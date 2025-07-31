'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
    label: 'TME FZCO',
    description: 'TME FZCO taxation services',
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FormSection
        title="Offer by:"
        description="Select the company providing these taxation services"
        icon={Building2}
        iconColor="text-blue-600"
      >
        <div className="space-y-3" style={{ fontFamily: 'Inter, sans-serif' }}>
          {COMPANY_OPTIONS.map((option) => {
            const isSelected = companyType === option.value;
            
            return (
              <motion.label
                key={option.value}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition-colors duration-150 bg-white border border-gray-200"
              >
                <div className="relative">
                  <input
                    type="radio"
                    {...register('companyType')}
                    value={option.value}
                    checked={isSelected}
                    onChange={() => onCompanyTypeChange(option.value)}
                    className="sr-only"
                  />
                  <div 
                    className="w-5 h-5 rounded-full border-2 border-gray-300 transition-all duration-200 flex items-center justify-center"
                    style={{ 
                      borderColor: isSelected ? '#243F7B' : '#d1d5db' 
                    }}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: '#243F7B' }}
                      />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-base font-medium text-gray-900">
                    {option.label}
                  </span>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {option.description}
                  </p>
                </div>
              </motion.label>
            );
          })}
        </div>
      </FormSection>
    </motion.div>
  );
}; 