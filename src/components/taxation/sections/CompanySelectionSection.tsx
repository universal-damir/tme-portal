'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { CompanyType, TaxationData } from '@/types/taxation';
import { UseFormRegister } from 'react-hook-form';

interface CompanySelectionSectionProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<TaxationData>;
  
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
    label: 'TME Services FZCO',
    description: 'FZCO Company Details',
  },
  {
    value: 'management-consultants' as const,
    label: 'TME Management Consultants LLC',
    description: 'MGT Company Details',
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
      description="Select the company providing these taxation services"
      icon={Building2}
      iconColor="text-purple-600"
    >
      <div className="flex flex-col gap-4">
        {COMPANY_OPTIONS.map((option) => {
          const isSelected = companyType === option.value;
          
          return (
            <div key={option.value}>
              <label className="cursor-pointer block">
              <input
                type="radio"
                {...register('companyType')}
                value={option.value}
                onChange={() => onCompanyTypeChange(option.value)}
                className="sr-only"
              />
              <div className={`
                bg-gray-50 border border-gray-300 rounded-xl p-6 w-full
                transition-all duration-200
                ${isSelected 
                  ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 border-blue-300' 
                  : 'hover:shadow-md hover:border-gray-400'
                }
              `}>
                <div className="flex items-center">
                  <div className={`
                    w-4 h-4 rounded-full mr-3 transition-all duration-200
                    ${isSelected ? 'bg-blue-500' : 'bg-gray-300'}
                  `} />
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
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              </label>
            </div>
          );
        })}
      </div>
    </FormSection>
  );
}; 