// Review System Health Check API Route
// Monitor system status and provide safe rollback information

import { NextRequest, NextResponse } from 'next/server';
import { checkReviewSystemHealth } from '@/lib/services/review-system';
import { getReviewSystemConfig } from '@/lib/config/review-system';
import { verifyToken } from '@/lib/auth';

// GET /api/review-system/health - System health check
export async function GET(request: NextRequest) {
  try {
    // Optional: Require admin access for health checks
    const token = request.cookies.get('session')?.value;
    let isAdmin = false;
    
    if (token) {
      const payload = await verifyToken(token);
      // Add admin check here if needed
      isAdmin = payload?.role === 'admin';
    }

    // Get current configuration
    const config = getReviewSystemConfig();
    
    // Run health check
    const health = await checkReviewSystemHealth();
    
    // Build response based on admin access
    const response = {
      timestamp: new Date().toISOString(),
      enabled: health.enabled,
      status: health.enabled ? 'enabled' : 'disabled',
      
      // Basic health info for all users
      basic_health: {
        database_connection: health.database_connection,
        tables_exist: health.tables_exist
      },
      
      // Detailed info for admins only
      ...(isAdmin && {
        detailed_config: {
          notifications_enabled: config.notificationsEnabled,
          review_submission_enabled: config.reviewSubmissionEnabled,
          polling_interval: config.notificationPollingInterval,
          max_notifications: config.maxNotificationsToFetch,
          debug_mode: config.debugMode
        },
        
        rollback_info: {
          can_disable_instantly: true,
          emergency_disable_command: 'Set ENABLE_REVIEW_SYSTEM=false in environment',
          rollback_migration_available: true,
          rollback_command: 'npm run rollback:review-system'
        }
      }),
      
      // Include error if any
      ...(health.error && { error: health.error })
    };

    return NextResponse.json(response, {
      status: health.enabled && health.database_connection ? 200 : 503
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      enabled: false,
      status: 'error',
      error: 'Health check failed',
      rollback_info: {
        emergency_disable_command: 'Set ENABLE_REVIEW_SYSTEM=false in environment'
      }
    }, { status: 503 });
  }
}