/**
 * Todo Statistics API Route
 * Get todo statistics and dashboard data for users
 * Phase 2: Backend Services Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { TodoService } from '@/lib/services/todo-service';

// GET /api/user/todos/stats - Get user todo statistics
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

    // Get comprehensive stats
    const stats = await TodoService.getStats(userId);

    // Calculate completion rate
    const completionRate = stats.total_todos > 0 
      ? Math.round((stats.completed_count / stats.total_todos) * 100) 
      : 0;

    // Calculate active todos (pending + in_progress)
    const activeTodos = stats.pending_count + stats.in_progress_count;

    // Determine priority level for overdue todos
    let priorityLevel = 'normal';
    if (stats.overdue_count > 5) {
      priorityLevel = 'critical';
    } else if (stats.overdue_count > 2) {
      priorityLevel = 'high';
    } else if (stats.overdue_count > 0) {
      priorityLevel = 'medium';
    }

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        active_todos: activeTodos,
        completion_rate: completionRate,
        overdue_priority_level: priorityLevel
      },
      insights: {
        has_overdue: stats.overdue_count > 0,
        has_due_soon: stats.due_soon_count > 0,
        productivity_score: completionRate,
        needs_attention: stats.overdue_count > 0 || stats.due_soon_count > 0,
        workload_level: activeTodos > 10 ? 'heavy' : activeTodos > 5 ? 'moderate' : 'light'
      }
    });

  } catch (error) {
    console.error('GET /api/user/todos/stats error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get todo statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}