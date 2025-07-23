import { NextRequest } from 'next/server';
import { rateLimit, getClientIP, SECURITY_HEADERS } from '@/lib/security';

describe('Rate Limiting Security Tests', () => {
  const createMockRequest = (ip: string = '127.0.0.1') => {
    return {
      headers: new Map([
        ['x-forwarded-for', ip],
        ['user-agent', 'test-agent']
      ]),
      ip,
      nextUrl: { pathname: '/api/test' }
    } as any as NextRequest;
  };

  beforeEach(() => {
    // Clear rate limit store before each test
    jest.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    test('should allow requests within limit', () => {
      const limiter = rateLimit('api');
      const req = createMockRequest();

      // Make requests within limit
      for (let i = 0; i < 50; i++) {
        const result = limiter(req);
        expect(result.blocked).toBe(false);
        expect(result.remaining).toBe(50 - i - 1);
      }
    });

    test('should block requests exceeding limit', () => {
      const limiter = rateLimit('api', { maxRequests: 5, windowMs: 60000 });
      const req = createMockRequest();

      // Make requests up to limit
      for (let i = 0; i < 5; i++) {
        const result = limiter(req);
        expect(result.blocked).toBe(false);
      }

      // Next request should be blocked
      const blockedResult = limiter(req);
      expect(blockedResult.blocked).toBe(true);
      expect(blockedResult.remaining).toBe(0);
    });

    test('should apply different limits for different endpoints', () => {
      const loginLimiter = rateLimit('login');
      const adminLimiter = rateLimit('admin');
      const req = createMockRequest();

      // Login should have stricter limits (5 requests)
      for (let i = 0; i < 5; i++) {
        const result = loginLimiter(req);
        expect(result.blocked).toBe(false);
      }
      
      const loginBlocked = loginLimiter(req);
      expect(loginBlocked.blocked).toBe(true);

      // Admin should have moderate limits (50 requests)
      for (let i = 0; i < 50; i++) {
        const result = adminLimiter(req);
        expect(result.blocked).toBe(false);
      }
      
      const adminBlocked = adminLimiter(req);
      expect(adminBlocked.blocked).toBe(true);
    });

    test('should isolate rate limits by IP address', () => {
      const limiter = rateLimit('api', { maxRequests: 2, windowMs: 60000 });
      const req1 = createMockRequest('192.168.1.1');
      const req2 = createMockRequest('192.168.1.2');

      // Exhaust limit for first IP
      limiter(req1);
      limiter(req1);
      const blocked1 = limiter(req1);
      expect(blocked1.blocked).toBe(true);

      // Second IP should still be allowed
      const allowed2 = limiter(req2);
      expect(allowed2.blocked).toBe(false);
    });
  });

  describe('IP Address Extraction', () => {
    test('should extract IP from x-forwarded-for header', () => {
      const req = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
            return null;
          }
        },
        ip: '127.0.0.1'
      } as any as NextRequest;

      const ip = getClientIP(req);
      expect(ip).toBe('192.168.1.1');
    });

    test('should extract IP from x-real-ip header', () => {
      const req = {
        headers: {
          get: (name: string) => {
            if (name === 'x-real-ip') return '192.168.1.2';
            return null;
          }
        },
        ip: '127.0.0.1'
      } as any as NextRequest;

      const ip = getClientIP(req);
      expect(ip).toBe('192.168.1.2');
    });

    test('should fallback to request IP', () => {
      const req = {
        headers: {
          get: () => null
        },
        ip: '192.168.1.3'
      } as any as NextRequest;

      const ip = getClientIP(req);
      expect(ip).toBe('192.168.1.3');
    });

    test('should fallback to localhost if no IP found', () => {
      const req = {
        headers: {
          get: () => null
        }
      } as any as NextRequest;

      const ip = getClientIP(req);
      expect(ip).toBe('127.0.0.1');
    });
  });

  describe('Security Headers', () => {
    test('should include all required security headers', () => {
      expect(SECURITY_HEADERS).toHaveProperty('X-Content-Type-Options', 'nosniff');
      expect(SECURITY_HEADERS).toHaveProperty('X-Frame-Options', 'DENY');
      expect(SECURITY_HEADERS).toHaveProperty('X-XSS-Protection', '1; mode=block');
      expect(SECURITY_HEADERS).toHaveProperty('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(SECURITY_HEADERS).toHaveProperty('Strict-Transport-Security');
      expect(SECURITY_HEADERS).toHaveProperty('Content-Security-Policy');
    });

    test('should have proper CSP configuration', () => {
      const csp = SECURITY_HEADERS['Content-Security-Policy'];
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
    });
  });

  describe('Brute Force Protection', () => {
    test('should detect rapid login attempts', () => {
      const limiter = rateLimit('login');
      const req = createMockRequest('192.168.1.100');

      // Simulate rapid login attempts
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(limiter(req));
      }

      // First 5 should be allowed, rest blocked
      expect(results.slice(0, 5).every(r => !r.blocked)).toBe(true);
      expect(results.slice(5).every(r => r.blocked)).toBe(true);
    });

    test('should reset limits after time window', (done) => {
      const limiter = rateLimit('api', { maxRequests: 2, windowMs: 100 });
      const req = createMockRequest();

      // Exhaust limit
      limiter(req);
      limiter(req);
      const blocked = limiter(req);
      expect(blocked.blocked).toBe(true);

      // Wait for window to reset
      setTimeout(() => {
        const allowed = limiter(req);
        expect(allowed.blocked).toBe(false);
        done();
      }, 150);
    });
  });
});