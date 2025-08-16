// Applications API Route
// Safe CRUD operations for applications

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationsService } from '@/lib/services/review-system';
import { getReviewSystemConfig } from '@/lib/config/review-system';
import { verifySession } from '@/lib/auth';

// GET /api/applications - Fetch user's applications
export async function GET(request: NextRequest) {
  // Safety check: Feature flag
  const config = getReviewSystemConfig();
  if (!config.enabled) {
    return NextResponse.json(
      { applications: [] }, 
      { status: 200 }
    );
  }

  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json(
        { applications: [], error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    const userId = session.user.id;

    const url = new URL(request.url);
    const mode = url.searchParams.get('mode');
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const limit = url.searchParams.get('limit');

    let applications;
    if (mode === 'review') {
      // Get applications assigned for review
      applications = await ApplicationsService.getForReview(userId);
    } else {
      // Get user's own applications
      applications = await ApplicationsService.getByUser(userId);
    }

    // Filter by type if specified
    if (type) {
      applications = applications.filter(app => app.type === type);
    }

    // Filter by status if specified
    if (status) {
      applications = applications.filter(app => app.status === status);
    }

    // Limit results if specified
    if (limit) {
      const limitNum = parseInt(limit);
      applications = applications.slice(0, limitNum);
    }

    return NextResponse.json({ applications }, { status: 200 });

  } catch (error) {
    console.error('Applications API error:', error);
    
    // Safe fallback - return empty applications instead of error
    return NextResponse.json(
      { 
        applications: [],
        error: config.debugMode ? (error as Error).message : 'Service temporarily unavailable'
      }, 
      { status: config.debugMode ? 500 : 200 }
    );
  }
}

// POST /api/applications - Create new application
export async function POST(request: NextRequest) {
  const config = getReviewSystemConfig();
  if (!config.enabled) {
    return NextResponse.json({ success: false }, { status: 200 });
  }

  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;

    const body = await request.json();
    const { type, title, form_data } = body;

    if (!type || !title || !form_data) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    const application = await ApplicationsService.create({
      type,
      title,
      form_data
    }, userId);

    return NextResponse.json({ 
      success: true, 
      application 
    }, { status: 201 });

  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: config.debugMode ? (error as Error).message : 'Failed to create application'
      }, 
      { status: config.debugMode ? 500 : 200 }
    );
  }
}