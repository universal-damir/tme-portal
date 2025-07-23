import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-middleware';
import { detectSuspiciousActivity } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Get suspicious activities
    const activities = await detectSuspiciousActivity();

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Failed to fetch suspicious activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suspicious activities' },
      { status: 500 }
    );
  }
}