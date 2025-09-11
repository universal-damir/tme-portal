// Health check endpoint with auto-initialization
// This endpoint is commonly called by monitoring systems and ensures services are running

import { NextResponse } from 'next/server';
import { ensureAppInitialized } from '@/lib/services/app-initializer';
import { emailQueueProcessor } from '@/lib/services/email-queue-processor';
import { pool } from '@/lib/database';

export async function GET() {
  // Auto-initialize services
  ensureAppInitialized();
  
  try {
    // Check database connection
    const dbCheck = await pool.query('SELECT 1');
    
    // Check email queue status
    const queueStatus = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM email_queue 
      WHERE created_at > NOW() - INTERVAL '24 hours'`
    );
    
    const processorStatus = emailQueueProcessor.getStatus();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        emailQueueProcessor: processorStatus.running ? 'running' : 'stopped',
        emailQueue: queueStatus.rows[0]
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
