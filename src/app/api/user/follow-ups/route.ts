/**
 * Email Follow-ups API Route
 * Main endpoint for follow-up CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { FollowUpService, FollowUpFilters, CreateFollowUpInput } from '@/lib/services/follow-up-service';
import { logAuditEvent } from '@/lib/audit';

// GET /api/user/follow-ups - Fetch user follow-ups with filters
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

    // Check if table exists (for graceful handling before migration)
    const tableExists = await FollowUpService.tableExists();
    if (!tableExists) {
      console.log('Follow-ups table does not exist yet. Run migration: npm run migrate:follow-ups');
      return NextResponse.json({
        success: true,
        follow_ups: [],
        stats: {
          total_pending: 0,
          total_completed: 0,
          total_no_response: 0,
          overdue_count: 0,
          due_today_count: 0
        },
        total: 0,
        pagination: {
          limit: 50,
          offset: 0,
          has_more: false
        }
      });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters: FollowUpFilters = {
      user_id: userId,
      status: searchParams.get('status') as any,
      follow_up_number: searchParams.get('follow_up_number') ? 
        parseInt(searchParams.get('follow_up_number')!) as any : undefined,
      client_name: searchParams.get('client_name') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    // Fetch follow-ups and stats in parallel
    const [result, stats] = await Promise.all([
      FollowUpService.getByUser(filters),
      FollowUpService.getStats(userId)
    ]);

    return NextResponse.json({
      success: true,
      follow_ups: result.follow_ups,
      stats,
      total: result.total,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        has_more: (filters.offset || 0) + (filters.limit || 50) < result.total
      }
    });

  } catch (error) {
    console.error('GET /api/user/follow-ups error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch follow-ups',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/user/follow-ups - Create a new follow-up
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

    // Check if table exists
    const tableExists = await FollowUpService.tableExists();
    if (!tableExists) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Follow-ups system not initialized. Please run migration.',
          details: 'Run: npm run migrate:follow-ups'
        },
        { status: 503 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      email_subject,
      client_name,
      client_email,
      document_type,
      original_email_id,
      sent_date
    } = body;

    // Validate required fields
    if (!email_subject || !client_name) {
      return NextResponse.json(
        { error: 'Email subject and client name are required' },
        { status: 400 }
      );
    }

    const followUpInput: CreateFollowUpInput = {
      user_id: userId,
      email_subject,
      client_name,
      client_email,
      document_type,
      original_email_id,
      sent_date: sent_date ? new Date(sent_date) : undefined
    };

    const followUp = await FollowUpService.create(followUpInput);

    return NextResponse.json({
      success: true,
      message: 'Follow-up created successfully',
      follow_up: followUp
    });

  } catch (error) {
    console.error('POST /api/user/follow-ups error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create follow-up',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/user/follow-ups - Update follow-up status
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if table exists
    const tableExists = await FollowUpService.tableExists();
    if (!tableExists) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Follow-ups system not initialized. Please run migration.',
          details: 'Run: npm run migrate:follow-ups'
        },
        { status: 503 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      follow_up_id,
      action,
      reason,
      manager_id,
      manager_name
    } = body;

    // Validate required fields
    if (!follow_up_id || !action) {
      return NextResponse.json(
        { error: 'Follow-up ID and action are required' },
        { status: 400 }
      );
    }

    let updatedFollowUp;

    switch (action) {
      case 'complete':
        updatedFollowUp = await FollowUpService.updateStatus(
          follow_up_id,
          userId,
          'completed',
          reason || 'client_responded'
        );
        break;

      case 'snooze':
        updatedFollowUp = await FollowUpService.snooze(follow_up_id, userId);
        break;

      case 'no_response':
        updatedFollowUp = await FollowUpService.updateStatus(
          follow_up_id,
          userId,
          'no_response'
        );
        break;

      case 'resend':
        updatedFollowUp = await FollowUpService.resend(follow_up_id, userId);
        break;

      case 'escalate':
        // Manual escalation to selected manager
        if (!manager_id) {
          return NextResponse.json(
            { error: 'Manager ID is required for escalation' },
            { status: 400 }
          );
        }
        updatedFollowUp = await FollowUpService.manualEscalate(
          follow_up_id,
          userId,
          manager_id,
          manager_name
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: complete, snooze, no_response, or resend' },
          { status: 400 }
        );
    }

    // Log audit event
    await logAuditEvent({
      user_id: userId,
      action: `follow_up_${action}`,
      resource: `follow_up_${follow_up_id}`,
      details: { action, reason }
    });

    return NextResponse.json({
      success: true,
      message: `Follow-up ${action} successful`,
      follow_up: updatedFollowUp
    });

  } catch (error) {
    console.error('PATCH /api/user/follow-ups error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update follow-up',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}