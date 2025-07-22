import { NextRequest, NextResponse } from 'next/server';
import { getSession, logUserAction } from '@/lib/auth';
import { userProfileSchema } from '@/lib/validations/auth';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const sessionData = await getSession(sessionId);
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get full user profile data
    const result = await query(`
      SELECT id, employee_code, email, full_name, department, designation, 
             role, status, created_at, last_login, last_password_change
      FROM users WHERE id = $1
    `, [sessionData.user.id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];

    return NextResponse.json({
      id: user.id,
      employee_code: user.employee_code,
      email: user.email,
      full_name: user.full_name,
      department: user.department,
      designation: user.designation,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      last_login: user.last_login,
      last_password_change: user.last_password_change,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const sessionData = await getSession(sessionId);
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { email, full_name, department, designation } = userProfileSchema.parse(body);

    // Update user profile
    await query(`
      UPDATE users 
      SET email = $1, full_name = $2, department = $3, designation = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [email, full_name, department, designation, sessionData.user.id]);

    // Log profile update
    await logUserAction(
      sessionData.user.id,
      'profile_update',
      'users',
      sessionData.user.id.toString(),
      { fields_updated: ['email', 'full_name', 'department', 'designation'] },
      request.ip || request.headers.get('x-forwarded-for'),
      request.headers.get('user-agent')
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Profile update failed' },
      { status: 500 }
    );
  }
}