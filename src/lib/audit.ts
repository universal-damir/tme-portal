import { query } from '@/lib/database';
import { logUserAction } from '@/lib/auth';

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
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    'unknown'
  );
}

// Helper function to get user agent from request
export function getUserAgent(req: any): string {
  return req.headers['user-agent'] || 'unknown';
}