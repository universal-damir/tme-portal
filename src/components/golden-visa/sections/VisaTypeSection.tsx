'use client';

import React, { useState } from 'react';
import { Check, Shield, ChevronDown, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { AuthorityFeesSection } from './AuthorityFeesSection';
import { NumberInputField } from '@/components/portal/tabs/NumberInputField';
import { GoldenVisaType, GoldenVisaData } from '@/types/golden-visa';
import { FREEZONE_OPTIONS, getFreezoneCost } from '../utils/goldenVisaConfig';

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


interface VisaTypeSectionProps {
  /**
   * Form registration function from react-hook-form
   */
  register: any;
  
  /**
   * Form errors object
   */
  errors: any;
  
  /**
   * Handler for visa type change
   */
  onVisaTypeChange: (visaType: GoldenVisaType) => void;
  
  /**
   * Whether primary visa is required
   */
  primaryVisaRequired: boolean;
  
  /**
   * Handler for primary visa requirement change
   */
  onPrimaryVisaChange: (required: boolean) => void;
  
  /**
   * Current selected visa type value
   */
  currentVisaType?: GoldenVisaType;
  
  /**
   * Current form data for authority fees
   */
  data?: GoldenVisaData;
  
  /**
   * Handler for field value changes
   */
  onFieldChange?: (path: string, value: number | boolean) => void;
  
  /**
   * Form errors object
   */
  errors: any;
}

export const VisaTypeSection: React.FC<VisaTypeSectionProps> = ({
  register,
  errors,
  onVisaTypeChange,
  primaryVisaRequired,
  onPrimaryVisaChange,
  currentVisaType,
  data,
  onFieldChange,
}) => {
  const [isFreezoneDropdownOpen, setIsFreezoneDropdownOpen] = useState(false);
  const [isSalaryCertificateDropdownOpen, setIsSalaryCertificateDropdownOpen] = useState(false);

  const handleFreezoneSelect = (freezoneValue: string) => {
    if (onFieldChange) {
      onFieldChange('selectedFreezone', freezoneValue);
      // Auto-populate the NOC fee based on the selected freezone
      const cost = getFreezoneCost(freezoneValue);
      onFieldChange('freezoneNocFee', cost);
      
      // If salary certificate is also required, sync the freezone selection
      if (data?.requiresSalaryCertificate) {
        onFieldChange('selectedSalaryCertificateFreezone', freezoneValue);
        onFieldChange('salaryCertificateFee', cost);
      }
    }
    setIsFreezoneDropdownOpen(false);
  };

  const handleSalaryCertificateFreezoneSelect = (freezoneValue: string) => {
    if (onFieldChange) {
      onFieldChange('selectedSalaryCertificateFreezone', freezoneValue);
      // Auto-populate the salary certificate fee based on the selected freezone
      const cost = getFreezoneCost(freezoneValue);
      onFieldChange('salaryCertificateFee', cost);
    }
    setIsSalaryCertificateDropdownOpen(false);
  };

  const selectedFreezone = FREEZONE_OPTIONS.find(f => f.value === data?.selectedFreezone);
  const selectedSalaryCertificateFreezone = FREEZONE_OPTIONS.find(f => f.value === data?.selectedSalaryCertificateFreezone);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <FormSection
        title="Golden Visa Type"
        description="Select the type of Golden Visa application"
        icon={FileText}
        iconColor="text-green-600"
      >
        <div className="space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Primary Visa Selection */}
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <motion.label 
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  {...register('primaryVisaRequired')}
                  checked={primaryVisaRequired}
                  onChange={(e) => onPrimaryVisaChange(e.target.checked)}
                  className="sr-only"
                />
                <div 
                  className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                    primaryVisaRequired
                      ? 'border-2'
                      : 'border-2 border-gray-300'
                  }`}
                  style={{ 
                    borderColor: primaryVisaRequired ? '#243F7B' : '#d1d5db',
                    backgroundColor: primaryVisaRequired ? '#243F7B' : 'white'
                  }}
                >
                  {primaryVisaRequired && (
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
                Include Primary Visa Holder
              </span>
            </motion.label>
          </div>
            
          {/* Visa Type Selection with Side-by-Side Layout */}
          {primaryVisaRequired && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Left Column - Visa Type Options */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold mb-3" style={{ color: '#243F7B' }}>
                  Select Visa Type
                </h4>
                {VISA_TYPE_OPTIONS.map((option, index) => (
                  <div key={option.value}>
                    <motion.label 
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

                    {/* NOC Requirements - Only show for skilled-employee */}
                    {option.value === 'skilled-employee' && currentVisaType === 'skilled-employee' && data && onFieldChange && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="ml-8 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-2 mb-3">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">NOC Requirements</span>
                        </div>
                        
                        {/* NOC Checkbox */}
                        <motion.label 
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition-colors duration-150"
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              {...register('requiresNOC')}
                              className="sr-only"
                            />
                            <div 
                              className="w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center"
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
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </motion.div>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-medium text-blue-800">
                            Requires NOC (No Objection Certificate)
                          </span>
                        </motion.label>

                        {/* Freezone Selection */}
                        {data.requiresNOC && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                            className="mt-3 space-y-2"
                          >
                            <label className="block text-xs font-medium text-blue-800">
                              Select Freezone *
                            </label>
                            <div className="relative">
                              <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                type="button"
                                onClick={() => setIsFreezoneDropdownOpen(!isFreezoneDropdownOpen)}
                                className="w-full px-3 py-2 rounded-lg border-2 border-blue-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200 text-sm"
                                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                                onBlur={(e) => e.target.style.borderColor = '#bfdbfe'}
                              >
                                <span className={selectedFreezone ? 'text-gray-900' : 'text-gray-500'}>
                                  {selectedFreezone ? selectedFreezone.label : 'Select freezone for NOC'}
                                </span>
                                <motion.div
                                  animate={{ rotate: isFreezoneDropdownOpen ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                </motion.div>
                              </motion.button>
                              
                              {isFreezoneDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute z-10 w-full mt-1 bg-white border-2 border-blue-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"
                                >
                                  {FREEZONE_OPTIONS.map((freezone) => (
                                    <motion.button
                                      key={freezone.value}
                                      whileHover={{ backgroundColor: '#dbeafe' }}
                                      type="button"
                                      onClick={() => handleFreezoneSelect(freezone.value)}
                                      className="w-full px-3 py-2 text-left hover:bg-blue-50 first:rounded-t-lg last:rounded-b-lg transition-colors duration-150 text-sm"
                                    >
                                      {freezone.label}
                                    </motion.button>
                                  ))}
                                </motion.div>
                              )}
                            </div>
                            {errors.selectedFreezone && (
                              <p className="text-red-500 text-xs">{errors.selectedFreezone.message}</p>
                            )}

                            {/* NOC Fee Field */}
                            {data.selectedFreezone && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-2"
                              >
                                <NumberInputField
                                  label={`${selectedFreezone?.pdfLabel || 'Freezone'} NOC (AED)`}
                                  value={data.freezoneNocFee}
                                  onChange={(value) => onFieldChange('freezoneNocFee', value)}
                                  placeholder={selectedFreezone?.cost?.toLocaleString() || "2,020"}
                                  required
                                  error={errors.freezoneNocFee?.message}
                                  className="focus:ring-blue-500"
                                />
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Salary Certificate Requirements - Only show for skilled-employee */}
                    {option.value === 'skilled-employee' && currentVisaType === 'skilled-employee' && data && onFieldChange && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        className="ml-8 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-2 mb-3">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Salary Certificate Requirements</span>
                        </div>
                        
                        {/* Salary Certificate Checkbox */}
                        <motion.label 
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-green-100 transition-colors duration-150"
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              {...register('requiresSalaryCertificate')}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                if (onFieldChange) {
                                  onFieldChange('requiresSalaryCertificate', isChecked);
                                  // If NOC is already selected and salary certificate is now checked, sync the freezone
                                  if (isChecked && data?.requiresNOC && data?.selectedFreezone) {
                                    onFieldChange('selectedSalaryCertificateFreezone', data.selectedFreezone);
                                    const cost = getFreezoneCost(data.selectedFreezone);
                                    onFieldChange('salaryCertificateFee', cost);
                                  }
                                }
                              }}
                              className="sr-only"
                            />
                            <div 
                              className="w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center"
                              style={{ 
                                borderColor: data.requiresSalaryCertificate ? '#243F7B' : '#d1d5db',
                                backgroundColor: data.requiresSalaryCertificate ? '#243F7B' : 'white'
                              }}
                            >
                              {data.requiresSalaryCertificate && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                >
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </motion.div>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-medium text-green-800">
                            Requires Salary Certificate
                          </span>
                        </motion.label>

                        {/* Salary Certificate Freezone Selection */}
                        {data.requiresSalaryCertificate && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                            className="mt-3 space-y-2"
                          >
                            <label className="block text-xs font-medium text-green-800">
                              Select Freezone for Salary Certificate *
                              {data?.requiresNOC && data?.selectedFreezone && (
                                <span className="text-xs text-gray-600 ml-1">(Auto-synced with NOC)</span>
                              )}
                            </label>
                            <div className="relative">
                              <motion.button
                                whileHover={{ scale: data?.requiresNOC && data?.selectedFreezone ? 1 : 1.01 }}
                                whileTap={{ scale: data?.requiresNOC && data?.selectedFreezone ? 1 : 0.99 }}
                                type="button"
                                onClick={() => {
                                  // Only allow opening dropdown if NOC is not selected
                                  if (!(data?.requiresNOC && data?.selectedFreezone)) {
                                    setIsSalaryCertificateDropdownOpen(!isSalaryCertificateDropdownOpen);
                                  }
                                }}
                                disabled={data?.requiresNOC && data?.selectedFreezone}
                                className={`w-full px-3 py-2 rounded-lg border-2 border-green-200 text-left flex items-center justify-between focus:outline-none transition-all duration-200 text-sm ${
                                  data?.requiresNOC && data?.selectedFreezone 
                                    ? 'bg-gray-100 cursor-not-allowed opacity-75' 
                                    : 'bg-white'
                                }`}
                                onFocus={(e) => {
                                  if (!(data?.requiresNOC && data?.selectedFreezone)) {
                                    e.target.style.borderColor = '#243F7B';
                                  }
                                }}
                                onBlur={(e) => e.target.style.borderColor = '#bbf7d0'}
                              >
                                <span className={selectedSalaryCertificateFreezone ? 'text-gray-900' : 'text-gray-500'}>
                                  {selectedSalaryCertificateFreezone ? selectedSalaryCertificateFreezone.label : 'Select freezone for salary certificate'}
                                </span>
                                <motion.div
                                  animate={{ rotate: isSalaryCertificateDropdownOpen ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                </motion.div>
                              </motion.button>
                              
                              {isSalaryCertificateDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute z-10 w-full mt-1 bg-white border-2 border-green-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"
                                >
                                  {FREEZONE_OPTIONS.map((freezone) => (
                                    <motion.button
                                      key={freezone.value}
                                      whileHover={{ backgroundColor: '#dcfce7' }}
                                      type="button"
                                      onClick={() => handleSalaryCertificateFreezoneSelect(freezone.value)}
                                      className="w-full px-3 py-2 text-left hover:bg-green-50 first:rounded-t-lg last:rounded-b-lg transition-colors duration-150 text-sm"
                                    >
                                      {freezone.label}
                                    </motion.button>
                                  ))}
                                </motion.div>
                              )}
                            </div>
                            {errors.selectedSalaryCertificateFreezone && (
                              <p className="text-red-500 text-xs">{errors.selectedSalaryCertificateFreezone.message}</p>
                            )}

                            {/* Salary Certificate Fee Field */}
                            {data.selectedSalaryCertificateFreezone && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-2"
                              >
                                <NumberInputField
                                  label={`${selectedSalaryCertificateFreezone?.pdfLabel || 'Freezone'} Salary Certificate (AED)`}
                                  value={data.salaryCertificateFee}
                                  onChange={(value) => onFieldChange('salaryCertificateFee', value)}
                                  placeholder={selectedSalaryCertificateFreezone?.cost?.toLocaleString() || "2,020"}
                                  required
                                  error={errors.salaryCertificateFee?.message}
                                  className="focus:ring-green-500"
                                />
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>

              {/* Right Column - Authority Costs */}
              <div className="space-y-3">
                {currentVisaType && data && onFieldChange && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <AuthorityFeesSection
                      visaType={currentVisaType}
                      data={data}
                      onFieldChange={onFieldChange}
                    />
                  </motion.div>
                )}
              </div>

            </motion.div>
          )}

        </div>
        {errors.visaType && (
          <p className="text-red-500 text-sm mt-2">{errors.visaType.message}</p>
        )}
      </FormSection>
    </motion.div>
  );
}; 