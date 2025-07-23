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

    // Get recent security-related audit logs as alerts
    const alertsResult = await query(
      `SELECT 
        al.id,
        al.action as type,
        al.details,
        al.ip_address,
        al.created_at as timestamp,
        al.user_id,
        u.full_name as user_name,
        u.employee_code,
        CASE 
          WHEN al.action LIKE '%fail%' THEN 'high'
          WHEN al.action LIKE '%lock%' THEN 'high'
          WHEN al.action LIKE '%admin_%' THEN 'medium'
          ELSE 'low'
        END as severity
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.action IN ('login_failed', 'account_locked', 'password_reset', 'admin_action')
        OR al.action LIKE '%_fail%'
        OR al.action LIKE '%_error%'
        OR al.action LIKE '%_lock%'
      ORDER BY al.created_at DESC
      LIMIT 50`
    );

    const alerts = alertsResult.rows.map(row => ({
      id: row.id.toString(),
      type: row.type,
      severity: row.severity,
      message: generateAlertMessage(row.type, row.details, row.user_name),
      user_id: row.user_id,
      user_name: row.user_name,
      employee_code: row.employee_code,
      timestamp: row.timestamp,
      acknowledged: false // In a real app, you'd store this in the database
    }));

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Failed to fetch security alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security alerts' },
      { status: 500 }
    );
  }
}

function generateAlertMessage(action: string, details: any, userName: string): string {
  const parsedDetails = typeof details === 'string' ? JSON.parse(details || '{}') : details || {};
  
  switch (action) {
    case 'login_failed':
      return `Failed login attempt${userName ? ` for ${userName}` : ''}`;
    case 'account_locked':
      return `Account locked due to multiple failed attempts${userName ? ` for ${userName}` : ''}`;
    case 'password_reset':
      return `Password reset${userName ? ` for ${userName}` : ''}`;
    case 'admin_create_user':
      return `New user created by admin${userName ? ` (${userName})` : ''}`;
    case 'admin_update_user':
      return `User account modified by admin${userName ? ` (${userName})` : ''}`;
    case 'admin_delete_user':
      return `User account deleted by admin${userName ? ` (${userName})` : ''}`;
    default:
      return `Security event: ${action.replace(/_/g, ' ')}${userName ? ` by ${userName}` : ''}`;
  }
}