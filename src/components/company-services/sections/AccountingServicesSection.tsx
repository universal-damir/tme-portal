'use client';

import React, { useState } from 'react';
import { Calculator, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { CompanyServicesData } from '@/types/company-services';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { 
  AdditionalServiceCard,
  AnnualServiceCard,
  CommercialServiceCard,
} from '../ui';
import { useAccountingPricing, useAccountingDefaults } from '../hooks';

interface AccountingServicesSectionProps {
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

export const AccountingServicesSection: React.FC<AccountingServicesSectionProps> = ({
  register,
  errors,
  setValue,
  watchedData,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Use custom hooks for pricing and defaults
  const { transactionTiers, combinedDisplayTiers } = useAccountingPricing(watchedData);
  useAccountingDefaults(watchedData, setValue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FormSection
        title="Accounting Services"
        description="Financial accounting with trial balance and P&L statements"
        icon={Calculator}
        iconColor="text-blue-600"
      >
        <div className="space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Main Accounting Services Checkbox */}
          <motion.label
            whileHover={{ scale: 1.01 }}
            className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="relative">
              <input
                type="checkbox"
                {...register('accountingServices.enabled')}
                checked={watchedData.accountingServices?.enabled || false}
                className="sr-only"
              />
              <div 
                className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                style={{ 
                  borderColor: watchedData.accountingServices?.enabled ? '#243F7B' : '#d1d5db',
                  backgroundColor: watchedData.accountingServices?.enabled ? '#243F7B' : 'white'
                }}
              >
                {watchedData.accountingServices?.enabled && (
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
                Include Accounting Services
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                Financial accounting services with trial balance and P&L statements
              </p>
            </div>
          </motion.label>

          {/* Accounting Options - Show only if enabled */}
          {watchedData.accountingServices?.enabled && (
            <div className="space-y-4 mt-4">
              {/* Combined Accounting Configuration */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-base font-semibold mb-4" style={{ color: '#243F7B' }}>
                  Accounting Configuration
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Service Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                      Service Type
                    </label>
                    <div className="flex flex-col gap-2">
                      {[
                        { value: 'monthly', label: 'Monthly Accounting' },
                        { value: 'quarterly-yearly', label: 'Quarterly/Yearly Accounting' }
                      ].map((option) => (
                        <motion.label
                          key={option.value}
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                        >
                          <div className="relative">
                            <input
                              type="radio"
                              {...register('accountingServices.serviceType')}
                              value={option.value}
                              checked={watchedData.accountingServices?.serviceType === option.value}
                              onChange={() => setValue('accountingServices.serviceType', option.value as 'monthly' | 'quarterly-yearly')}
                              className="sr-only"
                            />
                            <div 
                              className="w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
                              style={{ 
                                borderColor: watchedData.accountingServices?.serviceType === option.value ? '#243F7B' : '#d1d5db' 
                              }}
                            >
                              {watchedData.accountingServices?.serviceType === option.value && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: '#243F7B' }}
                                />
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </motion.label>
                      ))}
                    </div>
                    {errors.accountingServices?.serviceType && (
                      <p className="text-red-500 text-xs mt-1" role="alert">
                        {errors.accountingServices.serviceType.message}
                      </p>
                    )}
                  </div>

                  {/* Transaction Volume */}
                  {watchedData.accountingServices?.serviceType && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                        Transaction Volume per Month
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
                            {watchedData.accountingServices?.transactionTier 
                              ? `Up to ${watchedData.accountingServices.transactionTier} transactions/month`
                              : 'Select transaction volume...'}
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
                            {transactionTiers.map((tier) => (
                              <motion.button
                                key={tier}
                                type="button"
                                whileHover={{ backgroundColor: '#f3f4f6' }}
                                onClick={() => {
                                  setValue('accountingServices.transactionTier', tier);
                                  setIsDropdownOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors duration-150"
                              >
                                Up to {tier} transactions/month
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                        
                        {/* Hidden input for React Hook Form registration */}
                        <input
                          type="hidden"
                          {...register('accountingServices.transactionTier', { valueAsNumber: true })}
                          value={watchedData.accountingServices?.transactionTier || 0}
                        />
                      </div>
                      {errors.accountingServices?.transactionTier && (
                        <p className="text-red-500 text-xs mt-1" role="alert">
                          {errors.accountingServices.transactionTier.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pricing Display */}
                  {watchedData.accountingServices?.serviceType && combinedDisplayTiers.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                        {watchedData.accountingServices?.serviceType === 'monthly' ? 'Monthly Pricing' : 'Quarterly/Yearly Pricing'}
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {combinedDisplayTiers.map((tierData) => (
                          <div 
                            key={tierData.tier}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs"
                          >
                            <span className="text-gray-600">Up to {tierData.tier} trans/month</span>
                            {watchedData.accountingServices?.serviceType === 'monthly' ? (
                              <span className="font-semibold" style={{ color: '#243F7B' }}>
                                AED {'price' in tierData ? tierData.price?.toLocaleString() : 'N/A'}
                              </span>
                            ) : (
                              <div className="text-right">
                                {'pricing' in tierData && tierData.pricing && (
                                  <>
                                    <div className="font-semibold" style={{ color: '#243F7B' }}>
                                      Q: AED {tierData.pricing.quarterly.toLocaleString()}
                                    </div>
                                    <div className="font-semibold" style={{ color: '#243F7B' }}>
                                      Y: AED {tierData.pricing.yearly.toLocaleString()}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AdditionalServiceCard 
                  register={register} 
                  watchedData={watchedData}
                />

                <AnnualServiceCard 
                  register={register} 
                  errors={errors} 
                  setValue={setValue}
                  watchedData={watchedData}
                />
              </div>

              <CommercialServiceCard 
                register={register} 
                errors={errors} 
                watchedData={watchedData} 
                setValue={setValue}
              />
            </div>
          )}
        </div>
      </FormSection>
    </motion.div>
  );
}; 