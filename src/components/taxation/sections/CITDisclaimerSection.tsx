'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { TaxationData, CompanyType, TaxPeriodDateRange } from '@/types/taxation';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { CompanySelectionSection } from './CompanySelectionSection';
import { CustomDateRangePicker } from '../ui/CustomDateRangePicker';

interface CITDisclaimerSectionProps {
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
  
  /**
   * Handler for company type change
   */
  onCompanyTypeChange: (companyType: CompanyType) => void;
}

// Helper functions for number formatting (updated to support decimals)
const formatNumberWithSeparators = (value: string): string => {
  // Remove all non-digit characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  
  if (!cleaned) return '';
  
  // Split by decimal point to handle integer and decimal parts separately
  const parts = cleaned.split('.');
  
  // If there are more than 2 parts (multiple decimal points), keep only the first two
  if (parts.length > 2) {
    parts.splice(2);
  }
  
  // Add thousands separators to the integer part
  if (parts[0]) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  // Handle decimal part
  if (parts.length === 2) {
    // Limit decimal part to 2 digits but don't auto-add .00
    parts[1] = parts[1].slice(0, 2);
    return parts.join('.');
  }
  
  return parts[0] || '';
};

const parseFormattedNumber = (formattedValue: string): number => {
  if (!formattedValue || formattedValue.trim() === '') return 0;
  
  // Remove commas and parse as float to preserve decimals
  const cleaned = formattedValue.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  
  // Round to 2 decimal places to avoid floating point precision issues
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
};

export const CITDisclaimerSection: React.FC<CITDisclaimerSectionProps> = ({
  register,
  errors,
  data,
  setValue,
  onCompanyTypeChange,
}) => {
  const [formattedRevenue, setFormattedRevenue] = useState<string>('');

  // Update formatted revenue when prop value changes
  useEffect(() => {
    const revenue = data.citDisclaimer?.generatedRevenue;
    const noRevenue = data.citDisclaimer?.noRevenueGenerated;
    
    if (noRevenue) {
      // If "no revenue" is checked, keep input empty
      setFormattedRevenue('');
    } else if (revenue && revenue > 0) {
      // Format without forcing decimal places unless they exist
      const hasDecimals = revenue % 1 !== 0;
      const formatted = hasDecimals ? revenue.toFixed(2) : revenue.toString();
      setFormattedRevenue(formatNumberWithSeparators(formatted));
    } else {
      setFormattedRevenue('');
    }
  }, [data.citDisclaimer?.generatedRevenue, data.citDisclaimer?.noRevenueGenerated]);

  // Reset CIT Disclaimer fields when main checkbox is unchecked
  useEffect(() => {
    if (!data.citDisclaimer?.enabled) {
      setValue('citDisclaimer.taxPeriodRange', { fromDate: '', toDate: '' });
      setValue('citDisclaimer.generatedRevenue', 0);
      setValue('citDisclaimer.noRevenueGenerated', false);
      setFormattedRevenue('');
    }
  }, [data.citDisclaimer?.enabled, setValue]);

  // Handle tax period range change
  const handleTaxPeriodRangeChange = (range: TaxPeriodDateRange) => {
    setValue('citDisclaimer.taxPeriodRange', range);
  };

  // Handle generated revenue change
  const handleGeneratedRevenueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatNumberWithSeparators(value);
    const parsed = parseFormattedNumber(formatted);
    
    setFormattedRevenue(formatted);
    setValue('citDisclaimer.generatedRevenue', parsed);
  }, [setValue]);

  // Handle "No revenue generated" checkbox change
  const handleNoRevenueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setValue('citDisclaimer.noRevenueGenerated', isChecked);
    
    if (isChecked) {
      // If "no revenue" is checked, clear the revenue input and set to 0
      setValue('citDisclaimer.generatedRevenue', 0);
      setFormattedRevenue('');
    }
  }, [setValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FormSection
        title="CIT Disclaimer"
        description="Corporate Income Tax disclaimer and related information"
        icon={FileCheck}
        iconColor="text-green-600"
      >
        <div className="space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Main CIT Disclaimer Checkbox */}
          <div>
            <motion.label 
              whileHover={{ scale: 1.01 }}
              className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  {...register('citDisclaimer.enabled')}
                  className="sr-only"
                />
                <div 
                  className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                  style={{ 
                    borderColor: data.citDisclaimer?.enabled ? '#243F7B' : '#d1d5db',
                    backgroundColor: data.citDisclaimer?.enabled ? '#243F7B' : 'white'
                  }}
                >
                  {data.citDisclaimer?.enabled && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </div>
              <span className="ml-3 text-sm font-medium" style={{ color: '#243F7B' }}>
                Include CIT Disclaimer
              </span>
            </motion.label>
            <p className="text-xs text-gray-500 mt-1 ml-8">
              Select to include Corporate Income Tax disclaimer in the offer
            </p>
          </div>

          {/* CIT Disclaimer Options - Show only if enabled */}
          {data.citDisclaimer?.enabled && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 pl-6 border-l-2" 
              style={{ borderColor: '#243F7B' }}
            >
              {/* Company Selection (Offer by) */}
              <CompanySelectionSection
                register={register}
                companyType={data.companyType}
                onCompanyTypeChange={onCompanyTypeChange}
              />

              {/* Tax Period and Revenue Information in two columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Tax Period Date Range Selector */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="text-base font-semibold mb-3 flex items-center" style={{ color: '#243F7B' }}>
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#243F7B' }}></div>
                    Tax Period
                  </h3>
                  
                  <CustomDateRangePicker
                    value={data.citDisclaimer?.taxPeriodRange || { fromDate: '', toDate: '' }}
                    onChange={handleTaxPeriodRangeChange}
                    label="Tax Period Range"
                    description="Select the relevant tax period range for this CIT disclaimer"
                    required={true}
                    error={errors.citDisclaimer?.taxPeriodRange?.fromDate?.message || errors.citDisclaimer?.taxPeriodRange?.toDate?.message}
                  />
                </div>

                {/* Generated Revenue Section */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="text-base font-semibold mb-3 flex items-center" style={{ color: '#243F7B' }}>
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#243F7B' }}></div>
                    Revenue Information
                  </h3>
                  
                  <div className="space-y-3">
                  {/* Generated Revenue Input */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                      Generated Revenue *
                    </label>

                    {/* Revenue Input Field - Disabled when "No revenue" is checked */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-sm text-gray-500">AED</span>
                      </div>
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        type="text"
                        value={formattedRevenue}
                        onChange={handleGeneratedRevenueChange}
                        disabled={data.citDisclaimer?.noRevenueGenerated || false}
                        className={`w-full max-w-md pl-12 pr-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] ${
                          data.citDisclaimer?.noRevenueGenerated 
                            ? 'bg-gray-100 cursor-not-allowed opacity-50' 
                            : ''
                        }`}
                        placeholder={data.citDisclaimer?.noRevenueGenerated ? 'No revenue generated' : 'Enter Generated Revenue'}
                        onFocus={(e) => !data.citDisclaimer?.noRevenueGenerated && (e.target.style.borderColor = '#243F7B')}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                    
                    {/* No Revenue Generated Checkbox */}
                    <div className="mt-2">
                      <motion.label 
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={data.citDisclaimer?.noRevenueGenerated || false}
                            onChange={handleNoRevenueChange}
                            className="sr-only"
                          />
                          <div 
                            className="w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center"
                            style={{ 
                              borderColor: data.citDisclaimer?.noRevenueGenerated ? '#243F7B' : '#d1d5db',
                              backgroundColor: data.citDisclaimer?.noRevenueGenerated ? '#243F7B' : 'white'
                            }}
                          >
                            {data.citDisclaimer?.noRevenueGenerated && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </motion.div>
                            )}
                          </div>
                        </div>
                        <span className="ml-2 text-sm text-gray-700">
                          No revenue generated during this period
                        </span>
                      </motion.label>
                    </div>
                    
                    {errors.citDisclaimer?.generatedRevenue && (
                      <p className="text-red-500 text-xs mt-1">{errors.citDisclaimer.generatedRevenue.message}</p>
                    )}
                  </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </FormSection>
    </motion.div>
  );
}; 