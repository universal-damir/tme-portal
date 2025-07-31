'use client';

import React, { useCallback, useState } from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { TaxationData, DESIGNATION_OPTIONS, Designation } from '@/types/taxation';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { PhoneNumberInput } from '../ui/PhoneNumberInput';

interface CITShareholderDeclarationSectionProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<TaxationData>;
  
  /**
   * Form errors object
   */
  errors: FieldErrors<TaxationData>;
  
  /**
   * Current form data for reactive display
   */
  data: TaxationData;
  
  /**
   * Handler for setting form values
   */
  setValue: UseFormSetValue<TaxationData>;
}

export const CITShareholderDeclarationSection: React.FC<CITShareholderDeclarationSectionProps> = ({
  register,
  errors,
  data,
  setValue,
}) => {
  const [isDesignationDropdownOpen, setIsDesignationDropdownOpen] = useState(false);
  
  // Handle phone number change
  const handlePhoneNumberChange = (phoneNumber: string) => {
    setValue('citShareholderDeclaration.clientContactNumber', phoneNumber);
  };
  
  // Handle designation dropdown selection
  const handleDesignationSelect = useCallback((value: string) => {
    setValue('citShareholderDeclaration.designation', value as Designation);
    setIsDesignationDropdownOpen(false);
  }, [setValue]);

  // Handle Small Business Relief checkbox change
  const handleSBRChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('citShareholderDeclaration.smallBusinessRelief', e.target.checked);
  }, [setValue]);

  // Handle Company Liquidation checkbox change
  const handleCompanyLiquidationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('citShareholderDeclaration.companyLiquidation', e.target.checked);
  }, [setValue]);

  // Handle books accounts deductible expenses radio button change
  const handleBooksAccountsChange = useCallback((value: 'contain' | 'do-not-contain') => {
    setValue('citShareholderDeclaration.booksAccountsDeductibleExpenses', value);
  }, [setValue]);

  // Handle has own header footer checkbox change
  const handleHasOwnHeaderFooterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('citShareholderDeclaration.hasOwnHeaderFooter', e.target.checked);
  }, [setValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FormSection
        title="CIT Shareholder Declaration"
        description="Contact information and client details for CIT Shareholder Declaration"
        icon={Users}
        iconColor="text-purple-600"
      >
        <div className="space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Additional Points and Books of Accounts Status in two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Additional Points Section */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-base font-semibold mb-3 flex items-center" style={{ color: '#243F7B' }}>
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#243F7B' }}></div>
                Additional Points
              </h3>
              
              
              <div className="space-y-2">
                {/* Small Business Relief Checkbox */}
                <div>
                  <motion.label 
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="smallBusinessRelief"
                        checked={data.citShareholderDeclaration?.smallBusinessRelief || false}
                        onChange={handleSBRChange}
                        className="sr-only"
                      />
                      <div 
                        className="w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center"
                        style={{ 
                          borderColor: data.citShareholderDeclaration?.smallBusinessRelief ? '#243F7B' : '#d1d5db',
                          backgroundColor: data.citShareholderDeclaration?.smallBusinessRelief ? '#243F7B' : 'white'
                        }}
                      >
                        {data.citShareholderDeclaration?.smallBusinessRelief && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Small Business Relief (SBR)
                    </span>
                  </motion.label>
                </div>

                {/* Company Liquidation Checkbox */}
                <div>
                  <motion.label 
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="companyLiquidation"
                        checked={data.citShareholderDeclaration?.companyLiquidation || false}
                        onChange={handleCompanyLiquidationChange}
                        className="sr-only"
                      />
                      <div 
                        className="w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center"
                        style={{ 
                          borderColor: data.citShareholderDeclaration?.companyLiquidation ? '#243F7B' : '#d1d5db',
                          backgroundColor: data.citShareholderDeclaration?.companyLiquidation ? '#243F7B' : 'white'
                        }}
                      >
                        {data.citShareholderDeclaration?.companyLiquidation && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Company Liquidation
                    </span>
                  </motion.label>
                </div>
              </div>
            </div>

            {/* Books of Accounts Status */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-base font-semibold mb-3 flex items-center" style={{ color: '#243F7B' }}>
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#243F7B' }}></div>
                Books of Accounts Status
              </h3>
              
              <div className="space-y-2">
                {/* Option 1: Books DO contain deductible expenses */}
                <div>
                  <motion.label 
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="relative">
                      <input
                        type="radio"
                        name="citShareholderBooksAccounts"
                        value="contain"
                        checked={data.citShareholderDeclaration?.booksAccountsDeductibleExpenses === 'contain'}
                        onChange={() => handleBooksAccountsChange('contain')}
                        className="sr-only"
                      />
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-gray-300 transition-all duration-200 flex items-center justify-center"
                        style={{ 
                          borderColor: data.citShareholderDeclaration?.booksAccountsDeductibleExpenses === 'contain' ? '#243F7B' : '#d1d5db' 
                        }}
                      >
                        {data.citShareholderDeclaration?.booksAccountsDeductibleExpenses === 'contain' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: '#243F7B' }}
                          />
                        )}
                      </div>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Books of accounts DO contain deductible expenses
                    </span>
                  </motion.label>
                </div>

                {/* Option 2: Books DO NOT contain deductible expenses */}
                <div>
                  <motion.label 
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="relative">
                      <input
                        type="radio"
                        name="citShareholderBooksAccounts"
                        value="do-not-contain"
                        checked={data.citShareholderDeclaration?.booksAccountsDeductibleExpenses === 'do-not-contain'}
                        onChange={() => handleBooksAccountsChange('do-not-contain')}
                        className="sr-only"
                      />
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-gray-300 transition-all duration-200 flex items-center justify-center"
                        style={{ 
                          borderColor: data.citShareholderDeclaration?.booksAccountsDeductibleExpenses === 'do-not-contain' ? '#243F7B' : '#d1d5db' 
                        }}
                      >
                        {data.citShareholderDeclaration?.booksAccountsDeductibleExpenses === 'do-not-contain' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: '#243F7B' }}
                          />
                        )}
                      </div>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Books of accounts DO NOT contain deductible expenses
                    </span>
                  </motion.label>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information and Client Footer Details in two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Contact Information */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-base font-semibold mb-3 flex items-center" style={{ color: '#243F7B' }}>
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#243F7B' }}></div>
                Contact Information
              </h3>
              
              <div className="space-y-3">
                {/* Client Contact Number */}
                <div>
                  <PhoneNumberInput
                    value={data.citShareholderDeclaration?.clientContactNumber || ''}
                    onChange={handlePhoneNumberChange}
                    label="Client Contact Number"
                    required={true}
                    focusColor="focus:ring-blue-500"
                    error={errors.citShareholderDeclaration?.clientContactNumber?.message}
                    className="max-w-md"
                  />
                </div>

                {/* Designation Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                    Designation *
                  </label>
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setIsDesignationDropdownOpen(!isDesignationDropdownOpen)}
                      className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200 h-[42px]"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#243F7B'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                    >
                      <span className={data.citShareholderDeclaration?.designation ? 'text-gray-900' : 'text-gray-500'}>
                        {data.citShareholderDeclaration?.designation 
                          ? DESIGNATION_OPTIONS.find(opt => opt.value === data.citShareholderDeclaration?.designation)?.label 
                          : 'Select designation...'
                        }
                      </span>
                      <motion.div
                        animate={{ rotate: isDesignationDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </motion.button>
                    
                    {isDesignationDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg"
                      >
                        {DESIGNATION_OPTIONS.map((option) => (
                          <motion.button
                            key={option.value}
                            whileHover={{ backgroundColor: '#f3f4f6' }}
                            onClick={() => handleDesignationSelect(option.value)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-150"
                          >
                            {option.label}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                    
                    {/* Hidden input for form registration */}
                    <input
                      {...register('citShareholderDeclaration.designation')}
                      type="hidden"
                      value={data.citShareholderDeclaration?.designation || ''}
                    />
                  </div>
                  {errors.citShareholderDeclaration?.designation && (
                    <p className="text-red-500 text-xs mt-1">{errors.citShareholderDeclaration.designation.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Client Footer Details */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-base font-semibold mb-3 flex items-center" style={{ color: '#243F7B' }}>
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#243F7B' }}></div>
                Client Footer Details
              </h3>
              
              <div className="space-y-3">
                {/* Licence Number */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                    Licence Number
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    {...register('citShareholderDeclaration.licenceNumber')}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 bg-white h-[42px]"
                    placeholder="Enter licence number"
                    onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                  {errors.citShareholderDeclaration?.licenceNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.citShareholderDeclaration.licenceNumber.message}</p>
                  )}
                </div>

                {/* Client has own header and footer checkbox */}
                <div>
                  <motion.label 
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={data.citShareholderDeclaration?.hasOwnHeaderFooter || false}
                        onChange={handleHasOwnHeaderFooterChange}
                        className="sr-only"
                      />
                      <div 
                        className="w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center"
                        style={{ 
                          borderColor: data.citShareholderDeclaration?.hasOwnHeaderFooter ? '#243F7B' : '#d1d5db',
                          backgroundColor: data.citShareholderDeclaration?.hasOwnHeaderFooter ? '#243F7B' : 'white'
                        }}
                      >
                        {data.citShareholderDeclaration?.hasOwnHeaderFooter && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Client has own header and footer
                    </span>
                  </motion.label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Check this box if the client will provide their own header and footer for the PDF document
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormSection>
    </motion.div>
  );
}; 