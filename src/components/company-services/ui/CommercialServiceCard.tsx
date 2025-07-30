'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BANK_ACCOUNT_SERVICES } from '../utils/accountingServiceConfig';
import { FORMATTED_DEFAULT_FEES } from '../utils/accountingPricingConfig';
import { CompanyServicesData } from '@/types/company-services';
import { NumberInputField } from '../../portal/tabs/NumberInputField';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';

interface CommercialServiceCardProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<CompanyServicesData>;
  
  /**
   * Form errors object
   */
  errors: FieldErrors<CompanyServicesData>;
  
  /**
   * Current watched form data
   */
  watchedData: CompanyServicesData;
  
  /**
   * Handler for setting form values
   */
  setValue: UseFormSetValue<CompanyServicesData>;
}

export const CommercialServiceCard: React.FC<CommercialServiceCardProps> = ({
  register,
  errors,
  watchedData,
  setValue,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg p-4 border border-gray-200"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <h3 className="text-base font-semibold mb-3" style={{ color: '#243F7B' }}>
        Commercial Services
      </h3>
      
      <div className="space-y-4">
        {/* Commercial Services */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="p-3 bg-white rounded-lg border border-gray-200"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div>
              <motion.label 
                whileHover={{ scale: 1.01 }}
                className="flex items-start space-x-3 cursor-pointer"
              >
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    {...register('accountingServices.commercialServices')}
                    checked={watchedData.accountingServices?.commercialServices || false}
                    className="sr-only"
                  />
                  <div 
                    className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                    style={{ 
                      borderColor: watchedData.accountingServices?.commercialServices ? '#243F7B' : '#d1d5db',
                      backgroundColor: watchedData.accountingServices?.commercialServices ? '#243F7B' : 'white'
                    }}
                  >
                    {watchedData.accountingServices?.commercialServices && (
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
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">
                    Commercial Services
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Handling of all financial jobs like checking and payments of monthly expenses
                  </p>
                </div>
              </motion.label>
            </div>
            
            {watchedData.accountingServices?.commercialServices && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <NumberInputField
                  label="Monthly Fee (AED)"
                  value={watchedData.accountingServices?.commercialServicesFee || 0}
                  onChange={(value) => setValue('accountingServices.commercialServicesFee', value)}
                  placeholder={FORMATTED_DEFAULT_FEES.commercialServices}
                  className="w-full max-w-xs"
                  error={errors.accountingServices?.commercialServicesFee?.message}
                  min={0}
                />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Payroll Services */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-3 bg-white rounded-lg border border-gray-200"
        >
          <div className="space-y-3">
            <motion.label 
              whileHover={{ scale: 1.01 }}
              className="flex items-start space-x-3 cursor-pointer"
            >
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  {...register('accountingServices.payrollServices')}
                  checked={watchedData.accountingServices?.payrollServices || false}
                  className="sr-only"
                />
                <div 
                  className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                  style={{ 
                    borderColor: watchedData.accountingServices?.payrollServices ? '#243F7B' : '#d1d5db',
                    backgroundColor: watchedData.accountingServices?.payrollServices ? '#243F7B' : 'white'
                  }}
                >
                  {watchedData.accountingServices?.payrollServices && (
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
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  Payroll Services
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Company payroll setup and ongoing payroll services
                </p>
              </div>
            </motion.label>
            
            {watchedData.accountingServices?.payrollServices && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200"
              >
                <div>
                  <NumberInputField
                    label="One-time Setup Fee (AED)"
                    value={watchedData.accountingServices?.payrollSetupFee || 0}
                    onChange={(value) => setValue('accountingServices.payrollSetupFee', value)}
                    placeholder={FORMATTED_DEFAULT_FEES.payrollSetup}
                    className="w-full max-w-xs"
                    error={errors.accountingServices?.payrollSetupFee?.message}
                    min={0}
                  />
                </div>

                <div>
                  <motion.label 
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150 mb-2"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        {...register('accountingServices.payrollServicesEnabled')}
                        checked={watchedData.accountingServices?.payrollServicesEnabled || false}
                        className="sr-only"
                      />
                      <div 
                        className="w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
                        style={{ 
                          borderColor: watchedData.accountingServices?.payrollServicesEnabled ? '#243F7B' : '#d1d5db'
                        }}
                      >
                        {watchedData.accountingServices?.payrollServicesEnabled && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: '#243F7B' }}
                          />
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      Payroll Services per Person
                    </span>
                  </motion.label>
                  
                  {watchedData.accountingServices?.payrollServicesEnabled && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <NumberInputField
                        label="Fee per Person/Month (AED)"
                        value={watchedData.accountingServices?.payrollServicesPerPersonFee || 0}
                        onChange={(value) => setValue('accountingServices.payrollServicesPerPersonFee', value)}
                        placeholder={FORMATTED_DEFAULT_FEES.payrollPerPerson}
                        className="w-full max-w-xs"
                        error={errors.accountingServices?.payrollServicesPerPersonFee?.message}
                        min={0}
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Bank Account Opening */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="p-3 bg-white rounded-lg border border-gray-200"
        >
          <div className="space-y-3">
            <motion.label 
              whileHover={{ scale: 1.01 }}
              className="flex items-start space-x-3 cursor-pointer"
            >
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  {...register('accountingServices.bankAccountOpening')}
                  checked={watchedData.accountingServices?.bankAccountOpening || false}
                  className="sr-only"
                />
                <div 
                  className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                  style={{ 
                    borderColor: watchedData.accountingServices?.bankAccountOpening ? '#243F7B' : '#d1d5db',
                    backgroundColor: watchedData.accountingServices?.bankAccountOpening ? '#243F7B' : 'white'
                  }}
                >
                  {watchedData.accountingServices?.bankAccountOpening && (
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
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  Company Bank Account Opening
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Assistance with UAE bank account opening for personal and company accounts
                </p>
              </div>
            </motion.label>
            
            {watchedData.accountingServices?.bankAccountOpening && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 mt-3 pt-3 border-t border-gray-200"
              >
                {BANK_ACCOUNT_SERVICES.map((service, index) => (
                  <motion.div 
                    key={service.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start"
                  >
                    <motion.label 
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          {...register(`accountingServices.${service.key}`)}
                          checked={watchedData.accountingServices?.[service.key as keyof typeof watchedData.accountingServices] || false}
                          className="sr-only"
                        />
                        <div 
                          className="w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
                          style={{ 
                            borderColor: watchedData.accountingServices?.[service.key as keyof typeof watchedData.accountingServices] ? '#243F7B' : '#d1d5db'
                          }}
                        >
                          {watchedData.accountingServices?.[service.key as keyof typeof watchedData.accountingServices] && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: '#243F7B' }}
                            />
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {service.label}
                      </span>
                    </motion.label>
                    
                    {watchedData.accountingServices?.[service.key as keyof typeof watchedData.accountingServices] && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <NumberInputField
                          label="Service Fee (AED)"
                          value={watchedData.accountingServices?.[service.feeKey as keyof typeof watchedData.accountingServices] as number || 0}
                          onChange={(value) => setValue(`accountingServices.${service.feeKey}`, value)}
                          placeholder={service.placeholder}
                          className="w-full max-w-xs"
                          error={errors.accountingServices?.[service.feeKey]?.message}
                          min={0}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}; 