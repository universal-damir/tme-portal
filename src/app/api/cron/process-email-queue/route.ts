/**
 * Email Queue Processing Endpoint
 * Manually processes pending emails in the queue
 * Useful for development testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationEmailService } from '@/lib/services/notification-email';
import { logAuditEvent } from '@/lib/audit';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify authorization (check for cron secret or internal call)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // In development, allow without auth for testing
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         process.env.NEXT_PUBLIC_PORTAL_URL?.includes('localhost');
    
    if (!isDevelopment && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('📧 Starting email queue processing...');

    // Get queue status before processing
    const beforeResult = await query(
      `SELECT status, COUNT(*) as count
       FROM email_queue
       WHERE created_at > NOW() - INTERVAL '24 hours'
       GROUP BY status`
    );
    
    const beforeStatus = beforeResult.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    console.log('Queue status before processing:', beforeStatus);

    // Process the queue
    await NotificationEmailService.processQueue(20); // Process up to 20 emails

    // Get queue status after processing
    const afterResult = await query(
      `SELECT status, COUNT(*) as count
       FROM email_queue
       WHERE created_at > NOW() - INTERVAL '24 hours'
       GROUP BY status`
    );
    
    const afterStatus = afterResult.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    console.log('Queue status after processing:', afterStatus);

    // Calculate what changed
    const emailsSent = (afterStatus.sent || 0) - (beforeStatus.sent || 0);
    const emailsFailed = (afterStatus.failed || 0) - (beforeStatus.failed || 0);

    // Get details of recently processed emails
    const recentEmails = await query(
      `SELECT eq.*, u.full_name, u.email as user_email
       FROM email_queue eq
       JOIN users u ON eq.user_id = u.id
       WHERE eq.processed_at > NOW() - INTERVAL '5 minutes'
       ORDER BY eq.processed_at DESC
       LIMIT 10`
    );

    // Log the processing
    await logAuditEvent({
      user_id: 0, // System action
      action: 'email_queue_processed',
      resource: 'email_queue',
      details: {
        before_status: beforeStatus,
        after_status: afterStatus,
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
        recent_count: recentEmails.rows.length
      }
    });

    console.log(`📧 Email queue processing completed:`, {
      emails_sent: emailsSent,
      emails_failed: emailsFailed,
      pending_remaining: afterStatus.pending || 0
    });

    return NextResponse.json({
      success: true,
      results: {
        before_status: beforeStatus,
        after_status: afterStatus,
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
        pending_remaining: afterStatus.pending || 0,
        recent_emails: recentEmails.rows.map(email => ({
          id: email.id,
          to: email.to_email,
          subject: email.subject,
          status: email.status,
          processed_at: email.processed_at,
          error: email.last_error
        }))
      }
    });

  } catch (error) {
    console.error('❌ Email queue processing failed:', error);
    
    // Log the error
    await logAuditEvent({
      user_id: 0,
      action: 'email_queue_processing_error',
      resource: 'email_queue',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Queue processing failed' 
      },
      { status: 500 }
    );
  }
}

// Only allow GET requests (for cron jobs)
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET for cron job endpoints.' },
    { status: 405 }
  );
}