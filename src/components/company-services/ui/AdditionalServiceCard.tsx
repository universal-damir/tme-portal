'use client';

import React from 'react';
import { ADDITIONAL_SERVICES, SECTION_COLORS } from '../utils/accountingServiceConfig';
import { UseFormRegister } from 'react-hook-form';
import { CompanyServicesData } from '@/types/company-services';

interface AdditionalServiceCardProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<CompanyServicesData>;
}

export const AdditionalServiceCard: React.FC<AdditionalServiceCardProps> = ({
  register,
}) => {
  const colors = SECTION_COLORS.additionalServices;

  return (
    <div className={`${colors.bg} rounded-xl p-6 border ${colors.border}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <div className={`w-2 h-2 ${colors.dotColor} rounded-full mr-2`}></div>
        Additional Services
      </h3>
      
      <div className="space-y-4">
        {ADDITIONAL_SERVICES.map((service) => (
          <div key={service.key}>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register(`accountingServices.${service.key}`)}
                className={`w-4 h-4 ${colors.textColor} bg-gray-100 border-gray-300 rounded ${colors.ringColor} focus:ring-2`}
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                {service.label}
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              {service.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}; 