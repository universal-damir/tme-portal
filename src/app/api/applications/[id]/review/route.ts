// Review Application Action API Route
// Safe approve/reject actions with comprehensive validation

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationsService } from '@/lib/services/review-system';
import { getReviewSystemConfig } from '@/lib/config/review-system';
import { verifySession } from '@/lib/auth';

// POST /api/applications/[id]/review - Approve or reject application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Safety check: Feature flag
  const config = getReviewSystemConfig();
  if (!config.enabled || !config.allowReviewActions) {
    return NextResponse.json({ success: false, message: 'Review actions are currently disabled' }, { status: 200 });
  }

  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;

    const body = await request.json();
    const { action, comments } = body;

    // Validation
    if (!action) {
      return NextResponse.json(
        { error: 'Missing required field: action' }, 
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: approve or reject' }, 
        { status: 400 }
      );
    }

    // Comments are required for reject, optional for approve
    if (action === 'reject' && (!comments || comments.trim().length < 10)) {
      return NextResponse.json(
        { error: 'Comments are required when rejecting (minimum 10 characters)' }, 
        { status: 400 }
      );
    }

    // Perform review action
    const success = await ApplicationsService.performReviewAction({
      application_id: id,
      action,
      comments: comments ? comments.trim() : ''
    }, userId);

    if (success) {
      return NextResponse.json({ 
        success: true,
        message: `Application ${action}ed successfully`
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Failed to perform review action'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Review action error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: config.debugMode ? (error as Error).message : 'Failed to perform review action'
      }, 
      { status: config.debugMode ? 500 : 200 }
    );
  }
}