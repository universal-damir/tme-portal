// Clear Old Notifications API Route
// Development utility to clear old test notifications

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { verifySession } from '@/lib/auth';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function DELETE(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Clear ALL notifications (for testing)
    const result = await pool.query(`
      DELETE FROM notifications 
      RETURNING id, title, created_at
    `);

    return NextResponse.json({
      success: true,
      deleted_count: result.rowCount,
      message: `Deleted ${result.rowCount} old notifications`
    });

  } catch (error) {
    console.error('Clear notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}