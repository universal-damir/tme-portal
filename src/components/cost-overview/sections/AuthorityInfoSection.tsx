import React, { useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { Shield, AlertCircle } from 'lucide-react';
import { OfferData } from '@/types/offer';
import { AUTHORITIES } from '@/lib/constants';
import { FormSection } from '../ui/FormSection';
import { FormattedInputState, FormattedInputHandlers, ValidationErrors, getInvestorVisaCount } from '../hooks/useFormattedInputs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
}

export const AuthorityInfoSection: React.FC<AuthorityInfoSectionProps> = ({
  register,
  errors,
  watchedData,
  setValue,
  formattedInputs,
  handlers,
  validationErrors
}) => {
  // Calculate investor visa count for share capital validation
  const investorVisaCount = getInvestorVisaCount(watchedData);

  // Handle authority change
  const handleAuthorityChange = (value: string) => {
    setValue('authorityInformation.responsibleAuthority', value);
  };

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

  return (
    <FormSection
      title="Authority Information"
      description="Select the responsible UAE authority and provide company details"
      icon={Shield}
      iconColor="text-blue-600"
    >
      <div className="space-y-6">
        {/* Responsible Authority */}
        <div className="space-y-2">
          <Label htmlFor="authority" className="text-sm font-semibold text-gray-700">
            Responsible Authority *
          </Label>
          <Select value={watchedData.authorityInformation?.responsibleAuthority || ''} onValueChange={handleAuthorityChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select responsible authority" />
            </SelectTrigger>
            <SelectContent>
              {AUTHORITIES.map((authority) => (
                <SelectItem key={authority} value={authority}>
                  {authority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.authorityInformation?.responsibleAuthority && (
            <p className="text-sm text-red-600">{errors.authorityInformation.responsibleAuthority.message}</p>
          )}
        </div>

        {/* Legal Entity and Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Legal Entity Type
            </Label>
            <input
              type="text"
              {...register('authorityInformation.legalEntity')}
              placeholder="e.g., Limited Liability Company"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Area in UAE
            </Label>
            <input
              type="text"
              {...register('authorityInformation.areaInUAE')}
              placeholder="e.g., Dubai"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Share Capital, Value per Share, and Number of Shares */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Share Capital (AED) *
            </Label>
            <div className="relative">
              <input
                type="text"
                value={formattedInputs.shareCapitalFormatted}
                onChange={handlers.handleShareCapitalChange}
                placeholder="100,000"
                className={cn(
                  "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white",
                  validationErrors.shareCapitalError ? 'border-red-300 focus:ring-red-500' : ''
                )}
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
              <p className="text-sm text-red-600">{validationErrors.shareCapitalError}</p>
            )}
            {errors.authorityInformation?.shareCapitalAED && (
              <p className="text-sm text-red-600">{errors.authorityInformation.shareCapitalAED.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Value per Share (AED) *
            </Label>
            <input
              type="text"
              value={formattedInputs.valuePerShareFormatted}
              onChange={handlers.handleValuePerShareChange}
              placeholder="1"
              className={cn(
                "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white",
                validationErrors.valuePerShareError ? 'border-red-300 focus:ring-red-500' : ''
              )}
            />
            {validationErrors.valuePerShareError && (
              <p className="text-sm text-red-600">{validationErrors.valuePerShareError}</p>
            )}
            {errors.authorityInformation?.valuePerShareAED && (
              <p className="text-sm text-red-600">{errors.authorityInformation.valuePerShareAED.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Number of Shares
            </Label>
            <input
              type="text"
              value={watchedData.authorityInformation?.numberOfShares ? watchedData.authorityInformation.numberOfShares.toLocaleString() : ''}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
              placeholder="Calculated automatically"
            />
            {/* Hidden input for form registration */}
            <input
              type="hidden"
              {...register('authorityInformation.numberOfShares')}
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}; 