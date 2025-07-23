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

    // Get user statistics
    const totalUsersResult = await query(
      'SELECT COUNT(*) as count FROM users'
    );

    const activeUsersResult = await query(
      'SELECT COUNT(*) as count FROM users WHERE status = $1',
      ['active']
    );

    const lockedUsersResult = await query(
      `SELECT COUNT(*) as count FROM users 
       WHERE status = 'locked' OR (locked_until IS NOT NULL AND locked_until > NOW())`
    );

    const recentLoginsResult = await query(
      'SELECT COUNT(*) as count FROM users WHERE last_login >= NOW() - INTERVAL \'7 days\''
    );

    const newUsersResult = await query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL \'30 days\''
    );

    const stats = {
      totalUsers: parseInt(totalUsersResult.rows[0]?.count || '0'),
      activeUsers: parseInt(activeUsersResult.rows[0]?.count || '0'),
      lockedUsers: parseInt(lockedUsersResult.rows[0]?.count || '0'),
      recentLogins: parseInt(recentLoginsResult.rows[0]?.count || '0'),
      newUsers: parseInt(newUsersResult.rows[0]?.count || '0'),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}