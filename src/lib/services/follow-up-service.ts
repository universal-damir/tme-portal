/**
 * Email Follow-up Service Layer
 * Manages email follow-up creation, tracking, and escalation
 */

import { query } from '@/lib/database';
import { logAuditEvent } from '@/lib/audit';

// TypeScript interfaces
export interface EmailFollowUp {
  id: string;
  user_id: number;
  email_subject: string;
  client_name: string;
  client_email?: string;
  document_type?: string;
  original_email_id?: string;
  follow_up_number: 1 | 2 | 3;
  sent_date: Date;
  due_date: Date;
  status: 'pending' | 'completed' | 'no_response' | 'snoozed';
  completed_date?: Date;
  completed_reason?: 'client_responded' | 'signed' | 'paid' | 'cancelled' | 'other';
  escalated_to_manager: boolean;
  escalation_date?: Date;
  manager_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFollowUpInput {
  user_id: number;
  email_subject: string;
  client_name: string;
  client_email?: string;
  document_type?: string;
  original_email_id?: string;
  sent_date?: Date;
}

export interface FollowUpFilters {
  user_id: number;
  status?: 'pending' | 'completed' | 'no_response';
  follow_up_number?: 1 | 2 | 3;
  client_name?: string;
  limit?: number;
  offset?: number;
}

export interface FollowUpStats {
  total_pending: number;
  total_completed: number;
  total_no_response: number;
  overdue_count: number;
  due_today_count: number;
}

export class FollowUpService {
  /**
   * Calculate due date based on follow-up number
   * 1st: 7 days, 2nd: 14 days, 3rd: 21 days
   */
  private static calculateDueDate(sentDate: Date, followUpNumber: 1 | 2 | 3): Date {
    const daysMap = { 1: 7, 2: 14, 3: 21 };
    const dueDate = new Date(sentDate);
    dueDate.setDate(dueDate.getDate() + daysMap[followUpNumber]);
    return dueDate;
  }

  /**
   * Create a new follow-up entry
   */
  static async create(input: CreateFollowUpInput): Promise<EmailFollowUp> {
    const {
      user_id,
      email_subject,
      client_name,
      client_email = null,
      document_type = null,
      original_email_id = null,
      sent_date = new Date()
    } = input;

    // Calculate initial due date (7 days)
    const due_date = this.calculateDueDate(sent_date, 1);

    const result = await query(
      `INSERT INTO email_follow_ups (
        user_id, email_subject, client_name, client_email,
        document_type, original_email_id, follow_up_number,
        sent_date, due_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        user_id, email_subject, client_name, client_email,
        document_type, original_email_id, 1,
        sent_date, due_date, 'pending'
      ]
    );

    const followUp = result.rows[0];

    // Log creation in history
    await query(
      `INSERT INTO email_follow_up_history (
        follow_up_id, user_id, action, new_status, notes
      ) VALUES ($1, $2, $3, $4, $5)`,
      [followUp.id, user_id, 'created', 'pending', `Email sent: ${email_subject}`]
    );

    // Log audit event
    await logAuditEvent({
      user_id,
      action: 'follow_up_created',
      resource: `follow_up_${followUp.id}`,
      details: { email_subject, client_name }
    });

    return followUp;
  }

  /**
   * Check if follow-ups table exists
   */
  static async tableExists(): Promise<boolean> {
    try {
      const result = await query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'email_follow_ups'
        )`,
        []
      );
      return result.rows[0]?.exists || false;
    } catch (error) {
      console.error('Error checking if follow-ups table exists:', error);
      return false;
    }
  }

  /**
   * Get follow-ups with filters
   */
  static async getByUser(filters: FollowUpFilters): Promise<{ follow_ups: EmailFollowUp[], total: number }> {
    const {
      user_id,
      status,
      follow_up_number,
      client_name,
      limit = 50,
      offset = 0
    } = filters;

    let whereConditions = ['user_id = $1'];
    let params: any[] = [user_id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (follow_up_number) {
      paramCount++;
      whereConditions.push(`follow_up_number = $${paramCount}`);
      params.push(follow_up_number);
    }

    if (client_name) {
      paramCount++;
      whereConditions.push(`client_name ILIKE $${paramCount}`);
      params.push(`%${client_name}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM email_follow_ups WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    const result = await query(
      `SELECT * FROM email_follow_ups 
       WHERE ${whereClause}
       ORDER BY 
         CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
         due_date ASC,
         created_at DESC
       LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
      params
    );

    return {
      follow_ups: result.rows,
      total
    };
  }

  /**
   * Update follow-up status
   */
  static async updateStatus(
    followUpId: string,
    userId: number,
    status: 'completed' | 'no_response',
    reason?: 'client_responded' | 'signed' | 'paid' | 'cancelled' | 'other'
  ): Promise<EmailFollowUp> {
    const updateData: any = {
      status,
      updated_at: new Date()
    };

    if (status === 'completed') {
      updateData.completed_date = new Date();
      if (reason) {
        updateData.completed_reason = reason;
      }
    }

    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    const result = await query(
      `UPDATE email_follow_ups 
       SET ${setClause}
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [followUpId, userId, ...Object.values(updateData)]
    );

    if (result.rows.length === 0) {
      throw new Error('Follow-up not found or unauthorized');
    }

    const followUp = result.rows[0];

    // Log status change
    await query(
      `INSERT INTO email_follow_up_history (
        follow_up_id, user_id, action, previous_status, new_status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        followUpId, userId, 
        status === 'completed' ? 'completed' : 'marked_no_response',
        'pending', status,
        reason || null
      ]
    );

    return followUp;
  }

  /**
   * Snooze follow-up (7 days) and upgrade to next level
   */
  static async snooze(followUpId: string, userId: number): Promise<EmailFollowUp> {
    // Get current follow-up
    const currentResult = await query(
      `SELECT * FROM email_follow_ups 
       WHERE id = $1 AND user_id = $2 AND status = 'pending'`,
      [followUpId, userId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Follow-up not found or already completed');
    }

    const current = currentResult.rows[0];
    
    // Calculate new follow-up number (max 3)
    const newFollowUpNumber = Math.min(current.follow_up_number + 1, 3) as 1 | 2 | 3;
    
    // Calculate new due date from today
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + 7);

    // Update follow-up
    const result = await query(
      `UPDATE email_follow_ups 
       SET follow_up_number = $1, due_date = $2, status = 'snoozed', updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [newFollowUpNumber, newDueDate, followUpId, userId]
    );

    const followUp = result.rows[0];

    // Log snooze action
    await query(
      `INSERT INTO email_follow_up_history (
        follow_up_id, user_id, action, notes
      ) VALUES ($1, $2, $3, $4)`,
      [
        followUpId, userId, 'snoozed',
        `Snoozed to follow-up #${newFollowUpNumber}, due ${newDueDate.toLocaleDateString()}`
      ]
    );

    // Reset status back to pending after logging
    await query(
      `UPDATE email_follow_ups SET status = 'pending' WHERE id = $1`,
      [followUpId]
    );

    followUp.status = 'pending';
    return followUp;
  }

  /**
   * Get stats for user's follow-ups
   */
  static async getStats(userId: number): Promise<FollowUpStats> {
    const result = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as total_pending,
        COUNT(*) FILTER (WHERE status = 'completed') as total_completed,
        COUNT(*) FILTER (WHERE status = 'no_response') as total_no_response,
        COUNT(*) FILTER (WHERE status = 'pending' AND due_date < NOW()) as overdue_count,
        COUNT(*) FILTER (WHERE status = 'pending' AND DATE(due_date) = CURRENT_DATE) as due_today_count
       FROM email_follow_ups
       WHERE user_id = $1`,
      [userId]
    );

    const stats = result.rows[0];
    
    return {
      total_pending: parseInt(stats.total_pending) || 0,
      total_completed: parseInt(stats.total_completed) || 0,
      total_no_response: parseInt(stats.total_no_response) || 0,
      overdue_count: parseInt(stats.overdue_count) || 0,
      due_today_count: parseInt(stats.due_today_count) || 0
    };
  }

  /**
   * Check and escalate overdue 3rd follow-ups
   */
  static async escalateOverdueFollowUps(): Promise<void> {
    // Find overdue 3rd follow-ups
    const overdueResult = await query(
      `SELECT ef.*, u.role, u.is_manager, u.full_name
       FROM email_follow_ups ef
       JOIN users u ON ef.user_id = u.id
       WHERE ef.status = 'pending'
       AND ef.follow_up_number = 3
       AND ef.due_date < NOW() - INTERVAL '1 day'
       AND ef.escalated_to_manager = FALSE`
    );

    for (const followUp of overdueResult.rows) {
      // Update to no_response status
      const shouldEscalate = !followUp.is_manager && followUp.role !== 'manager';
      
      await query(
        `UPDATE email_follow_ups
         SET status = 'no_response',
             escalated_to_manager = $1,
             escalation_date = $2
         WHERE id = $3`,
        [shouldEscalate, shouldEscalate ? new Date() : null, followUp.id]
      );

      // Log the escalation
      await query(
        `INSERT INTO email_follow_up_history (
          follow_up_id, user_id, action, previous_status, new_status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          followUp.id,
          followUp.user_id,
          'marked_no_response',
          'pending',
          'no_response',
          shouldEscalate ? 'Auto-escalated to manager' : 'Marked as no response (user is manager)'
        ]
      );

      // If escalating, create notification for manager
      if (shouldEscalate) {
        // Find manager (simplified - in production, implement proper manager lookup)
        const managerResult = await query(
          `SELECT id FROM users 
           WHERE (role = 'manager' OR is_manager = TRUE) 
           AND id != $1 
           LIMIT 1`,
          [followUp.user_id]
        );

        if (managerResult.rows.length > 0) {
          const managerId = managerResult.rows[0].id;
          
          // Update follow-up with manager ID
          await query(
            `UPDATE email_follow_ups SET manager_id = $1 WHERE id = $2`,
            [managerId, followUp.id]
          );

          // Here you would create a notification for the manager
          // This would integrate with your existing notification system
        }
      }
    }
  }

  /**
   * Resend email (creates new follow-up entry)
   */
  static async resend(followUpId: string, userId: number): Promise<EmailFollowUp> {
    // Get original follow-up
    const originalResult = await query(
      `SELECT * FROM email_follow_ups WHERE id = $1 AND user_id = $2`,
      [followUpId, userId]
    );

    if (originalResult.rows.length === 0) {
      throw new Error('Follow-up not found');
    }

    const original = originalResult.rows[0];

    // Mark original as completed
    await this.updateStatus(followUpId, userId, 'completed', 'other');

    // Create new follow-up
    const newFollowUp = await this.create({
      user_id: userId,
      email_subject: original.email_subject,
      client_name: original.client_name,
      client_email: original.client_email,
      document_type: original.document_type,
      original_email_id: original.original_email_id,
      sent_date: new Date()
    });

    // Log resend action
    await query(
      `INSERT INTO email_follow_up_history (
        follow_up_id, user_id, action, notes
      ) VALUES ($1, $2, $3, $4)`,
      [newFollowUp.id, userId, 'resent', `Resent from follow-up ${followUpId}`]
    );

    return newFollowUp;
  }
}