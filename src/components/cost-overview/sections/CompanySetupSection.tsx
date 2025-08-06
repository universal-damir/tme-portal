import React from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { OfferData } from '@/types/offer';
import { FormattedInputHandlers, FormattedInputState, ValidationErrors, ShareCapitalAlert } from '../hooks/useFormattedInputs';
import { FormSection } from '../ui/FormSection';
import { cn } from '@/lib/utils';

interface CompanySetupSectionProps {
  register: UseFormRegister<OfferData>;
  errors: FieldErrors<OfferData>;
  watchedData: OfferData;
  handlers: FormattedInputHandlers;
  setValue: UseFormSetValue<OfferData>;
  formattedInputs: FormattedInputState;
  validationErrors: ValidationErrors;
  shareCapitalAlert: ShareCapitalAlert;
}

export const CompanySetupSection: React.FC<CompanySetupSectionProps> = ({
  register,
  errors,
  watchedData,
  handlers,
  setValue,
  formattedInputs,
  validationErrors,
  shareCapitalAlert
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <FormSection
        title="Company Setup"
        description="Company structure, share capital, and currency information"
        icon={Building2}
        iconColor="text-slate-600"
      >
        <div className="space-y-4">
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
                      borderColor: watchedData.clientDetails?.companySetupType === 'Individual Setup' ? '#243F7B' : '#d1d5db' 
                    }}
                  >
                    {watchedData.clientDetails?.companySetupType === 'Individual Setup' && (
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
                      borderColor: watchedData.clientDetails?.companySetupType === 'Corporate Setup' ? '#243F7B' : '#d1d5db' 
                    }}
                  >
                    {watchedData.clientDetails?.companySetupType === 'Corporate Setup' && (
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

          {/* Separator Line */}
          <div className="border-t border-gray-200"></div>

          {/* Share Capital Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Share Capital (AED) *
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="text"
                {...register('authorityInformation.shareCapitalAED')}
                value={formattedInputs.shareCapitalFormatted}
                onChange={handlers.handleShareCapitalChange}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]",
                  validationErrors.shareCapitalError ? 'border-red-300' : ''
                )}
                placeholder="100,000"
                onFocus={(e) => e.target.style.borderColor = validationErrors.shareCapitalError ? '#ef4444' : '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = validationErrors.shareCapitalError ? '#ef4444' : '#e5e7eb'}
              />
              {validationErrors.shareCapitalError && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.shareCapitalError}</p>
              )}
              {errors.authorityInformation?.shareCapitalAED && (
                <p className="text-red-500 text-xs mt-1">{errors.authorityInformation.shareCapitalAED.message}</p>
              )}
              {shareCapitalAlert.shouldHighlight && shareCapitalAlert.message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-start space-x-2">
                    <svg className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-800">{shareCapitalAlert.message}</p>
                  </div>
                </motion.div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Value per Share (AED) *
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="text"
                {...register('authorityInformation.valuePerShareAED')}
                value={formattedInputs.valuePerShareFormatted}
                onChange={handlers.handleValuePerShareChange}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]",
                  validationErrors.valuePerShareError ? 'border-red-300' : ''
                )}
                placeholder="1"
                onFocus={(e) => e.target.style.borderColor = validationErrors.valuePerShareError ? '#ef4444' : '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = validationErrors.valuePerShareError ? '#ef4444' : '#e5e7eb'}
              />
              {validationErrors.valuePerShareError && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.valuePerShareError}</p>
              )}
              {errors.authorityInformation?.valuePerShareAED && (
                <p className="text-red-500 text-xs mt-1">{errors.authorityInformation.valuePerShareAED.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Number of Shares
              </label>
              <div className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 h-[42px] flex items-center bg-gray-50">
                <span className="text-gray-600 font-medium">
                  {(() => {
                    const shareCapital = watchedData.authorityInformation?.shareCapitalAED || 0;
                    const valuePerShare = watchedData.authorityInformation?.valuePerShareAED || 0;
                    
                    if (shareCapital > 0 && valuePerShare > 0) {
                      const numberOfShares = Math.floor(shareCapital / valuePerShare);
                      return numberOfShares.toLocaleString();
                    }
                    
                    return '0';
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Separator Line */}
          <div className="border-t border-gray-200"></div>

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
                          borderColor: watchedData.clientDetails?.secondaryCurrency === currency ? '#243F7B' : '#d1d5db' 
                        }}
                      >
                        {watchedData.clientDetails?.secondaryCurrency === currency && (
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
                Exchange Rate (AED to {watchedData.clientDetails?.secondaryCurrency || 'EUR'}) *
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      const currentValue = watchedData.clientDetails?.exchangeRate || 0;
                      const newValue = Math.max(0.01, currentValue - 0.01);
                      setValue('clientDetails.exchangeRate', parseFloat(newValue.toFixed(2)));
                    }}
                    className="w-7 h-7 rounded-lg border-2 border-gray-200 transition-all duration-200 flex items-center justify-center font-semibold text-sm text-gray-600"
                  >
                    -
                  </motion.button>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    {...register('clientDetails.exchangeRate', { 
                      valueAsNumber: true,
                      setValueAs: (value) => parseFloat(value) || 0
                    })}
                    value={watchedData.clientDetails?.exchangeRate || 4}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d.]/g, '');
                      const parsed = parseFloat(value) || 0;
                      setValue('clientDetails.exchangeRate', parsed);
                    }}
                    className="w-28 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="4"
                    onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      const currentValue = watchedData.clientDetails?.exchangeRate || 0;
                      const newValue = currentValue + 0.01;
                      setValue('clientDetails.exchangeRate', parseFloat(newValue.toFixed(2)));
                    }}
                    className="w-7 h-7 rounded-lg border-2 border-gray-200 transition-all duration-200 flex items-center justify-center font-semibold text-sm text-gray-600"
                  >
                    +
                  </motion.button>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 h-[42px] flex items-center">
                  <p className="text-xs text-gray-600 font-medium whitespace-nowrap">
                    {watchedData.clientDetails?.exchangeRate || '4'} AED = 1 {watchedData.clientDetails?.secondaryCurrency || 'EUR'}
                  </p>
                </div>
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