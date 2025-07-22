'use client';

import React from 'react';
import { ANNUAL_SERVICES, SECTION_COLORS } from '../utils/accountingServiceConfig';
import { NumberInputField } from '../../portal/tabs/NumberInputField';
import { CompanyServicesData } from '@/types/company-services';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';

interface AnnualServiceCardProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<CompanyServicesData>;
  
  /**
   * Form errors object
   */
  errors: FieldErrors<CompanyServicesData>;
  
  /**
   * Handler for setting form values
   */
  setValue: UseFormSetValue<CompanyServicesData>;
  
  /**
   * Current watched form data
   */
  watchedData: CompanyServicesData;
}

export const AnnualServiceCard: React.FC<AnnualServiceCardProps> = ({
  register,
  errors,
  setValue,
  watchedData,
}) => {
  const colors = SECTION_COLORS.annualServices;

  return (
    <div className={`${colors.bg} rounded-xl p-6 border ${colors.border}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <div className={`w-2 h-2 ${colors.dotColor} rounded-full mr-2`}></div>
        Annual Services
      </h3>
      
      <div className="space-y-4">
        {ANNUAL_SERVICES.map((service) => (
          <div key={service.key}>
            <NumberInputField
              label={service.label}
              value={watchedData.accountingServices?.[service.key as keyof typeof watchedData.accountingServices] as number || 0}
              onChange={(value) => setValue(`accountingServices.${service.key}`, value)}
              placeholder={service.placeholder}
              className={`w-full max-w-md ${colors.ringColor}`}
              error={errors.accountingServices?.[service.key]?.message}
              min={0}
            />
            <p className="text-xs text-gray-500 mt-1">
              {service.description}
            </p>
          </div>
        ))}

        {/* Local Auditor Fee */}
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('accountingServices.localAuditorFee')}
              className={`w-4 h-4 ${colors.textColor} bg-gray-100 border-gray-300 rounded ${colors.ringColor} focus:ring-2`}
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Local Auditor Fee
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            The audit fee of the local auditor will be, according to our experience, 
            between AED 6,420 and AED 8,560. Upon request, we suggest an auditor 
            with whom we have sufficient and excellent experience with, 
            and who knows our business and work.
          </p>
        </div>
      </div>
    </div>
  );
}; 