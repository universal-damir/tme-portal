// Mark Notification as Read API Route
// Safe implementation with ownership validation

import { NextRequest, NextResponse } from 'next/server';
import { NotificationsService } from '@/lib/services/review-system';
import { getReviewSystemConfig } from '@/lib/config/review-system';
import { verifySession } from '@/lib/auth';

// POST /api/notifications/[id]/read - Mark single notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Mark notification as read (with ownership check built into service)
    const success = await NotificationsService.markAsRead(id, userId);

    return NextResponse.json({ success }, { status: 200 });

  } catch (error) {
    console.error('Mark notification read error:', error);
    
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