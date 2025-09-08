import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { query } from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    // Verify user authentication (any authenticated user can access)
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Fetch active team members with their basic info for email autocomplete
    const teamResult = await query(
      `SELECT 
        email, 
        full_name, 
        department,
        designation,
        employee_code
      FROM users 
      WHERE status = 'active'
      ORDER BY full_name ASC`,
      []
    );

    const teamEmails = teamResult.rows.map(member => ({
      email: member.email,
      name: member.full_name,
      department: member.department,
      designation: member.designation,
      employeeCode: member.employee_code,
      photoUrl: `/api/photos/${encodeURIComponent(member.employee_code)}`,
      label: `${member.full_name} - ${member.department}` // For display in dropdown
    }));

    return NextResponse.json({ teamEmails });
  } catch (error) {
    console.error('Team emails fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team emails' },
      { status: 500 }
    );
  }
}