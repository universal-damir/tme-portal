import React, { useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { User } from 'lucide-react';
import { OfferData } from '@/types/offer';
import { FormSection } from '../ui/FormSection';
import { FormattedInputHandlers } from '../hooks/useFormattedInputs';
import { FormDatePicker } from '@/components/ui/form-date-picker';

interface ClientDetailsSectionProps {
  register: UseFormRegister<OfferData>;
  errors: FieldErrors<OfferData>;
  watchedData: OfferData;
  handlers: FormattedInputHandlers;
  setValue: UseFormSetValue<OfferData>;
}

export const ClientDetailsSection: React.FC<ClientDetailsSectionProps> = ({
  register,
  errors,
  watchedData,
  handlers,
  setValue
}) => {
  const { clientDetails } = watchedData;
  
  // Check if company name has any meaningful content
  const hasCompanyName = clientDetails?.companyName && clientDetails.companyName.trim().length > 0;

  useEffect(() => {
    if (!hasCompanyName) {
      setValue('clientDetails.addressToCompany', false);
    }
  }, [hasCompanyName, setValue]);

  return (
    <FormSection
      title="Client Details"
      description="Basic client information"
      icon={User}
      iconColor="text-blue-600"
    >
      <div className="space-y-8">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              First Name *
            </label>
            <input
              {...register('clientDetails.firstName')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-400"
              placeholder="Enter first name"
            />
            {errors.clientDetails?.firstName && (
              <p className="text-red-500 text-sm">{errors.clientDetails.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Last Name *
            </label>
            <input
              {...register('clientDetails.lastName')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-400"
              placeholder="Enter last name"
            />
            {errors.clientDetails?.lastName && (
              <p className="text-red-500 text-sm">{errors.clientDetails.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Company Information and Date */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Company Name
            </label>
            <input
              {...register('clientDetails.companyName')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-400"
              placeholder="Enter company name (optional)"
            />
            {errors.clientDetails?.companyName && (
              <p className="text-red-500 text-sm">{errors.clientDetails.companyName.message}</p>
            )}
            
            {/* Company Address Checkbox */}
            <div className="pt-2">
              <label className={`flex items-center space-x-3 ${hasCompanyName ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                <input
                  type="checkbox"
                  {...register('clientDetails.addressToCompany')}
                  disabled={!hasCompanyName}
                  checked={hasCompanyName ? (clientDetails?.addressToCompany || false) : false}
                  className={`w-4 h-4 text-blue-600 border-2 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-200 ${
                    !hasCompanyName 
                      ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-300' 
                      : 'border-gray-300 hover:border-blue-400 bg-white'
                  }`}
                />
                <span className={`text-sm font-medium select-none ${
                  hasCompanyName ? 'text-gray-700' : 'text-gray-400'
                }`}>
                  Address offer to company
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Date *
            </label>
            <FormDatePicker
              register={register}
              name="clientDetails.date"
              value={watchedData.clientDetails?.date}
              onChange={(value: string) => setValue('clientDetails.date', value)}
              label=""
              placeholder="Select date"
              required={false}
              error={errors.clientDetails?.date?.message}
            />
          </div>
        </div>

        {/* Company Setup Type */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">
            Company Setup Type *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group">
              <input
                type="radio"
                {...register('clientDetails.companySetupType')}
                value="Individual Setup"
                onClick={() => handlers.handleRadioClick('companySetupType', 'Individual Setup')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-blue-700">
                Individual Shareholder
              </span>
            </label>
            <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group">
              <input
                type="radio"
                {...register('clientDetails.companySetupType')}
                value="Corporate Setup"
                onClick={() => handlers.handleRadioClick('companySetupType', 'Corporate Setup')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-blue-700">
                Corporate Shareholder
              </span>
            </label>
          </div>
          {errors.clientDetails?.companySetupType && (
            <p className="text-red-500 text-sm">{errors.clientDetails.companySetupType.message}</p>
          )}
        </div>

        {/* Currency and Exchange Rate */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Secondary Currency *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['EUR', 'USD', 'GBP'].map((currency) => (
                <label key={currency} className="flex items-center justify-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group">
                  <input
                    type="radio"
                    {...register('clientDetails.secondaryCurrency')}
                    value={currency}
                    onClick={() => handlers.handleRadioClick('secondaryCurrency', currency)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm font-semibold text-gray-700 group-hover:text-blue-700">
                    {currency}
                  </span>
                </label>
              ))}
            </div>
            {errors.clientDetails?.secondaryCurrency && (
              <p className="text-red-500 text-sm">{errors.clientDetails.secondaryCurrency.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Exchange Rate (AED to {clientDetails?.secondaryCurrency || 'Currency'}) *
            </label>
            <input
              type="number"
              step="0.01"
              {...register('clientDetails.exchangeRate', { valueAsNumber: true })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-400"
              placeholder="4.00"
            />
            <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
              <p className="text-xs text-gray-600 font-medium">
                {clientDetails?.exchangeRate || '4.00'} AED = 1 {clientDetails?.secondaryCurrency || 'Currency'}
              </p>
            </div>
            {errors.clientDetails?.exchangeRate && (
              <p className="text-red-500 text-sm">{errors.clientDetails.exchangeRate.message}</p>
            )}
          </div>
        </div>
      </div>
    </FormSection>
  );
}; 