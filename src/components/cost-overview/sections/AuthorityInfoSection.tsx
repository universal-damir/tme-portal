import React, { useEffect, useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFieldArrayReturn } from 'react-hook-form';
import { Shield, AlertCircle, ChevronDown, FileText, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { OfferData } from '@/types/offer';
import { AUTHORITIES } from '@/lib/constants';
import { AuthorityConfig } from '@/lib/authorities/types';
import { FormSection } from '../ui/FormSection';
import { FormattedInputState, FormattedInputHandlers, ValidationErrors, getInvestorVisaCount } from '../hooks/useFormattedInputs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AuthorityInfoSectionProps {
  register: UseFormRegister<OfferData>;
  errors: FieldErrors<OfferData>;
  watchedData: OfferData;
  setValue: UseFormSetValue<OfferData>;
  formattedInputs: FormattedInputState;
  handlers: FormattedInputHandlers;
  validationErrors: ValidationErrors;
  activityCodesArray: UseFieldArrayReturn<OfferData, 'activityCodes', 'id'>;
  authorityConfig?: AuthorityConfig;
}

export const AuthorityInfoSection: React.FC<AuthorityInfoSectionProps> = ({
  register,
  errors,
  watchedData,
  setValue,
  formattedInputs,
  handlers,
  validationErrors,
  activityCodesArray,
  authorityConfig
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Calculate investor visa count for share capital validation
  const investorVisaCount = getInvestorVisaCount(watchedData);
  
  // Activity codes array destructuring
  const { fields, append, remove } = activityCodesArray;

  // Handle authority change
  const handleAuthorityChange = (value: string) => {
    setValue('authorityInformation.responsibleAuthority', value);
    setIsDropdownOpen(false);
  };
  
  // Set legal entity and area based on authority selection
  useEffect(() => {
    if (authorityConfig) {
      setValue('authorityInformation.legalEntity', authorityConfig.legalEntity);
      setValue('authorityInformation.areaInUAE', authorityConfig.areaInUAE);
    }
  }, [authorityConfig, setValue]);

  // Calculate number of shares when share capital or value per share changes
  useEffect(() => {
    const shareCapital = watchedData.authorityInformation?.shareCapitalAED || 0;
    const valuePerShare = watchedData.authorityInformation?.valuePerShareAED || 0;
    
    if (shareCapital > 0 && valuePerShare > 0) {
      const numberOfShares = shareCapital / valuePerShare;
      setValue('authorityInformation.numberOfShares', numberOfShares);
    }
  }, [
    watchedData.authorityInformation?.shareCapitalAED,
    watchedData.authorityInformation?.valuePerShareAED,
    setValue
  ]);

  // Activity codes logic - simplified to always use TBC from authorityInformation
  const isTbcEnabled = watchedData.authorityInformation?.activitiesToBeConfirmed || false;

  // Ensure at least one activity field exists when TBC is not enabled
  useEffect(() => {
    if (!isTbcEnabled && fields.length === 0) {
      append({ code: '', description: '' });
    }
  }, [isTbcEnabled, fields.length, append]);

  // Activity helper functions
  const isActivityComplete = (index: number) => {
    const activity = watchedData.activityCodes?.[index];
    return activity && activity.code && activity.code.trim() !== '' && activity.description && activity.description.trim() !== '';
  };


  const handleAddActivity = () => {
    append({ code: '', description: '' });
  };

  const handleRemoveActivity = (index: number) => {
    remove(index);
    // Don't auto-add a field here - let the useEffect handle it if needed
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <FormSection
        title="Authority Information"
        description="Select the responsible UAE authority and provide company details"
        icon={Shield}
        iconColor="text-slate-600"
      >
        <div className="space-y-4">
          {/* Responsible Authority */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
              Responsible Authority *
            </label>
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none transition-all duration-200 h-[42px]"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <span className={watchedData.authorityInformation?.responsibleAuthority ? 'text-gray-900' : 'text-gray-500'}>
                  {watchedData.authorityInformation?.responsibleAuthority || 'Select responsible authority'}
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
                  {AUTHORITIES.map((authority) => (
                    <motion.button
                      key={authority}
                      whileHover={{ backgroundColor: '#f3f4f6' }}
                      type="button"
                      onClick={() => handleAuthorityChange(authority)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-150 text-sm"
                    >
                      {authority}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>
            {errors.authorityInformation?.responsibleAuthority && (
              <p className="text-red-500 text-xs mt-1">{errors.authorityInformation.responsibleAuthority.message}</p>
            )}
          </div>

          {/* Legal Entity and Area - Read only, populated from authority config */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Legal Entity Type
              </label>
              <input
                type="text"
                value={authorityConfig?.legalEntity || ''}
                readOnly
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed h-[42px]"
                placeholder="Select authority first"
              />
              {/* Hidden input for form registration */}
              <input
                type="hidden"
                {...register('authorityInformation.legalEntity')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Area in UAE
              </label>
              <input
                type="text"
                value={authorityConfig?.areaInUAE || ''}
                readOnly
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed h-[42px]"
                placeholder="Select authority first"
              />
              {/* Hidden input for form registration */}
              <input
                type="hidden"
                {...register('authorityInformation.areaInUAE')}
              />
            </div>
          </div>

          {/* Share Capital, Value per Share, and Number of Shares */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Share Capital (AED) *
              </label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  value={formattedInputs.shareCapitalFormatted}
                  onChange={handlers.handleShareCapitalChange}
                  placeholder="100,000"
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]",
                    validationErrors.shareCapitalError ? 'border-red-300' : ''
                  )}
                  onFocus={(e) => e.target.style.borderColor = validationErrors.shareCapitalError ? '#ef4444' : '#243F7B'}
                  onBlur={(e) => e.target.style.borderColor = validationErrors.shareCapitalError ? '#ef4444' : '#e5e7eb'}
                />
                {investorVisaCount > 0 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Consider AED {(investorVisaCount * 300000).toLocaleString()} for {investorVisaCount} investor visa{investorVisaCount > 1 ? 's' : ''}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
              {validationErrors.shareCapitalError && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.shareCapitalError}</p>
              )}
              {errors.authorityInformation?.shareCapitalAED && (
                <p className="text-red-500 text-xs mt-1">{errors.authorityInformation.shareCapitalAED.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Value per Share (AED) *
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="text"
                value={formattedInputs.valuePerShareFormatted}
                onChange={handlers.handleValuePerShareChange}
                placeholder="1"
                className={cn(
                  "w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]",
                  validationErrors.valuePerShareError ? 'border-red-300' : ''
                )}
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
              <input
                type="text"
                value={watchedData.authorityInformation?.numberOfShares ? watchedData.authorityInformation.numberOfShares.toLocaleString() : ''}
                readOnly
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed h-[42px]"
                placeholder="Calculated automatically"
              />
              {/* Hidden input for form registration */}
              <input
                type="hidden"
                {...register('authorityInformation.numberOfShares')}
              />
            </div>
          </div>

          {/* Activity Codes - Show always, compact layout */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-600" />
              <label className="block text-sm font-medium" style={{ color: '#243F7B' }}>
                Business Activity Codes
              </label>
            </div>

            {/* TBC Checkbox - Always available, simplified */}
            <div className="mb-3">
              <motion.label
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    {...register('authorityInformation.activitiesToBeConfirmed')}
                    className="sr-only"
                  />
                  <div 
                    className="w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center"
                    style={{ 
                      borderColor: watchedData.authorityInformation?.activitiesToBeConfirmed ? '#243F7B' : '#d1d5db',
                      backgroundColor: watchedData.authorityInformation?.activitiesToBeConfirmed ? '#243F7B' : 'white'
                    }}
                  >
                    {watchedData.authorityInformation?.activitiesToBeConfirmed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700">
                  Activities TBC (To be confirmed)
                </span>
              </motion.label>
            </div>

            {/* Activity Fields */}
            {!isTbcEnabled && (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-3 items-start"
                  >
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                          Activity Code *
                        </label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          {...register(`activityCodes.${index}.code`)}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                          placeholder="Enter code"
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                        {errors.activityCodes?.[index]?.code && (
                          <p className="text-red-500 text-xs mt-1">{errors.activityCodes[index]?.code?.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                          Description *
                        </label>
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          {...register(`activityCodes.${index}.description`)}
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                          placeholder="Enter description"
                          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                        {errors.activityCodes?.[index]?.description && (
                          <p className="text-red-500 text-xs mt-1">{errors.activityCodes[index]?.description?.message}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Only show delete button if there's more than 1 field AND it's not the first field when there's only 1 */}
                    {fields.length > 1 && (
                      <div className="flex items-end pt-5">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => handleRemoveActivity(index)}
                          className="px-2 py-2 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600 transition-all duration-200 h-[42px] flex items-center"
                          title="Remove"
                        >
                          <Trash2 className="h-3 w-3" />
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
                
            {/* Add Activity button - always shown when not TBC */}
            {!isTbcEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center mt-2"
              >
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={handleAddActivity}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm"
                  style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
                  title="Add another activity"
                >
                  <Plus className="h-3 w-3" />
                  Add Activity
                </motion.button>
              </motion.div>
            )}
            
            {/* Compact instruction text */}
            {!isTbcEnabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-xs text-gray-500 text-center"
              >
                <p>Fill in both code and description to add more activities.</p>
              </motion.div>
            )}
          </div>

        </div>
      </FormSection>
    </motion.div>
  );
}; 