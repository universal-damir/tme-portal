import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { query } from '@/lib/database';
import { logAuditEvent, getClientIP, getUserAgent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const sessionData = await verifySession(request);
    
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = sessionData;
    const body = await request.json();
    const { action, resource, details } = body;

    if (!action || !resource) {
      return NextResponse.json(
        { error: 'Action and resource are required' },
        { status: 400 }
      );
    }

    // Log the activity
    await logAuditEvent({
      user_id: user.id,
      action,
      resource,
      details,
      ip_address: getClientIP(request),
      user_agent: getUserAgent(request)
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error logging user activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionData = await verifySession(request);
    
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = sessionData;
    
    const result = await query(
      `SELECT id, action, resource, created_at AT TIME ZONE 'UTC' as created_at, ip_address, details 
       FROM audit_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [user.id]
    );

    return NextResponse.json({
      activities: result.rows
    });

  } catch (error) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}