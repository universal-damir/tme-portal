'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface NumberInputFieldProps {
  label: string;
  value?: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  required?: boolean;
  min?: number;
  max?: number;
}

const formatNumberWithSeparators = (value: string): string => {
  // Remove all non-digit characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  // Split by decimal point
  const parts = cleaned.split('.');
  // Add thousand separators to the integer part
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  // Join back with decimal point if there was one
  return parts.length > 1 ? parts.join('.') : parts[0];
};

const parseFormattedNumber = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  const cleaned = value.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const NumberInputField: React.FC<NumberInputFieldProps> = ({
  label,
  value = 0,
  onChange,
  placeholder = "0",
  className = "",
  error,
  required = false,
  min,
  max
}) => {
  const [formattedValue, setFormattedValue] = useState<string>('');
  
  // Generate unique ID for accessibility
  const inputId = React.useId();
  const errorId = error ? `${inputId}-error` : undefined;

  // Update formatted value when prop value changes
  useEffect(() => {
    if (value && value > 0) {
      setFormattedValue(formatNumberWithSeparators(value.toString()));
    } else {
      setFormattedValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatNumberWithSeparators(inputValue);
    const parsed = parseFormattedNumber(formatted);
    
    // Apply min/max constraints if provided
    let finalValue = parsed;
    if (min !== undefined && finalValue < min) {
      finalValue = min;
    }
    if (max !== undefined && finalValue > max) {
      finalValue = max;
    }
    
    setFormattedValue(formatted);
    onChange(finalValue);
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <Label 
        htmlFor={inputId}
        className="text-sm font-medium mb-1"
        style={{ color: '#243F7B' }}
      >
        {label}{required && ' *'}
      </Label>
      
      <motion.div whileFocus={{ scale: 1.01 }}>
        <Input
          id={inputId}
          type="text"
          value={formattedValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          aria-describedby={errorId}
          aria-invalid={!!error}
          className={cn(
            "h-[42px] text-base px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            error && "border-red-500",
            className
          )}
          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
          onBlur={(e) => e.target.style.borderColor = error ? '#ef4444' : '#e5e7eb'}
        />
      </motion.div>
      
      {error && (
        <p 
          id={errorId}
          className="text-sm text-red-500 font-medium"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}; 