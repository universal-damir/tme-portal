// Notification Email Service
// Handles email delivery for notifications using Brevo SMTP

import { pool } from '@/lib/database';
import { logAuditEvent } from '@/lib/audit';
import { sendEmail } from './email-sender';

// Types
export interface EmailTemplate {
  id: number;
  name: string;
  subject_template: string;
  html_template: string;
  variables: Record<string, string>;
}

export interface NotificationPreferences {
  user_id: number;
  in_app_enabled: boolean;
  email_enabled: boolean;
  email_review_requested: boolean;
  email_review_completed: boolean;
  email_application_approved: boolean;
  email_application_rejected: boolean;
}

export interface EmailQueueItem {
  id: number;
  notification_id: string;
  user_id: number;
  to_email: string;
  subject: string;
  html_content: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  created_at: Date;
  scheduled_for: Date;
  processed_at: Date | null;
}

export interface NotificationEmailData {
  notification_id: string;
  user_id: number;
  type: 'review_requested' | 'review_completed' | 'application_approved' | 'application_rejected';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

// Constants
const DAILY_EMAIL_LIMIT = 10; // Per user per day
const MAX_RETRY_ATTEMPTS = 3;
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3000';

export class NotificationEmailService {

  // Get user's notification preferences
  static async getUserPreferences(userId: number): Promise<NotificationPreferences | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM notification_preferences WHERE user_id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        // Create default preferences if they don't exist
        await pool.query(
          `INSERT INTO notification_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
          [userId]
        );
        const newResult = await pool.query(
          `SELECT * FROM notification_preferences WHERE user_id = $1`,
          [userId]
        );
        return newResult.rows[0];
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  // Check if user should receive email for this notification type
  static async shouldSendEmail(
    userId: number, 
    notificationType: string
  ): Promise<{ should_send: boolean; email: string | null; reason?: string }> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences) {
        return { should_send: false, email: null, reason: 'No preferences found' };
      }

      if (!preferences.email_enabled) {
        return { should_send: false, email: null, reason: 'Email notifications disabled' };
      }

      // Get user's email
      const userResult = await pool.query(
        `SELECT email FROM users WHERE id = $1`,
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        return { should_send: false, email: null, reason: 'User not found' };
      }

      const email = userResult.rows[0].email;
      
      if (!email) {
        return { should_send: false, email: null, reason: 'No email address' };
      }

      // Check notification type preference
      const typePreferenceMap: Record<string, keyof NotificationPreferences> = {
        'review_requested': 'email_review_requested',
        'review_completed': 'email_review_completed',
        'application_approved': 'email_application_approved',
        'application_rejected': 'email_application_rejected'
      };

      const preferenceKey = typePreferenceMap[notificationType];
      if (preferenceKey && preferences[preferenceKey] === false) {
        return { should_send: false, email: null, reason: `${notificationType} emails disabled` };
      }

      return { should_send: true, email };
    } catch (error) {
      console.error('Error checking email eligibility:', error);
      return { should_send: false, email: null, reason: 'Error checking preferences' };
    }
  }

  // Removed - no daily limits for employee system
  private static async resetDailyCountIfNeeded(userId: number): Promise<void> {
    // Not needed for employee system
    return;
  }

  // Get email template
  static async getTemplate(templateName: string): Promise<EmailTemplate | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM email_templates WHERE name = $1 AND is_active = true`,
        [templateName]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching email template:', error);
      return null;
    }
  }

  // Replace template variables
  static replaceTemplateVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    // Replace simple variables {{variable}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });
    
    // Handle conditionals {{#if variable}}...{{/if}}
    const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    result = result.replace(conditionalRegex, (match, variable, content) => {
      return variables[variable] ? content : '';
    });
    
    return result;
  }

  // Queue email for sending
  static async queueEmail(data: NotificationEmailData): Promise<boolean> {
    try {
      // Check if should send email
      const { should_send, email, reason } = await this.shouldSendEmail(data.user_id, data.type);
      
      if (!should_send) {
        console.log(`Not sending email for notification ${data.notification_id}: ${reason}`);
        return false;
      }

      // Get template
      const template = await this.getTemplate(data.type);
      if (!template) {
        console.error(`No template found for notification type: ${data.type}`);
        return false;
      }

      // Get user details
      const userResult = await pool.query(
        `SELECT full_name FROM users WHERE id = $1`,
        [data.user_id]
      );
      const userName = userResult.rows[0]?.full_name || 'User';

      // No unsubscribe for employee system

      // Prepare template variables based on notification type and metadata
      const variables: Record<string, any> = {
        user_name: userName,
        portal_url: PORTAL_URL,
        ...data.metadata
      };

      // Process templates
      const subject = this.replaceTemplateVariables(template.subject_template, variables);
      const htmlContent = this.replaceTemplateVariables(template.html_template, variables);

      // Check for existing queue item to prevent duplicates
      const existingQueue = await pool.query(
        `SELECT id FROM email_queue WHERE notification_id = $1`,
        [data.notification_id]
      );

      if (existingQueue.rows.length > 0) {
        console.log(`Email already queued for notification ${data.notification_id}`);
        return true;
      }

      // Add to queue
      await pool.query(
        `INSERT INTO email_queue (
          notification_id, user_id, to_email, subject, html_content, status, scheduled_for
        ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())`,
        [data.notification_id, data.user_id, email, subject, htmlContent]
      );

      console.log(`Email queued for notification ${data.notification_id}`);
      return true;
    } catch (error) {
      console.error('Error queueing email:', error);
      return false;
    }
  }

  // Process email queue (called by cron job or interval)
  static async processQueue(limit: number = 10): Promise<void> {
    try {
      // Get pending emails
      const result = await pool.query(
        `SELECT * FROM email_queue 
         WHERE status IN ('pending', 'processing') 
         AND attempts < max_attempts
         AND scheduled_for <= NOW()
         ORDER BY created_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED`,
        [limit]
      );

      const emails = result.rows;
      
      if (emails.length === 0) {
        return;
      }

      console.log(`Processing ${emails.length} emails from queue`);

      // Process each email
      for (const email of emails) {
        await this.sendQueuedEmail(email);
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  }

  // Send a single queued email
  private static async sendQueuedEmail(queueItem: EmailQueueItem): Promise<void> {
    try {
      // Mark as processing
      await pool.query(
        `UPDATE email_queue SET status = 'processing', attempts = attempts + 1 WHERE id = $1`,
        [queueItem.id]
      );

      // Check if SMTP is configured
      if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASSWORD) {
        throw new Error('SMTP credentials not configured');
      }

      // Send email with unique message ID based on notification ID
      const result = await sendEmail({
        from: 'TME Services Portal <portal@TME-Services.com>',
        to: queueItem.to_email,
        subject: queueItem.subject,
        html: queueItem.html_content,
        messageId: `<${queueItem.notification_id}@tme-portal.com>`
      });

      // Mark as sent
      await pool.query(
        `UPDATE email_queue 
         SET status = 'sent', processed_at = NOW() 
         WHERE id = $1`,
        [queueItem.id]
      );

      // Update notification record
      await pool.query(
        `UPDATE notifications 
         SET email_sent = true, email_sent_at = NOW() 
         WHERE id = $1`,
        [queueItem.notification_id]
      );

      // No daily count tracking for employee system

      // Log success
      await logAuditEvent({
        user_id: queueItem.user_id,
        action: 'notification_email_sent',
        resource: 'email_system',
        details: {
          notification_id: queueItem.notification_id,
          to_email: queueItem.to_email,
          message_id: result.messageId
        }
      });

      console.log(`Email sent successfully for notification ${queueItem.notification_id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update queue with error
      await pool.query(
        `UPDATE email_queue 
         SET status = CASE 
           WHEN attempts >= max_attempts THEN 'failed' 
           ELSE 'pending' 
         END,
         last_error = $2,
         scheduled_for = CASE
           WHEN attempts < max_attempts THEN NOW() + INTERVAL '5 minutes' * attempts
           ELSE scheduled_for
         END
         WHERE id = $1`,
        [queueItem.id, errorMessage]
      );

      // Update notification with error
      await pool.query(
        `UPDATE notifications 
         SET email_error = $2, email_attempts = COALESCE(email_attempts, 0) + 1 
         WHERE id = $1`,
        [queueItem.notification_id, errorMessage]
      );

      console.error(`Error sending email for notification ${queueItem.notification_id}:`, error);
    }
  }

  // Update user preferences
  static async updatePreferences(
    userId: number, 
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(preferences).forEach(([key, value]) => {
        if (key !== 'user_id' && key !== 'id') {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      if (updates.length === 0) {
        return false;
      }

      values.push(userId);
      
      await pool.query(
        `UPDATE notification_preferences 
         SET ${updates.join(', ')}, updated_at = NOW() 
         WHERE user_id = $${paramCount}`,
        values
      );

      // Log preference change
      await logAuditEvent({
        user_id: userId,
        action: 'notification_preferences_updated',
        resource: 'notification_preferences',
        details: preferences
      });

      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  }

  // Handle unsubscribe
  static async handleUnsubscribe(token: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `UPDATE notification_preferences 
         SET email_enabled = false, updated_at = NOW() 
         WHERE unsubscribe_token = $1
         RETURNING user_id`,
        [token]
      );

      if (result.rows.length > 0) {
        await logAuditEvent({
          user_id: result.rows[0].user_id,
          action: 'email_notifications_unsubscribed',
          resource: 'notification_preferences',
          details: { unsubscribe_token: token }
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error handling unsubscribe:', error);
      return false;
    }
  }

  // Cancel pending emails for a notification
  static async cancelPendingEmails(notificationId: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE email_queue 
         SET status = 'cancelled' 
         WHERE notification_id = $1 AND status = 'pending'`,
        [notificationId]
      );
    } catch (error) {
      console.error('Error cancelling pending emails:', error);
    }
  }

  // Get email statistics for monitoring
  static async getEmailStats(userId?: number): Promise<any> {
    try {
      const userCondition = userId ? 'WHERE user_id = $1' : '';
      const params = userId ? [userId] : [];

      const stats = await pool.query(
        `SELECT 
          status,
          COUNT(*) as count,
          DATE(created_at) as date
         FROM email_queue
         ${userCondition}
         GROUP BY status, DATE(created_at)
         ORDER BY date DESC, status`,
        params
      );

      return stats.rows;
    } catch (error) {
      console.error('Error fetching email stats:', error);
      return [];
    }
  }
}