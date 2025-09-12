/**
 * Cron Job: Escalate Overdue Follow-ups
 * This endpoint should be called daily to check and escalate overdue follow-ups
 */

import { NextRequest, NextResponse } from 'next/server';
import { FollowUpService } from '@/lib/services/follow-up-service';
import { query } from '@/lib/database';

// This can be called by a cron job service or scheduled task
export async function GET(request: NextRequest) {
  try {
    // Optional: Add a secret key check for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run the escalation check
    await FollowUpService.escalateOverdueFollowUps();

    // Also check for follow-ups that need manager notification
    const managersToNotify = await query(
      `SELECT DISTINCT 
        ef.manager_id,
        u.email as manager_email,
        u.full_name as manager_name,
        COUNT(ef.id) as escalated_count
       FROM email_follow_ups ef
       JOIN users u ON ef.manager_id = u.id
       WHERE ef.escalated_to_manager = TRUE
       AND ef.escalation_date >= NOW() - INTERVAL '1 hour'
       GROUP BY ef.manager_id, u.email, u.full_name`
    );

    // Here you would send notification emails to managers
    // For now, just log the notifications
    for (const manager of managersToNotify.rows) {
      console.log(`📧 Manager notification needed: ${manager.manager_name} (${manager.manager_email}) - ${manager.escalated_count} escalated follow-ups`);
      
      // In production, you would send an email here
      // await sendManagerNotification(manager);
    }

    return NextResponse.json({
      success: true,
      message: 'Escalation check completed',
      managers_notified: managersToNotify.rows.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron escalation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to run escalation check',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST method for manual trigger
export async function POST(request: NextRequest) {
  return GET(request);
}