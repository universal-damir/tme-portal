import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders, rateLimit, getClientIP } from '@/lib/security';

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/admin',
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/change-password',
  '/api/auth',
  '/api/photos',
  '/_next',
  '/favicon.ico',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create response
  let response = NextResponse.next();
  
  // Apply security headers to all responses
  response = applySecurityHeaders(response);
  
  // Apply rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const endpoint = pathname.startsWith('/api/auth/login') ? 'login' : 
                    pathname.startsWith('/api/admin/') ? 'admin' : 'api';
    
    const rateCheck = rateLimit(endpoint)(request);
    
    if (rateCheck.blocked) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateCheck.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateCheck.resetTime).toISOString()
        }
      });
    }
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', rateCheck.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateCheck.resetTime).toISOString());
  }
  
  // Allow static files and public routes
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    return response;
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (!isProtectedRoute) {
    return response;
  }

  // Get session from cookie
  const sessionId = request.cookies.get('session')?.value;
  
  if (!sessionId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // For protected routes, let the API routes handle detailed session validation
  // This lightweight middleware just checks for session existence
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};