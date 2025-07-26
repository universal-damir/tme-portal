'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { FormSection } from '../../cost-overview/ui/FormSection';

interface CompanySelectionSectionProps {
  /**
   * Form registration function from react-hook-form
   */
  register: any;
}

export const CompanySelectionSection: React.FC<CompanySelectionSectionProps> = ({
  register,
}) => {
  return (
    <>
      {/* Hidden input to maintain form logic - UI commented out for now */}
      <input
        type="hidden"
        {...register('companyType')}
        value="management-consultants"
      />
      
      {/* TODO: Uncomment when ready to add more company options
      <FormSection
        title="Offer by:"
        description="Company issuing this Golden Visa offer"
        icon={Building2}
        iconColor="text-blue-600"
      >
        <div className="flex items-center">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 w-full">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-lg font-semibold text-blue-900">TME Management Consultants</span>
            </div>
            <p className="text-sm text-blue-700 mt-1 ml-6">Default company for Golden Visa offers</p>
          </div>
        </div>
      </FormSection>
      */}
    </>
  );
}; 