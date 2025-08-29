/**
 * Todo Service Layer
 * Core CRUD operations and smart todo management for TME Portal
 * Phase 2: Backend Services Implementation
 */

import { query } from '@/lib/database';
import { logAuditEvent } from '@/lib/audit';

// TypeScript interfaces for todos
export interface Todo {
  id: string;
  user_id: number;
  notification_id: string | null;
  title: string;
  description: string | null;
  category: 'to_send' | 'to_check' | 'to_follow_up';
  priority: 'standard' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed' | 'expired';
  due_date: Date | null;
  auto_generated: boolean;
  action_type: string | null;
  action_data: any;
  application_id: string | null;
  client_name: string | null;
  document_type: string | null;
  created_at: Date;
  completed_at: Date | null;
  dismissed_at: Date | null;
  updated_at: Date;
}

export interface CreateTodoInput {
  user_id: number;
  notification_id?: string;
  title: string;
  description?: string;
  category: 'to_send' | 'to_check' | 'to_follow_up';
  priority?: 'standard' | 'urgent';
  status?: 'pending' | 'in_progress';
  due_date?: Date;
  auto_generated?: boolean;
  action_type?: string;
  action_data?: any;
  application_id?: string;
  client_name?: string;
  document_type?: string;
}

export interface TodoFilters {
  user_id: number;
  status?: string | string[];
  category?: string | string[];
  priority?: string | string[];
  overdue_only?: boolean;
  due_soon_only?: boolean;
  limit?: number;
  offset?: number;
}

export interface TodoStats {
  total_todos: number;
  pending_count: number;
  in_progress_count: number;
  completed_count: number;
  dismissed_count: number;
  overdue_count: number;
  due_soon_count: number;
}

export class TodoService {
  /**
   * Safely parse action_data JSON, handling various input formats
   */
  private static parseActionData(actionData: any): any {
    if (!actionData) return null;
    if (typeof actionData === 'object') return actionData; // Already parsed
    if (typeof actionData !== 'string') return actionData; // Not a string, return as-is
    
    try {
      return JSON.parse(actionData);
    } catch (error) {
      console.warn('Failed to parse action_data:', actionData, error);
      return actionData; // Return original string if parsing fails
    }
  }
  /**
   * Create a new todo item
   */
  static async create(input: CreateTodoInput): Promise<Todo> {
    const {
      user_id,
      notification_id = null,
      title,
      description = null,
      category,
      priority = 'standard',
      status = 'pending',
      due_date = null,
      auto_generated = false,
      action_type = null,
      action_data = null,
      application_id = null,
      client_name = null,
      document_type = null
    } = input;

    try {
      const result = await query(`
        INSERT INTO user_todos (
          user_id, notification_id, title, description, category, priority, status,
          due_date, auto_generated, action_type, action_data, application_id,
          client_name, document_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        user_id, notification_id, title, description, category, priority, status,
        due_date, auto_generated, action_type, action_data ? JSON.stringify(action_data) : null, application_id,
        client_name, document_type
      ]);

      const todo = result.rows[0];

      // Log the activity
      await logAuditEvent({
        user_id,
        action: 'todo_created',
        resource: 'todos',
        details: {
          todo_id: todo.id,
          title: todo.title,
          category: todo.category,
          priority: todo.priority,
          auto_generated: todo.auto_generated
        }
      });

      return todo;
    } catch (error) {
      console.error('TodoService.create error:', error);
      throw new Error(`Failed to create todo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get todos for a user with optional filters
   */
  static async getByUser(filters: TodoFilters): Promise<{ todos: Todo[], total: number }> {
    const {
      user_id,
      status,
      category,
      priority,
      overdue_only = false,
      due_soon_only = false,
      limit = 50,
      offset = 0
    } = filters;

    try {
      const whereConditions = ['user_id = $1'];
      const params: any[] = [user_id];
      let paramIndex = 2;

      // Status filter
      if (status) {
        if (Array.isArray(status)) {
          whereConditions.push(`status = ANY($${paramIndex})`);
          params.push(status);
        } else {
          whereConditions.push(`status = $${paramIndex}`);
          params.push(status);
        }
        paramIndex++;
      }

      // Category filter
      if (category) {
        if (Array.isArray(category)) {
          whereConditions.push(`category = ANY($${paramIndex})`);
          params.push(category);
        } else {
          whereConditions.push(`category = $${paramIndex}`);
          params.push(category);
        }
        paramIndex++;
      }

      // Priority filter
      if (priority) {
        if (Array.isArray(priority)) {
          whereConditions.push(`priority = ANY($${paramIndex})`);
          params.push(priority);
        } else {
          whereConditions.push(`priority = $${paramIndex}`);
          params.push(priority);
        }
        paramIndex++;
      }

      // Overdue filter
      if (overdue_only) {
        whereConditions.push(`due_date < CURRENT_TIMESTAMP AND status IN ('pending', 'in_progress')`);
      }

      // Due soon filter (within 24 hours)
      if (due_soon_only) {
        whereConditions.push(`due_date < CURRENT_TIMESTAMP + INTERVAL '24 hours' AND status IN ('pending', 'in_progress')`);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await query(`
        SELECT COUNT(*) as count FROM user_todos WHERE ${whereClause}
      `, params);
      const total = parseInt(countResult.rows[0].count);

      // Get todos with pagination
      const todosResult = await query(`
        SELECT * FROM user_todos 
        WHERE ${whereClause}
        ORDER BY 
          CASE priority
            WHEN 'urgent' THEN 1
            WHEN 'standard' THEN 2
          END,
          due_date ASC NULLS LAST,
          created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, offset]);

      const todos = todosResult.rows.map(row => ({
        ...row,
        action_data: this.parseActionData(row.action_data)
      }));

      return { todos, total };
    } catch (error) {
      console.error('TodoService.getByUser error:', error);
      throw new Error(`Failed to get todos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a single todo by ID (with user ownership check)
   */
  static async getById(todoId: string, userId: number): Promise<Todo | null> {
    try {
      const result = await query(`
        SELECT * FROM user_todos WHERE id = $1 AND user_id = $2
      `, [todoId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const todo = result.rows[0];
      return {
        ...todo,
        action_data: this.parseActionData(todo.action_data)
      };
    } catch (error) {
      console.error('TodoService.getById error:', error);
      throw new Error(`Failed to get todo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update todo status (complete, dismiss, etc.)
   */
  static async updateStatus(
    todoId: string, 
    userId: number, 
    status: 'pending' | 'in_progress' | 'completed' | 'dismissed' | 'expired'
  ): Promise<Todo | null> {
    try {
      const timestampField = status === 'completed' ? 'completed_at' : 
                           status === 'dismissed' ? 'dismissed_at' : null;

      const updateFields = timestampField 
        ? `status = $3, ${timestampField} = CURRENT_TIMESTAMP`
        : 'status = $3';

      const result = await query(`
        UPDATE user_todos 
        SET ${updateFields}
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `, [todoId, userId, status]);

      if (result.rows.length === 0) {
        return null;
      }

      const todo = result.rows[0];

      // Log the activity
      await logAuditEvent({
        user_id: userId,
        action: 'todo_status_updated',
        resource: 'todos',
        details: {
          todo_id: todoId,
          old_status: 'unknown', // We could fetch this if needed
          new_status: status,
          title: todo.title
        }
      });

      return {
        ...todo,
        action_data: this.parseActionData(todo.action_data)
      };
    } catch (error) {
      console.error('TodoService.updateStatus error:', error);
      throw new Error(`Failed to update todo status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get todo statistics for a user
   */
  static async getStats(userId: number): Promise<TodoStats> {
    try {
      const result = await query(`
        SELECT * FROM user_todo_stats WHERE user_id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        // Return empty stats if user has no todos
        return {
          total_todos: 0,
          pending_count: 0,
          in_progress_count: 0,
          completed_count: 0,
          dismissed_count: 0,
          overdue_count: 0,
          due_soon_count: 0
        };
      }

      const stats = result.rows[0];
      return {
        total_todos: parseInt(stats.total_todos) || 0,
        pending_count: parseInt(stats.pending_count) || 0,
        in_progress_count: parseInt(stats.in_progress_count) || 0,
        completed_count: parseInt(stats.completed_count) || 0,
        dismissed_count: parseInt(stats.dismissed_count) || 0,
        overdue_count: parseInt(stats.overdue_count) || 0,
        due_soon_count: parseInt(stats.due_soon_count) || 0
      };
    } catch (error) {
      console.error('TodoService.getStats error:', error);
      throw new Error(`Failed to get todo stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark related todos as completed when an action occurs
   * (Smart auto-completion feature)
   */
  static async autoCompleteRelatedTodos(criteria: {
    user_id: number;
    action_type?: string;
    application_id?: string;
    client_name?: string;
    document_type?: string;
  }): Promise<number> {
    const { user_id, action_type, application_id, client_name, document_type } = criteria;

    try {
      const whereConditions = ['user_id = $1', 'status IN (\'pending\', \'in_progress\')'];
      const params: any[] = [user_id];
      let paramIndex = 2;

      if (action_type) {
        whereConditions.push(`action_type = $${paramIndex}`);
        params.push(action_type);
        paramIndex++;
      }

      if (application_id) {
        whereConditions.push(`application_id = $${paramIndex}`);
        params.push(application_id);
        paramIndex++;
      }

      if (client_name) {
        whereConditions.push(`client_name = $${paramIndex}`);
        params.push(client_name);
        paramIndex++;
      }

      if (document_type) {
        whereConditions.push(`document_type = $${paramIndex}`);
        params.push(document_type);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const result = await query(`
        UPDATE user_todos 
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE ${whereClause}
        RETURNING id, title
      `, params);

      const completedCount = result.rows.length;

      if (completedCount > 0) {
        // Log the auto-completion activity
        await logAuditEvent({
          user_id,
          action: 'todos_auto_completed',
          resource: 'todos',
          details: {
            completed_count: completedCount,
            criteria: { action_type, application_id, client_name, document_type },
            completed_todos: result.rows.map(row => ({ id: row.id, title: row.title }))
          }
        });
      }

      return completedCount;
    } catch (error) {
      console.error('TodoService.autoCompleteRelatedTodos error:', error);
      throw new Error(`Failed to auto-complete todos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a todo (admin only or for cleanup)
   */
  static async delete(todoId: string, userId: number): Promise<boolean> {
    try {
      const result = await query(`
        DELETE FROM user_todos WHERE id = $1 AND user_id = $2 RETURNING id
      `, [todoId, userId]);

      const deleted = result.rows.length > 0;

      if (deleted) {
        await logAuditEvent({
          user_id: userId,
          action: 'todo_deleted',
          resource: 'todos',
          details: { todo_id: todoId }
        });
      }

      return deleted;
    } catch (error) {
      console.error('TodoService.delete error:', error);
      throw new Error(`Failed to delete todo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Bulk status update for multiple todos
   */
  static async bulkUpdateStatus(
    todoIds: string[], 
    userId: number, 
    status: 'completed' | 'dismissed'
  ): Promise<number> {
    try {
      const timestampField = status === 'completed' ? 'completed_at' : 'dismissed_at';

      const result = await query(`
        UPDATE user_todos 
        SET status = $3, ${timestampField} = CURRENT_TIMESTAMP
        WHERE id = ANY($1) AND user_id = $2
        RETURNING id, title
      `, [todoIds, userId, status]);

      const updatedCount = result.rows.length;

      if (updatedCount > 0) {
        await logAuditEvent({
          user_id: userId,
          action: 'todos_bulk_updated',
          resource: 'todos',
          details: {
            updated_count: updatedCount,
            new_status: status,
            updated_todos: result.rows.map(row => ({ id: row.id, title: row.title }))
          }
        });
      }

      return updatedCount;
    } catch (error) {
      console.error('TodoService.bulkUpdateStatus error:', error);
      throw new Error(`Failed to bulk update todos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get overdue todos for reminder system
   */
  static async getOverdueTodos(hours: number = 24): Promise<Todo[]> {
    try {
      const result = await query(`
        SELECT ut.*, u.full_name, u.email 
        FROM user_todos ut
        JOIN users u ON ut.user_id = u.id
        WHERE ut.due_date < CURRENT_TIMESTAMP - INTERVAL '${hours} hours'
        AND ut.status IN ('pending', 'in_progress')
        ORDER BY ut.due_date ASC
      `, []);

      return result.rows.map(row => ({
        ...row,
        action_data: row.action_data ? JSON.parse(row.action_data) : null
      }));
    } catch (error) {
      console.error('TodoService.getOverdueTodos error:', error);
      throw new Error(`Failed to get overdue todos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}