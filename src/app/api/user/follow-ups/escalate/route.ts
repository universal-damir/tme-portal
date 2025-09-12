/**
 * Email Follow-ups Escalation API Route
 * Endpoint for checking and escalating overdue follow-ups
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { FollowUpService } from '@/lib/services/follow-up-service';

// POST /api/user/follow-ups/escalate - Check and escalate overdue follow-ups
export async function POST(request: NextRequest) {
  try {
    // This could be called by a cron job or admin user
    // For now, verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin/manager (optional)
    // For now, allow any authenticated user to trigger escalation check
    
    await FollowUpService.escalateOverdueFollowUps();

    return NextResponse.json({
      success: true,
      message: 'Escalation check completed'
    });

  } catch (error) {
    console.error('POST /api/user/follow-ups/escalate error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check escalations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}