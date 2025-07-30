// Review System Database Service
// Safe database operations with error handling and rollback capabilities

import { Pool } from 'pg';
import { 
  Application, 
  Notification, 
  ApplicationType, 
  ApplicationStatus,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ReviewSubmission,
  ReviewAction
} from '@/types/review-system';
import { getReviewSystemConfig, withReviewSystemEnabled } from '@/lib/config/review-system';

// Database connection (reuse existing pool)
let pool: Pool;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

// Safe database operation wrapper
async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  operationName: string
): Promise<T> {
  const config = getReviewSystemConfig();
  
  if (!config.enabled) {
    if (config.debugMode) {
      console.log(`Review system disabled, skipping ${operationName}`);
    }
    return fallback;
  }

  try {
    return await operation();
  } catch (error) {
    console.error(`Review system ${operationName} failed:`, error);
    
    // Log to audit table for debugging
    try {
      await logError(operationName, error);
    } catch (logError) {
      console.error('Failed to log review system error:', logError);
    }
    
    return fallback;
  }
}

// Error logging function
async function logError(operation: string, error: any): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, resource, details)
      VALUES (NULL, $1, 'review_system', $2)
    `, [
      `review_system_error_${operation}`,
      JSON.stringify({
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    ]);
  } catch (e) {
    // Silent fail - don't throw errors in error logging
  }
}

// Applications service
export class ApplicationsService {
  
  static async create(data: CreateApplicationRequest, userId: number): Promise<Application | null> {
    return safeDbOperation(async () => {
      const config = getReviewSystemConfig();
      const pool = getPool();
      
      // Safety check: Limit applications per user
      const countResult = await pool.query(`
        SELECT COUNT(*) as count 
        FROM applications 
        WHERE submitted_by_id = $1 AND status != 'approved'
      `, [userId]);
      
      if (parseInt(countResult.rows[0].count) >= config.maxApplicationsPerUser) {
        throw new Error('Maximum applications limit reached');
      }
      
      const result = await pool.query(`
        INSERT INTO applications (type, title, form_data, submitted_by_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [data.type, data.title, data.form_data, userId]);
      
      return result.rows[0] as Application;
    }, null, 'create_application');
  }
  
  static async update(id: string, data: UpdateApplicationRequest, userId: number): Promise<Application | null> {
    return safeDbOperation(async () => {
      const pool = getPool();
      
      // Verify ownership
      const ownerCheck = await pool.query(`
        SELECT submitted_by_id FROM applications WHERE id = $1
      `, [id]);
      
      if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].submitted_by_id !== userId) {
        throw new Error('Application not found or access denied');
      }
      
      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      if (data.title) {
        updateFields.push(`title = $${paramCount++}`);
        values.push(data.title);
      }
      
      if (data.form_data) {
        updateFields.push(`form_data = $${paramCount++}`);
        values.push(data.form_data);
      }
      
      values.push(id);
      
      const result = await pool.query(`
        UPDATE applications 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `, values);
      
      return result.rows[0] as Application;
    }, null, 'update_application');
  }
  
  static async getByUser(userId: number): Promise<Application[]> {
    return safeDbOperation(async () => {
      const pool = getPool();
      
      const result = await pool.query(`
        SELECT a.*, 
               sb.full_name as submitted_by_name,
               r.full_name as reviewer_name
        FROM applications a
        LEFT JOIN users sb ON a.submitted_by_id = sb.id
        LEFT JOIN users r ON a.reviewer_id = r.id
        WHERE a.submitted_by_id = $1
        ORDER BY a.created_at DESC
      `, [userId]);
      
      return result.rows as Application[];
    }, [], 'get_applications_by_user');
  }
  
  static async getById(applicationId: string, userId: number): Promise<Application | null> {
    return safeDbOperation(async () => {
      const pool = getPool();
      
      const result = await pool.query(`
        SELECT a.*, 
               sb.id as submitted_by_id_ref, sb.full_name as submitted_by_name, sb.email as submitted_by_email, sb.department as submitted_by_department,
               r.id as reviewer_id_ref, r.full_name as reviewer_name, r.email as reviewer_email, r.department as reviewer_department
        FROM applications a
        LEFT JOIN users sb ON a.submitted_by_id = sb.id
        LEFT JOIN users r ON a.reviewer_id = r.id
        WHERE a.id = $1 AND (a.submitted_by_id = $2 OR a.reviewer_id = $2)
        ORDER BY a.created_at DESC
      `, [applicationId, userId]);
      
      const row = result.rows[0];
      if (!row) return null;
      
      // Transform the flat result into the expected Application structure
      const application: Application = {
        id: row.id,
        type: row.type,
        title: row.title,
        form_data: row.form_data,
        status: row.status,
        submitted_by_id: row.submitted_by_id,
        reviewer_id: row.reviewer_id,
        submitter_message: row.submitter_message,
        review_comments: row.review_comments,
        urgency: row.urgency,
        submitted_at: row.submitted_at,
        reviewed_at: row.reviewed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        // Transform the joined user data into nested objects
        submitted_by: row.submitted_by_name ? {
          id: row.submitted_by_id_ref,
          full_name: row.submitted_by_name,
          email: row.submitted_by_email,
          department: row.submitted_by_department
        } : undefined,
        reviewer: row.reviewer_name ? {
          id: row.reviewer_id_ref,
          full_name: row.reviewer_name,
          email: row.reviewer_email,
          department: row.reviewer_department
        } : undefined
      };
      
      return application;
    }, null, 'get_application_by_id');
  }
  
  static async submitForReview(submission: ReviewSubmission, userId: number): Promise<boolean> {
    return safeDbOperation(async () => {
      const config = getReviewSystemConfig();
      
      if (!config.reviewSubmissionEnabled) {
        throw new Error('Review submission is currently disabled');
      }
      
      const pool = getPool();
      
      // Start transaction for atomic operation
      await pool.query('BEGIN');
      
      try {
        // Update application status and store submitter message
        // For now, store submitter message in a temporary way until schema is updated
        const submitterComments = submission.comments || null;
        
        await pool.query(`
          UPDATE applications 
          SET status = 'pending_review', 
              reviewer_id = $1, 
              urgency = $2,
              submitted_at = CURRENT_TIMESTAMP
          WHERE id = $3 AND submitted_by_id = $4
        `, [submission.reviewer_id, submission.urgency, submission.application_id, userId]);
        
        // Store submitter message in form_data temporarily
        if (submitterComments) {
          await pool.query(`
            UPDATE applications 
            SET form_data = form_data || jsonb_build_object('_submitter_message', $1::text)
            WHERE id = $2
          `, [submitterComments, submission.application_id]);
        }
        
        // Get application data for notification title generation
        const appResult = await pool.query(`
          SELECT title, form_data FROM applications WHERE id = $1
        `, [submission.application_id]);
        
        let applicationTitle = 'Application';
        
        if (appResult.rows.length > 0) {
          try {
            const formData = appResult.rows[0].form_data;
            
            // Generate title using same PDF naming convention as GoldenVisaTab
            const date = new Date(formData.date || new Date());
            const yy = date.getFullYear().toString().slice(-2);
            const mm = (date.getMonth() + 1).toString().padStart(2, '0');
            const dd = date.getDate().toString().padStart(2, '0');
            const formattedDate = `${yy}${mm}${dd}`;
            
            let nameForTitle = '';
            if (formData.companyName) {
              nameForTitle = formData.companyName;
            } else if (formData.lastName && formData.firstName) {
              nameForTitle = `${formData.lastName} ${formData.firstName}`;
            } else if (formData.firstName) {
              nameForTitle = formData.firstName;
            } else if (formData.lastName) {
              nameForTitle = formData.lastName;
            } else {
              nameForTitle = 'Client';
            }
            
            const visaTypeMap: { [key: string]: string } = {
              'property-investment': 'property',
              'time-deposit': 'deposit', 
              'skilled-employee': 'skilled'
            };
            
            const visaTypeFormatted = visaTypeMap[formData.visaType] || formData.visaType;
            applicationTitle = `${formattedDate} ${nameForTitle} offer golden visa ${visaTypeFormatted}`;
          } catch (error) {
            console.error('Error generating notification title:', error);
            applicationTitle = appResult.rows[0].title || 'Application';
          }
        }
        
        // Get submitter info for notification
        const submitterResult = await pool.query(`
          SELECT full_name, employee_code FROM users WHERE id = $1
        `, [userId]);
        
        const submitterInfo = submitterResult.rows[0];
        
        // Create notification for reviewer
        await NotificationsService.create({
          user_id: submission.reviewer_id,
          type: 'review_requested',
          title: applicationTitle,
          message: submission.comments || 'A new application has been submitted for your review.',
          application_id: submission.application_id,
          metadata: {
            submitter_name: submitterInfo?.full_name,
            submitter_employee_code: submitterInfo?.employee_code
          }
        });
        
        await pool.query('COMMIT');
        return true;
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    }, false, 'submit_for_review');
  }
  
  static async performReviewAction(action: ReviewAction, userId: number): Promise<boolean> {
    return safeDbOperation(async () => {
      const config = getReviewSystemConfig();
      
      if (!config.allowReviewActions) {
        throw new Error('Review actions are currently disabled');
      }
      
      const pool = getPool();
      
      // Start transaction for atomic operation
      await pool.query('BEGIN');
      
      try {
        // Update application status based on action
        const newStatus = action.action === 'approve' ? 'approved' : 'rejected';
        
        await pool.query(`
          UPDATE applications 
          SET status = $1, 
              review_comments = $2,
              reviewed_at = CURRENT_TIMESTAMP
          WHERE id = $3 AND reviewer_id = $4
        `, [newStatus, action.comments, action.application_id, userId]);
        
        // Get application details and reviewer info for notification
        const appResult = await pool.query(`
          SELECT a.submitted_by_id, a.title, a.form_data, u.full_name as reviewer_name, u.employee_code as reviewer_employee_code
          FROM applications a
          JOIN users u ON a.reviewer_id = u.id
          WHERE a.id = $1
        `, [action.application_id]);
        
        if (appResult.rows.length > 0) {
          const app = appResult.rows[0];
          
          // Generate proper application title using same logic as submitForReview
          let applicationTitle = 'Application';
          
          try {
            const formData = app.form_data;
            
            // Generate title using same PDF naming convention as GoldenVisaTab
            const date = new Date(formData.date || new Date());
            const yy = date.getFullYear().toString().slice(-2);
            const mm = (date.getMonth() + 1).toString().padStart(2, '0');
            const dd = date.getDate().toString().padStart(2, '0');
            const formattedDate = `${yy}${mm}${dd}`;
            
            let nameForTitle = '';
            if (formData.companyName) {
              nameForTitle = formData.companyName;
            } else if (formData.lastName && formData.firstName) {
              nameForTitle = `${formData.lastName} ${formData.firstName}`;
            } else if (formData.firstName) {
              nameForTitle = formData.firstName;
            } else if (formData.lastName) {
              nameForTitle = formData.lastName;
            } else {
              nameForTitle = 'Client';
            }
            
            const visaTypeMap: { [key: string]: string } = {
              'property-investment': 'property',
              'time-deposit': 'deposit', 
              'skilled-employee': 'skilled'
            };
            
            const visaTypeFormatted = visaTypeMap[formData.visaType] || formData.visaType;
            applicationTitle = `${formattedDate} ${nameForTitle} offer golden visa ${visaTypeFormatted}`;
          } catch (error) {
            console.error('Error generating notification title:', error);
            applicationTitle = app.title || 'Application';
          }
          
          // Create notification for submitter
          await NotificationsService.create({
            user_id: app.submitted_by_id,
            type: action.action === 'approve' ? 'application_approved' : 'application_rejected',
            title: `${applicationTitle} ${action.action === 'approve' ? 'Approved' : 'Rejected'}`,
            message: action.comments,
            application_id: action.application_id,
            metadata: {
              reviewer_name: app.reviewer_name,
              reviewer_employee_code: app.reviewer_employee_code
            }
          });
        }
        
        await pool.query('COMMIT');
        return true;
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    }, false, 'perform_review_action');
  }
}

// Notifications service
export class NotificationsService {
  
  static async create(data: {
    user_id: number;
    type: string;
    title: string;
    message: string;
    application_id?: string;
    metadata?: Record<string, any>;
  }): Promise<Notification | null> {
    return safeDbOperation(async () => {
      const config = getReviewSystemConfig();
      
      if (!config.notificationsEnabled) {
        return null; // Silent skip if notifications disabled
      }
      
      const pool = getPool();
      
      // Safety check: Limit notifications per user
      const countResult = await pool.query(`
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = $1 AND created_at > NOW() - INTERVAL '24 hours'
      `, [data.user_id]);
      
      if (parseInt(countResult.rows[0].count) >= config.maxNotificationsPerUser) {
        console.warn(`Notification limit reached for user ${data.user_id}`);
        return null;
      }
      
      // Try to insert with metadata column first (if migration has been run)
      let result;
      try {
        result = await pool.query(`
          INSERT INTO notifications (user_id, type, title, message, application_id, metadata)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [data.user_id, data.type, data.title, data.message, data.application_id, JSON.stringify(data.metadata || {})]);
      } catch (error: any) {
        // If metadata column doesn't exist, fall back to old schema
        if (error.message && error.message.includes('metadata')) {
          console.log('Metadata column not found, using legacy notification schema');
          result = await pool.query(`
            INSERT INTO notifications (user_id, type, title, message, application_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
          `, [data.user_id, data.type, data.title, data.message, data.application_id]);
        } else {
          throw error;
        }
      }
      
      return result.rows[0] as Notification;
    }, null, 'create_notification');
  }
  
  static async getByUser(userId: number): Promise<{
    notifications: Notification[];
    unread_count: number;
  }> {
    return safeDbOperation(async () => {
      const config = getReviewSystemConfig();
      const pool = getPool();
      
      // Get notifications with limit for safety
      const notificationsResult = await pool.query(`
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `, [userId, config.maxNotificationsToFetch]);
      
      // Get unread count
      const unreadResult = await pool.query(`
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = $1 AND is_read = false
      `, [userId]);
      
      return {
        notifications: notificationsResult.rows as Notification[],
        unread_count: parseInt(unreadResult.rows[0].count)
      };
    }, { notifications: [], unread_count: 0 }, 'get_notifications_by_user');
  }
  
  static async markAsRead(notificationId: string, userId: number): Promise<boolean> {
    return safeDbOperation(async () => {
      const pool = getPool();
      
      await pool.query(`
        UPDATE notifications 
        SET is_read = true 
        WHERE id = $1 AND user_id = $2
      `, [notificationId, userId]);
      
      return true;
    }, false, 'mark_notification_read');
  }
  
  static async markAllAsRead(userId: number): Promise<boolean> {
    return safeDbOperation(async () => {
      const pool = getPool();
      
      await pool.query(`
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = $1 AND is_read = false
      `, [userId]);
      
      return true;
    }, false, 'mark_all_notifications_read');
  }
}

// Reviewers service
export class ReviewersService {
  
  static async getAvailableReviewers(currentUserId: number): Promise<Reviewer[]> {
    return safeDbOperation(async () => {
      const config = getReviewSystemConfig();
      
      if (!config.showReviewerDropdown) {
        return []; // Silent return if feature disabled
      }
      
      const pool = getPool();
      
      try {
        console.log(`🔧 ReviewersService: Getting reviewers for userId: ${currentUserId}`);
        
        // Get current user's department
        const userResult = await pool.query(`
          SELECT department FROM users WHERE id = $1
        `, [currentUserId]);
        
        if (userResult.rows.length === 0) {
          console.log('🔧 ReviewersService: Current user not found, using default department');
        }
        
        const userDepartment = userResult.rows.length > 0 ? userResult.rows[0].department : 'General';
        console.log(`🔧 ReviewersService: User department: ${userDepartment}`);
        
        // Get department colleagues + UH user Uwe Hohmann
        // Query gets: 1) Same department colleagues (excluding self) 2) UH user Uwe Hohmann
        const reviewersResult = await pool.query(`
          SELECT id, full_name, email, department, role, employee_code
          FROM users 
          WHERE id != $1 
          AND (department = $2 OR email = 'uwe@TME-Services.com')
          ORDER BY 
            CASE WHEN email = 'uwe@TME-Services.com' THEN 0 ELSE 1 END,
            full_name ASC
          LIMIT $3
        `, [currentUserId, userDepartment, config.maxReviewersToFetch]);
        
        console.log(`🔧 ReviewersService: Raw query result:`, reviewersResult.rows);
        console.log(`🔧 ReviewersService: Found ${reviewersResult.rows.length} reviewers for department: ${userDepartment}`);
        
        const reviewers = reviewersResult.rows.map(row => ({
          id: row.id,
          full_name: row.full_name,
          email: row.email,
          department: row.department,
          employee_code: row.employee_code,
          is_universal: row.email === 'uwe@TME-Services.com'
        })) as Reviewer[];
        
        // If no reviewers found, add fallback reviewers
        if (reviewers.length === 0) {
          console.log('🔧 ReviewersService: No reviewers found in database, using fallback');
          return [
            {
              id: 999,
              full_name: 'UH - Uwe Hohmann',
              email: 'uwe@TME-Services.com',
              department: 'Management',
              employee_code: '09 UH',
              is_universal: true
            },
            {
              id: 998,
              full_name: 'Test Reviewer',
              email: 'test@TME-Services.com',
              department: userDepartment,
              employee_code: 'TR',
              is_universal: false
            }
          ];
        }
        
        return reviewers;
        
      } catch (error) {
        console.error('🔧 ReviewersService: Database error:', error);
        
        // Fallback: Return at least UH user Uwe if database fails
        return [
          {
            id: 999, // Special ID for UH user
            full_name: 'UH - Uwe Hohmann',
            email: 'uwe@TME-Services.com',
            department: 'Management',
            employee_code: 'UH',
            is_universal: true
          }
        ];
      }
      
    }, [], 'get_available_reviewers');
  }
}


// Health check function for monitoring
export async function checkReviewSystemHealth(): Promise<{
  enabled: boolean;
  database_connection: boolean;
  tables_exist: boolean;
  error?: string;
}> {
  const config = getReviewSystemConfig();
  
  if (!config.enabled) {
    return {
      enabled: false,
      database_connection: false,
      tables_exist: false
    };
  }
  
  try {
    const pool = getPool();
    
    // Test database connection
    await pool.query('SELECT 1');
    
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('applications', 'notifications')
    `);
    
    return {
      enabled: true,
      database_connection: true,
      tables_exist: tablesResult.rows.length === 2
    };
  } catch (error) {
    return {
      enabled: true,
      database_connection: false,
      tables_exist: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}