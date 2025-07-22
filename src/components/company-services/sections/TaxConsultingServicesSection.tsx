'use client';

import React, { useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { CompanyServicesData } from '@/types/company-services';
import { DEFAULT_FEES, FORMATTED_DEFAULT_FEES } from '../utils/accountingPricingConfig';
import { NumberInputField } from '../../portal/tabs/NumberInputField';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';

interface TaxConsultingServicesSectionProps {
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

export const TaxConsultingServicesSection: React.FC<TaxConsultingServicesSectionProps> = ({
  register,
  errors,
  data,
  setValue,
  watchedData,
}) => {
  // Reset tax consulting fields when the main checkbox is unchecked
  useEffect(() => {
    if (!watchedData.taxConsultingServices?.enabled) {
      setValue('taxConsultingServices.citRegistration', 0);
      setValue('taxConsultingServices.citType', '');
      setValue('taxConsultingServices.vatType', '');
      setValue('taxConsultingServices.vatRegistration', 0);
      setValue('taxConsultingServices.vatReturnFiling', 0);
      setValue('taxConsultingServices.vatReturnFilingType', '');
      setValue('taxConsultingServices.clientManagedAccounting', false);
    }
  }, [watchedData.taxConsultingServices?.enabled, setValue]);

  // Auto-populate default values when sections are enabled
  useEffect(() => {
    if (watchedData.taxConsultingServices?.enabled) {
      // Auto-populate CIT Registration if not already set
      if (!watchedData.taxConsultingServices?.citRegistration || watchedData.taxConsultingServices?.citRegistration === 0) {
        setValue('taxConsultingServices.citRegistration', DEFAULT_FEES.citRegistration);
      }
    }
  }, [watchedData.taxConsultingServices?.enabled, setValue]);

  // Auto-populate VAT registration fee when VAT type is selected
  useEffect(() => {
    const vatType = watchedData.taxConsultingServices?.vatType;
    if (vatType && ['registration', 'exception', 'de-registration'].includes(vatType)) {
      if (!watchedData.taxConsultingServices?.vatRegistration || watchedData.taxConsultingServices?.vatRegistration === 0) {
        setValue('taxConsultingServices.vatRegistration', DEFAULT_FEES.vatRegistration);
      }
    } else {
      setValue('taxConsultingServices.vatRegistration', 0);
      setValue('taxConsultingServices.vatReturnFiling', 0);
      setValue('taxConsultingServices.vatReturnFilingType', '');
    }
  }, [watchedData.taxConsultingServices?.vatType, setValue]);

  // Auto-populate VAT return filing fee when VAT return filing type is selected
  useEffect(() => {
    const vatReturnFilingType = watchedData.taxConsultingServices?.vatReturnFilingType;
    if (vatReturnFilingType && ['mini', 'basic', 'complex'].includes(vatReturnFilingType)) {
      let defaultValue = 664; // mini
      if (vatReturnFilingType === 'basic') {
        defaultValue = 2361;
      } else if (vatReturnFilingType === 'complex') {
        defaultValue = 3541;
      }
      
      // Always update the value when the type changes
      setValue('taxConsultingServices.vatReturnFiling', defaultValue);
    } else {
      setValue('taxConsultingServices.vatReturnFiling', 0);
    }
  }, [watchedData.taxConsultingServices?.vatReturnFilingType, setValue]);

  return (
    <FormSection
      title="Tax Consulting Services"
      description="CIT (Corporate Income Tax) and VAT (Value Added Tax) consulting services"
      icon={Calculator}
      iconColor="text-green-600"
    >
      <div className="space-y-6">
        {/* Main Tax Consulting Services Checkbox */}
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('taxConsultingServices.enabled')}
              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Include Tax Consulting Services
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Select to include Corporate Income Tax (CIT) and Value Added Tax (VAT) services
          </p>
        </div>

        {/* Tax Consulting Options - Show only if enabled */}
        {watchedData.taxConsultingServices?.enabled && (
          <div className="space-y-8 pl-6 border-l-2 border-green-200">
            {/* CIT Section */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Corporate Income Tax (CIT) Section
              </h3>
              
              <div className="space-y-4">
                {/* CIT Registration */}
                <div>
                  <NumberInputField
                    label="CIT (Corporate Income Tax) Registration (AED)"
                    value={watchedData.taxConsultingServices?.citRegistration || 0}
                    onChange={(value) => setValue('taxConsultingServices.citRegistration', value)}
                    placeholder={FORMATTED_DEFAULT_FEES.citRegistration}
                    className="w-full max-w-xs focus:ring-green-500"
                    error={errors.taxConsultingServices?.citRegistration?.message}
                    min={0}
                  />
                </div>

                {/* CIT Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    CIT Return Filing Type
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { value: 'sbr-regular', label: 'SBR / Regular' },
                      { value: 'qfzp', label: 'QFZP' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          {...register('taxConsultingServices.citType')}
                          value={option.value}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.taxConsultingServices?.citType && (
                    <p className="text-red-500 text-sm mt-1">{errors.taxConsultingServices.citType.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Select the appropriate CIT filing type
                  </p>
                </div>
              </div>
            </div>

            {/* VAT Section */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Value Added Tax (VAT) Section
              </h3>
              
              <div className="space-y-4">
                {/* VAT Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    VAT Service Type
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { value: 'registration', label: 'VAT Registration' },
                      { value: 'exception', label: 'VAT Exception' },
                      { value: 'de-registration', label: 'VAT De-registration' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          {...register('taxConsultingServices.vatType')}
                          value={option.value}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.taxConsultingServices?.vatType && (
                    <p className="text-red-500 text-sm mt-1">{errors.taxConsultingServices.vatType.message}</p>
                  )}
                </div>

                {/* VAT Registration Fee - Show when VAT type is selected */}
                {watchedData.taxConsultingServices?.vatType && ['registration', 'exception', 'de-registration'].includes(watchedData.taxConsultingServices.vatType) && (
                  <div>
                    <NumberInputField
                      label={`VAT ${watchedData.taxConsultingServices.vatType === 'registration' ? 'Registration' : 
                           watchedData.taxConsultingServices.vatType === 'exception' ? 'Exception' : 'De-registration'} Fee (AED)`}
                      value={watchedData.taxConsultingServices?.vatRegistration || 0}
                      onChange={(value) => setValue('taxConsultingServices.vatRegistration', value)}
                      placeholder={FORMATTED_DEFAULT_FEES.vatRegistration}
                      className="w-full max-w-xs focus:ring-blue-500"
                      error={errors.taxConsultingServices?.vatRegistration?.message}
                      min={0}
                    />
                  </div>
                )}

                {/* VAT Return Filing */}
                {watchedData.taxConsultingServices?.vatType && ['registration', 'exception', 'de-registration'].includes(watchedData.taxConsultingServices.vatType) && (
                  <div className="space-y-4">
                    {/* VAT Return Filing Type Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        VAT Return Filing Type
                      </label>
                      <div className="flex flex-wrap gap-4">
                        {[
                          { value: 'mini', label: 'Mini' },
                          { value: 'basic', label: 'Basic' },
                          { value: 'complex', label: 'Complex' }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              {...register('taxConsultingServices.vatReturnFilingType')}
                              value={option.value}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      {errors.taxConsultingServices?.vatReturnFilingType && (
                        <p className="text-red-500 text-sm mt-1">{errors.taxConsultingServices.vatReturnFilingType.message}</p>
                      )}
                    </div>

                    {/* VAT Return Filing Fee - Show when VAT return filing type is selected */}
                    {watchedData.taxConsultingServices?.vatReturnFilingType && (
                      <div>
                        <NumberInputField
                          label={`VAT Return Filing (${watchedData.taxConsultingServices.vatReturnFilingType.charAt(0).toUpperCase() + watchedData.taxConsultingServices.vatReturnFilingType.slice(1)}) (AED)`}
                          value={watchedData.taxConsultingServices?.vatReturnFiling || 0}
                          onChange={(value) => setValue('taxConsultingServices.vatReturnFiling', value)}
                          placeholder={
                            watchedData.taxConsultingServices.vatReturnFilingType === 'mini' ? '664' :
                            watchedData.taxConsultingServices.vatReturnFilingType === 'basic' ? '2,361' :
                            watchedData.taxConsultingServices.vatReturnFilingType === 'complex' ? '3,541' : '664'
                          }
                          className="w-full max-w-xs focus:ring-blue-500"
                          error={errors.taxConsultingServices?.vatReturnFiling?.message}
                          min={0}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Client-Managed Accounting Option */}
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('taxConsultingServices.clientManagedAccounting')}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Client-Managed Accounting
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Select if the client handles their own accounting (not TME Services)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FormSection>
  );
}; 