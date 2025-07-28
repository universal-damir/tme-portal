'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ANNUAL_SERVICES } from '../utils/accountingServiceConfig';
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ANNUAL_SERVICES.map((service, index) => (
            <motion.div 
              key={service.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <NumberInputField
                label={service.label}
                value={watchedData.accountingServices?.[service.key as keyof typeof watchedData.accountingServices] as number || 0}
                onChange={(value) => setValue(`accountingServices.${service.key}`, value)}
                placeholder={service.placeholder}
                className="w-full max-w-xs"
                error={errors.accountingServices?.[service.key]?.message}
                min={0}
              />
              <p className="text-xs text-gray-500 mt-1">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>

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