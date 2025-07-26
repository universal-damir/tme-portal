'use client';

import React from 'react';
import { User, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FormSection
        title="Client Details"
        description="Basic client information"
        icon={User}
        iconColor="text-blue-600"
      >
        <div className="space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Name Fields and Date in one row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                First Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                {...register('firstName')}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
                placeholder="Enter first name"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Last Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                {...register('lastName')}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
                placeholder="Enter last name"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Date *
              </label>
              <div className="relative date-picker-override">
                <FormDatePicker
                  register={register}
                  name="date"
                  value={data.date}
                  onChange={(value: string) => setValue('date', value)}
                  label=""
                  placeholder="dd.mm.yyyy"
                  required={true}
                  error={errors.date?.message}
                  captionLayout="dropdown"
                />
              </div>
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date?.message}</p>
              )}
            </div>
          </div>

          {/* Currency and Exchange Rate in one row - very compact */}
          <div className="flex items-start gap-2">
            {/* Secondary Currency Selection - Inline */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Secondary Currency *
              </label>
              <div className="flex gap-2">
                {SECONDARY_CURRENCIES.map((currency) => (
                  <motion.label 
                    key={currency.value} 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center space-x-2 cursor-pointer px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors duration-150 border border-gray-200 h-[42px]"
                  >
                    <div className="relative">
                      <input
                        type="radio"
                        {...register('secondaryCurrency')}
                        value={currency.value}
                        onChange={() => onSecondaryCurrencyChange(currency.value)}
                        className="sr-only"
                      />
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-gray-300 transition-all duration-200 flex items-center justify-center"
                        style={{ 
                          borderColor: data.secondaryCurrency === currency.value ? '#243F7B' : '#d1d5db' 
                        }}
                      >
                        {data.secondaryCurrency === currency.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: '#243F7B' }}
                          />
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-700">{currency.label}</span>
                  </motion.label>
                ))}
              </div>
              {errors.secondaryCurrency && (
                <p className="text-red-500 text-xs mt-1">{errors.secondaryCurrency.message}</p>
              )}
            </div>

            {/* Exchange Rate Input - Much narrower and closer */}
            <div className="w-28 ml-2">
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Rate *
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="number"
                step="0.01"
                {...register('exchangeRate', { valueAsNumber: true })}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 text-center"
                placeholder="3.67"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                {data.exchangeRate || '3.67'} AED = 1 {data.secondaryCurrency || 'EUR'}
              </p>
              {errors.exchangeRate && (
                <p className="text-red-500 text-xs mt-1">{errors.exchangeRate.message}</p>
              )}
            </div>
          </div>
        </div>
        
      </FormSection>
    </motion.div>
  );
}; 