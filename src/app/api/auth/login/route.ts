import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession, logUserAction } from '@/lib/auth';
import { loginSchema } from '@/lib/validations/auth';
import { shouldUseSecureCookies } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = loginSchema.parse(body);

    // Get client info
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Authenticate user
    const user = await authenticateUser(email, password);

    if (!user) {
      // Log failed login attempt
      await logUserAction(
        null, // No user ID for failed attempts
        'login_failed',
        'auth',
        email,
        { reason: 'invalid_credentials' },
        ipAddress,
        userAgent
      );

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const sessionId = await createSession(user, ipAddress, userAgent);

    // Log successful login
    await logUserAction(
      user.id,
      'login_success',
      'auth',
      undefined,
      { remember_me: rememberMe },
      ipAddress,
      userAgent
    );

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        employee_code: user.employee_code,
        email: user.email,
        full_name: user.full_name,
        department: user.department,
        designation: user.designation,
        role: user.role,
        must_change_password: user.must_change_password,
      },
    });

    // Set session cookie
    const cookieOptions = {
      httpOnly: true,
      secure: shouldUseSecureCookies(),
      sameSite: 'lax' as const,
      path: '/',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60, // 30 days or 8 hours
    };

    response.cookies.set('session', sessionId, cookieOptions);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}