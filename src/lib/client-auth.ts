// Client-side safe authentication utilities
// This file contains auth utilities that can run in the browser

export interface User {
  id: number;
  employee_code: string;
  email: string;
  full_name: string;
  department: string;
  designation: string;
  role: 'admin' | 'manager' | 'employee';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  must_change_password: boolean;
  last_login?: Date;
}

// Password validation - client-safe version
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

// Get user initials for avatar fallbacks
export function getUserInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}