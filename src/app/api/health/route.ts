import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - just return success if the app is running
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'TME Portal',
      version: '5.2'
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}