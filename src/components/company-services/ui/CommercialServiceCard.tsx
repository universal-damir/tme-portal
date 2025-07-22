'use client';

import React from 'react';
import { BANK_ACCOUNT_SERVICES, SECTION_COLORS } from '../utils/accountingServiceConfig';
import { FORMATTED_DEFAULT_FEES } from '../utils/accountingPricingConfig';
import { CompanyServicesData } from '@/types/company-services';
import { NumberInputField } from '../../portal/tabs/NumberInputField';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';

interface CommercialServiceCardProps {
  /**
   * Form registration function from react-hook-form
   */
  register: UseFormRegister<CompanyServicesData>;
  
  /**
   * Form errors object
   */
  errors: FieldErrors<CompanyServicesData>;
  
  /**
   * Current watched form data
   */
  watchedData: CompanyServicesData;
  
  /**
   * Handler for setting form values
   */
  setValue: UseFormSetValue<CompanyServicesData>;
}

export const CommercialServiceCard: React.FC<CommercialServiceCardProps> = ({
  register,
  errors,
  watchedData,
  setValue,
}) => {
  const colors = SECTION_COLORS.commercialServices;

  return (
    <div className={`${colors.bg} rounded-xl p-6 border ${colors.border}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <div className={`w-2 h-2 ${colors.dotColor} rounded-full mr-2`}></div>
        Commercial Services
      </h3>
      
      <div className="space-y-4">
        {/* Commercial Services */}
        <div className="flex items-start gap-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex-1">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('accountingServices.commercialServices')}
                className={`w-4 h-4 ${colors.textColor} bg-gray-100 border-gray-300 rounded ${colors.ringColor} focus:ring-2`}
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Commercial Services
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Handling of all financial jobs like checking and payments of monthly expenses
            </p>
          </div>
          
          {watchedData.accountingServices?.commercialServices && (
            <>
              <div className="w-px h-16 bg-gray-200"></div>
              <div className="flex-1">
                <NumberInputField
                  label="Monthly Fee (AED)"
                  value={watchedData.accountingServices?.commercialServicesFee || 0}
                  onChange={(value) => setValue('accountingServices.commercialServicesFee', value)}
                  placeholder={FORMATTED_DEFAULT_FEES.commercialServices}
                  className={`w-full max-w-md ${colors.ringColor}`}
                  error={errors.accountingServices?.commercialServicesFee?.message}
                  min={0}
                />
              </div>
            </>
          )}
        </div>

        {/* Payroll Services */}
        <div className="flex items-start gap-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex-1">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('accountingServices.payrollServices')}
                className={`w-4 h-4 ${colors.textColor} bg-gray-100 border-gray-300 rounded ${colors.ringColor} focus:ring-2`}
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Payroll Services
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Company payroll setup and ongoing payroll services
            </p>
          </div>
          
          {watchedData.accountingServices?.payrollServices && (
            <>
              <div className="w-px h-32 bg-gray-200"></div>
              <div className="flex-1 space-y-4">
                <div>
                  <NumberInputField
                    label="One-time Company Payroll Setup Fee (AED)"
                    value={watchedData.accountingServices?.payrollSetupFee || 0}
                    onChange={(value) => setValue('accountingServices.payrollSetupFee', value)}
                    placeholder={FORMATTED_DEFAULT_FEES.payrollSetup}
                    className={`w-full max-w-md ${colors.ringColor}`}
                    error={errors.accountingServices?.payrollSetupFee?.message}
                    min={0}
                  />
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <label className="flex items-center cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      {...register('accountingServices.payrollServicesEnabled')}
                      className={`w-4 h-4 ${colors.textColor} bg-gray-100 border-gray-300 rounded ${colors.ringColor} focus:ring-2`}
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Payroll Services and Salary Slip per Person
                    </span>
                  </label>
                  
                  {watchedData.accountingServices?.payrollServicesEnabled && (
                    <div className="mt-2">
                      <NumberInputField
                        label="Fee per Person per Month (AED)"
                        value={watchedData.accountingServices?.payrollServicesPerPersonFee || 0}
                        onChange={(value) => setValue('accountingServices.payrollServicesPerPersonFee', value)}
                        placeholder={FORMATTED_DEFAULT_FEES.payrollPerPerson}
                        className={`w-full max-w-md ${colors.ringColor}`}
                        error={errors.accountingServices?.payrollServicesPerPersonFee?.message}
                        min={0}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bank Account Opening */}
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('accountingServices.bankAccountOpening')}
                  className={`w-4 h-4 ${colors.textColor} bg-gray-100 border-gray-300 rounded ${colors.ringColor} focus:ring-2`}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Company Bank Account Opening
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Assistance with UAE bank account opening for personal and company accounts
              </p>
            </div>
            
            {watchedData.accountingServices?.bankAccountOpening && (
              <>
                <div className="w-px h-40 bg-gray-200"></div>
                <div className="flex-1 space-y-4">
                  {BANK_ACCOUNT_SERVICES.map((service) => (
                    <div key={service.key} className={service.key !== 'personalUAEBank' ? 'pt-3 border-t border-gray-100' : ''}>
                      <label className="flex items-center cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          {...register(`accountingServices.${service.key}`)}
                          className={`w-4 h-4 ${colors.textColor} bg-gray-100 border-gray-300 rounded ${colors.ringColor} focus:ring-2`}
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {service.label}
                        </span>
                      </label>
                      {watchedData.accountingServices?.[service.key as keyof typeof watchedData.accountingServices] && (
                        <div>
                          <NumberInputField
                            label="Service Fee (AED)"
                            value={watchedData.accountingServices?.[service.feeKey as keyof typeof watchedData.accountingServices] as number || 0}
                            onChange={(value) => setValue(`accountingServices.${service.feeKey}`, value)}
                            placeholder={service.placeholder}
                            className={`w-full max-w-md ${colors.ringColor}`}
                            error={errors.accountingServices?.[service.feeKey]?.message}
                            min={0}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 