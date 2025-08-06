/**
 * Notification-to-Todo Automation Service
 * Automatically converts notifications into actionable todos
 * Phase 4: Smart Automation Implementation
 */

import { TodoService } from './todo-service';
import { TODO_GENERATION_RULES } from '../config/todo-generation-rules';
import { logAuditEvent } from '../audit';
import type { Notification } from '@/types/notification';
import type { CreateTodoInput } from '@/types/todo';

export class NotificationTodoAutomation {
  /**
   * Main automation function - converts notification to todo
   * Called when a new notification is created
   */
  static async processNotification(notification: Notification): Promise<void> {
    try {
      console.log(`🔄 Processing notification for todo generation:`, notification.id);

      // Get generation rule for this notification type
      const rule = TODO_GENERATION_RULES[notification.type];
      if (!rule) {
        console.log(`⏭️  No todo generation rule for notification type: ${notification.type}`);
        return;
      }

      // Skip if notification already has a todo
      if (notification.todo_id) {
        console.log(`⏭️  Notification ${notification.id} already has todo: ${notification.todo_id}`);
        return;
      }

      // Parse notification data for rule processing
      const notificationData = notification.data || {};

      // Check if this is an auto-completion-only rule (no todo creation)
      const todoTitle = rule.title(notificationData);
      if (!todoTitle || todoTitle.trim() === '') {
        console.log(`⚡ Auto-completion only rule for: ${notification.type}`);
        // Skip todo creation, just handle auto-completion
        await this.checkAutoCompletion(null, notification);
        return;
      }

      // Generate todo input using the rule
      const todoInput: CreateTodoInput = {
        user_id: notification.user_id,
        notification_id: null, // Set to null for mock notifications
        title: todoTitle,
        description: rule.description ? rule.description(notificationData) : null,
        category: rule.category,
        priority: rule.priority(notificationData),
        due_date: rule.due_date ? rule.due_date(notificationData) : null,
        client_name: notificationData.client_name || null,
        document_type: notificationData.document_type || null,
        application_id: notificationData.application_id || null,
        auto_generated: true,
        action_type: rule.action_type,
        action_data: rule.action_data(notificationData)
      };

      // Create the todo
      const todo = await TodoService.create(todoInput);
      console.log(`✅ Created todo ${todo.id} from notification ${notification.id}`);

      // Note: Would update notification with todo reference if NotificationService existed
      // await NotificationService.updateTodoReference(notification.id, todo.id);

      // Check for auto-completion conditions
      await this.checkAutoCompletion(todo, notification);

      // Schedule follow-up reminders if applicable
      await this.scheduleFollowUpReminders(todo, notification);

      // Log the automation
      await logAuditEvent({
        user_id: notification.user_id,
        action: 'todo_auto_generated',
        resource: 'automation',
        details: {
          notification_id: notification.id,
          todo_id: todo.id,
          notification_type: notification.type,
          rule_applied: notification.type
        }
      });

    } catch (error) {
      console.error('❌ Failed to process notification for todo generation:', error);
      
      // Log the failure
      await logAuditEvent({
        user_id: notification.user_id,
        action: 'todo_generation_failed',
        resource: 'automation',
        details: {
          notification_id: notification.id,
          error: error.message,
          notification_type: notification.type
        }
      });
    }
  }

  /**
   * Check if todo should be auto-completed based on related events
   */
  static async checkAutoCompletion(todo: any, sourceNotification: Notification): Promise<void> {
    try {
      // Get completion rules for this todo type
      const rule = TODO_GENERATION_RULES[sourceNotification.type];
      if (!rule.auto_complete_criteria) return;

      const completionCriteria = rule.auto_complete_criteria(sourceNotification.data || {});

      // If no specific todo provided (auto-completion only rule), find todos to complete
      if (!todo) {
        const completedCount = await TodoService.autoCompleteRelatedTodos(completionCriteria);
        
        if (completedCount > 0) {
          console.log(`🔄 Auto-completed ${completedCount} todos based on criteria`);
          
          // Log auto-completion
          await logAuditEvent({
            user_id: sourceNotification.user_id,
            action: 'todos_auto_completed',
            resource: 'automation',
            details: {
              completion_criteria: completionCriteria,
              source_notification: sourceNotification.id,
              completed_count: completedCount
            }
          });
        }
        return;
      }

      // Check if specific todo should be auto-completed
      const shouldComplete = await this.evaluateCompletionCriteria(
        todo, 
        sourceNotification, 
        completionCriteria
      );

      if (shouldComplete) {
        console.log(`🔄 Auto-completing todo ${todo.id} based on criteria`);
        
        await TodoService.updateStatus(todo.id, 'completed', {
          completed_by: 'system',
          completion_reason: 'auto_completion',
          completion_criteria: completionCriteria
        });

        // Log auto-completion
        await logAuditEvent({
          user_id: todo.user_id,
          action: 'todo_auto_completed',
          resource: 'automation',
          details: {
            todo_id: todo.id,
            completion_criteria: completionCriteria,
            source_notification: sourceNotification.id
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to check auto-completion:', error);
    }
  }

  /**
   * Evaluate whether completion criteria are met
   */
  static async evaluateCompletionCriteria(
    todo: any, 
    sourceNotification: Notification, 
    criteria: any
  ): Promise<boolean> {
    try {
      // Example criteria evaluation
      if (criteria.on_status_change) {
        // Check if related application status changed
        if (todo.application_id) {
          // This would check application status in the future
          // For now, return false as applications aren't implemented yet
          return false;
        }
      }

      if (criteria.on_document_sent) {
        // Check if related document was sent
        const sentActivities = await this.getRelatedActivities(
          todo.user_id, 
          ['pdf_sent'], 
          sourceNotification.data
        );
        return sentActivities.length > 0;
      }

      if (criteria.on_review_completed) {
        // Check if review was completed
        const reviewActivities = await this.getRelatedActivities(
          todo.user_id,
          ['review_approved', 'review_rejected'],
          sourceNotification.data
        );
        return reviewActivities.length > 0;
      }

      return false;
    } catch (error) {
      console.error('Failed to evaluate completion criteria:', error);
      return false;
    }
  }

  /**
   * Get related activities for completion checking
   */
  static async getRelatedActivities(
    userId: number, 
    actionTypes: string[], 
    notificationData: any
  ): Promise<any[]> {
    try {
      const query = `
        SELECT * FROM audit_logs 
        WHERE user_id = $1 
          AND action = ANY($2)
          AND created_at > NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 10
      `;
      
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });

      const result = await pool.query(query, [userId, actionTypes]);
      await pool.end();

      return result.rows;
    } catch (error) {
      console.error('Failed to get related activities:', error);
      return [];
    }
  }

  /**
   * Schedule follow-up reminders for client interactions
   */
  static async scheduleFollowUpReminders(todo: any, sourceNotification: Notification): Promise<void> {
    try {
      const rule = TODO_GENERATION_RULES[sourceNotification.type];
      if (!rule.follow_up) return;

      const followUpConfig = rule.follow_up;
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + followUpConfig.days);

      // Create follow-up todo
      const followUpInput: CreateTodoInput = {
        user_id: todo.user_id,
        notification_id: null, // No source notification for follow-ups
        title: followUpConfig.title(sourceNotification.data || {}),
        description: followUpConfig.description ? followUpConfig.description(sourceNotification.data || {}) : null,
        category: 'follow_up',
        priority: followUpConfig.priority || 'medium',
        due_date: followUpDate,
        client_name: todo.client_name,
        document_type: todo.document_type,
        application_id: todo.application_id,
        auto_generated: true,
        action_type: 'follow_up_reminder',
        action_data: {
          follow_up_for: todo.id,
          follow_up_type: followUpConfig.type,
          original_notification: sourceNotification.id
        }
      };

      const followUpTodo = await TodoService.create(followUpInput);
      console.log(`📅 Scheduled follow-up todo ${followUpTodo.id} for ${followUpConfig.days} days`);

      // Log follow-up scheduling
      await logAuditEvent(
        todo.user_id,
        'follow_up_scheduled',
        'automation',
        {
          original_todo: todo.id,
          follow_up_todo: followUpTodo.id,
          follow_up_days: followUpConfig.days,
          follow_up_type: followUpConfig.type
        }
      );

    } catch (error) {
      console.error('❌ Failed to schedule follow-up reminder:', error);
    }
  }

  /**
   * Process bulk notifications (for batch operations)
   */
  static async processBulkNotifications(notifications: Notification[]): Promise<void> {
    console.log(`🔄 Processing ${notifications.length} notifications for todo generation`);

    const results = await Promise.allSettled(
      notifications.map(notification => this.processNotification(notification))
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`✅ Processed ${successful}/${notifications.length} notifications successfully`);
    if (failed > 0) {
      console.log(`❌ Failed to process ${failed} notifications`);
    }
  }

  /**
   * Cleanup expired or dismissed todos
   */
  static async cleanupExpiredTodos(): Promise<void> {
    try {
      console.log('🧹 Cleaning up expired todos...');

      // Mark overdue todos as expired (if they've been overdue for more than 7 days)
      const expiredCount = await TodoService.bulkUpdateExpired();
      
      if (expiredCount > 0) {
        console.log(`📋 Marked ${expiredCount} overdue todos as expired`);
      }

      // Auto-complete related todos when main todo is completed
      const autoCompletedCount = await TodoService.autoCompleteRelatedTodos({
        older_than_days: 1,
        status: 'completed'
      });

      if (autoCompletedCount > 0) {
        console.log(`✅ Auto-completed ${autoCompletedCount} related todos`);
      }

    } catch (error) {
      console.error('❌ Failed to cleanup expired todos:', error);
    }
  }

  /**
   * Get automation statistics
   */
  static async getAutomationStats(userId?: number): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) FILTER (WHERE metadata->>'auto_generated' = 'true') as auto_generated_count,
          COUNT(*) FILTER (WHERE metadata->>'auto_generated' = 'true' AND status = 'completed') as auto_completed_count,
          COUNT(*) FILTER (WHERE category = 'follow_up') as follow_up_count,
          AVG(EXTRACT(epoch FROM (completed_at - created_at))/3600) FILTER (WHERE status = 'completed' AND metadata->>'auto_generated' = 'true') as avg_completion_hours
        FROM user_todos 
        WHERE ($1::integer IS NULL OR user_id = $1)
          AND created_at > NOW() - INTERVAL '30 days'
      `;

      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });

      const result = await pool.query(query, [userId]);
      await pool.end();

      return result.rows[0];
    } catch (error) {
      console.error('Failed to get automation stats:', error);
      return {};
    }
  }
}

export default NotificationTodoAutomation;