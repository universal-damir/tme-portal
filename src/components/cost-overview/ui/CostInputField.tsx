import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CostInputFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  currency?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
  description?: string;
}

export const CostInputField: React.FC<CostInputFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = "0",
  currency = "AED",
  required = false,
  error,
  className = "",
  disabled = false,
  description
}) => {
  // Generate unique ID for accessibility
  const inputId = React.useId();
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cn("flex flex-col h-full space-y-2", className)}>
      <Label 
        htmlFor={inputId}
        className={cn(
          "text-sm font-semibold text-foreground",
          description ? 'min-h-[3rem] flex items-end' : ''
        )}
      >
        {label}{required && ' *'}
      </Label>
      
      <div className="relative mt-auto">
        <Input
          id={inputId}
          type="text"
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          aria-describedby={cn(
            descriptionId,
            errorId
          )}
          aria-invalid={!!error}
          className={cn(
            "pr-16 h-12 text-base",
            "focus-visible:ring-2 focus-visible:ring-primary",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            error && "border-destructive focus-visible:ring-destructive",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className={cn(
            "text-sm font-medium",
            error ? "text-destructive" : "text-muted-foreground"
          )}>
            {currency}
          </span>
        </div>

      </div>
      
      {description && (
        <p 
          id={descriptionId}
          className="text-xs text-muted-foreground"
        >
          {description}
        </p>
      )}
      
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