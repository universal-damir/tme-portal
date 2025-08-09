'use client';

import React, { useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { motion } from 'framer-motion';
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
  // Reset CIT fields when CIT checkbox is unchecked
  useEffect(() => {
    if (!watchedData.taxConsultingServices?.citEnabled) {
      setValue('taxConsultingServices.citRegistration', 0);
      setValue('taxConsultingServices.citType', '');
    }
  }, [watchedData.taxConsultingServices?.citEnabled, setValue]);

  // Reset VAT fields when VAT checkbox is unchecked
  useEffect(() => {
    if (!watchedData.taxConsultingServices?.vatEnabled) {
      setValue('taxConsultingServices.vatType', '');
      setValue('taxConsultingServices.vatRegistration', 0);
      setValue('taxConsultingServices.vatReturnFiling', 0);
      setValue('taxConsultingServices.vatReturnFilingType', '');
      setValue('taxConsultingServices.clientManagedAccounting', false);
    }
  }, [watchedData.taxConsultingServices?.vatEnabled, setValue]);

  // Auto-populate default values when CIT is enabled
  useEffect(() => {
    if (watchedData.taxConsultingServices?.citEnabled) {
      // Auto-populate CIT Registration if not already set
      if (!watchedData.taxConsultingServices?.citRegistration || watchedData.taxConsultingServices?.citRegistration === 0) {
        setValue('taxConsultingServices.citRegistration', DEFAULT_FEES.citRegistration);
      }
    }
  }, [watchedData.taxConsultingServices?.citEnabled, setValue]);

  // Auto-populate VAT registration fee when VAT type is selected
  useEffect(() => {
    const vatType = watchedData.taxConsultingServices?.vatType;
    if (watchedData.taxConsultingServices?.vatEnabled && vatType && ['registration', 'exception', 'de-registration'].includes(vatType)) {
      if (!watchedData.taxConsultingServices?.vatRegistration || watchedData.taxConsultingServices?.vatRegistration === 0) {
        setValue('taxConsultingServices.vatRegistration', DEFAULT_FEES.vatRegistration);
      }
    } else if (!watchedData.taxConsultingServices?.vatEnabled) {
      setValue('taxConsultingServices.vatRegistration', 0);
      setValue('taxConsultingServices.vatReturnFiling', 0);
      setValue('taxConsultingServices.vatReturnFilingType', '');
    }
  }, [watchedData.taxConsultingServices?.vatType, watchedData.taxConsultingServices?.vatEnabled, setValue]);

  // Auto-populate VAT return filing fee when VAT return filing type is selected
  useEffect(() => {
    const vatReturnFilingType = watchedData.taxConsultingServices?.vatReturnFilingType;
    if (watchedData.taxConsultingServices?.vatEnabled && vatReturnFilingType && ['mini', 'basic', 'complex'].includes(vatReturnFilingType)) {
      let defaultValue = 664; // mini
      if (vatReturnFilingType === 'basic') {
        defaultValue = 2361;
      } else if (vatReturnFilingType === 'complex') {
        defaultValue = 3541;
      }
      
      // Always update the value when the type changes
      setValue('taxConsultingServices.vatReturnFiling', defaultValue);
    } else if (!watchedData.taxConsultingServices?.vatEnabled) {
      setValue('taxConsultingServices.vatReturnFiling', 0);
    }
  }, [watchedData.taxConsultingServices?.vatReturnFilingType, watchedData.taxConsultingServices?.vatEnabled, setValue]);

  // Update the main enabled flag for backward compatibility with PDF rendering
  useEffect(() => {
    const citEnabled = watchedData.taxConsultingServices?.citEnabled;
    const vatEnabled = watchedData.taxConsultingServices?.vatEnabled;
    const overallEnabled = citEnabled || vatEnabled;
    
    if (watchedData.taxConsultingServices?.enabled !== overallEnabled) {
      setValue('taxConsultingServices.enabled', overallEnabled);
    }
  }, [watchedData.taxConsultingServices?.citEnabled, watchedData.taxConsultingServices?.vatEnabled, setValue]);

  return (
    <>
      {/* CIT Consulting Service Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <FormSection
          title="CIT Consulting Service"
          description="Corporate Income Tax (CIT) consulting services"
          icon={Calculator}
          iconColor="text-blue-600"
        >
          <div className="space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* CIT Services Checkbox */}
            <motion.label
              whileHover={{ scale: 1.01 }}
              className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  {...register('taxConsultingServices.citEnabled')}
                  checked={watchedData.taxConsultingServices?.citEnabled || false}
                  className="sr-only"
                />
                <div 
                  className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                  style={{ 
                    borderColor: watchedData.taxConsultingServices?.citEnabled ? '#243F7B' : '#d1d5db',
                    backgroundColor: watchedData.taxConsultingServices?.citEnabled ? '#243F7B' : 'white'
                  }}
                >
                  {watchedData.taxConsultingServices?.citEnabled && (
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
                  Include CIT Consulting Services
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select to include Corporate Income Tax (CIT) services
                </p>
              </div>
            </motion.label>

            {/* CIT Options - Show only if enabled */}
            {watchedData.taxConsultingServices?.citEnabled && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-base font-semibold mb-3" style={{ color: '#243F7B' }}>
                  Corporate Income Tax (CIT)
                </h3>
                
                <div className="space-y-3">
                  {/* CIT Registration */}
                  <div>
                    <NumberInputField
                      label="CIT (Corporate Income Tax) Registration (AED)"
                      value={watchedData.taxConsultingServices?.citRegistration || 0}
                      onChange={(value) => setValue('taxConsultingServices.citRegistration', value)}
                      placeholder={FORMATTED_DEFAULT_FEES.citRegistration}
                      className="w-full max-w-xs"
                      error={errors.taxConsultingServices?.citRegistration?.message}
                      min={0}
                    />
                  </div>

                  {/* CIT Type Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                      CIT Return Filing Type
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: 'sbr-regular', label: 'SBR / Regular' },
                        { value: 'qfzp', label: 'QFZP' }
                      ].map((option) => (
                        <motion.label
                          key={option.value}
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                        >
                          <div className="relative">
                            <input
                              type="radio"
                              {...register('taxConsultingServices.citType')}
                              value={option.value}
                              checked={watchedData.taxConsultingServices?.citType === option.value}
                              className="sr-only"
                            />
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-gray-300 transition-all duration-200 flex items-center justify-center"
                              style={{ 
                                borderColor: watchedData.taxConsultingServices?.citType === option.value ? '#243F7B' : '#d1d5db' 
                              }}
                            >
                              {watchedData.taxConsultingServices?.citType === option.value && (
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
                    {errors.taxConsultingServices?.citType && (
                      <p className="text-red-500 text-xs mt-1">{errors.taxConsultingServices.citType.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </FormSection>
      </motion.div>

      {/* VAT Consulting Services Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <FormSection
          title="VAT Consulting Services"
          description="Value Added Tax (VAT) consulting services"
          icon={Calculator}
          iconColor="text-blue-600"
        >
          <div className="space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* VAT Services Checkbox */}
            <motion.label
              whileHover={{ scale: 1.01 }}
              className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  {...register('taxConsultingServices.vatEnabled')}
                  checked={watchedData.taxConsultingServices?.vatEnabled || false}
                  className="sr-only"
                />
                <div 
                  className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                  style={{ 
                    borderColor: watchedData.taxConsultingServices?.vatEnabled ? '#243F7B' : '#d1d5db',
                    backgroundColor: watchedData.taxConsultingServices?.vatEnabled ? '#243F7B' : 'white'
                  }}
                >
                  {watchedData.taxConsultingServices?.vatEnabled && (
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
                  Include VAT Consulting Services
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select to include Value Added Tax (VAT) services
                </p>
              </div>
            </motion.label>

            {/* VAT Options - Show only if enabled */}
            {watchedData.taxConsultingServices?.vatEnabled && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">

                <h3 className="text-base font-semibold mb-3" style={{ color: '#243F7B' }}>
                  Value Added Tax (VAT)
                </h3>
                
                <div className="space-y-3">
                  {/* VAT Type Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                      VAT Service Type
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: 'registration', label: 'Registration' },
                        { value: 'exception', label: 'Exception' },
                        { value: 'de-registration', label: 'De-registration' }
                      ].map((option) => (
                        <motion.label
                          key={option.value}
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                        >
                          <div className="relative">
                            <input
                              type="radio"
                              {...register('taxConsultingServices.vatType')}
                              value={option.value}
                              checked={watchedData.taxConsultingServices?.vatType === option.value}
                              className="sr-only"
                            />
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-gray-300 transition-all duration-200 flex items-center justify-center"
                              style={{ 
                                borderColor: watchedData.taxConsultingServices?.vatType === option.value ? '#243F7B' : '#d1d5db' 
                              }}
                            >
                              {watchedData.taxConsultingServices?.vatType === option.value && (
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
                    {errors.taxConsultingServices?.vatType && (
                      <p className="text-red-500 text-xs mt-1">{errors.taxConsultingServices.vatType.message}</p>
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
                        className="w-full max-w-xs"
                        error={errors.taxConsultingServices?.vatRegistration?.message}
                        min={0}
                      />
                    </div>
                  )}

                  {/* VAT Return Filing */}
                  {watchedData.taxConsultingServices?.vatType && ['registration', 'exception', 'de-registration'].includes(watchedData.taxConsultingServices.vatType) && (
                    <div className="space-y-3">
                      {/* VAT Return Filing Type Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                          VAT Return Filing Type
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {[
                            { value: 'mini', label: 'Mini' },
                            { value: 'basic', label: 'Basic' },
                            { value: 'complex', label: 'Complex' }
                          ].map((option) => (
                            <motion.label
                              key={option.value}
                              whileHover={{ scale: 1.01 }}
                              className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                            >
                              <div className="relative">
                                <input
                                  type="radio"
                                  {...register('taxConsultingServices.vatReturnFilingType')}
                                  value={option.value}
                                  checked={watchedData.taxConsultingServices?.vatReturnFilingType === option.value}
                                  className="sr-only"
                                />
                                <div 
                                  className="w-4 h-4 rounded-full border-2 border-gray-300 transition-all duration-200 flex items-center justify-center"
                                  style={{ 
                                    borderColor: watchedData.taxConsultingServices?.vatReturnFilingType === option.value ? '#243F7B' : '#d1d5db' 
                                  }}
                                >
                                  {watchedData.taxConsultingServices?.vatReturnFilingType === option.value && (
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
                        {errors.taxConsultingServices?.vatReturnFilingType && (
                          <p className="text-red-500 text-xs mt-1">{errors.taxConsultingServices.vatReturnFilingType.message}</p>
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
                            className="w-full max-w-xs"
                            error={errors.taxConsultingServices?.vatReturnFiling?.message}
                            min={0}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Client-Managed Accounting Option */}
                  <motion.label
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        {...register('taxConsultingServices.clientManagedAccounting')}
                        checked={watchedData.taxConsultingServices?.clientManagedAccounting || false}
                        className="sr-only"
                      />
                      <div 
                        className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                        style={{ 
                          borderColor: watchedData.taxConsultingServices?.clientManagedAccounting ? '#243F7B' : '#d1d5db',
                          backgroundColor: watchedData.taxConsultingServices?.clientManagedAccounting ? '#243F7B' : 'white'
                        }}
                      >
                        {watchedData.taxConsultingServices?.clientManagedAccounting && (
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
                      <span className="text-sm font-medium text-gray-700">
                        Client-Managed Accounting
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Select if the client handles their own accounting (not TME Services)
                      </p>
                    </div>
                  </motion.label>
                </div>
              </div>
            )}
          </div>
        </FormSection>
      </motion.div>
    </>
  );
}; 