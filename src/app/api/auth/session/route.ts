import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: sessionData.user.id,
        employee_code: sessionData.user.employee_code,
        email: sessionData.user.email,
        full_name: sessionData.user.full_name,
        department: sessionData.user.department,
        designation: sessionData.user.designation,
        role: sessionData.user.role,
        must_change_password: sessionData.user.must_change_password,
        last_login: sessionData.user.last_login,
      },
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}