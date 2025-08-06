/**
 * Todo Bulk Operations API Route
 * Bulk update multiple todos at once
 * Phase 2: Backend Services Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { TodoService } from '@/lib/services/todo-service';

// PUT /api/user/todos/bulk - Bulk update todo statuses
export async function PUT(request: NextRequest) {
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
    const { todo_ids, status } = body;

    // Validate input
    if (!todo_ids || !Array.isArray(todo_ids) || todo_ids.length === 0) {
      return NextResponse.json(
        { error: 'todo_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (todo_ids.length > 50) {
      return NextResponse.json(
        { error: 'Cannot update more than 50 todos at once' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['completed', 'dismissed'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status for bulk update. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Perform bulk update
    const updatedCount = await TodoService.bulkUpdateStatus(todo_ids, userId, status);

    return NextResponse.json({
      success: true,
      message: `${updatedCount} todos updated to ${status}`,
      updated_count: updatedCount,
      requested_count: todo_ids.length,
      status: status
    });

  } catch (error) {
    console.error('PUT /api/user/todos/bulk error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to bulk update todos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/user/todos/bulk - Bulk create todos (for admin or system use)
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
    const { todos } = body;

    // Validate input
    if (!todos || !Array.isArray(todos) || todos.length === 0) {
      return NextResponse.json(
        { error: 'todos must be a non-empty array' },
        { status: 400 }
      );
    }

    if (todos.length > 20) {
      return NextResponse.json(
        { error: 'Cannot create more than 20 todos at once' },
        { status: 400 }
      );
    }

    // Validate each todo
    const validCategories = ['review', 'follow_up', 'reminder', 'action'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    for (let i = 0; i < todos.length; i++) {
      const todo = todos[i];
      
      if (!todo.title || !todo.category) {
        return NextResponse.json(
          { error: `Todo ${i + 1}: title and category are required` },
          { status: 400 }
        );
      }

      if (!validCategories.includes(todo.category)) {
        return NextResponse.json(
          { error: `Todo ${i + 1}: invalid category` },
          { status: 400 }
        );
      }

      if (todo.priority && !validPriorities.includes(todo.priority)) {
        return NextResponse.json(
          { error: `Todo ${i + 1}: invalid priority` },
          { status: 400 }
        );
      }
    }

    // Create todos
    const createdTodos = [];
    const errors = [];

    for (let i = 0; i < todos.length; i++) {
      try {
        const todoData = {
          ...todos[i],
          user_id: userId,
          auto_generated: false,
          due_date: todos[i].due_date ? new Date(todos[i].due_date) : undefined
        };

        const createdTodo = await TodoService.create(todoData);
        createdTodos.push(createdTodo);
      } catch (error) {
        errors.push({
          index: i,
          todo: todos[i],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${createdTodos.length} todos created successfully`,
      created_count: createdTodos.length,
      requested_count: todos.length,
      created_todos: createdTodos,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('POST /api/user/todos/bulk error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to bulk create todos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}