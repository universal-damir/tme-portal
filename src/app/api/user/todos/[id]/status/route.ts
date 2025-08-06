/**
 * Todo Status Update API Route
 * Update status of individual todos (complete, dismiss, etc.)
 * Phase 2: Backend Services Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { TodoService } from '@/lib/services/todo-service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// PUT /api/user/todos/[id]/status - Update todo status
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const { id: todoId } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'dismissed', 'expired'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update todo status
    const updatedTodo = await TodoService.updateStatus(todoId, userId, status);

    if (!updatedTodo) {
      return NextResponse.json(
        { error: 'Todo not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Todo status updated to ${status}`,
      todo: updatedTodo
    });

  } catch (error) {
    const { id } = await params;
    console.error(`PUT /api/user/todos/${id}/status error:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update todo status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/user/todos/[id]/status - Get current todo status (for verification)
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    const { id: todoId } = await params;

    // Get todo
    const todo = await TodoService.getById(todoId, userId);

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      todo_id: todoId,
      status: todo.status,
      completed_at: todo.completed_at,
      dismissed_at: todo.dismissed_at,
      updated_at: todo.updated_at
    });

  } catch (error) {
    const { id } = await params;
    console.error(`GET /api/user/todos/${id}/status error:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get todo status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}