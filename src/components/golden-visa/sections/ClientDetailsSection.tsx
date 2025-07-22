'use client';

import React from 'react';
import { User } from 'lucide-react';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { GoldenVisaData } from '@/types/golden-visa';
import { FormDatePicker } from '@/components/ui/form-date-picker';

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
  register: any;
  
  /**
   * Form errors object
   */
  errors: any;
  
  /**
   * Current form data for reactive display
   */
  data: GoldenVisaData;
  
  /**
   * Handler for secondary currency change
   */
  onSecondaryCurrencyChange: (currency: 'EUR' | 'USD' | 'GBP') => void;
  
  /**
   * setValue function from react-hook-form
   */
  setValue: any;
}

export const ClientDetailsSection: React.FC<ClientDetailsSectionProps> = ({
  register,
  errors,
  data,
  onSecondaryCurrencyChange,
  setValue,
}) => {
  return (
    <FormSection
      title="Client Details"
      description="Basic client information"
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

        {/* Date Field */}
        <FormDatePicker
          register={register}
          name="date"
          value={data.date}
          onChange={(value: string) => setValue('date', value)}
          label="Date"
          placeholder="Select date"
          required={true}
          error={errors.date?.message}
          captionLayout="dropdown"
        />

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
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
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