// Submit Application for Review API Route
// Safe review submission with comprehensive validation

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationsService } from '@/lib/services/review-system';
import { getReviewSystemConfig } from '@/lib/config/review-system';
import { verifySession } from '@/lib/auth';

// POST /api/applications/[id]/submit-review - Submit application for review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Safety check: Feature flag
  const config = getReviewSystemConfig();
  if (!config.enabled || !config.reviewSubmissionEnabled) {
    return NextResponse.json({ success: false, message: 'Review submission is currently disabled' }, { status: 200 });
  }

  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;

    const body = await request.json();
    const { reviewer_id, urgency, comments } = body;

    // Validation
    if (!reviewer_id || !urgency) {
      return NextResponse.json(
        { error: 'Missing required fields: reviewer_id and urgency' }, 
        { status: 400 }
      );
    }

    if (!['standard', 'urgent'].includes(urgency)) {
      return NextResponse.json(
        { error: 'Invalid urgency level. Must be: standard or urgent' }, 
        { status: 400 }
      );
    }

    // Submit for review
    const success = await ApplicationsService.submitForReview({
      application_id: id,
      reviewer_id: parseInt(reviewer_id),
      urgency,
      comments
    }, userId);

    if (success) {
      return NextResponse.json({ 
        success: true,
        message: 'Application submitted for review successfully'
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Failed to submit application for review'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: config.debugMode ? (error as Error).message : 'Failed to submit for review'
      }, 
      { status: config.debugMode ? 500 : 200 }
    );
  }
}