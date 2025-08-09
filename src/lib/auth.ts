import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { query, redis, ensureRedisConnection } from './database';

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');

export interface User {
  id: number;
  employee_code: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  department: string;
  designation: string;
  role: 'admin' | 'manager' | 'employee' | 'staff';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  must_change_password: boolean;
  last_login?: Date;
}

export interface SessionData {
  user: User;
  sessionId: string;
  expiresAt: Date;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// JWT token utilities
export async function createToken(payload: any, expiresIn = '8h'): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// User authentication
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND status = $2',
      [email, 'active']
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new Error('Account is locked due to too many failed login attempts');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.hashed_password);

    if (!isValid) {
      // Increment failed login attempts
      await query(
        'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = $1',
        [user.id]
      );

      // Lock account after 5 failed attempts
      if (user.failed_login_attempts + 1 >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 30); // Lock for 30 minutes
        
        await query(
          'UPDATE users SET locked_until = $1 WHERE id = $2',
          [lockUntil, user.id]
        );
        throw new Error('Account locked due to too many failed login attempts');
      }

      return null;
    }

    // Reset failed attempts and update last login
    await query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    return {
      id: user.id,
      employee_code: user.employee_code,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      phone: user.phone,
      department: user.department,
      designation: user.designation,
      role: user.role,
      status: user.status,
      must_change_password: user.must_change_password,
      last_login: user.last_login,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

// Session management
export async function createSession(user: User, ipAddress?: string, userAgent?: string): Promise<string> {
  // Generate UUID using Web Crypto API or fallback
  const sessionId = globalThis.crypto?.randomUUID?.() || 
    `${Date.now()}-${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 8); // 8 hour expiration

  // Store session in database
  await query(
    'INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
    [sessionId, user.id, expiresAt, ipAddress, userAgent]
  );

  // Store session data in Redis for fast lookup
  const sessionData: SessionData = {
    user,
    sessionId,
    expiresAt,
  };

  await ensureRedisConnection();
  await redis.setEx(`session:${sessionId}`, 8 * 60 * 60, JSON.stringify(sessionData)); // 8 hours

  return sessionId;
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  try {
    // Try Redis first for performance
    await ensureRedisConnection();
    const cached = await redis.get(`session:${sessionId}`);
    if (cached) {
      const sessionData = JSON.parse(cached);
      if (new Date(sessionData.expiresAt) > new Date()) {
        return sessionData;
      }
    }

    // Fallback to database
    const result = await query(`
      SELECT s.*, u.* FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1 AND s.expires_at > CURRENT_TIMESTAMP
    `, [sessionId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const sessionData: SessionData = {
      user: {
        id: row.user_id,
        employee_code: row.employee_code,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        full_name: row.full_name,
        phone: row.phone,
        department: row.department,
        designation: row.designation,
        role: row.role,
        status: row.status,
        must_change_password: row.must_change_password,
        last_login: row.last_login,
      },
      sessionId: row.id,
      expiresAt: row.expires_at,
    };

    // Update Redis cache
    const ttl = Math.floor((new Date(row.expires_at).getTime() - Date.now()) / 1000);
    if (ttl > 0) {
      await ensureRedisConnection();
      await redis.setEx(`session:${sessionId}`, ttl, JSON.stringify(sessionData));
    }

    return sessionData;
  } catch (error) {
    console.error('Session lookup error:', error);
    return null;
  }
}

export async function invalidateSession(sessionId: string): Promise<void> {
  // Remove from Redis
  await ensureRedisConnection();
  await redis.del(`session:${sessionId}`);
  
  // Remove from database
  await query('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

// Renew session expiration
export async function renewSession(sessionId: string): Promise<boolean> {
  try {
    const sessionData = await getSession(sessionId);
    if (!sessionData) {
      return false;
    }

    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + 8); // Extend by 8 hours

    // Update database
    await query(
      'UPDATE sessions SET expires_at = $1 WHERE id = $2',
      [newExpiresAt, sessionId]
    );

    // Update Redis cache
    sessionData.expiresAt = newExpiresAt;
    await ensureRedisConnection();
    await redis.setEx(`session:${sessionId}`, 8 * 60 * 60, JSON.stringify(sessionData));

    return true;
  } catch (error) {
    console.error('Session renewal error:', error);
    return false;
  }
}

// Get all active sessions for a user
export async function getUserSessions(userId: number): Promise<any[]> {
  try {
    const result = await query(`
      SELECT id, expires_at, ip_address, user_agent, created_at
      FROM sessions
      WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
    `, [userId]);

    return result.rows;
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return [];
  }
}

// Invalidate all sessions for a user (useful for password changes)
export async function invalidateAllUserSessions(userId: number, exceptSessionId?: string): Promise<void> {
  try {
    // Get all active sessions for the user
    const sessions = await getUserSessions(userId);
    
    for (const session of sessions) {
      if (exceptSessionId && session.id === exceptSessionId) {
        continue; // Skip the current session if specified
      }
      
      // Remove from Redis
      await ensureRedisConnection();
      await redis.del(`session:${session.id}`);
    }

    // Remove from database
    if (exceptSessionId) {
      await query(
        'DELETE FROM sessions WHERE user_id = $1 AND id != $2',
        [userId, exceptSessionId]
      );
    } else {
      await query(
        'DELETE FROM sessions WHERE user_id = $1',
        [userId]
      );
    }
  } catch (error) {
    console.error('Error invalidating user sessions:', error);
    throw error;
  }
}

// Check if session is close to expiring (within 30 minutes)
export function isSessionNearExpiry(sessionData: SessionData): boolean {
  const now = new Date();
  const expiry = new Date(sessionData.expiresAt);
  const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
  
  return (expiry.getTime() - now.getTime()) <= thirtyMinutes;
}

// Verify and get session from request
export async function verifySession(request: Request): Promise<SessionData | null> {
  try {
    const sessionCookie = request.headers.get('cookie')
      ?.split(';')
      .find(c => c.trim().startsWith('session='))
      ?.split('=')[1];

    if (!sessionCookie) {
      return null;
    }

    return await getSession(sessionCookie);
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

// Audit logging
export async function logUserAction(
  userId: number | null,
  action: string,
  resource?: string,
  resourceId?: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await query(
    'INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [userId, action, resource, resourceId, details ? JSON.stringify(details) : null, ipAddress, userAgent]
  );
}

// Password validation
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}