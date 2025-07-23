import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-middleware';
import { query } from '@/lib/database';
import os from 'os';

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Get system uptime
    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    let uptimeString = '';
    if (days > 0) uptimeString += `${days} days, `;
    if (hours > 0) uptimeString += `${hours}h `;
    uptimeString += `${minutes}m`;

    // Get memory usage
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = Math.round((usedMemory / totalMemory) * 100);

    // Get CPU info (simplified - just load average)
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length;
    const cpuUsage = Math.min(Math.round((loadAvg / cpuCount) * 100), 100);

    // Check database connection
    let dbStatus = 'healthy';
    try {
      await query('SELECT 1');
    } catch (error) {
      dbStatus = 'error';
      console.error('Database health check failed:', error);
    }

    // Get active sessions count
    let activeConnections = 0;
    try {
      const sessionsResult = await query(
        'SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()'
      );
      activeConnections = parseInt(sessionsResult.rows[0]?.count || '0');
    } catch (error) {
      console.error('Failed to get active sessions:', error);
    }

    // Determine overall system status
    let status = 'healthy';
    if (dbStatus === 'error' || memoryUsage > 90 || cpuUsage > 90) {
      status = 'error';
    } else if (memoryUsage > 80 || cpuUsage > 80) {
      status = 'warning';
    }

    const healthData = {
      status,
      uptime: uptimeString,
      cpuUsage,
      memoryUsage,
      activeConnections,
      database: dbStatus,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(healthData);
  } catch (error) {
    console.error('System health check error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        uptime: '0m',
        cpuUsage: 0,
        memoryUsage: 0,
        activeConnections: 0,
        database: 'error',
        timestamp: new Date().toISOString(),
        error: 'Failed to get system health'
      },
      { status: 500 }
    );
  }
}