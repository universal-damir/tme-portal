import { NextRequest } from 'next/server';
import { middleware } from '@/src/middleware';

// Mock security module
jest.mock('@/lib/security', () => ({
  applySecurityHeaders: jest.fn((response) => {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    return response;
  }),
  rateLimit: jest.fn((endpoint) => () => ({
    blocked: false,
    remaining: 10,
    resetTime: Date.now() + 900000
  })),
  getClientIP: jest.fn(() => '127.0.0.1'),
}));

describe('Security Integration Tests', () => {
  const createMockRequest = (pathname: string, options: any = {}) => {
    return {
      nextUrl: { pathname },
      headers: {
        get: jest.fn((name: string) => {
          if (name === 'user-agent') return 'test-agent';
          if (name === 'x-forwarded-for') return options.ip || '127.0.0.1';
          return null;
        })
      },
      cookies: {
        get: jest.fn((name: string) => {
          if (name === 'session') return { value: options.sessionId || null };
          return null;
        })
      },
      ip: options.ip || '127.0.0.1'
    } as any as NextRequest;
  };

  describe('Middleware Security Integration', () => {
    test('should apply security headers to all responses', async () => {
      const req = createMockRequest('/dashboard', { sessionId: 'valid-session' });
      const response = await middleware(req);
      
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    test('should redirect unauthenticated users from protected routes', async () => {
      const req = createMockRequest('/dashboard'); // No session
      const response = await middleware(req);
      
      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get('location')).toContain('/login');
    });

    test('should allow access to public routes without authentication', async () => {
      const req = createMockRequest('/login');
      const response = await middleware(req);
      
      expect(response.status).not.toBe(307);
    });

    test('should apply rate limiting to API routes', async () => {
      const { rateLimit } = require('@/lib/security');
      
      const req = createMockRequest('/api/test');
      await middleware(req);
      
      expect(rateLimit).toHaveBeenCalledWith('api');
    });

    test('should apply stricter rate limiting to login endpoints', async () => {
      const { rateLimit } = require('@/lib/security');
      
      const req = createMockRequest('/api/auth/login');
      await middleware(req);
      
      expect(rateLimit).toHaveBeenCalledWith('login');
    });
  });

  describe('End-to-End Security Flow', () => {
    test('should handle complete authentication flow securely', async () => {
      // 1. Unauthenticated access to protected route should redirect
      const unauthReq = createMockRequest('/dashboard');
      const redirectResponse = await middleware(unauthReq);
      expect(redirectResponse.status).toBe(307);

      // 2. Access to login page should be allowed
      const loginReq = createMockRequest('/login');
      const loginResponse = await middleware(loginReq);
      expect(loginResponse.status).not.toBe(307);

      // 3. Authenticated access to protected route should be allowed
      const authReq = createMockRequest('/dashboard', { sessionId: 'valid-session' });
      const authResponse = await middleware(authReq);
      expect(authResponse.status).not.toBe(307);
    });

    test('should handle rate limiting across multiple endpoints', async () => {
      const { rateLimit } = require('@/lib/security');
      
      // Mock rate limiter to return blocked on third call
      let callCount = 0;
      rateLimit.mockImplementation(() => () => {
        callCount++;
        return {
          blocked: callCount > 2,
          remaining: Math.max(0, 3 - callCount),
          resetTime: Date.now() + 900000
        };
      });

      // First two requests should pass
      const req1 = createMockRequest('/api/test');
      const response1 = await middleware(req1);
      expect(response1.status).not.toBe(429);

      const req2 = createMockRequest('/api/test');
      const response2 = await middleware(req2);
      expect(response2.status).not.toBe(429);

      // Third request should be blocked
      const req3 = createMockRequest('/api/test');
      const response3 = await middleware(req3);
      expect(response3.status).toBe(429);
    });
  });

  describe('Security Headers Validation', () => {
    test('should include all required security headers', async () => {
      const req = createMockRequest('/dashboard', { sessionId: 'valid-session' });
      const response = await middleware(req);
      
      // Verify security headers are applied (mocked in this case)
      expect(response.headers.get('X-Content-Type-Options')).toBeTruthy();
      
      // In a real test, you would check for all headers:
      // expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      // expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      // etc.
    });
  });

  describe('Error Handling', () => {
    test('should handle security module errors gracefully', async () => {
      const { applySecurityHeaders } = require('@/lib/security');
      
      // Mock security function to throw error
      applySecurityHeaders.mockImplementationOnce(() => {
        throw new Error('Security module error');
      });

      const req = createMockRequest('/test');
      
      // Should not crash the middleware
      await expect(middleware(req)).resolves.toBeDefined();
    });
  });

  describe('Static File Security', () => {
    test('should allow static files without authentication', async () => {
      const staticPaths = [
        '/_next/static/css/app.css',
        '/_next/image/logo.png',
        '/favicon.ico'
      ];

      for (const path of staticPaths) {
        const req = createMockRequest(path);
        const response = await middleware(req);
        expect(response.status).not.toBe(307);
      }
    });
  });

  describe('Admin Route Security', () => {
    test('should apply stricter rate limiting to admin routes', async () => {
      const { rateLimit } = require('@/lib/security');
      
      const req = createMockRequest('/api/admin/users');
      await middleware(req);
      
      expect(rateLimit).toHaveBeenCalledWith('admin');
    });
  });
});