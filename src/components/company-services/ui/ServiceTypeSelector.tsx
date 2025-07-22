'use client';

import React from 'react';
import { SERVICE_TYPE_OPTIONS, SECTION_COLORS } from '../utils/accountingServiceConfig';
import { UseFormRegister, FieldErrors, Control } from 'react-hook-form';
import { CompanyServicesData } from '@/types/company-services';
import { 
  RadioGroup, 
  RadioGroupItem 
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ServiceTypeSelectorProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<CompanyServicesData>;
  
  /**
   * Form errors object
   */
  errors: FieldErrors<CompanyServicesData>;
  
  /**
   * Current value for controlled component
   */
  value?: string;
  
  /**
   * Change handler for controlled component
   */
  onValueChange?: (value: string) => void;
}

export const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({
  register,
  errors,
  value,
  onValueChange,
}) => {
  const colors = SECTION_COLORS.serviceType;

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
        Service Type
      </h3>
      
      <div className="space-y-4">
        <RadioGroup 
          value={value}
          onValueChange={onValueChange}
          className="space-y-3"
        >
          {SERVICE_TYPE_OPTIONS.map((option) => {
            const itemId = `serviceType-${option.value}`;
            
            return (
              <div key={option.value} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={option.value}
                  id={itemId}
                  className={cn(
                    "focus-visible:ring-2 focus-visible:ring-purple-500",
                    "border-purple-300 text-purple-600"
                  )}
                />
                <Label 
                  htmlFor={itemId}
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
        
        {/* Hidden input for React Hook Form registration */}
        <input
          type="hidden"
          {...register('accountingServices.serviceType')}
          value={value || ''}
        />
        
        {errors.accountingServices?.serviceType && (
          <p 
            className="text-sm text-destructive font-medium mt-2"
            role="alert"
          >
            {errors.accountingServices.serviceType.message}
          </p>
        )}
      </div>
    </div>
  );
}; 