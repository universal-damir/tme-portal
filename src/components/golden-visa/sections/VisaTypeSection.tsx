'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { GoldenVisaType } from '@/types/golden-visa';

/**
 * Available visa types with their display labels
 */
const VISA_TYPE_OPTIONS = [
  {
    value: 'property-investment',
    label: 'Property Investment Golden Visa',
  },
  {
    value: 'time-deposit',
    label: 'Time Deposit Golden Visa',
  },
  {
    value: 'skilled-employee',
    label: 'Skilled Employee Golden Visa',
  },
] as const;

interface VisaTypeSectionProps {
  /**
   * Form registration function from react-hook-form
   */
  register: any;
  
  /**
   * Form errors object
   */
  errors: any;
  
  /**
   * Handler for visa type change
   */
  onVisaTypeChange: (visaType: GoldenVisaType) => void;
  
  /**
   * Whether primary visa is required
   */
  primaryVisaRequired: boolean;
  
  /**
   * Handler for primary visa requirement change
   */
  onPrimaryVisaChange: (required: boolean) => void;
}

export const VisaTypeSection: React.FC<VisaTypeSectionProps> = ({
  register,
  errors,
  onVisaTypeChange,
  primaryVisaRequired,
  onPrimaryVisaChange,
}) => {
  return (
    <FormSection
      title="Golden Visa Type"
      description="Select the type of Golden Visa application"
      icon={FileText}
      iconColor="text-green-600"
    >
      <div className="space-y-6">
        {/* Primary Visa Selection */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('primaryVisaRequired')}
                checked={primaryVisaRequired}
                onChange={(e) => onPrimaryVisaChange(e.target.checked)}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
              />
              <span className="ml-2 text-sm font-semibold text-gray-700">Include Primary Visa Holder</span>
            </div>
          </div>
          
          {primaryVisaRequired && (
            <div className="space-y-4">
              {VISA_TYPE_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    {...register('visaType')}
                    value={option.value}
                    onChange={() => onVisaTypeChange(option.value)}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      {errors.visaType && (
        <p className="text-red-500 text-sm mt-2">{errors.visaType.message}</p>
      )}
    </FormSection>
  );
}; 