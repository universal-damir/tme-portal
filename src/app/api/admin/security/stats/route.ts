import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-middleware';
import { query } from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Get failed logins in last 24 hours
    const failedLoginsResult = await query(
      `SELECT COUNT(*) as count 
       FROM audit_logs 
       WHERE action = 'login_failed' 
         AND created_at > NOW() - INTERVAL '24 hours'`
    );

    // Get locked accounts
    const lockedAccountsResult = await query(
      `SELECT COUNT(*) as count 
       FROM users 
       WHERE (locked_until IS NOT NULL AND locked_until > NOW()) 
          OR status = 'locked'`
    );

    // Get unusual access patterns (logins outside business hours)
    const unusualAccessResult = await query(
      `SELECT COUNT(*) as count 
       FROM audit_logs 
       WHERE action = 'login'
         AND (EXTRACT(hour FROM created_at) < 7 OR EXTRACT(hour FROM created_at) > 20)
         AND created_at > NOW() - INTERVAL '24 hours'`
    );

    // Get admin actions in last 24 hours
    const adminActionsResult = await query(
      `SELECT COUNT(*) as count 
       FROM audit_logs 
       WHERE action LIKE 'admin_%' 
         AND created_at > NOW() - INTERVAL '24 hours'`
    );

    const stats = {
      failedLogins24h: parseInt(failedLoginsResult.rows[0]?.count || '0'),
      lockedAccounts: parseInt(lockedAccountsResult.rows[0]?.count || '0'),
      unusualAccess: parseInt(unusualAccessResult.rows[0]?.count || '0'),
      adminActions24h: parseInt(adminActionsResult.rows[0]?.count || '0'),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch security stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security statistics' },
      { status: 500 }
    );
  }
}