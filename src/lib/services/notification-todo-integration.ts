/**
 * Notification-Todo Integration Service
 * Handles automatic todo generation from notifications and auto-completion logic
 * Phase 2: Backend Services Implementation
 */

import { TodoService, CreateTodoInput } from './todo-service';
import { 
  generateTodoFromNotification, 
  shouldGenerateTodo, 
  getAutoCompletionCriteria,
  NotificationData 
} from '@/lib/config/todo-generation-rules';
import { logAuditEvent } from '@/lib/audit';

export interface NotificationTodoIntegrationOptions {
  auto_generate_todos: boolean;
  auto_complete_related: boolean;
  debug_mode?: boolean;
}

export class NotificationTodoIntegration {
  /**
   * Handle notification creation with automatic todo generation
   */
  static async handleNotificationCreated(
    notificationData: NotificationData,
    options: NotificationTodoIntegrationOptions = {
      auto_generate_todos: true,
      auto_complete_related: true
    }
  ): Promise<{
    todo_generated: boolean;
    todo_id?: string;
    auto_completed_count?: number;
    message: string;
  }> {
    const { auto_generate_todos, auto_complete_related, debug_mode } = options;

    try {
      const result = {
        todo_generated: false,
        auto_completed_count: 0,
        message: 'No actions taken'
      };

      // Step 1: Auto-complete related todos if this notification indicates completion
      if (auto_complete_related) {
        const completedCount = await this.autoCompleteRelatedTodos(notificationData);
        result.auto_completed_count = completedCount;

        if (debug_mode && completedCount > 0) {
          console.log(`🔧 Auto-completed ${completedCount} related todos for notification ${notificationData.type}`);
        }
      }

      // Step 2: Generate new todo if appropriate
      if (auto_generate_todos && shouldGenerateTodo(notificationData.type, notificationData)) {
        const todoInput = generateTodoFromNotification(notificationData);
        
        // Add notification reference if available
        if ((notificationData as any).notification_id) {
          todoInput.notification_id = (notificationData as any).notification_id;
        }

        const createdTodo = await TodoService.create(todoInput);
        
        result.todo_generated = true;
        result.todo_id = createdTodo.id;

        if (debug_mode) {
          console.log(`🔧 Generated todo "${createdTodo.title}" from notification ${notificationData.type}`);
        }

        // Log the integration activity
        await logAuditEvent({
          user_id: notificationData.user_id,
          action: 'todo_auto_generated',
          resource: 'todos',
          details: {
            notification_type: notificationData.type,
            todo_id: createdTodo.id,
            todo_title: createdTodo.title,
            todo_category: createdTodo.category,
            todo_priority: createdTodo.priority
          }
        });
      }

      // Update result message
      if (result.todo_generated && result.auto_completed_count > 0) {
        result.message = `Generated 1 new todo and auto-completed ${result.auto_completed_count} related todos`;
      } else if (result.todo_generated) {
        result.message = 'Generated 1 new todo';
      } else if (result.auto_completed_count > 0) {
        result.message = `Auto-completed ${result.auto_completed_count} related todos`;
      } else {
        result.message = 'No todo actions required';
      }

      return result;

    } catch (error) {
      console.error('NotificationTodoIntegration.handleNotificationCreated error:', error);
      throw new Error(`Failed to handle notification-todo integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auto-complete related todos based on notification data
   */
  private static async autoCompleteRelatedTodos(notificationData: NotificationData): Promise<number> {
    const completionCriteria = getAutoCompletionCriteria(notificationData.type, notificationData);
    
    if (!completionCriteria) {
      return 0;
    }

    // Add user_id to criteria
    const criteria = {
      user_id: notificationData.user_id,
      ...completionCriteria
    };

    try {
      const completedCount = await TodoService.autoCompleteRelatedTodos(criteria);
      return completedCount;
    } catch (error) {
      console.error('Error auto-completing related todos:', error);
      return 0;
    }
  }

  /**
   * Handle specific notification types with custom logic
   */
  static async handleSpecificNotificationType(
    notificationType: string,
    notificationData: NotificationData
  ): Promise<void> {
    switch (notificationType) {
      case 'review_completed':
        await this.handleReviewCompleted(notificationData);
        break;
        
      case 'pdf_sent_to_client':
        await this.handleDocumentSentToClient(notificationData);
        break;
        
      case 'form_submitted_for_review':
        await this.handleFormSubmittedForReview(notificationData);
        break;
        
      default:
        // Use standard handling
        break;
    }
  }

  /**
   * Handle review completion - generate follow-up todos
   */
  private static async handleReviewCompleted(notificationData: NotificationData): Promise<void> {
    // Auto-complete the original review todo
    await TodoService.autoCompleteRelatedTodos({
      user_id: notificationData.user_id,
      action_type: 'review_document',
      application_id: notificationData.application_id
    });

    // Generate follow-up todo based on approval status
    const followUpTodoInput = generateTodoFromNotification({
      ...notificationData,
      type: 'review_completed'
    });

    await TodoService.create(followUpTodoInput);
  }

  /**
   * Handle document sent to client - schedule follow-up
   */
  private static async handleDocumentSentToClient(notificationData: NotificationData): Promise<void> {
    // Generate 7-day follow-up todo
    const followUpTodoInput = generateTodoFromNotification({
      ...notificationData,
      type: 'pdf_sent_to_client'
    });

    await TodoService.create(followUpTodoInput);

    // Log the scheduled follow-up
    await logAuditEvent({
      user_id: notificationData.user_id,
      action: 'follow_up_scheduled',
      resource: 'todos',
      details: {
        client_name: notificationData.client_name,
        document_type: notificationData.document_type,
        follow_up_date: followUpTodoInput.due_date,
        reason: 'document_sent_to_client'
      }
    });
  }

  /**
   * Handle form submitted for review - generate review todo
   */
  private static async handleFormSubmittedForReview(notificationData: NotificationData): Promise<void> {
    // Generate review todo for the reviewer
    const reviewTodoInput = generateTodoFromNotification({
      ...notificationData,
      type: 'review_requested'
    });

    await TodoService.create(reviewTodoInput);
  }

  /**
   * Schedule client follow-up reminders (for cron job)
   */
  static async scheduleClientFollowUpReminders(): Promise<{
    reminders_created: number;
    clients_contacted: string[];
  }> {
    try {
      // Get todos that are 7+ days overdue and are follow-up type
      const overdueTodos = await TodoService.getOverdueTodos(168); // 7 days = 168 hours
      
      const followUpTodos = overdueTodos.filter(todo => 
        todo.category === 'follow_up' && 
        todo.action_type === 'contact_client' &&
        todo.status === 'pending'
      );

      const remindersCreated = [];
      const clientsContacted = new Set<string>();

      for (const todo of followUpTodos) {
        // Create urgent reminder todo
        const reminderTodoInput: CreateTodoInput = {
          user_id: todo.user_id,
          title: `URGENT: Follow up on overdue client contact - ${todo.client_name}`,
          description: `Original follow-up todo "${todo.title}" is now ${Math.ceil((Date.now() - todo.due_date!.getTime()) / (24 * 60 * 60 * 1000))} days overdue.`,
          category: 'reminder',
          priority: 'urgent',
          due_date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
          action_type: 'urgent_follow_up',
          action_data: {
            original_todo_id: todo.id,
            client_name: todo.client_name,
            days_overdue: Math.ceil((Date.now() - todo.due_date!.getTime()) / (24 * 60 * 60 * 1000)),
            original_due_date: todo.due_date
          },
          client_name: todo.client_name,
          document_type: todo.document_type,
          auto_generated: true
        };

        const reminderTodo = await TodoService.create(reminderTodoInput);
        remindersCreated.push(reminderTodo);
        
        if (todo.client_name) {
          clientsContacted.add(todo.client_name);
        }

        // Mark original todo as expired
        await TodoService.updateStatus(todo.id, todo.user_id, 'expired');
      }

      return {
        reminders_created: remindersCreated.length,
        clients_contacted: Array.from(clientsContacted)
      };

    } catch (error) {
      console.error('Error scheduling client follow-up reminders:', error);
      throw new Error(`Failed to schedule reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up completed and dismissed todos (for maintenance)
   */
  static async cleanupCompletedTodos(daysOld: number = 30): Promise<number> {
    try {
      // This would require a cleanup method in TodoService
      // For now, we'll just return 0 as this is a future enhancement
      return 0;
    } catch (error) {
      console.error('Error cleaning up completed todos:', error);
      return 0;
    }
  }

  /**
   * Get integration statistics
   */
  static async getIntegrationStats(userId: number): Promise<{
    total_auto_generated: number;
    total_auto_completed: number;
    integration_success_rate: number;
  }> {
    try {
      // Get todos that were auto-generated
      const { todos: autoGeneratedTodos } = await TodoService.getByUser({
        user_id: userId,
        limit: 1000
      });

      const autoGenerated = autoGeneratedTodos.filter(todo => todo.auto_generated);
      const autoCompleted = autoGeneratedTodos.filter(todo => 
        todo.auto_generated && todo.status === 'completed'
      );

      const successRate = autoGenerated.length > 0 
        ? Math.round((autoCompleted.length / autoGenerated.length) * 100) 
        : 0;

      return {
        total_auto_generated: autoGenerated.length,
        total_auto_completed: autoCompleted.length,
        integration_success_rate: successRate
      };

    } catch (error) {
      console.error('Error getting integration stats:', error);
      return {
        total_auto_generated: 0,
        total_auto_completed: 0,
        integration_success_rate: 0
      };
    }
  }
}