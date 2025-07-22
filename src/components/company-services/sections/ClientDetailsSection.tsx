'use client';

import React, { useEffect } from 'react';
import { User } from 'lucide-react';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { CompanyServicesData } from '@/types/company-services';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';

/**
 * Available secondary currencies
 */
const SECONDARY_CURRENCIES = [
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
] as const;

interface ClientDetailsSectionProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<CompanyServicesData>;
  
  /**
   * Form errors object
   */
  errors: FieldErrors<CompanyServicesData>;
  
  /**
   * Current form data for reactive display
   */
  data: CompanyServicesData;
  
  /**
   * Handler for secondary currency change
   */
  onSecondaryCurrencyChange: (currency: 'EUR' | 'USD' | 'GBP') => void;
  
  /**
   * Handler for setting form values
   */
  setValue: UseFormSetValue<CompanyServicesData>;
}

export const ClientDetailsSection: React.FC<ClientDetailsSectionProps> = ({
  register,
  errors,
  data,
  onSecondaryCurrencyChange,
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
      description="Basic client information for company services"
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

        {/* Secondary Currency Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Secondary Currency *
          </label>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {SECONDARY_CURRENCIES.map((currency) => (
              <label key={currency.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  {...register('secondaryCurrency')}
                  value={currency.value}
                  onChange={() => onSecondaryCurrencyChange(currency.value)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">{currency.label}</span>
              </label>
            ))}
          </div>
          {errors.secondaryCurrency && (
            <p className="text-red-500 text-sm mt-1">{errors.secondaryCurrency.message}</p>
          )}
        </div>

        {/* Exchange Rate Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Exchange Rate (AED to {data.secondaryCurrency || 'Selected Currency'}) *
          </label>
          <input
            type="number"
            step="0.01"
            {...register('exchangeRate', { valueAsNumber: true })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="3.67"
          />
          <p className="text-xs text-gray-500 mt-2">
            {data.exchangeRate || '3.67'} AED = 1 {data.secondaryCurrency || 'Selected Currency'}
          </p>
          {errors.exchangeRate && (
            <p className="text-red-500 text-sm mt-1">{errors.exchangeRate.message}</p>
          )}
        </div>
      </div>
    </FormSection>
  );
}; 