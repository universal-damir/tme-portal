import { NextRequest, NextResponse } from 'next/server';
import { verifySession, renewSession, isSessionNearExpiry } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const sessionData = await verifySession(request);
    
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Check if session needs renewal (within 30 minutes of expiry)
    if (!isSessionNearExpiry(sessionData)) {
      return NextResponse.json({
        renewed: false,
        message: 'Session does not need renewal yet'
      });
    }

    const renewed = await renewSession(sessionData.sessionId);
    
    if (!renewed) {
      return NextResponse.json(
        { error: 'Failed to renew session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      renewed: true,
      message: 'Session renewed successfully'
    });

  } catch (error) {
    console.error('Session renewal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}