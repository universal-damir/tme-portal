/**
 * Notification Created Webhook Handler
 * Triggers todo generation when notifications are created
 * Phase 4: Smart Automation Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationTodoAutomation } from '@/lib/services/notification-todo-automation';
import { logAuditEvent } from '@/lib/audit';
import type { Notification } from '@/types/notification';

export async function POST(request: NextRequest) {
  try {
    // Parse the notification data from the webhook
    const notification: Notification = await request.json();

    console.log(`🔔 Received notification webhook for todo generation:`, {
      id: notification.id,
      type: notification.type,
      user_id: notification.user_id
    });

    // Validate required fields
    if (!notification.id || !notification.type || !notification.user_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required notification fields (id, type, user_id)' 
        },
        { status: 400 }
      );
    }

    // Process the notification for todo generation
    await NotificationTodoAutomation.processNotification(notification);

    // Log the webhook processing
    await logAuditEvent(
      notification.user_id,
      'notification_webhook_processed',
      'automation',
      {
        notification_id: notification.id,
        notification_type: notification.type,
        webhook_url: '/api/webhooks/notification-created'
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Notification processed for todo generation',
      notification_id: notification.id
    });

  } catch (error) {
    console.error('❌ Notification webhook processing failed:', error);

    // Try to log the error if we have enough info
    try {
      const body = await request.text();
      const parsed = JSON.parse(body);
      if (parsed.user_id) {
        await logAuditEvent(
          parsed.user_id,
          'notification_webhook_failed',
          'automation',
          {
            error: error instanceof Error ? error.message : 'Unknown error',
            notification_type: parsed.type,
            webhook_url: '/api/webhooks/notification-created'
          }
        );
      }
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process notification webhook' 
      },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to send notification webhooks.' },
    { status: 405 }
  );
}