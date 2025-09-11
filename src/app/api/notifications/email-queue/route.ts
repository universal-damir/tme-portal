// Email Queue Processing API Route
// Processes pending notification emails

import { NextRequest, NextResponse } from 'next/server';
import { NotificationEmailService } from '@/lib/services/notification-email';
import { getReviewSystemConfig } from '@/lib/config/review-system';
import { headers } from 'next/headers';

// Secret key for internal API calls (should be in env vars)
const QUEUE_PROCESSOR_SECRET = process.env.EMAIL_QUEUE_SECRET || 'default-secret-change-in-production';

// POST /api/notifications/email-queue - Process email queue
export async function POST(request: NextRequest) {
  try {
    // Verify internal API key for security
    const headersList = await headers();
    const authHeader = headersList.get('x-queue-secret');
    
    if (authHeader !== QUEUE_PROCESSOR_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if system is enabled
    const config = getReviewSystemConfig();
    if (!config.enabled || !config.notificationsEnabled) {
      return NextResponse.json(
        { message: 'Notification system disabled', processed: 0 },
        { status: 200 }
      );
    }

    // Process queue (default 10 emails at a time)
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 10;

    console.log(`Processing email queue with limit: ${limit}`);
    await NotificationEmailService.processQueue(limit);

    return NextResponse.json({
      success: true,
      message: 'Queue processed successfully'
    });

  } catch (error) {
    console.error('Email queue processing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process email queue',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/notifications/email-queue - Get queue statistics
export async function GET(request: NextRequest) {
  try {
    // This endpoint can be public for monitoring
    const stats = await NotificationEmailService.getEmailStats();
    
    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching queue stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch queue statistics',
        stats: []
      },
      { status: 500 }
    );
  }
}