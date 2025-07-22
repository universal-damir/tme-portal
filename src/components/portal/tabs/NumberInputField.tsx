'use client';

import React, { useState, useEffect } from 'react';
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
    <div className="space-y-2">
      <Label 
        htmlFor={inputId}
        className="text-sm font-semibold text-foreground"
      >
        {label}{required && ' *'}
      </Label>
      
      <Input
        id={inputId}
        type="text"
        value={formattedValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        aria-describedby={errorId}
        aria-invalid={!!error}
        className={cn(
          "h-12 text-base",
          "focus-visible:ring-2 focus-visible:ring-primary",
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
      />
      
      {error && (
        <p 
          id={errorId}
          className="text-sm text-destructive font-medium"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}; 