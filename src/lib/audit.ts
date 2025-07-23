import { query } from '@/lib/database';
import { logUserAction } from '@/lib/auth';
import { detectSuspiciousActivity as detectSecurityEvents, SecurityEvent } from '@/lib/security';

export interface AuditEventData {
  user_id?: number;
  action: string;
  resource?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

export async function logAuditEvent(eventData: AuditEventData): Promise<void> {
  try {
    // Use the existing logUserAction function
    await logUserAction(
      eventData.user_id || null,
      eventData.action,
      eventData.resource || undefined,
      undefined, // resource_id
      eventData.details,
      eventData.ip_address,
      eventData.user_agent
    );

    // Detect and log security events if applicable
    if (eventData.user_id && eventData.ip_address && eventData.user_agent) {
      await detectAndLogSecurityEvents(
        eventData.user_id,
        eventData.action,
        eventData.ip_address,
        eventData.user_agent
      );
    }
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw the error as we don't want audit logging failures to break the main flow
  }
}

export interface AuditLogQuery {
  user_id?: number;
  action?: string;
  resource?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

export async function getAuditLogs(filters: AuditLogQuery = {}) {
  const whereConditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // Build WHERE conditions dynamically
  if (filters.user_id) {
    whereConditions.push(`al.user_id = $${paramIndex++}`);
    values.push(filters.user_id);
  }

  if (filters.action) {
    whereConditions.push(`al.action = $${paramIndex++}`);
    values.push(filters.action);
  }

  if (filters.resource) {
    whereConditions.push(`al.resource = $${paramIndex++}`);
    values.push(filters.resource);
  }

  if (filters.start_date) {
    whereConditions.push(`al.created_at >= $${paramIndex++}`);
    values.push(filters.start_date);
  }

  if (filters.end_date) {
    whereConditions.push(`al.created_at <= $${paramIndex++}`);
    values.push(filters.end_date);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  const queryText = `
    SELECT 
      al.id,
      al.user_id,
      al.action,
      al.resource,
      al.details,
      al.ip_address,
      al.user_agent,
      al.created_at,
      u.full_name as user_name,
      u.email as user_email,
      u.employee_code
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
  `;

  values.push(limit, offset);

  const result = await query(queryText, values);
  return result.rows;
}

export async function getAuditStatistics(filters: { start_date?: Date; end_date?: Date } = {}) {
  const whereConditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filters.start_date) {
    whereConditions.push(`created_at >= $${paramIndex++}`);
    values.push(filters.start_date);
  }

  if (filters.end_date) {
    whereConditions.push(`created_at <= $${paramIndex++}`);
    values.push(filters.end_date);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total events count
  const totalResult = await query(
    `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
    values
  );

  // Get events by action
  const actionStatsResult = await query(
    `SELECT action, COUNT(*) as count 
     FROM audit_logs ${whereClause}
     GROUP BY action 
     ORDER BY count DESC 
     LIMIT 10`,
    values
  );

  // Get events by user
  const userStatsResult = await query(
    `SELECT 
       al.user_id,
       u.full_name as user_name,
       u.employee_code,
       COUNT(*) as count 
     FROM audit_logs al 
     LEFT JOIN users u ON al.user_id = u.id 
     ${whereClause}
     GROUP BY al.user_id, u.full_name, u.employee_code 
     ORDER BY count DESC 
     LIMIT 10`,
    values
  );

  // Get recent suspicious activities
  const suspiciousResult = await query(
    `SELECT 
       al.id,
       al.user_id,
       al.action,
       al.resource,
       al.details,
       al.ip_address,
       al.created_at,
       u.full_name as user_name,
       u.employee_code
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ${whereClause ? `${whereClause} AND` : 'WHERE'} 
     (al.action LIKE '%_fail%' OR al.action LIKE '%_error%' OR al.action LIKE '%_lock%')
     ORDER BY al.created_at DESC
     LIMIT 20`,
    values
  );

  return {
    total: parseInt(totalResult.rows[0]?.total || '0'),
    actionStats: actionStatsResult.rows,
    userStats: userStatsResult.rows,
    suspiciousActivities: suspiciousResult.rows
  };
}

// Security monitoring functions
export async function detectSuspiciousActivity(user_id?: number) {
  const suspicious = [];

  // Check for multiple failed logins in short period
  const failedLoginsResult = await query(
    `SELECT user_id, COUNT(*) as failed_attempts
     FROM audit_logs 
     WHERE action = 'login_failed' 
       AND created_at > NOW() - INTERVAL '1 hour'
       ${user_id ? 'AND user_id = $1' : ''}
     GROUP BY user_id
     HAVING COUNT(*) >= 5`,
    user_id ? [user_id] : []
  );

  for (const row of failedLoginsResult.rows) {
    suspicious.push({
      type: 'multiple_failed_logins',
      user_id: row.user_id,
      severity: 'high',
      details: `${row.failed_attempts} failed login attempts in the last hour`
    });
  }

  // Check for unusual access patterns (access outside normal hours)
  const unusualAccessResult = await query(
    `SELECT user_id, COUNT(*) as unusual_accesses
     FROM audit_logs 
     WHERE action = 'login'
       AND (EXTRACT(hour FROM created_at) < 7 OR EXTRACT(hour FROM created_at) > 20)
       AND created_at > NOW() - INTERVAL '24 hours'
       ${user_id ? 'AND user_id = $1' : ''}
     GROUP BY user_id
     HAVING COUNT(*) >= 3`,
    user_id ? [user_id] : []
  );

  for (const row of unusualAccessResult.rows) {
    suspicious.push({
      type: 'unusual_access_hours',
      user_id: row.user_id,
      severity: 'medium',
      details: `${row.unusual_accesses} logins outside normal business hours`
    });
  }

  // Check for admin actions by non-admin users (should not happen if properly secured)
  const suspiciousAdminResult = await query(
    `SELECT al.user_id, u.role, COUNT(*) as admin_actions
     FROM audit_logs al
     JOIN users u ON al.user_id = u.id
     WHERE al.action LIKE 'admin_%'
       AND u.role != 'admin'
       AND al.created_at > NOW() - INTERVAL '24 hours'
       ${user_id ? 'AND al.user_id = $1' : ''}
     GROUP BY al.user_id, u.role`,
    user_id ? [user_id] : []
  );

  for (const row of suspiciousAdminResult.rows) {
    suspicious.push({
      type: 'unauthorized_admin_action',
      user_id: row.user_id,
      severity: 'critical',
      details: `${row.admin_actions} admin actions by user with role: ${row.role}`
    });
  }

  return suspicious;
}

export async function logSecurityEvent(event: {
  type: 'login_failed' | 'account_locked' | 'password_reset' | 'suspicious_activity';
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
  details?: any;
}) {
  await logAuditEvent({
    user_id: event.user_id,
    action: event.type,
    resource: 'security',
    details: event.details,
    ip_address: event.ip_address,
    user_agent: event.user_agent
  });
}

// Helper function to get client IP from request
export function getClientIP(req: any): string {
  const ip = (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.ip ||
    '127.0.0.1'  // Use localhost instead of 'unknown'
  );
  
  // Ensure it's a valid IP format for database inet type
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipRegex.test(ip) ? ip : '127.0.0.1';
}

// Helper function to get user agent from request
export function getUserAgent(req: any): string {
  return req.headers['user-agent'] || 'unknown';
}

// Enhanced security event detection
async function detectAndLogSecurityEvents(
  userId: number,
  action: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  try {
    // Get recent activity for the user
    const recentActivityResult = await query(`
      SELECT action, created_at, ip_address 
      FROM audit_logs 
      WHERE user_id = $1 
        AND created_at > NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC
      LIMIT 20
    `, [userId]);

    const securityEvents = detectSecurityEvents(
      userId,
      action,
      ipAddress,
      userAgent,
      recentActivityResult.rows
    );

    // Log each security event
    for (const event of securityEvents) {
      await query(
        `INSERT INTO audit_logs (user_id, action, resource, details, ip_address, user_agent) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          `security_event_${event.type}`,
          'security',
          JSON.stringify({
            severity: event.severity,
            originalAction: action,
            ...event.details
          }),
          ipAddress,
          userAgent
        ]
      );
    }
  } catch (error) {
    console.error('Failed to detect and log security events:', error);
  }
}

// Get enhanced security statistics
export async function getSecurityStats(): Promise<Record<string, number>> {
  try {
    const stats: Record<string, number> = {};

    // Failed logins in last 24 hours
    const failedLogins = await query(`
      SELECT COUNT(*) as count 
      FROM audit_logs 
      WHERE action = 'login_failed' 
        AND created_at > NOW() - INTERVAL '24 hours'
    `);
    stats.failedLogins24h = parseInt(failedLogins.rows[0]?.count || '0');

    // Locked accounts
    const lockedAccounts = await query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE (locked_until IS NOT NULL AND locked_until > NOW()) 
         OR status = 'locked'
    `);
    stats.lockedAccounts = parseInt(lockedAccounts.rows[0]?.count || '0');

    // Unusual access patterns
    const unusualAccess = await query(`
      SELECT COUNT(*) as count 
      FROM audit_logs 
      WHERE action = 'login'
        AND (EXTRACT(hour FROM created_at) < 7 OR EXTRACT(hour FROM created_at) > 20)
        AND created_at > NOW() - INTERVAL '24 hours'
    `);
    stats.unusualAccess = parseInt(unusualAccess.rows[0]?.count || '0');

    // Admin actions in last 24 hours
    const adminActions = await query(`
      SELECT COUNT(*) as count 
      FROM audit_logs 
      WHERE action LIKE 'admin_%' 
        AND created_at > NOW() - INTERVAL '24 hours'
    `);
    stats.adminActions24h = parseInt(adminActions.rows[0]?.count || '0');

    // Security events in last 24 hours
    const securityEvents = await query(`
      SELECT COUNT(*) as count 
      FROM audit_logs 
      WHERE action LIKE 'security_event_%' 
        AND created_at > NOW() - INTERVAL '24 hours'
    `);
    stats.securityEvents24h = parseInt(securityEvents.rows[0]?.count || '0');

    return stats;
  } catch (error) {
    console.error('Failed to get security stats:', error);
    return {};
  }
}