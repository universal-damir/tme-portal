/**
 * Follow-up Email Reminder Cron Job
 * Sends email reminders for due and overdue follow-ups
 * Runs daily at 9 AM to remind users about pending follow-ups
 */

import { NextRequest, NextResponse } from 'next/server';
import { FollowUpService } from '@/lib/services/follow-up-service';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    // Verify authorization (check for cron secret or internal call)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('📧 Starting follow-up email reminder cron job...');

    // Get all follow-ups that need reminders
    const followUps = await FollowUpService.getFollowUpsNeedingReminders();
    
    console.log(`Found ${followUps.length} follow-ups needing reminders`);

    let remindersSent = 0;
    let remindersSkipped = 0;
    const clientsReminded: string[] = [];
    const errors: string[] = [];

    // Send reminders for each follow-up
    for (const followUp of followUps) {
      try {
        // Check user preferences to see if they want email reminders
        const { query } = await import('@/lib/database');
        const prefResult = await query(
          `SELECT email_enabled, email_follow_up_reminders 
           FROM notification_preferences 
           WHERE user_id = $1`,
          [followUp.user_id]
        );

        // Default to sending if no preferences exist
        let shouldSend = true;
        
        if (prefResult.rows.length > 0) {
          const prefs = prefResult.rows[0];
          shouldSend = prefs.email_enabled && (prefs.email_follow_up_reminders ?? true);
        }

        if (!shouldSend) {
          console.log(`Skipping reminder for ${followUp.client_name} - user has disabled follow-up emails`);
          remindersSkipped++;
          continue;
        }

        // Send the reminder email
        const sent = await FollowUpService.sendReminderEmail(followUp);
        
        if (sent) {
          remindersSent++;
          clientsReminded.push(followUp.client_name);
          
          console.log(`✅ Sent ${followUp.follow_up_number === 1 ? '1st' : followUp.follow_up_number === 2 ? '2nd' : '3rd'} reminder for ${followUp.client_name}`);
        } else {
          errors.push(`Failed to send reminder for ${followUp.client_name}`);
          console.error(`❌ Failed to send reminder for ${followUp.client_name}`);
        }

      } catch (error) {
        const errorMsg = `Error processing reminder for ${followUp.client_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Log the cron job execution
    await logAuditEvent({
      user_id: 0, // System action
      action: 'follow_up_reminders_cron',
      resource: 'cron_jobs',
      details: {
        total_follow_ups: followUps.length,
        reminders_sent: remindersSent,
        reminders_skipped: remindersSkipped,
        clients_reminded: clientsReminded,
        errors: errors.length > 0 ? errors : undefined
      }
    });

    console.log(`📧 Follow-up reminder cron job completed:`, {
      total_follow_ups: followUps.length,
      reminders_sent: remindersSent,
      reminders_skipped: remindersSkipped,
      clients_reminded: clientsReminded.length
    });

    return NextResponse.json({
      success: true,
      results: {
        total_follow_ups: followUps.length,
        reminders_sent: remindersSent,
        reminders_skipped: remindersSkipped,
        clients_reminded: clientsReminded,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('❌ Follow-up reminder cron job failed:', error);
    
    // Log the error
    await logAuditEvent({
      user_id: 0,
      action: 'follow_up_reminders_cron_error',
      resource: 'cron_jobs',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Cron job failed' 
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