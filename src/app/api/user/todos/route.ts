/**
 * User Todos API Route
 * Main endpoint for todo CRUD operations
 * Phase 2: Backend Services Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { TodoService, TodoFilters, CreateTodoInput } from '@/lib/services/todo-service';
import { generateTodoFromNotification, shouldGenerateTodo } from '@/lib/config/todo-generation-rules';
import { logAuditEvent } from '@/lib/audit';

// GET /api/user/todos - Fetch user todos with filters
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters: TodoFilters = {
      user_id: userId,
      status: searchParams.get('status') ? 
        searchParams.get('status')!.split(',') : undefined,
      category: searchParams.get('category') ? 
        searchParams.get('category')!.split(',') : undefined,
      priority: searchParams.get('priority') ? 
        searchParams.get('priority')!.split(',') : undefined,
      overdue_only: searchParams.get('overdue_only') === 'true',
      due_soon_only: searchParams.get('due_soon_only') === 'true',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    // Fetch todos and stats in parallel
    const [result, stats] = await Promise.all([
      TodoService.getByUser(filters),
      TodoService.getStats(userId)
    ]);

    // Note: Removed todos_fetched logging to reduce activity noise

    return NextResponse.json({
      success: true,
      todos: result.todos,
      stats,
      total: result.total,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        has_more: (filters.offset || 0) + (filters.limit || 50) < result.total
      }
    });

  } catch (error) {
    console.error('GET /api/user/todos error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch todos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/user/todos - Create a new todo (manual or auto-generated)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    // Handle auto-generation from notification
    if (body.from_notification) {
      const { notification_data } = body;
      
      if (!notification_data || !notification_data.type) {
        return NextResponse.json(
          { error: 'Invalid notification data for todo generation' },
          { status: 400 }
        );
      }

      // Check if we should generate a todo for this notification
      if (!shouldGenerateTodo(notification_data.type, notification_data)) {
        return NextResponse.json({
          success: true,
          message: 'Todo generation skipped based on business rules',
          todo_generated: false
        });
      }

      // Generate todo from notification
      const todoInput = generateTodoFromNotification({
        ...notification_data,
        user_id: userId
      });

      // Add notification reference
      if (notification_data.notification_id) {
        todoInput.notification_id = notification_data.notification_id;
      }

      const todo = await TodoService.create(todoInput);

      return NextResponse.json({
        success: true,
        message: 'Todo generated from notification',
        todo,
        todo_generated: true
      });
    }

    // Handle manual todo creation
    const {
      title,
      description,
      category,
      priority = 'medium',
      due_date,
      action_type,
      action_data,
      application_id,
      client_name,
      document_type
    } = body;

    // Validate required fields
    if (!title || !category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      );
    }

    // Validate category and priority values
    const validCategories = ['review', 'follow_up', 'reminder', 'action'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    const todoInput: CreateTodoInput = {
      user_id: userId,
      title,
      description,
      category,
      priority,
      due_date: due_date ? new Date(due_date) : undefined,
      action_type,
      action_data,
      application_id,
      client_name,
      document_type,
      auto_generated: false
    };

    const todo = await TodoService.create(todoInput);

    return NextResponse.json({
      success: true,
      message: 'Todo created successfully',
      todo
    });

  } catch (error) {
    console.error('POST /api/user/todos error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create todo',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}