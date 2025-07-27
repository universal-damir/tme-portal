import React, { useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { User, Check } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <FormSection
        title="Client Details"
        description="Basic client information"
        icon={User}
        iconColor="text-slate-600"
      >
        <div className="space-y-4">
          {/* Personal Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                First Name *
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                {...register('clientDetails.firstName')}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                placeholder="Enter first name"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              {errors.clientDetails?.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.clientDetails.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Last Name *
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                {...register('clientDetails.lastName')}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                placeholder="Enter last name"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              {errors.clientDetails?.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.clientDetails.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Company Information and Date */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Company Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                {...register('clientDetails.companyName')}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                placeholder="Enter company name (optional)"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              {errors.clientDetails?.companyName && (
                <p className="text-red-500 text-xs mt-1">{errors.clientDetails.companyName.message}</p>
              )}
              
              {/* Company Address Checkbox */}
              <div className="mt-3">
                <motion.label 
                  whileHover={hasCompanyName ? { scale: 1.02 } : {}}
                  className={`flex items-center cursor-pointer ${!hasCompanyName ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      {...register('clientDetails.addressToCompany')}
                      disabled={!hasCompanyName}
                      checked={hasCompanyName ? (clientDetails?.addressToCompany || false) : false}
                      className="sr-only"
                    />
                    <div 
                      className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                      style={{ 
                        borderColor: (hasCompanyName && clientDetails?.addressToCompany) ? '#243F7B' : '#d1d5db',
                        backgroundColor: (hasCompanyName && clientDetails?.addressToCompany) ? '#243F7B' : 'white'
                      }}
                    >
                      {hasCompanyName && clientDetails?.addressToCompany && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Address offer to company
                  </span>
                </motion.label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
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
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
              Company Setup Type *
            </label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
              <motion.label 
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 border border-gray-200"
              >
                <div className="relative">
                  <input
                    type="radio"
                    {...register('clientDetails.companySetupType')}
                    value="Individual Setup"
                    onClick={() => handlers.handleRadioClick('companySetupType', 'Individual Setup')}
                    className="sr-only"
                  />
                  <div 
                    className="w-5 h-5 rounded-full border-2 border-gray-300 transition-all duration-200 flex items-center justify-center"
                    style={{ 
                      borderColor: clientDetails?.companySetupType === 'Individual Setup' ? '#243F7B' : '#d1d5db' 
                    }}
                  >
                    {clientDetails?.companySetupType === 'Individual Setup' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: '#243F7B' }}
                      />
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">Individual Shareholder</span>
              </motion.label>
              
              <motion.label 
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 border border-gray-200"
              >
                <div className="relative">
                  <input
                    type="radio"
                    {...register('clientDetails.companySetupType')}
                    value="Corporate Setup"
                    onClick={() => handlers.handleRadioClick('companySetupType', 'Corporate Setup')}
                    className="sr-only"
                  />
                  <div 
                    className="w-5 h-5 rounded-full border-2 border-gray-300 transition-all duration-200 flex items-center justify-center"
                    style={{ 
                      borderColor: clientDetails?.companySetupType === 'Corporate Setup' ? '#243F7B' : '#d1d5db' 
                    }}
                  >
                    {clientDetails?.companySetupType === 'Corporate Setup' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: '#243F7B' }}
                      />
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">Corporate Shareholder</span>
              </motion.label>
            </div>
            {errors.clientDetails?.companySetupType && (
              <p className="text-red-500 text-xs mt-1">{errors.clientDetails.companySetupType.message}</p>
            )}
          </div>

          {/* Currency and Exchange Rate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Secondary Currency *
              </label>
              <div className="flex items-start gap-2 mt-3">
                {['EUR', 'USD', 'GBP'].map((currency) => (
                  <motion.label 
                    key={currency}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center cursor-pointer"
                  >
                    <div className="relative">
                      <input
                        type="radio"
                        {...register('clientDetails.secondaryCurrency')}
                        value={currency}
                        onClick={() => handlers.handleRadioClick('secondaryCurrency', currency)}
                        className="sr-only"
                      />
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-gray-300 transition-all duration-200 flex items-center justify-center"
                        style={{ 
                          borderColor: clientDetails?.secondaryCurrency === currency ? '#243F7B' : '#d1d5db' 
                        }}
                      >
                        {clientDetails?.secondaryCurrency === currency && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: '#243F7B' }}
                          />
                        )}
                      </div>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">{currency}</span>
                  </motion.label>
                ))}
              </div>
              {errors.clientDetails?.secondaryCurrency && (
                <p className="text-red-500 text-xs mt-1">{errors.clientDetails.secondaryCurrency.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Exchange Rate (AED to {clientDetails?.secondaryCurrency || 'Currency'}) *
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="number"
                step="0.01"
                {...register('clientDetails.exchangeRate', { valueAsNumber: true })}
                className="w-28 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                placeholder="4.00"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 mt-2">
                <p className="text-xs text-gray-600 font-medium">
                  {clientDetails?.exchangeRate || '4.00'} AED = 1 {clientDetails?.secondaryCurrency || 'Currency'}
                </p>
              </div>
              {errors.clientDetails?.exchangeRate && (
                <p className="text-red-500 text-xs mt-1">{errors.clientDetails.exchangeRate.message}</p>
              )}
            </div>
          </div>
        </div>
      </FormSection>
    </motion.div>
  );
}; 