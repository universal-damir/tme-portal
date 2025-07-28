'use client';

import React, { useEffect } from 'react';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { CompanyServicesData } from '@/types/company-services';
import { NumberInputField } from '../../portal/tabs/NumberInputField';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';

interface ComplianceServicesSectionProps {
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

// Compliance service configurations with pricing tiers
const PERIODIC_BANK_REVIEW_PRICING = {
  basic: 1630,
  standard: 3225,
  complex: 6450,
};

const UBO_REGISTER_UPDATES_PRICING = {
  basic: 830,
  standard: 1659,
  complex: 2487,
};

export const ComplianceServicesSection: React.FC<ComplianceServicesSectionProps> = ({
  register,
  errors,
  data,
  setValue,
  watchedData,
}) => {
  // Reset compliance fields when the main checkbox is unchecked
  useEffect(() => {
    if (!watchedData.complianceServices?.enabled) {
      setValue('complianceServices.periodicBankReviewType', '');
      setValue('complianceServices.periodicBankReviewFee', 0);
      setValue('complianceServices.uboRegisterUpdatesType', '');
      setValue('complianceServices.uboRegisterUpdatesFee', 0);
    }
  }, [watchedData.complianceServices?.enabled, setValue]);

  // Auto-populate Periodic Bank Review fee when type is selected
  useEffect(() => {
    const reviewType = watchedData.complianceServices?.periodicBankReviewType;
    if (reviewType && PERIODIC_BANK_REVIEW_PRICING[reviewType as keyof typeof PERIODIC_BANK_REVIEW_PRICING]) {
      const fee = PERIODIC_BANK_REVIEW_PRICING[reviewType as keyof typeof PERIODIC_BANK_REVIEW_PRICING];
      setValue('complianceServices.periodicBankReviewFee', fee);
    } else {
      setValue('complianceServices.periodicBankReviewFee', 0);
    }
  }, [watchedData.complianceServices?.periodicBankReviewType, setValue]);

  // Auto-populate UBO Register Updates fee when type is selected
  useEffect(() => {
    const updatesType = watchedData.complianceServices?.uboRegisterUpdatesType;
    if (updatesType && UBO_REGISTER_UPDATES_PRICING[updatesType as keyof typeof UBO_REGISTER_UPDATES_PRICING]) {
      const fee = UBO_REGISTER_UPDATES_PRICING[updatesType as keyof typeof UBO_REGISTER_UPDATES_PRICING];
      setValue('complianceServices.uboRegisterUpdatesFee', fee);
    } else {
      setValue('complianceServices.uboRegisterUpdatesFee', 0);
    }
  }, [watchedData.complianceServices?.uboRegisterUpdatesType, setValue]);

  // Calculate secondary currency values
  const getSecondaryCurrencyValue = (aedValue: number) => {
    const exchangeRate = watchedData.exchangeRate || 4;
    return Math.round(aedValue / exchangeRate);
  };

  const secondaryCurrencyCode = watchedData.secondaryCurrency || 'USD';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FormSection
        title="Compliance Services"
        description="Stay compliant with regulatory and banking requirements in the UAE"
        icon={Shield}
        iconColor="text-blue-600"
      >
        <div className="space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Main Compliance Services Checkbox */}
          <motion.label
            whileHover={{ scale: 1.01 }}
            className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="relative">
              <input
                type="checkbox"
                {...register('complianceServices.enabled')}
                checked={watchedData.complianceServices?.enabled || false}
                className="sr-only"
              />
              <div 
                className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                style={{ 
                  borderColor: watchedData.complianceServices?.enabled ? '#243F7B' : '#d1d5db',
                  backgroundColor: watchedData.complianceServices?.enabled ? '#243F7B' : 'white'
                }}
              >
                {watchedData.complianceServices?.enabled && (
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
                Include Compliance Services
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                Stay compliant with regulatory and banking requirements in the UAE
              </p>
            </div>
          </motion.label>

          {/* Compliance Options - Show only if enabled */}
          {watchedData.complianceServices?.enabled && (
            <div className="space-y-4 mt-4">
              {/* Compliance Configuration */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-base font-semibold mb-4" style={{ color: '#243F7B' }}>
                  Compliance Configuration
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Periodic Bank Review Section */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-3 rounded-lg border border-gray-100"
                  >
                    <h4 className="text-sm font-semibold mb-3" style={{ color: '#243F7B' }}>
                      Periodic Bank Review
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Service Complexity Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                          Service Complexity
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {[
                            { value: 'basic', label: 'Basic', price: PERIODIC_BANK_REVIEW_PRICING.basic },
                            { value: 'standard', label: 'Standard', price: PERIODIC_BANK_REVIEW_PRICING.standard },
                            { value: 'complex', label: 'Complex', price: PERIODIC_BANK_REVIEW_PRICING.complex }
                          ].map((option) => (
                            <motion.label
                              key={option.value}
                              whileHover={{ scale: 1.01 }}
                              className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                            >
                              <div className="relative">
                                <input
                                  type="radio"
                                  {...register('complianceServices.periodicBankReviewType')}
                                  value={option.value}
                                  checked={watchedData.complianceServices?.periodicBankReviewType === option.value}
                                  className="sr-only"
                                />
                                <div 
                                  className="w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
                                  style={{ 
                                    borderColor: watchedData.complianceServices?.periodicBankReviewType === option.value ? '#243F7B' : '#d1d5db' 
                                  }}
                                >
                                  {watchedData.complianceServices?.periodicBankReviewType === option.value && (
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
                        {errors.complianceServices?.periodicBankReviewType && (
                          <p className="text-red-500 text-xs mt-1">{errors.complianceServices.periodicBankReviewType.message}</p>
                        )}
                      </div>

                      {/* Fee Display */}
                      {watchedData.complianceServices?.periodicBankReviewType && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 pt-3 border-t border-gray-200"
                        >
                          <NumberInputField
                            label="Service Fee (AED)"
                            value={watchedData.complianceServices?.periodicBankReviewFee || 0}
                            onChange={(value) => setValue('complianceServices.periodicBankReviewFee', value)}
                            placeholder="Enter fee amount"
                            className="w-full max-w-xs"
                            error={errors.complianceServices?.periodicBankReviewFee?.message}
                            min={0}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {secondaryCurrencyCode} {getSecondaryCurrencyValue(watchedData.complianceServices?.periodicBankReviewFee || 0).toLocaleString()}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  {/* UBO, Shareholder, and Company Register Updates Section */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="p-3 rounded-lg border border-gray-100"
                  >
                    <h4 className="text-sm font-semibold mb-3" style={{ color: '#243F7B' }}>
                      UBO, Shareholder, and Company Register Updates
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Service Complexity Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                          Service Complexity
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {[
                            { value: 'basic', label: 'Basic', price: UBO_REGISTER_UPDATES_PRICING.basic },
                            { value: 'standard', label: 'Standard', price: UBO_REGISTER_UPDATES_PRICING.standard },
                            { value: 'complex', label: 'Complex', price: UBO_REGISTER_UPDATES_PRICING.complex }
                          ].map((option) => (
                            <motion.label
                              key={option.value}
                              whileHover={{ scale: 1.01 }}
                              className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                            >
                              <div className="relative">
                                <input
                                  type="radio"
                                  {...register('complianceServices.uboRegisterUpdatesType')}
                                  value={option.value}
                                  checked={watchedData.complianceServices?.uboRegisterUpdatesType === option.value}
                                  className="sr-only"
                                />
                                <div 
                                  className="w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
                                  style={{ 
                                    borderColor: watchedData.complianceServices?.uboRegisterUpdatesType === option.value ? '#243F7B' : '#d1d5db' 
                                  }}
                                >
                                  {watchedData.complianceServices?.uboRegisterUpdatesType === option.value && (
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
                        {errors.complianceServices?.uboRegisterUpdatesType && (
                          <p className="text-red-500 text-xs mt-1">{errors.complianceServices.uboRegisterUpdatesType.message}</p>
                        )}
                      </div>

                      {/* Fee Display */}
                      {watchedData.complianceServices?.uboRegisterUpdatesType && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 pt-3 border-t border-gray-200"
                        >
                          <NumberInputField
                            label="Service Fee (AED)"
                            value={watchedData.complianceServices?.uboRegisterUpdatesFee || 0}
                            onChange={(value) => setValue('complianceServices.uboRegisterUpdatesFee', value)}
                            placeholder="Enter fee amount"
                            className="w-full max-w-xs"
                            error={errors.complianceServices?.uboRegisterUpdatesFee?.message}
                            min={0}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {secondaryCurrencyCode} {getSecondaryCurrencyValue(watchedData.complianceServices?.uboRegisterUpdatesFee || 0).toLocaleString()}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </div>
      </FormSection>
    </motion.div>
  );
}; 