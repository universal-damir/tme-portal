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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get recent activities with user information
    const activitiesResult = await query(
      `SELECT 
        al.id,
        al.user_id,
        al.action,
        al.resource,
        al.details,
        al.ip_address,
        al.user_agent,
        al.created_at,
        u.full_name as user_name,
        u.email as user_email,
        u.employee_code
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get total count for pagination
    const countResult = await query('SELECT COUNT(*) as count FROM audit_logs');
    const totalCount = parseInt(countResult.rows[0]?.count || '0');

    const activities = activitiesResult.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.user_name || 'Unknown User',
      user_email: row.user_email || '',
      employee_code: row.employee_code || '',
      action: row.action,
      resource: row.resource,
      details: row.details,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      created_at: row.created_at,
    }));

    return NextResponse.json({
      activities,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    console.error('Admin recent activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}