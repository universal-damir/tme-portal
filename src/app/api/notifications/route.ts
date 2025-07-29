// Notifications API Route
// Safe implementation with feature flags and error handling

import { NextRequest, NextResponse } from 'next/server';
import { NotificationsService } from '@/lib/services/review-system';
import { getReviewSystemConfig } from '@/lib/config/review-system';
import { verifySession } from '@/lib/auth';

// GET /api/notifications - Fetch user notifications
export async function GET(request: NextRequest) {
  // Safety check: Feature flag
  const config = getReviewSystemConfig();
  if (!config.enabled || !config.notificationsEnabled) {
    return NextResponse.json(
      { notifications: [], unread_count: 0 }, 
      { status: 200 }
    );
  }

  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json(
        { notifications: [], unread_count: 0, error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    const userId = session.user.id;

    // Fetch notifications
    const result = await NotificationsService.getByUser(userId);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Notifications API error:', error);
    
    // Safe fallback - return empty notifications instead of error
    return NextResponse.json(
      { 
        notifications: [], 
        unread_count: 0,
        error: config.debugMode ? (error as Error).message : 'Service temporarily unavailable'
      }, 
      { status: config.debugMode ? 500 : 200 }
    );
  }
}

// POST /api/notifications - Create notification (internal use)
export async function POST(request: NextRequest) {
  const config = getReviewSystemConfig();
  if (!config.enabled || !config.notificationsEnabled) {
    return NextResponse.json({ success: false }, { status: 200 });
  }

  try {
    // Only allow internal service calls (could add API key check)
    const body = await request.json();
    const { user_id, type, title, message, application_id } = body;

    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    const notification = await NotificationsService.create({
      user_id,
      type,
      title,
      message,
      application_id
    });

    return NextResponse.json({ 
      success: true, 
      notification 
    }, { status: 201 });

  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: config.debugMode ? (error as Error).message : 'Failed to create notification'
      }, 
      { status: config.debugMode ? 500 : 200 }
    );
  }
}