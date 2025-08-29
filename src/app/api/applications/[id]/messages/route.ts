// Get Application Message History API Route
// Retrieves conversation history between submitters and reviewers

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationsService } from '@/lib/services/review-system';
import { getReviewSystemConfig } from '@/lib/config/review-system';
import { verifySession } from '@/lib/auth';

// GET /api/applications/[id]/messages - Get message history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log('🔧 MESSAGES API: Called for application ID:', id);
  
  // Safety check: Feature flag
  const config = getReviewSystemConfig();
  if (!config.enabled) {
    console.log('🔧 MESSAGES API: Review system disabled');
    return NextResponse.json({ success: false, message: 'Review system is currently disabled' }, { status: 200 });
  }

  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      console.log('🔧 MESSAGES API: No session found');
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    console.log('🔧 MESSAGES API: Session verified for user:', session.user.id);
    
    // Get application to verify user has access
    const userId = session.user.id;
    const application = await ApplicationsService.getByIdInternal(id);
    if (!application) {
      console.log('🔧 MESSAGES API: Application not found:', id);
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }
    console.log('🔧 MESSAGES API: Application found:', application.id);
    
    // Check if user has access to this application (either submitter or reviewer)
    if (application.submitted_by_id !== userId && application.reviewer_id !== userId) {
      console.log('🔧 MESSAGES API: Access denied. User:', userId, 'Submitter:', application.submitted_by_id, 'Reviewer:', application.reviewer_id);
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }
    console.log('🔧 MESSAGES API: Access granted for user:', userId);
    
    // Get message history
    console.log('🔧 MESSAGES API: Fetching message history...');
    const messages = await ApplicationsService.getMessageHistory(id);
    console.log('🔧 MESSAGES API: Found messages:', messages.length);
    
    return NextResponse.json(messages, { status: 200 });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: config.debugMode ? (error as Error).message : 'Failed to get message history'
      }, 
      { status: config.debugMode ? 500 : 200 }
    );
  }
}