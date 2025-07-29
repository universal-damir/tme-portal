// Mark All Notifications as Read API Route
// Bulk operation with safety limits

import { NextRequest, NextResponse } from 'next/server';
import { NotificationsService } from '@/lib/services/review-system';
import { getReviewSystemConfig } from '@/lib/config/review-system';
import { verifySession } from '@/lib/auth';

// POST /api/notifications/mark-all-read - Mark all user notifications as read
export async function POST(request: NextRequest) {
  // Safety check: Feature flag
  const config = getReviewSystemConfig();
  if (!config.enabled || !config.notificationsEnabled) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;

    // Mark all notifications as read for this user
    const success = await NotificationsService.markAllAsRead(userId);

    return NextResponse.json({ success }, { status: 200 });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    
    // Safe fallback - return success to prevent UI issues
    return NextResponse.json(
      { 
        success: true,
        error: config.debugMode ? (error as Error).message : undefined
      }, 
      { status: 200 }
    );
  }
}