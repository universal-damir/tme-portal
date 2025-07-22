'use client';

import React, { useEffect } from 'react';
import { User } from 'lucide-react';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { TaxationData } from '@/types/taxation';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';

interface ClientDetailsSectionProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<TaxationData>;
  
  /**
   * Form errors object
   */
  errors: FieldErrors<TaxationData>;
  
  /**
   * Current form data for reactive display
   */
  data: TaxationData;
  
  /**
   * Handler for setting form values
   */
  setValue: UseFormSetValue<TaxationData>;
}

export const ClientDetailsSection: React.FC<ClientDetailsSectionProps> = ({
  register,
  errors,
  data,
  setValue,
}) => {
  // Auto-fill short company name when company name changes
  useEffect(() => {
    if (data.companyName) {
      const words = data.companyName.trim().split(/\s+/);
      const shortName = words.slice(0, 2).join(' ');
      setValue('shortCompanyName', shortName);
    } else {
      setValue('shortCompanyName', '');
    }
  }, [data.companyName, setValue]);

  return (
    <FormSection
      title="Client Details"
      description="Basic client information for taxation services"
      icon={User}
      iconColor="text-blue-600"
    >
      <div className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              First Name
            </label>
            <input
              {...register('firstName')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="Enter first name"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Last Name
            </label>
            <input
              {...register('lastName')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="Enter last name"
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Company Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company Name
            </label>
            <input
              {...register('companyName')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="Enter company name"
            />
            {errors.companyName && (
              <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Short Company Name
            </label>
            <input
              {...register('shortCompanyName')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="Auto-filled from company name"
            />
            <p className="text-xs text-gray-500 mt-1">
              Automatically fills with first two words of company name
            </p>
            {errors.shortCompanyName && (
              <p className="text-red-500 text-sm mt-1">{errors.shortCompanyName.message}</p>
            )}
          </div>
        </div>

        {/* Date Field */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            {...register('date')}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
          />
          {errors.date && (
            <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
          )}
        </div>
      </div>
    </FormSection>
  );
}; 