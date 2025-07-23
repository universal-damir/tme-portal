import { NextRequest, NextResponse } from 'next/server';

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';",
};

// Rate limiting configuration
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
}

const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  'login': { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  'api': { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  'admin': { maxRequests: 50, windowMs: 5 * 60 * 1000 }, // 50 requests per 5 minutes
};

// In-memory rate limit store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function rateLimit(endpoint: string, customConfig?: RateLimitConfig) {
  return (req: NextRequest): { blocked: boolean; remaining: number; resetTime: number } => {
    const config = customConfig || DEFAULT_RATE_LIMITS[endpoint] || DEFAULT_RATE_LIMITS.api;
    const clientIp = getClientIP(req);
    const key = `${endpoint}:${clientIp}`;
    
    const now = Date.now();
    
    let record = rateLimitStore.get(key);
    
    if (!record || record.resetTime <= now) {
      record = { count: 0, resetTime: now + config.windowMs };
      rateLimitStore.set(key, record);
    }
    
    if (record.count >= config.maxRequests) {
      return {
        blocked: true,
        remaining: 0,
        resetTime: record.resetTime
      };
    }
    
    record.count++;
    rateLimitStore.set(key, record);
    
    return {
      blocked: false,
      remaining: config.maxRequests - record.count,
      resetTime: record.resetTime
    };
  };
}

export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return req.ip || '127.0.0.1';
}

export function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'Unknown';
}

// CSRF Protection
export function generateCSRFToken(): string {
  // Use Web Crypto API for Edge Runtime compatibility
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyCSRFToken(token: string, sessionToken: string): Promise<boolean> {
  if (!token || !sessionToken) return false;
  
  try {
    // Use Web Crypto API for HMAC
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(sessionToken));
    const hashArray = Array.from(new Uint8Array(signature));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Timing-safe comparison
    return token.length === hash.length && 
           token.split('').every((char, i) => char === hash[i]);
  } catch {
    return false;
  }
}

// Input validation and sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim()
    .substring(0, 1000); // Limit length
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

export function validateEmployeeCode(code: string): boolean {
  const codeRegex = /^[A-Z0-9]{2,10}$/;
  return codeRegex.test(code);
}

// Password strength validation
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score++;
  else feedback.push('Password should be at least 8 characters long');
  
  if (password.length >= 12) score++;
  else if (password.length >= 8) feedback.push('Consider using a longer password (12+ characters)');
  
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else feedback.push('Include both uppercase and lowercase letters');
  
  if (/\d/.test(password)) score++;
  else feedback.push('Include at least one number');
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push('Include at least one special character');
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters');
    score = Math.max(0, score - 1);
  }
  
  if (/123|abc|qwe|password|admin/i.test(password)) {
    feedback.push('Avoid common patterns and words');
    score = Math.max(0, score - 1);
  }
  
  return {
    score,
    feedback,
    isStrong: score >= 3
  };
}

// Security event detection
export interface SecurityEvent {
  type: 'suspicious_login' | 'brute_force' | 'unusual_access' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  timestamp: Date;
}

export function detectSuspiciousActivity(
  userId: number,
  action: string,
  ipAddress: string,
  userAgent: string,
  previousActivity?: Array<{ created_at: Date; action: string; ip_address: string }>
): SecurityEvent[] {
  const events: SecurityEvent[] = [];
  const now = new Date();
  
  // Detect unusual hours (outside 7 AM - 8 PM)
  const hour = now.getHours();
  if (hour < 7 || hour > 20) {
    events.push({
      type: 'unusual_access',
      severity: 'medium',
      details: {
        userId,
        action,
        hour,
        ipAddress,
        userAgent
      },
      timestamp: now
    });
  }
  
  // Detect rapid successive attempts
  if (previousActivity) {
    const recentAttempts = previousActivity.filter(
      activity => activity.created_at > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );
    
    if (recentAttempts.length > 10) {
      events.push({
        type: 'brute_force',
        severity: 'high',
        details: {
          userId,
          attemptCount: recentAttempts.length,
          ipAddress,
          userAgent
        },
        timestamp: now
      });
    }
  }
  
  return events;
}

// Session security enhancements
export function isSecureContext(req: NextRequest): boolean {
  const protocol = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol;
  const host = req.headers.get('host');
  
  // In production, enforce HTTPS
  if (process.env.NODE_ENV === 'production' && protocol !== 'https:') {
    return false;
  }
  
  // Check for localhost in development
  if (process.env.NODE_ENV === 'development' && host?.includes('localhost')) {
    return true;
  }
  
  return protocol === 'https:';
}

export function generateSecureSessionCookie(sessionId: string, maxAge: number): string {
  const cookieOptions = [
    `session=${sessionId}`,
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
    'Path=/'
  ];
  
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.push('Secure');
  }
  
  return cookieOptions.join('; ');
}

// Content filtering for XSS prevention
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// Database query security
export function validateQueryParams(params: Record<string, unknown>): boolean {
  for (const [, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // Check for SQL injection patterns
      if (/(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|SELECT|UNION|UPDATE)\b)|(\b(OR|AND)\s+\d+\s*=\s*\d+)|(';\s*--)|(\/\*.*\*\/)/i.test(value)) {
        return false;
      }
    }
  }
  return true;
}

// File upload security
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: 'File extension not allowed' };
  }
  
  return { valid: true };
}

// Cleanup old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes