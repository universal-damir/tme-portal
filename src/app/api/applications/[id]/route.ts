// Application by ID API Route
// Handles individual application operations

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationsService } from '@/lib/services/review-system';
import { getReviewSystemConfig } from '@/lib/config/review-system';
import { verifySession } from '@/lib/auth';

// GET /api/applications/[id] - Get single application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const config = getReviewSystemConfig();
  if (!config.enabled) {
    return NextResponse.json(
      { application: null }, 
      { status: 200 }
    );
  }

  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json(
        { application: null, error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    const userId = session.user.id;

    // Get application by ID with access control (submitter or reviewer can access)
    const application = await ApplicationsService.getById(id, userId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ application }, { status: 200 });

  } catch (error) {
    console.error('Get application error:', error);
    return NextResponse.json(
      { 
        application: null,
        error: config.debugMode ? (error as Error).message : 'Failed to get application'
      }, 
      { status: config.debugMode ? 500 : 200 }
    );
  }
}

// PUT /api/applications/[id] - Update existing application
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const { title, form_data } = body;

    if (!title && !form_data) {
      return NextResponse.json(
        { error: 'At least one field (title or form_data) is required' }, 
        { status: 400 }
      );
    }

    const application = await ApplicationsService.update(id, {
      title,
      form_data
    }, userId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found or access denied' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(application, { status: 200 });

  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: config.debugMode ? (error as Error).message : 'Failed to update application'
      }, 
      { status: config.debugMode ? 500 : 200 }
    );
  }
}