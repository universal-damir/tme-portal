// Reviewers API Route
// Safe implementation for fetching available reviewers

import { NextRequest, NextResponse } from 'next/server';
import { ReviewersService } from '@/lib/services/review-system';
import { getReviewSystemConfig } from '@/lib/config/review-system';
import { verifySession } from '@/lib/auth';

// GET /api/reviewers - Fetch available reviewers for current user
export async function GET(request: NextRequest) {
  // Safety check: Feature flag
  const config = getReviewSystemConfig();
  if (!config.enabled || !config.showReviewerDropdown) {
    return NextResponse.json(
      { reviewers: [] }, 
      { status: 200 }
    );
  }

  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json(
        { reviewers: [], error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    const userId = session.user.id;

    // Get document type from query params
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('documentType');

    // Fetch available reviewers (department colleagues + UH user Uwe, or Company Setup for specific docs)
    const reviewers = await ReviewersService.getAvailableReviewers(userId, documentType || undefined);

    return NextResponse.json({ reviewers }, { status: 200 });

  } catch (error) {
    console.error('Reviewers API error:', error);
    
    // Safe fallback - return empty reviewers instead of error
    return NextResponse.json(
      { 
        reviewers: [],
        error: config.debugMode ? (error as Error).message : 'Service temporarily unavailable'
      }, 
      { status: config.debugMode ? 500 : 200 }
    );
  }
}