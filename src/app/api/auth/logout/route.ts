import { NextRequest, NextResponse } from 'next/server';
import { invalidateSession, logUserAction, getSession } from '@/lib/auth';
import { shouldUseSecureCookies } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    // Get session data for logging
    const sessionData = await getSession(sessionId);
    
    // Invalidate session
    await invalidateSession(sessionId);

    // Log logout
    if (sessionData?.user) {
      await logUserAction(
        sessionData.user.id,
        'logout',
        'auth',
        undefined,
        undefined,
        request.ip || request.headers.get('x-forwarded-for'),
        request.headers.get('user-agent')
      );
    }

    // Create response and clear session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: shouldUseSecureCookies(),
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}