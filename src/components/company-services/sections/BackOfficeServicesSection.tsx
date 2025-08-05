'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { CompanyServicesData } from '@/types/company-services';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';

// Currency formatting utilities (same as used in useFormattedInputs)
const formatNumberWithSeparators = (value: string): string => {
  // Remove all non-digit characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  // Split by decimal point
  const parts = cleaned.split('.');
  // Add thousand separators to the integer part
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  // Join back with decimal point if there was one
  return parts.length > 1 ? parts.join('.') : parts[0];
};

const parseFormattedNumber = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  const cleaned = value.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// Add custom styles to hide number input spinners
const hideSpinnersStyle = `
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
`;

interface BackOfficeServicesSectionProps {
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
   * Handler for setting form values
   */
  setValue: UseFormSetValue<CompanyServicesData>;
  
  /**
   * Current watched form data
   */
  watchedData: CompanyServicesData;
}

// Team size configurations with pricing tiers
const TEAM_CONFIGURATIONS = {
  micro: {
    label: 'Micro Team',
    tiers: [
      { staffRange: '1–2 staff', monthlyFee: 500 },
      { staffRange: '3–4 staff', monthlyFee: 960 },
      { staffRange: '5–6 staff', monthlyFee: 1374 },
    ]
  },
  small: {
    label: 'Small Team',
    tiers: [
      { staffRange: '1–3 staff', monthlyFee: 750 },
      { staffRange: '4–6 staff', monthlyFee: 1440 },
      { staffRange: '7–10 staff', monthlyFee: 2280 },
    ]
  },
  medium: {
    label: 'Medium Team',
    tiers: [
      { staffRange: '1–4 staff', monthlyFee: 980 },
      { staffRange: '5–6 staff', monthlyFee: 1440 },
      { staffRange: '7–8 staff', monthlyFee: 1860 },
    ]
  },
  large: {
    label: 'Large Team',
    tiers: [
      { staffRange: '1-5 staff', monthlyFee: 1250 },
      { staffRange: '6-10 staff', monthlyFee: 2400 },
      { staffRange: '11-15 staff', monthlyFee: 3412 },
      { staffRange: '16-20 staff', monthlyFee: 4273 },
    ]
  },
};

export const BackOfficeServicesSection: React.FC<BackOfficeServicesSectionProps> = ({
  register,
  errors,
  data,
  setValue,
  watchedData,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Reset back-office fields when main checkbox is unchecked
  useEffect(() => {
    if (!watchedData.backOfficeServices?.enabled) {
      setValue('backOfficeServices.teamSize', '');
    }
  }, [watchedData.backOfficeServices?.enabled, setValue]);

  // Get current team configuration
  const currentTeamConfig = useMemo(() => {
    const teamSize = watchedData.backOfficeServices?.teamSize;
    if (teamSize && TEAM_CONFIGURATIONS[teamSize as keyof typeof TEAM_CONFIGURATIONS]) {
      return TEAM_CONFIGURATIONS[teamSize as keyof typeof TEAM_CONFIGURATIONS];
    }
    return null;
  }, [watchedData.backOfficeServices?.teamSize]);

  // Calculate secondary currency values
  const getSecondaryCurrencyValue = (aedValue: number) => {
    const exchangeRate = watchedData.exchangeRate || 3.67;
    return Math.round(aedValue / exchangeRate);
  };

  const secondaryCurrencyCode = watchedData.secondaryCurrency || 'USD';

  return (
    <>
      <style>{hideSpinnersStyle}</style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
      <FormSection
        title="Back-Office (PRO) Services"
        description="Comprehensive administrative support for government-related processes"
        icon={Users}
        iconColor="text-blue-600"
      >
        <div className="space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Main Back-Office Services Checkbox */}
          <motion.label
            whileHover={{ scale: 1.01 }}
            className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="relative">
              <input
                type="checkbox"
                {...register('backOfficeServices.enabled')}
                checked={watchedData.backOfficeServices?.enabled || false}
                className="sr-only"
              />
              <div 
                className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                style={{ 
                  borderColor: watchedData.backOfficeServices?.enabled ? '#243F7B' : '#d1d5db',
                  backgroundColor: watchedData.backOfficeServices?.enabled ? '#243F7B' : 'white'
                }}
              >
                {watchedData.backOfficeServices?.enabled && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-3 h-3 text-white flex items-center justify-center"
                  >
                    ✓
                  </motion.div>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium" style={{ color: '#243F7B' }}>
                Include Back-Office (PRO) Services
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                Comprehensive administrative support for government-related processes
              </p>
            </div>
          </motion.label>

          {/* Back-Office Options - Show only if enabled */}
          {watchedData.backOfficeServices?.enabled && (
            <div className="space-y-4 mt-4">
              {/* Combined Configuration */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-base font-semibold mb-4" style={{ color: '#243F7B' }}>
                  Back-Office Configuration
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Team Size Selection */}
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                      Select Team Size
                    </label>
                    <div className="relative">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] flex items-center justify-between bg-white"
                        onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      >
                        <span className="text-gray-700">
                          {watchedData.backOfficeServices?.teamSize 
                            ? (() => {
                                const teamSize = watchedData.backOfficeServices.teamSize;
                                if (teamSize === 'micro') return '1-2 | 3-4 | 5-6 | Staff';
                                if (teamSize === 'small') return '1-3 | 4-6 | 7-10 | Staff';
                                if (teamSize === 'medium') return '1-4 | 5-6 | 7-8 | Staff';
                                if (teamSize === 'large') return '1-5 | 6-10 | 11-15 | 16-20 | Staff';
                                if (teamSize === 'custom') return 'Custom';
                                return '';
                              })()
                            : 'Select team size...'}
                        </span>
                        <ChevronDown 
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                        />
                      </motion.button>

                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
                        >
                          {Object.entries(TEAM_CONFIGURATIONS).map(([key, config]) => {
                            const displayText = key === 'micro' ? '1-2 | 3-4 | 5-6 | Staff' :
                                              key === 'small' ? '1-3 | 4-6 | 7-10 | Staff' :
                                              key === 'medium' ? '1-4 | 5-6 | 7-8 | Staff' :
                                              '1-5 | 6-10 | 11-15 | 16-20 | Staff';
                            
                            return (
                              <motion.button
                                key={key}
                                type="button"
                                whileHover={{ backgroundColor: '#f3f4f6' }}
                                onClick={() => {
                                  setValue('backOfficeServices.teamSize', key as 'micro' | 'small' | 'medium' | 'large');
                                  setIsDropdownOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-150"
                              >
                                {displayText}
                              </motion.button>
                            );
                          })}
                          
                          {/* Custom Option */}
                          <motion.button
                            type="button"
                            whileHover={{ backgroundColor: '#f3f4f6' }}
                            onClick={() => {
                              setValue('backOfficeServices.teamSize', 'custom');
                              setIsDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 last:rounded-b-lg transition-colors duration-150"
                          >
                            Custom
                          </motion.button>
                        </motion.div>
                      )}
                      
                      {/* Hidden input for React Hook Form registration */}
                      <input
                        type="hidden"
                        {...register('backOfficeServices.teamSize')}
                        value={watchedData.backOfficeServices?.teamSize || ''}
                      />
                    </div>
                    {errors.backOfficeServices?.teamSize && (
                      <p className="text-red-500 text-xs mt-1" role="alert">
                        {errors.backOfficeServices.teamSize.message}
                      </p>
                    )}
                  </div>

                  {/* Pricing Display */}
                  {currentTeamConfig && (
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                        Monthly Pricing
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {currentTeamConfig.tiers.map((tier, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              {tier.staffRange}
                            </span>
                            <div className="text-right">
                              <div className="text-sm font-bold" style={{ color: '#243F7B' }}>
                                AED {tier.monthlyFee.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {secondaryCurrencyCode} {getSecondaryCurrencyValue(tier.monthlyFee).toLocaleString()}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Pricing Configuration */}
                  {watchedData.backOfficeServices?.teamSize === 'custom' && (
                    <div className="flex flex-col">
                      {/* Column Headers with Custom Pricing Tiers centered above Staff Range */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1 flex flex-col items-center">
                          <label className="text-sm font-medium mb-1" style={{ color: '#243F7B' }}>Custom Pricing Tiers</label>
                          <label className="text-xs text-gray-500 font-medium">Staff Range</label>
                        </div>
                        <div className="flex-1 flex justify-center">
                          <label className="text-xs text-gray-500 font-medium">Monthly Fee</label>
                        </div>
                      </div>
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2 max-h-48 overflow-y-auto"
                      >
                      
                      {/* Custom Tier 1 */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center justify-center gap-2">
                          <input
                            type="number"
                            {...register('backOfficeServices.customTier1From', { valueAsNumber: true })}
                            placeholder="20"
                            min="1"
                            className="w-20 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] text-center"
                            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            style={{ MozAppearance: 'textfield' }}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                          <span className="text-gray-500">–</span>
                          <input
                            type="number"
                            {...register('backOfficeServices.customTier1To', { 
                              valueAsNumber: true,
                              onChange: (e) => {
                                const value = parseInt(e.target.value);
                                if (!isNaN(value)) {
                                  setValue('backOfficeServices.customTier2From', value + 1);
                                }
                              }
                            })}
                            placeholder="25"
                            min="1"
                            className="w-20 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] text-center"
                            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            style={{ MozAppearance: 'textfield' }}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">AED</span>
                            <input
                              type="text"
                              placeholder="2,500"
                              className="w-full pl-12 pr-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                              onChange={(e) => {
                                const value = e.target.value;
                                const formatted = formatNumberWithSeparators(value);
                                e.target.value = formatted;
                                const parsed = parseFormattedNumber(formatted);
                                setValue('backOfficeServices.customTier1Fee', parsed);
                              }}
                            />
                            <input
                              type="hidden"
                              {...register('backOfficeServices.customTier1Fee')}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Custom Tier 2 */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center justify-center gap-2">
                          <input
                            type="number"
                            {...register('backOfficeServices.customTier2From', { valueAsNumber: true })}
                            placeholder="26"
                            min="1"
                            className="w-20 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] text-center bg-gray-50"
                            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            style={{ MozAppearance: 'textfield' }}
                            onWheel={(e) => e.currentTarget.blur()}
                            readOnly
                          />
                          <span className="text-gray-500">–</span>
                          <input
                            type="number"
                            {...register('backOfficeServices.customTier2To', { 
                              valueAsNumber: true,
                              onChange: (e) => {
                                const value = parseInt(e.target.value);
                                if (!isNaN(value)) {
                                  setValue('backOfficeServices.customTier3From', value + 1);
                                }
                              }
                            })}
                            placeholder="30"
                            min="1"
                            className="w-20 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] text-center"
                            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            style={{ MozAppearance: 'textfield' }}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">AED</span>
                            <input
                              type="text"
                              placeholder="3,500"
                              className="w-full pl-12 pr-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                              onChange={(e) => {
                                const value = e.target.value;
                                const formatted = formatNumberWithSeparators(value);
                                e.target.value = formatted;
                                const parsed = parseFormattedNumber(formatted);
                                setValue('backOfficeServices.customTier2Fee', parsed);
                              }}
                            />
                            <input
                              type="hidden"
                              {...register('backOfficeServices.customTier2Fee')}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Custom Tier 3 */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center justify-center gap-2">
                          <input
                            type="number"
                            {...register('backOfficeServices.customTier3From', { valueAsNumber: true })}
                            placeholder="31"
                            min="1"
                            className="w-20 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] text-center bg-gray-50"
                            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            style={{ MozAppearance: 'textfield' }}
                            onWheel={(e) => e.currentTarget.blur()}
                            readOnly
                          />
                          <span className="text-gray-500">–</span>
                          <input
                            type="number"
                            {...register('backOfficeServices.customTier3To', { valueAsNumber: true })}
                            placeholder="35"
                            min="1"
                            className="w-20 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] text-center"
                            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            style={{ MozAppearance: 'textfield' }}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">AED</span>
                            <input
                              type="text"
                              placeholder="5,000"
                              className="w-full pl-12 pr-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                              onChange={(e) => {
                                const value = e.target.value;
                                const formatted = formatNumberWithSeparators(value);
                                e.target.value = formatted;
                                const parsed = parseFormattedNumber(formatted);
                                setValue('backOfficeServices.customTier3Fee', parsed);
                              }}
                            />
                            <input
                              type="hidden"
                              {...register('backOfficeServices.customTier3Fee')}
                            />
                          </div>
                        </div>
                      </div>
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </FormSection>
      </motion.div>
    </>
  );
}; 