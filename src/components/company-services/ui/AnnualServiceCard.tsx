'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FORMATTED_DEFAULT_FEES } from '../utils/accountingPricingConfig';
import { NumberInputField } from '../../portal/tabs/NumberInputField';
import { CompanyServicesData } from '@/types/company-services';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';

interface AnnualServiceCardProps {
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

export const AnnualServiceCard: React.FC<AnnualServiceCardProps> = ({
  register,
  errors,
  setValue,
  watchedData,
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
        Annual Services
      </h3>
      
      <div className="space-y-4">
        {/* Financial Statement Service */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="p-3 bg-white rounded-lg border border-gray-200"
        >
          <motion.label 
            whileHover={{ scale: 1.01 }}
            className="flex items-start space-x-3 cursor-pointer"
          >
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                {...register('accountingServices.plStatementEnabled')}
                checked={watchedData.accountingServices?.plStatementEnabled || false}
                className="sr-only"
              />
              <div 
                className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                style={{ 
                  borderColor: watchedData.accountingServices?.plStatementEnabled ? '#243F7B' : '#d1d5db',
                  backgroundColor: watchedData.accountingServices?.plStatementEnabled ? '#243F7B' : 'white'
                }}
              >
                {watchedData.accountingServices?.plStatementEnabled && (
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
                Financial Statement Service
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                For the preparation of the balance sheet and P/L statement at the end of each year
              </p>
            </div>
          </motion.label>
          
          {watchedData.accountingServices?.plStatementEnabled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pl-8"
            >
              <NumberInputField
                label="Financial Statement Fee (AED)"
                value={watchedData.accountingServices?.plStatementFee || 0}
                onChange={(value) => setValue('accountingServices.plStatementFee', value)}
                placeholder={FORMATTED_DEFAULT_FEES.plStatement}
                className="w-full max-w-xs"
                error={errors.accountingServices?.plStatementFee?.message}
                min={0}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Audit Guiding Service */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-3 bg-white rounded-lg border border-gray-200"
        >
          <motion.label 
            whileHover={{ scale: 1.01 }}
            className="flex items-start space-x-3 cursor-pointer"
          >
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                {...register('accountingServices.auditReportEnabled')}
                checked={watchedData.accountingServices?.auditReportEnabled || false}
                className="sr-only"
              />
              <div 
                className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                style={{ 
                  borderColor: watchedData.accountingServices?.auditReportEnabled ? '#243F7B' : '#d1d5db',
                  backgroundColor: watchedData.accountingServices?.auditReportEnabled ? '#243F7B' : 'white'
                }}
              >
                {watchedData.accountingServices?.auditReportEnabled && (
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
                Audit Guiding Service
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                If an audit report is requested by the authority or based on shareholder request
              </p>
            </div>
          </motion.label>
          
          {watchedData.accountingServices?.auditReportEnabled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pl-8"
            >
              <NumberInputField
                label="Audit Guiding Fee (AED)"
                value={watchedData.accountingServices?.auditReportFee || 0}
                onChange={(value) => setValue('accountingServices.auditReportFee', value)}
                placeholder={FORMATTED_DEFAULT_FEES.auditReport}
                className="w-full max-w-xs"
                error={errors.accountingServices?.auditReportFee?.message}
                min={0}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Local Auditor Fee */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <motion.label 
            whileHover={{ scale: 1.01 }}
            className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                {...register('accountingServices.localAuditorFee')}
                checked={watchedData.accountingServices?.localAuditorFee || false}
                className="sr-only"
              />
              <div 
                className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                style={{ 
                  borderColor: watchedData.accountingServices?.localAuditorFee ? '#243F7B' : '#d1d5db',
                  backgroundColor: watchedData.accountingServices?.localAuditorFee ? '#243F7B' : 'white'
                }}
              >
                {watchedData.accountingServices?.localAuditorFee && (
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
                Local Auditor Fee
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                The audit fee of the local auditor will be, according to our experience, 
                between AED 6,420 and AED 8,560. Upon request, we suggest an auditor 
                with whom we have sufficient and excellent experience with, 
                and who knows our business and work.
              </p>
            </div>
          </motion.label>
        </motion.div>
      </div>
    </motion.div>
  );
}; 