'use client';

import React from 'react';
import { SECTION_COLORS } from '../utils/accountingServiceConfig';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { CompanyServicesData } from '@/types/company-services';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TransactionTierSelectorProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<CompanyServicesData>;
  
  /**
   * Form errors object
   */
  errors: FieldErrors<CompanyServicesData>;
  
  /**
   * Available transaction tiers
   */
  transactionTiers: number[];
  
  /**
   * Current service type
   */
  serviceType?: string;
  
  /**
   * Current value for controlled component
   */
  value?: number;
  
  /**
   * Change handler for controlled component
   */
  onValueChange?: (value: number) => void;
}

export const TransactionTierSelector: React.FC<TransactionTierSelectorProps> = ({
  register,
  errors,
  transactionTiers,
  serviceType,
  value,
  onValueChange,
}) => {
  const colors = SECTION_COLORS.transactionTier;

  if (!serviceType) {
    return null;
  }

  // Generate unique ID for accessibility
  const selectId = React.useId();
  const errorId = errors.accountingServices?.transactionTier ? `${selectId}-error` : undefined;

  return (
    <div className={cn(
      "rounded-xl p-6 border",
      colors.bg,
      colors.border
    )}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <div className={cn(
          "w-2 h-2 rounded-full mr-2",
          colors.dotColor
        )}></div>
        Transaction Volume
      </h3>
      
      <div className="space-y-2">
        <Label 
          htmlFor={selectId}
          className="text-sm font-semibold text-foreground"
        >
          Select transaction volume per month
        </Label>
        
        <Select
          value={value ? value.toString() : ''}
          onValueChange={(val) => onValueChange && onValueChange(Number(val))}
        >
          <SelectTrigger
            id={selectId}
            aria-describedby={errorId}
            aria-invalid={!!errors.accountingServices?.transactionTier}
            className={cn(
              "w-full max-w-md h-12 text-base",
              "focus-visible:ring-2 focus-visible:ring-blue-500",
              errors.accountingServices?.transactionTier && "border-destructive focus-visible:ring-destructive"
            )}
          >
            <SelectValue placeholder="Select transaction tier..." />
          </SelectTrigger>
          <SelectContent>
            {transactionTiers.map((tier) => (
              <SelectItem key={tier} value={tier.toString()}>
                Up to {tier} transactions/month
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Hidden input for React Hook Form registration */}
        <input
          type="hidden"
          {...register('accountingServices.transactionTier', { valueAsNumber: true })}
          value={value || 0}
        />
        
        {errors.accountingServices?.transactionTier && (
          <p 
            id={errorId}
            className="text-sm text-destructive font-medium"
            role="alert"
          >
            {errors.accountingServices.transactionTier.message}
          </p>
        )}
      </div>
    </div>
  );
}; 