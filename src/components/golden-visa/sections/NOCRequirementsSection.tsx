'use client';

import React from 'react';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { Shield } from 'lucide-react';
import { GoldenVisaData } from '@/types/golden-visa';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { NumberInputField } from '../../portal/tabs/NumberInputField';
import { FREEZONE_OPTIONS } from '../utils/goldenVisaConfig';

interface NOCRequirementsSectionProps {
  data: GoldenVisaData;
  register: UseFormRegister<GoldenVisaData>;
  setValue: UseFormSetValue<GoldenVisaData>;
  errors: FieldErrors<GoldenVisaData>;
}

export const NOCRequirementsSection: React.FC<NOCRequirementsSectionProps> = ({
  data,
  register,
  setValue,
  errors,
}) => {
  return (
    <FormSection
      title="NOC Requirements"
      description="No Objection Certificate requirements for skilled employee visa"
      icon={Shield}
      iconColor="text-orange-600"
    >
      <div className="space-y-6">
        {/* NOC Checkbox */}
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('requiresNOC')}
              className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Requires NOC (No Objection Certificate)
            </span>
          </label>
        </div>

        {/* Freezone Dropdown - Show when NOC is required */}
        {data.requiresNOC && (
          <div className="space-y-4">
            <div className="max-w-md">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Freezone *
              </label>
              <select
                {...register('selectedFreezone')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              >
                <option value="">Select freezone for NOC</option>
                {FREEZONE_OPTIONS.map((freezone) => (
                  <option key={freezone.value} value={freezone.value}>
                    {freezone.label}
                  </option>
                ))}
              </select>
              {errors.selectedFreezone && (
                <p className="text-red-500 text-sm mt-1">{errors.selectedFreezone.message}</p>
              )}
            </div>

            {/* Dynamic Freezone NOC Fee Field */}
            {data.selectedFreezone && (
              <div className="max-w-md">
                <NumberInputField
                  label={`${FREEZONE_OPTIONS.find(f => f.value === data.selectedFreezone)?.label || 'Freezone'} NOC (AED)`}
                  value={data.freezoneNocFee}
                  onChange={(value) => setValue('freezoneNocFee', value)}
                  placeholder="2,020"
                  required
                  error={errors.freezoneNocFee?.message}
                  className="focus:ring-orange-500"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </FormSection>
  );
}; 