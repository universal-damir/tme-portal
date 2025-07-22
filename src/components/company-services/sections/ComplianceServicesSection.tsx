'use client';

import React, { useEffect } from 'react';
import { Shield } from 'lucide-react';
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
    const exchangeRate = watchedData.exchangeRate || 3.67;
    return Math.round(aedValue / exchangeRate);
  };

  const secondaryCurrencySymbol = watchedData.secondaryCurrency === 'EUR' ? '€' : 
    watchedData.secondaryCurrency === 'GBP' ? '£' : '$';

  return (
    <FormSection
      title="Compliance Services"
      description="Stay compliant with regulatory and banking requirements in the UAE"
      icon={Shield}
      iconColor="text-purple-600"
    >
      <div className="space-y-6">
        {/* Main Compliance Services Checkbox */}
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('complianceServices.enabled')}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Include Compliance Services
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Select to include regulatory and banking compliance support services
          </p>
        </div>

        {/* Compliance Options - Show only if enabled */}
        {watchedData.complianceServices?.enabled && (
          <div className="space-y-8 pl-6 border-l-2 border-purple-200">
            {/* Periodic Bank Review Section */}
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                Periodic Bank Review
              </h3>
              
              <div className="space-y-4">
                {/* Bank Review Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Service Complexity
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { value: 'basic', label: 'Basic', price: PERIODIC_BANK_REVIEW_PRICING.basic },
                      { value: 'standard', label: 'Standard', price: PERIODIC_BANK_REVIEW_PRICING.standard },
                      { value: 'complex', label: 'Complex', price: PERIODIC_BANK_REVIEW_PRICING.complex }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          {...register('complianceServices.periodicBankReviewType')}
                          value={option.value}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.complianceServices?.periodicBankReviewType && (
                    <p className="text-red-500 text-sm mt-1">{errors.complianceServices.periodicBankReviewType.message}</p>
                  )}
                </div>

                {/* Bank Review Fee Input */}
                {watchedData.complianceServices?.periodicBankReviewType && (
                  <div>
                    <NumberInputField
                      label="Service Fee (AED)"
                      value={watchedData.complianceServices?.periodicBankReviewFee || 0}
                      onChange={(value) => setValue('complianceServices.periodicBankReviewFee', value)}
                      placeholder="Enter fee amount"
                      className="w-full max-w-xs focus:ring-purple-500"
                      error={errors.complianceServices?.periodicBankReviewFee?.message}
                      min={0}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* UBO, Shareholder, and Company Register Updates Section */}
            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                UBO, Shareholder, and Company Register Updates
              </h3>
              
              <div className="space-y-4">
                {/* UBO Updates Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Service Complexity
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { value: 'basic', label: 'Basic', price: UBO_REGISTER_UPDATES_PRICING.basic },
                      { value: 'standard', label: 'Standard', price: UBO_REGISTER_UPDATES_PRICING.standard },
                      { value: 'complex', label: 'Complex', price: UBO_REGISTER_UPDATES_PRICING.complex }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          {...register('complianceServices.uboRegisterUpdatesType')}
                          value={option.value}
                          className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.complianceServices?.uboRegisterUpdatesType && (
                    <p className="text-red-500 text-sm mt-1">{errors.complianceServices.uboRegisterUpdatesType.message}</p>
                  )}
                </div>

                {/* UBO Updates Fee Input */}
                {watchedData.complianceServices?.uboRegisterUpdatesType && (
                  <div>
                    <NumberInputField
                      label="Service Fee (AED)"
                      value={watchedData.complianceServices?.uboRegisterUpdatesFee || 0}
                      onChange={(value) => setValue('complianceServices.uboRegisterUpdatesFee', value)}
                      placeholder="Enter fee amount"
                      className="w-full max-w-xs focus:ring-indigo-500"
                      error={errors.complianceServices?.uboRegisterUpdatesFee?.message}
                      min={0}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </FormSection>
  );
}; 