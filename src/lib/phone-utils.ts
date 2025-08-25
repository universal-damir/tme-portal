/**
 * Phone number utility functions for TME Portal
 * Supports UAE phone number formatting: +971 XX X XX XX XX
 */

export function formatPhoneNumber(input: string): string {
  // Remove all non-numeric characters except +
  const cleaned = input.replace(/[^\d+]/g, '');
  
  // If it starts with +971, format as UAE number
  if (cleaned.startsWith('+971')) {
    const digits = cleaned.slice(4); // Remove +971
    
    if (digits.length === 0) return '+971 ';
    if (digits.length <= 2) return `+971 ${digits}`;
    if (digits.length <= 3) return `+971 ${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 5) return `+971 ${digits.slice(0, 2)} ${digits.slice(2, 3)} ${digits.slice(3)}`;
    if (digits.length <= 7) return `+971 ${digits.slice(0, 2)} ${digits.slice(2, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
    
    // Full format: +971 XX X XX XX XX
    return `+971 ${digits.slice(0, 2)} ${digits.slice(2, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
  }
  
  // If starts with 971, add + prefix
  if (cleaned.startsWith('971')) {
    return formatPhoneNumber(`+${cleaned}`);
  }
  
  // If starts with 0, replace with +971
  if (cleaned.startsWith('0')) {
    return formatPhoneNumber(`+971${cleaned.slice(1)}`);
  }
  
  // If just digits (assuming UAE local number), add +971
  if (/^\d+$/.test(cleaned) && cleaned.length >= 9) {
    return formatPhoneNumber(`+971${cleaned}`);
  }
  
  // For other international numbers, keep as is but clean format
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  return input; // Return original if no pattern matches
}

export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  error?: string;
} {
  if (!phone.trim()) {
    return { isValid: true }; // Phone is optional
  }
  
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Check UAE format: +971 followed by 9 digits
  if (cleaned.startsWith('+971')) {
    const digits = cleaned.slice(4);
    if (digits.length !== 9) {
      return {
        isValid: false,
        error: 'UAE phone numbers must have 9 digits after +971'
      };
    }
    
    // Check if it starts with valid UAE mobile prefixes
    const validPrefixes = ['50', '52', '54', '55', '56', '58'];
    const prefix = digits.slice(0, 2);
    
    if (!validPrefixes.includes(prefix)) {
      return {
        isValid: false,
        error: 'Invalid UAE mobile number prefix'
      };
    }
    
    return { isValid: true };
  }
  
  // For other international numbers, basic validation
  if (cleaned.startsWith('+') && cleaned.length >= 10) {
    return { isValid: true };
  }
  
  return {
    isValid: false,
    error: 'Please enter a valid phone number (e.g., +971 55 123 45 67)'
  };
}

export function getPhoneDisplayFormat(phone: string): string {
  if (!phone) return '';
  
  // If already properly formatted, return as is
  if (phone.includes(' ') && phone.startsWith('+971')) {
    return phone;
  }
  
  // Otherwise, format it
  return formatPhoneNumber(phone);
}

export function normalizePhoneForStorage(phone: string): string {
  if (!phone.trim()) return '';
  
  // Always store in formatted display format
  return formatPhoneNumber(phone);
}