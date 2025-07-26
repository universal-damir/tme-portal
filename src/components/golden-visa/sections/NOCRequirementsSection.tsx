'use client';

import React, { useState } from 'react';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { Shield, ChevronDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoldenVisaData } from '@/types/golden-visa';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { NumberInputField } from '../../portal/tabs/NumberInputField';
import { FREEZONE_OPTIONS } from '../utils/goldenVisaConfig';

interface NOCRequirementsSectionProps {
  data: GoldenVisaData;
  register: UseFormRegister<GoldenVisaData>;
  setValue: UseFormSetValue<GoldenVisaData>;
  errors: FieldErrors<GoldenVisaData>;
}

export const NOCRequirementsSection: React.FC<NOCRequirementsSectionProps> = ({
  data,
  register,
  setValue,
  errors,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleFreezoneSelect = (freezoneValue: string) => {
    setValue('selectedFreezone', freezoneValue);
    setIsDropdownOpen(false);
  };

  const selectedFreezone = FREEZONE_OPTIONS.find(f => f.value === data.selectedFreezone);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <FormSection
        title="NOC Requirements"
        description="No Objection Certificate requirements for skilled employee visa"
        icon={Shield}
        iconColor="text-blue-600"
      >
        <div className="space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* NOC Checkbox - Custom Styled */}
          <motion.label 
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="relative">
              <input
                type="checkbox"
                {...register('requiresNOC')}
                className="sr-only"
              />
              <div 
                className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                  data.requiresNOC
                    ? 'border-2'
                    : 'border-2 border-gray-300'
                }`}
                style={{ 
                  borderColor: data.requiresNOC ? '#243F7B' : '#d1d5db',
                  backgroundColor: data.requiresNOC ? '#243F7B' : 'white'
                }}
              >
                {data.requiresNOC && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </div>
            </div>
            <span className="text-sm font-medium" style={{ color: '#243F7B' }}>
              Requires NOC (No Objection Certificate)
            </span>
          </motion.label>

          {/* Freezone Dropdown - Custom Styled */}
          {data.requiresNOC && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="max-w-md">
                <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                  Select Freezone *
                </label>
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200"
                    onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  >
                    <span className={selectedFreezone ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedFreezone ? selectedFreezone.label : 'Select freezone for NOC'}
                    </span>
                    <motion.div
                      animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </motion.div>
                  </motion.button>
                  
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    >
                      {FREEZONE_OPTIONS.map((freezone) => (
                        <motion.button
                          key={freezone.value}
                          whileHover={{ backgroundColor: '#f3f4f6' }}
                          type="button"
                          onClick={() => handleFreezoneSelect(freezone.value)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-150"
                        >
                          {freezone.label}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </div>
                {errors.selectedFreezone && (
                  <p className="text-red-500 text-xs mt-1">{errors.selectedFreezone.message}</p>
                )}
              </div>

              {/* Dynamic Freezone NOC Fee Field */}
              {data.selectedFreezone && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-md"
                >
                  <NumberInputField
                    label={`${selectedFreezone?.label || 'Freezone'} NOC (AED)`}
                    value={data.freezoneNocFee}
                    onChange={(value) => setValue('freezoneNocFee', value)}
                    placeholder="2,020"
                    required
                    error={errors.freezoneNocFee?.message}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </FormSection>
    </motion.div>
  );
}; 