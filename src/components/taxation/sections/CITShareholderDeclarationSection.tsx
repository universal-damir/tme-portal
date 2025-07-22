'use client';

import React, { useCallback } from 'react';
import { Users } from 'lucide-react';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { TaxationData, DESIGNATION_OPTIONS } from '@/types/taxation';
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
  // Handle phone number change
  const handlePhoneNumberChange = (phoneNumber: string) => {
    setValue('citShareholderDeclaration.clientContactNumber', phoneNumber);
  };

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
    <FormSection
      title="CIT Shareholder Declaration"
      description="Contact information and client details for CIT Shareholder Declaration"
      icon={Users}
      iconColor="text-purple-600"
    >
      <div className="space-y-8">
        {/* Additional Points Section */}
        <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
            Additional Points
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Additional points to the contract will be added based on this selection.
          </p>
          
          <div className="space-y-3">
            {/* Small Business Relief Checkbox */}
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="smallBusinessRelief"
                  checked={data.citShareholderDeclaration?.smallBusinessRelief || false}
                  onChange={handleSBRChange}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Small Business Relief (SBR)
                </span>
              </label>
            </div>

            {/* Company Liquidation Checkbox */}
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="companyLiquidation"
                  checked={data.citShareholderDeclaration?.companyLiquidation || false}
                  onChange={handleCompanyLiquidationChange}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Company Liquidation
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Books of Accounts Status */}
        <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
            Books of Accounts Status
          </h3>
          
          <div className="space-y-3">
            {/* Option 1: Books DO contain deductible expenses */}
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="citShareholderBooksAccounts"
                  value="contain"
                  checked={data.citShareholderDeclaration?.booksAccountsDeductibleExpenses === 'contain'}
                  onChange={() => handleBooksAccountsChange('contain')}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 focus:ring-2"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Books of accounts DO contain deductible expenses
                </span>
              </label>
            </div>

            {/* Option 2: Books DO NOT contain deductible expenses */}
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="citShareholderBooksAccounts"
                  value="do-not-contain"
                  checked={data.citShareholderDeclaration?.booksAccountsDeductibleExpenses === 'do-not-contain'}
                  onChange={() => handleBooksAccountsChange('do-not-contain')}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 focus:ring-2"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Books of accounts DO NOT contain deductible expenses
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            Contact Information
          </h3>
          
          <div className="space-y-4">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Designation *
              </label>
              <select
                {...register('citShareholderDeclaration.designation')}
                className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="">Select designation...</option>
                {DESIGNATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.citShareholderDeclaration?.designation && (
                <p className="text-red-500 text-sm mt-1">{errors.citShareholderDeclaration.designation.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Client Footer Details */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
            Client Footer Details
          </h3>
          
          <div className="space-y-4">
            {/* Licence Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Licence Number
              </label>
              <input
                {...register('citShareholderDeclaration.licenceNumber')}
                className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white"
                placeholder="Enter licence number"
              />
              {errors.citShareholderDeclaration?.licenceNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.citShareholderDeclaration.licenceNumber.message}</p>
              )}
            </div>

            {/* Client has own header and footer checkbox */}
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.citShareholderDeclaration?.hasOwnHeaderFooter || false}
                  onChange={handleHasOwnHeaderFooterChange}
                  className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Client has own header and footer
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Check this box if the client will provide their own header and footer for the PDF document
              </p>
            </div>
          </div>
        </div>
      </div>
    </FormSection>
  );
}; 