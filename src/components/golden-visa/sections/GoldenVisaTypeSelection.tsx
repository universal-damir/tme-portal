'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { GoldenVisaType } from '@/types/golden-visa';

/**
 * Available visa types with their display labels
 */
const VISA_TYPE_OPTIONS = [
  {
    value: 'property-investment',
    label: 'Property Investment Golden Visa',
  },
  {
    value: 'time-deposit',
    label: 'Time Deposit Golden Visa',
  },
  {
    value: 'skilled-employee',
    label: 'Skilled Employee Golden Visa',
  },
] as const;

interface GoldenVisaTypeSelectionProps {
  /**
   * Form registration function from react-hook-form
   */
  register: any;
  
  /**
   * Handler for visa type change
   */
  onVisaTypeChange: (visaType: GoldenVisaType) => void;
  
  /**
   * Current selected visa type value
   */
  currentVisaType?: GoldenVisaType;
  
  /**
   * Form errors object
   */
  errors: any;
}

export const GoldenVisaTypeSelection: React.FC<GoldenVisaTypeSelectionProps> = ({
  register,
  onVisaTypeChange,
  currentVisaType,
  errors
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FormSection
        title="Golden Visa Type Selection"
        description="Select the type of Golden Visa you want to apply for"
        icon={FileText}
        iconColor="text-blue-600"
      >
        <div className="space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VISA_TYPE_OPTIONS.map((option, index) => (
              <motion.label 
                key={option.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 border border-gray-200"
              >
                <div className="relative">
                  <input
                    type="radio"
                    {...register('visaType')}
                    value={option.value}
                    onChange={() => onVisaTypeChange(option.value)}
                    className="sr-only"
                  />
                  <div 
                    className="w-5 h-5 rounded-full border-2 border-gray-300 transition-all duration-200 flex items-center justify-center"
                    style={{ 
                      borderColor: currentVisaType === option.value ? '#243F7B' : '#d1d5db' 
                    }}
                  >
                    {currentVisaType === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: '#243F7B' }}
                      />
                    )}
                  </div>
                </div>
                <span className="text-gray-700 font-medium text-sm">{option.label}</span>
              </motion.label>
            ))}
          </div>
          
          {errors.visaType && (
            <p className="text-red-500 text-sm mt-2">{errors.visaType.message}</p>
          )}
        </div>
      </FormSection>
    </motion.div>
  );
};