import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword, verifyPassword, logUserAction, invalidateAllUserSessions } from '@/lib/auth';
import { changePasswordSchema } from '@/lib/validations/auth';
import { query } from '@/lib/database';

export async function POST(request: NextRequest) {
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
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    // Get user's current hashed password
    const result = await query(
      'SELECT hashed_password FROM users WHERE id = $1',
      [sessionData.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      result.rows[0].hashed_password
    );

    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
      await logUserAction(
        sessionData.user.id,
        'change_password_failed',
        'auth',
        undefined,
        { reason: 'invalid_current_password' },
        request.ip || request.headers.get('x-forwarded-for'),
        request.headers.get('user-agent')
      );

      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password in database
    await query(
      `UPDATE users 
       SET hashed_password = $1, 
           must_change_password = false, 
           last_password_change = CURRENT_TIMESTAMP,
           failed_login_attempts = 0,
           locked_until = NULL
       WHERE id = $2`,
      [hashedNewPassword, sessionData.user.id]
    );

    // Invalidate all other sessions (keep current session active)
    await invalidateAllUserSessions(sessionData.user.id, sessionId);

    // Log successful password change
    await logUserAction(
      sessionData.user.id,
      'change_password_success',
      'auth',
      undefined,
      { sessions_invalidated: true },
      request.ip || request.headers.get('x-forwarded-for'),
      request.headers.get('user-agent')
    );

    return NextResponse.json({ 
      success: true,
      message: 'Password changed successfully. All other sessions have been terminated.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Password change failed' },
      { status: 500 }
    );
  }
}