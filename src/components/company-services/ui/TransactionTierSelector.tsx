'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { CompanyServicesData } from '@/types/company-services';

interface TransactionTierSelectorProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<CompanyServicesData>;
  
  /**
   * Form errors object
   */
  errors: FieldErrors<CompanyServicesData>;
  
  /**
   * Available transaction tiers
   */
  transactionTiers: number[];
  
  /**
   * Current service type
   */
  serviceType?: string;
  
  /**
   * Current value for controlled component
   */
  value?: number;
  
  /**
   * Change handler for controlled component
   */
  onValueChange?: (value: number) => void;
}

export const TransactionTierSelector: React.FC<TransactionTierSelectorProps> = ({
  register,
  errors,
  transactionTiers,
  serviceType,
  value,
  onValueChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!serviceType) {
    return null;
  }

  const selectedTier = transactionTiers.find(tier => tier === value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg p-4 border border-gray-200"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <h3 className="text-base font-semibold mb-3" style={{ color: '#243F7B' }}>
        Transaction Volume
      </h3>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
          Select transaction volume per month
        </label>
        
        <div className="relative">
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setIsOpen(!isOpen)}
            className="w-full max-w-md px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] flex items-center justify-between bg-white"
            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <span className="text-gray-700">
              {selectedTier ? `Up to ${selectedTier} transactions/month` : 'Select transaction tier...'}
            </span>
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          </motion.button>

          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full max-w-md mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
            >
              {transactionTiers.map((tier) => (
                <motion.button
                  key={tier}
                  type="button"
                  whileHover={{ backgroundColor: '#f3f4f6' }}
                  onClick={() => {
                    onValueChange?.(tier);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors duration-150"
                >
                  Up to {tier} transactions/month
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
        
        {/* Hidden input for React Hook Form registration */}
        <input
          type="hidden"
          {...register('accountingServices.transactionTier', { valueAsNumber: true })}
          value={value || 0}
        />
        
        {errors.accountingServices?.transactionTier && (
          <p className="text-red-500 text-xs mt-1" role="alert">
            {errors.accountingServices.transactionTier.message}
          </p>
        )}
      </div>
    </motion.div>
  );
}; 