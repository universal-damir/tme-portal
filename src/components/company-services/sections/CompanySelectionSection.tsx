'use client';

import React from 'react';
import { Building2, Check } from 'lucide-react';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { CompanyType, CompanyServicesData } from '@/types/company-services';
import { UseFormRegister } from 'react-hook-form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CompanySelectionSectionProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<CompanyServicesData>;
  
  /**
   * Current company type selection
   */
  companyType: CompanyType;
  
  /**
   * Handler for company type change
   */
  onCompanyTypeChange: (companyType: CompanyType) => void;
}

const COMPANY_OPTIONS = [
  {
    value: 'tme-fzco' as const,
    label: 'TME FZCO',
    description: 'TME FZCO company services',
  },
  {
    value: 'management-consultants' as const,
    label: 'TME Management Consultants',
    description: 'TME Management Consultants services',
  }
];

export const CompanySelectionSection: React.FC<CompanySelectionSectionProps> = ({
  register,
  companyType,
  onCompanyTypeChange,
}) => {
  return (
    <FormSection
      title="Offer by:"
      description="Select the company providing these services"
      icon={Building2}
      iconColor="text-purple-600"
    >
      <RadioGroup
        value={companyType}
        onValueChange={(value) => onCompanyTypeChange(value as CompanyType)}
        className="space-y-4"
      >
        {COMPANY_OPTIONS.map((option) => {
          const isSelected = companyType === option.value;
          const itemId = `company-${option.value}`;
          
          return (
            <div key={option.value} className="relative">
              <Label
                htmlFor={itemId}
                className={cn(
                  "cursor-pointer block w-full",
                  "bg-gray-50 border border-gray-300 rounded-xl p-6",
                  "transition-all duration-200",
                  isSelected 
                    ? 'ring-2 ring-purple-500 ring-opacity-50 bg-purple-50 border-purple-300' 
                    : 'hover:shadow-md hover:border-gray-400'
                )}
              >
                <div className="flex items-center">
                  <div className="flex items-center mr-3">
                    <RadioGroupItem
                      value={option.value}
                      id={itemId}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-4 h-4 rounded-full transition-all duration-200",
                      isSelected ? 'bg-purple-500' : 'bg-gray-300'
                    )} />
                  </div>
                  <div className="flex-1">
                    <span className="text-lg font-semibold text-gray-900">
                      {option.label}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex items-center">
                      <Check className="w-5 h-5 text-purple-600" />
                    </div>
                  )}
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
      
      {/* Hidden input for React Hook Form registration */}
      <input
        type="hidden"
        {...register('companyType')}
        value={companyType}
      />
    </FormSection>
  );
}; 