'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { FileCheck } from 'lucide-react';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { TaxationData, CompanyType, TaxPeriodDateRange } from '@/types/taxation';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { CompanySelectionSection } from './CompanySelectionSection';
import { DateRangePicker } from '../ui/DateRangePicker';

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
  
  // Limit decimal part to 2 digits
  if (parts.length === 2) {
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
      // Format with proper decimal handling
      setFormattedRevenue(formatNumberWithSeparators(revenue.toFixed(2)));
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
    <FormSection
      title="CIT Disclaimer"
      description="Corporate Income Tax disclaimer and related information"
      icon={FileCheck}
      iconColor="text-green-600"
    >
      <div className="space-y-6">
        {/* Main CIT Disclaimer Checkbox */}
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('citDisclaimer.enabled')}
              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Include CIT Disclaimer
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Select to include Corporate Income Tax disclaimer in the offer
          </p>
        </div>

        {/* CIT Disclaimer Options - Show only if enabled */}
        {data.citDisclaimer?.enabled && (
          <div className="space-y-8 pl-6 border-l-2 border-green-200">
            {/* Company Selection (Offer by) */}
            <CompanySelectionSection
              register={register}
              companyType={data.companyType}
              onCompanyTypeChange={onCompanyTypeChange}
            />

            {/* Tax Period Date Range Selector */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Tax Period
              </h3>
              
              <DateRangePicker
                value={data.citDisclaimer?.taxPeriodRange || { fromDate: '', toDate: '' }}
                onChange={handleTaxPeriodRangeChange}
                label="Tax Period Range"
                description="Select the relevant tax period range for this CIT disclaimer"
                required={true}
                focusColor="focus:ring-green-500"
                error={errors.citDisclaimer?.taxPeriodRange?.fromDate?.message || errors.citDisclaimer?.taxPeriodRange?.toDate?.message}
              />
            </div>

            {/* Generated Revenue Section */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Revenue Information
              </h3>
              
              <div className="space-y-4">
                {/* Generated Revenue Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Generated Revenue *
                  </label>

                  {/* Revenue Input Field - Disabled when "No revenue" is checked */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-sm text-gray-500">AED</span>
                    </div>
                    <input
                      type="text"
                      value={formattedRevenue}
                      onChange={handleGeneratedRevenueChange}
                      disabled={data.citDisclaimer?.noRevenueGenerated || false}
                      className={`w-full max-w-md pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                        data.citDisclaimer?.noRevenueGenerated 
                          ? 'bg-gray-100 cursor-not-allowed opacity-50' 
                          : 'bg-gray-50 focus:bg-white'
                      }`}
                      placeholder={data.citDisclaimer?.noRevenueGenerated ? 'No revenue generated' : 'Enter Generated Revenue'}
                    />
                  </div>
                  
                  {/* No Revenue Generated Checkbox */}
                  <div className="mt-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.citDisclaimer?.noRevenueGenerated || false}
                        onChange={handleNoRevenueChange}
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        No revenue generated during this period
                      </span>
                    </label>
                  </div>
                  
                  {errors.citDisclaimer?.generatedRevenue && (
                    <p className="text-red-500 text-sm mt-1">{errors.citDisclaimer.generatedRevenue.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FormSection>
  );
}; 