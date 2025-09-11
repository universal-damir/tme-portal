// Notification Preferences API Route
// Manages user email notification preferences

import { NextRequest, NextResponse } from 'next/server';
import { NotificationEmailService } from '@/lib/services/notification-email';
import { getReviewSystemConfig } from '@/lib/config/review-system';
import { verifySession } from '@/lib/auth';
import { pool } from '@/lib/database';

// GET /api/notifications/preferences - Get user's notification preferences
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if system is enabled
    const config = getReviewSystemConfig();
    if (!config.enabled || !config.notificationsEnabled) {
      return NextResponse.json(
        { 
          preferences: {
            in_app_enabled: true,
            email_enabled: false,
            email_review_requested: false,
            email_review_completed: false,
            email_application_approved: false,
            email_application_rejected: false
          }
        },
        { status: 200 }
      );
    }

    // Get user preferences
    const preferences = await NotificationEmailService.getUserPreferences(session.user.id);
    
    if (!preferences) {
      // Return default preferences
      return NextResponse.json({
        preferences: {
          in_app_enabled: true,
          email_enabled: false,
          email_review_requested: true,
          email_review_completed: true,
          email_application_approved: true,
          email_application_rejected: true
        }
      });
    }

    // Return only the fields that exist in simplified schema
    const safePreferences = {
      in_app_enabled: preferences.in_app_enabled,
      email_enabled: preferences.email_enabled,
      email_review_requested: preferences.email_review_requested,
      email_review_completed: preferences.email_review_completed,
      email_application_approved: preferences.email_application_approved,
      email_application_rejected: preferences.email_application_rejected
    };

    return NextResponse.json({
      preferences: safePreferences
    });

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update user's notification preferences
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if system is enabled
    const config = getReviewSystemConfig();
    if (!config.enabled || !config.notificationsEnabled) {
      return NextResponse.json(
        { success: false, message: 'Notification system disabled' },
        { status: 200 }
      );
    }

    const body = await request.json();
    
    // Validate input - only allow specific fields to be updated (simplified schema)
    const allowedFields = [
      'in_app_enabled',
      'email_enabled',
      'email_review_requested',
      'email_review_completed',
      'email_application_approved',
      'email_application_rejected'
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // If email is enabled, automatically enable all email notification types
    if (updates.email_enabled === true) {
      updates.email_review_requested = true;
      updates.email_review_completed = true;
      updates.email_application_approved = true;
      updates.email_application_rejected = true;
    }

    // Update preferences
    const success = await NotificationEmailService.updatePreferences(
      session.user.id,
      updates
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    // Return updated preferences
    const updatedPreferences = await NotificationEmailService.getUserPreferences(session.user.id);
    
    if (!updatedPreferences) {
      return NextResponse.json(
        { error: 'Failed to fetch updated preferences' },
        { status: 500 }
      );
    }

    // Return only the fields that exist in simplified schema
    const safePreferences = {
      in_app_enabled: updatedPreferences.in_app_enabled,
      email_enabled: updatedPreferences.email_enabled,
      email_review_requested: updatedPreferences.email_review_requested,
      email_review_completed: updatedPreferences.email_review_completed,
      email_application_approved: updatedPreferences.email_application_approved,
      email_application_rejected: updatedPreferences.email_application_rejected
    };

    return NextResponse.json({
      success: true,
      preferences: safePreferences
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

// POST /api/notifications/preferences/test-email - Send a test email
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if system is enabled
    const config = getReviewSystemConfig();
    if (!config.enabled || !config.notificationsEnabled) {
      return NextResponse.json(
        { error: 'Notification system disabled' },
        { status: 400 }
      );
    }

    // Get user preferences
    const preferences = await NotificationEmailService.getUserPreferences(session.user.id);
    
    if (!preferences || !preferences.email_enabled) {
      return NextResponse.json(
        { error: 'Email notifications not enabled' },
        { status: 400 }
      );
    }

    const email = preferences.notification_email || session.user.email;
    
    if (!email) {
      return NextResponse.json(
        { error: 'No email address configured' },
        { status: 400 }
      );
    }

    // Create a test notification and queue email
    const testNotificationResult = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'review_requested', 'Test Email Notification', 'This is a test email to verify your notification settings are working correctly.')
       RETURNING id`,
      [session.user.id]
    );

    const notificationId = testNotificationResult.rows[0].id;

    // Queue the test email
    const queued = await NotificationEmailService.queueEmail({
      notification_id: notificationId,
      user_id: session.user.id,
      type: 'review_requested',
      title: 'Test Email Notification',
      message: 'This is a test email to verify your notification settings are working correctly.',
      metadata: {
        reviewer_name: session.user.name || 'User',
        form_name: 'Test Notification',
        submitter_name: 'TME Portal System',
        urgency: 'low',
        comments: 'This is a test notification to verify email delivery.',
        portal_url: process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3000'
      }
    });

    if (!queued) {
      // Clean up test notification
      await pool.query(`DELETE FROM notifications WHERE id = $1`, [notificationId]);
      
      return NextResponse.json(
        { error: 'Failed to queue test email. Please check your settings.' },
        { status: 500 }
      );
    }

    // Mark test notification as read immediately
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1`,
      [notificationId]
    );

    return NextResponse.json({
      success: true,
      message: `Test email queued for delivery to ${email}. Please check your inbox in a few moments.`
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}