// App initialization endpoint
// Starts background services like email queue processor

import { NextResponse } from 'next/server';
import { ensureAppInitialized } from '@/lib/services/app-initializer';
import { emailQueueProcessor } from '@/lib/services/email-queue-processor';

export async function GET() {
  // Use centralized initialization
  ensureAppInitialized();
  
  const status = emailQueueProcessor.getStatus();
  
  return NextResponse.json({ 
    message: status.running ? 'Services already initialized' : 'Services initialized',
    services: {
      emailQueueProcessor: status.running,
      processorInterval: status.interval
    }
  });
}
