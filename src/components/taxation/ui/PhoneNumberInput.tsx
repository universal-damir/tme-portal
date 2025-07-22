'use client';

import React, { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';

interface PhoneNumberInputProps {
  /**
   * Current phone number value (without prefix)
   */
  value: string;
  
  /**
   * Handler for phone number changes
   */
  onChange: (value: string) => void;
  
  /**
   * Label for the input
   */
  label: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Color theme for focus rings
   */
  focusColor?: string;
  
  /**
   * Error message
   */
  error?: string;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  label,
  required = false,
  className = '',
  focusColor = 'focus:ring-blue-500',
  error,
  placeholder = "58 1 23 45 67",
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [localError, setLocalError] = useState('');

  // Format phone number with spaces (XX X XX XX XX)
  const formatPhoneNumber = (input: string): string => {
    // Remove all non-digit characters
    const digitsOnly = input.replace(/\D/g, '');
    
    // Limit to 9 digits
    const limitedDigits = digitsOnly.slice(0, 9);
    
    // Format with spaces: XX X XX XX XX (e.g., 58 1 23 45 67)
    if (limitedDigits.length === 0) return '';
    if (limitedDigits.length <= 2) return limitedDigits;
    if (limitedDigits.length <= 3) {
      return limitedDigits.slice(0, 2) + ' ' + limitedDigits.slice(2);
    }
    if (limitedDigits.length <= 5) {
      return limitedDigits.slice(0, 2) + ' ' + limitedDigits.slice(2, 3) + ' ' + limitedDigits.slice(3);
    }
    if (limitedDigits.length <= 7) {
      return limitedDigits.slice(0, 2) + ' ' + limitedDigits.slice(2, 3) + ' ' + limitedDigits.slice(3, 5) + ' ' + limitedDigits.slice(5);
    }
    // Full format: XX X XX XX XX
    return limitedDigits.slice(0, 2) + ' ' + limitedDigits.slice(2, 3) + ' ' + limitedDigits.slice(3, 5) + ' ' + limitedDigits.slice(5, 7) + ' ' + limitedDigits.slice(7, 9);
  };

  // Validate phone number
  const validatePhoneNumber = (input: string): string => {
    const digitsOnly = input.replace(/\D/g, '');
    
    if (digitsOnly.length === 0) {
      return required ? 'Phone number is required' : '';
    }
    
    if (digitsOnly.length < 9) {
      return `Phone number must be exactly 9 digits (currently ${digitsOnly.length})`;
    }
    
    if (digitsOnly.length > 9) {
      return 'Phone number cannot exceed 9 digits';
    }
    
    // Check if it starts with a valid UAE mobile prefix
    const validPrefixes = ['50', '51', '52', '54', '55', '56', '58'];
    const prefix = digitsOnly.slice(0, 2);
    
    if (!validPrefixes.includes(prefix)) {
      return 'Invalid UAE mobile number. Must start with 50, 51, 52, 54, 55, 56, or 58';
    }
    
    return '';
  };

  // Update display value when value prop changes
  useEffect(() => {
    if (value) {
      setDisplayValue(formatPhoneNumber(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const digitsOnly = inputValue.replace(/\D/g, '');
    
    // Don't allow more than 9 digits
    if (digitsOnly.length > 9) {
      return;
    }
    
    const formatted = formatPhoneNumber(digitsOnly);
    setDisplayValue(formatted);
    
    // Validate
    const validationError = validatePhoneNumber(digitsOnly);
    setLocalError(validationError);
    
    // Always call onChange with clean digits (let parent handle validation)
    onChange(digitsOnly);
  };

  const handleBlur = () => {
    // Final validation on blur
    const validationError = validatePhoneNumber(displayValue);
    setLocalError(validationError);
  };

  // Use external error if provided, otherwise use local validation error
  const currentError = error || localError;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && '*'}
      </label>
      
      <div className="relative">
        {/* UAE Prefix */}
        <div className="absolute inset-y-0 left-0 flex items-center">
          <div className="flex items-center pl-3 pr-2 border-r border-gray-300">
            <Phone className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-600">+971</span>
          </div>
        </div>
        
        {/* Phone Number Input */}
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full pl-20 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ${focusColor} focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white ${
            currentError ? 'border-red-300 focus:ring-red-500' : ''
          }`}
          maxLength={13} // XX X XX XX XX = 13 characters with spaces
        />
      </div>
      
      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Enter 9-digit UAE mobile number (e.g., 58 1 23 45 67)
      </p>
      
      {/* Error Message */}
      {currentError && (
        <p className="text-red-500 text-sm mt-1">{currentError}</p>
      )}
      
      {/* Success State */}
      {displayValue && !currentError && displayValue.replace(/\D/g, '').length === 9 && (
        <p className="text-green-600 text-sm mt-1">
          ✓ Valid UAE mobile number: +971 {displayValue}
        </p>
      )}
    </div>
  );
}; 