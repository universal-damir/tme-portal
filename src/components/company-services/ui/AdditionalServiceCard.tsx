'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ADDITIONAL_SERVICES } from '../utils/accountingServiceConfig';
import { UseFormRegister } from 'react-hook-form';
import { CompanyServicesData } from '@/types/company-services';

interface AdditionalServiceCardProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<CompanyServicesData>;
  
  /**
   * Current watched form data
   */
  watchedData: CompanyServicesData;
}

export const AdditionalServiceCard: React.FC<AdditionalServiceCardProps> = ({
  register,
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
        Additional Services
      </h3>
      
      <div className="space-y-3">
        {ADDITIONAL_SERVICES.map((service, index) => (
          <motion.div 
            key={service.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <motion.label 
              whileHover={{ scale: 1.01 }}
              className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  {...register(`accountingServices.${service.key}`)}
                  checked={watchedData.accountingServices?.[service.key as keyof typeof watchedData.accountingServices] || false}
                  className="sr-only"
                />
                <div 
                  className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                  style={{ 
                    borderColor: watchedData.accountingServices?.[service.key as keyof typeof watchedData.accountingServices] ? '#243F7B' : '#d1d5db',
                    backgroundColor: watchedData.accountingServices?.[service.key as keyof typeof watchedData.accountingServices] ? '#243F7B' : 'white'
                  }}
                >
                  {watchedData.accountingServices?.[service.key as keyof typeof watchedData.accountingServices] && (
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
                  {service.label}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  {service.description}
                </p>
              </div>
            </motion.label>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}; 