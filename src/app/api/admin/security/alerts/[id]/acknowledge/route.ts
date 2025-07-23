import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-middleware';
import { query } from '@/lib/database';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = params;

    // Create table if it doesn't exist (for acknowledged alerts tracking)
    await query(`
      CREATE TABLE IF NOT EXISTS security_alert_acknowledgments (
        alert_id INTEGER PRIMARY KEY,
        acknowledged_by INTEGER REFERENCES users(id),
        acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if alert exists in audit_logs
    const alertCheck = await query(
      'SELECT id FROM audit_logs WHERE id = $1',
      [parseInt(id)]
    );

    if (alertCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Insert or update acknowledgment
    await query(
      `INSERT INTO security_alert_acknowledgments (alert_id, acknowledged_by)
       VALUES ($1, $2)
       ON CONFLICT (alert_id) 
       DO UPDATE SET acknowledged_by = $2, acknowledged_at = CURRENT_TIMESTAMP`,
      [parseInt(id), authResult.user.id]
    );

    // Create audit log entry for the acknowledgment
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        authResult.user.id,
        'security_alert_acknowledged',
        'security_alert',
        JSON.stringify({ alert_id: id }),
        req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      ]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Alert acknowledged successfully' 
    });
  } catch (error) {
    console.error('Failed to acknowledge alert:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
}