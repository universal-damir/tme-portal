'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SERVICE_TYPE_OPTIONS } from '../utils/accountingServiceConfig';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { CompanyServicesData } from '@/types/company-services';

interface ServiceTypeSelectorProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<CompanyServicesData>;
  
  /**
   * Form errors object
   */
  errors: FieldErrors<CompanyServicesData>;
  
  /**
   * Current value for controlled component
   */
  value?: string;
  
  /**
   * Change handler for controlled component
   */
  onValueChange?: (value: string) => void;
}

export const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({
  register,
  errors,
  value,
  onValueChange,
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
        Service Type
      </h3>
      
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          {SERVICE_TYPE_OPTIONS.map((option) => (
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
                  checked={value === option.value}
                  onChange={() => onValueChange?.(option.value)}
                  className="sr-only"
                />
                <div 
                  className="w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
                  style={{ 
                    borderColor: value === option.value ? '#243F7B' : '#d1d5db' 
                  }}
                >
                  {value === option.value && (
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
        
        {/* Hidden input for React Hook Form registration */}
        <input
          type="hidden"
          {...register('accountingServices.serviceType')}
          value={value || ''}
        />
        
        {errors.accountingServices?.serviceType && (
          <p className="text-red-500 text-xs mt-1" role="alert">
            {errors.accountingServices.serviceType.message}
          </p>
        )}
      </div>
    </motion.div>
  );
}; 