import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { shouldUseSecureCookies } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const sessionData = await getSession(sessionId);

    if (!sessionData) {
      // Clear invalid session cookie
      const response = NextResponse.json({ authenticated: false }, { status: 401 });
      response.cookies.set('session', '', {
        httpOnly: true,
        secure: shouldUseSecureCookies(),
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      return response;
    }

    const response = NextResponse.json({
      authenticated: true,
      user: {
        id: sessionData.user.id,
        employee_code: sessionData.user.employee_code,
        email: sessionData.user.email,
        first_name: sessionData.user.first_name,
        last_name: sessionData.user.last_name,
        full_name: sessionData.user.full_name,
        phone: sessionData.user.phone,
        department: sessionData.user.department,
        designation: sessionData.user.designation,
        role: sessionData.user.role,
        status: sessionData.user.status,
        must_change_password: sessionData.user.must_change_password,
        last_login: sessionData.user.last_login,
      },
    });
    
    // Prevent browser caching of session data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}