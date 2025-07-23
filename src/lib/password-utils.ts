/**
 * Password utility functions for TME Portal
 */

export function generateRandomPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';
  
  // Ensure password has at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} {
  const errors: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }
  
  // Character variety checks
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }
  
  // Common patterns check
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters
    /123|234|345|456|567|678|789|890/, // Sequential numbers
    /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i // Sequential letters
  ];
  
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password should not contain repeated or sequential characters');
      score -= 1;
      break;
    }
  }
  
  // Common passwords check (basic)
  const commonPasswords = [
    'password', 'password123', '123456', '123456789', 'qwerty',
    'abc123', 'password1', 'admin', 'root', 'user', 'test'
  ];
  
  if (commonPasswords.some(common => 
    password.toLowerCase().includes(common.toLowerCase())
  )) {
    errors.push('Password should not contain common words or patterns');
    score -= 1;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    score: Math.max(0, score)
  };
}

export function getPasswordStrengthText(score: number): {
  text: string;
  color: string;
} {
  if (score >= 5) {
    return { text: 'Strong', color: 'green' };
  } else if (score >= 3) {
    return { text: 'Medium', color: 'yellow' };
  } else {
    return { text: 'Weak', color: 'red' };
  }
}

export function generateEmployeePassword(employeeCode: string): string {
  // Generate a password in the format TME2024_XX where XX is employee code
  const year = new Date().getFullYear();
  return `TME${year}_${employeeCode.toUpperCase()}`;
}

export function hashPassword(password: string): Promise<string> {
  // This would typically use bcrypt
  // For now, return a placeholder that matches our existing implementation
  const bcrypt = require('bcryptjs');
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  // This would typically use bcrypt
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hash);
}