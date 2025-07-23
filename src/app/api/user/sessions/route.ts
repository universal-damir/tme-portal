import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getUserSessions, invalidateSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const sessionData = await verifySession(request);
    
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessions = await getUserSessions(sessionData.user.id);
    
    // Add current session indicator
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      is_current: session.id === sessionData.sessionId,
      created_at: new Date(session.created_at).toISOString(),
      expires_at: new Date(session.expires_at).toISOString(),
    }));

    return NextResponse.json({
      sessions: sessionsWithCurrent
    });

  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionData = await verifySession(request);
    
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Prevent users from terminating their current session via this endpoint
    if (sessionId === sessionData.sessionId) {
      return NextResponse.json(
        { error: 'Cannot terminate current session' },
        { status: 400 }
      );
    }

    // Verify the session belongs to the current user
    const userSessions = await getUserSessions(sessionData.user.id);
    const targetSession = userSessions.find(s => s.id === sessionId);

    if (!targetSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    await invalidateSession(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Session terminated successfully'
    });

  } catch (error) {
    console.error('Error terminating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}