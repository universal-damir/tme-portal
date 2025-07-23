import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
  status?: number;
}

export async function verifyAuth(req: NextRequest): Promise<AuthResult> {
  try {
    // Get session ID from cookie
    const sessionId = req.cookies.get('session')?.value;
    
    if (!sessionId) {
      return {
        success: false,
        error: 'No session found',
        status: 401
      };
    }

    // Get session data using the existing auth system
    const sessionData = await getSession(sessionId);
    
    if (!sessionData) {
      return {
        success: false,
        error: 'Session not found or expired',
        status: 401
      };
    }

    const user = sessionData.user;

    // Check if user is active
    if (user.status !== 'active') {
      return {
        success: false,
        error: 'Account is inactive',
        status: 403
      };
    }

    return {
      success: true,
      user: user
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      status: 500
    };
  }
}

export async function verifyAdminAuth(req: NextRequest): Promise<AuthResult> {
  const authResult = await verifyAuth(req);
  
  if (!authResult.success) {
    return authResult;
  }

  // Check if user has admin role
  if (authResult.user.role !== 'admin') {
    return {
      success: false,
      error: 'Admin access required',
      status: 403
    };
  }

  return authResult;
}

export async function verifyManagerAuth(req: NextRequest): Promise<AuthResult> {
  const authResult = await verifyAuth(req);
  
  if (!authResult.success) {
    return authResult;
  }

  // Check if user has manager or admin role
  if (!['admin', 'manager'].includes(authResult.user.role)) {
    return {
      success: false,
      error: 'Manager or admin access required',
      status: 403
    };
  }

  return authResult;
}

export function createAuthMiddleware(requiredRole?: 'admin' | 'manager') {
  return async (req: NextRequest) => {
    switch (requiredRole) {
      case 'admin':
        return await verifyAdminAuth(req);
      case 'manager':
        return await verifyManagerAuth(req);
      default:
        return await verifyAuth(req);
    }
  };
}