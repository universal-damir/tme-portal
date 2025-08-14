import { NextRequest, NextResponse } from 'next/server';

// Security headers configuration
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' data: blob:; frame-ancestors 'none';",
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

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
  
  // No rate limiting needed for internal network with 50-100 trusted users
  // The database pool has been increased to handle the load
  
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