import { useState, useCallback, useEffect, useRef } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { OfferData } from '@/types/offer';

export interface FormattedInputState {
  shareCapitalFormatted: string;
  valuePerShareFormatted: string;
  companyStampFormatted: string;
  emiratesPostFormatted: string;
  citRegistrationFormatted: string;
  citReturnFilingFormatted: string;
  vatRegistrationFormatted: string;
  personalBankFormatted: string;
  digitalBankFormatted: string;
  traditionalBankFormatted: string;
  accountingFeeFormatted: string;
}

export interface ValidationErrors {
  shareCapitalError: string | null;
  valuePerShareError: string | null;
}

export interface FormattedInputHandlers {
  handleShareCapitalChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleValuePerShareChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCompanyStampChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEmiratesPostChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCitRegistrationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCitReturnFilingChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleVatRegistrationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePersonalBankChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDigitalBankChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTraditionalBankChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAccountingFeeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAccountingFrequencyChange: (frequency: 'yearly' | 'quarterly' | 'monthly') => void;
  handleRadioClick: (fieldName: string, value: string) => void;
}

export interface ShareCapitalAlert {
  shouldHighlight: boolean;
  message: string | null;
}

const formatNumberWithSeparators = (value: string): string => {
  // Remove all non-digit characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  // Split by decimal point
  const parts = cleaned.split('.');
  // Add thousand separators to the integer part
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  // Join back with decimal point if there was one
  return parts.length > 1 ? parts.join('.') : parts[0];
};

const parseFormattedNumber = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  const cleaned = value.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const validateShareCapital = (value: number, investorVisaCount = 0): string | null => {
  const minimumRequired = investorVisaCount > 0 ? investorVisaCount * 50000 : 10000;
  
  if (value > 0 && value < minimumRequired) {
    if (investorVisaCount > 0) {
      return `Minimum share capital requirement for ${investorVisaCount} investor visa${investorVisaCount > 1 ? 's' : ''} is AED ${minimumRequired.toLocaleString()}`;
    }
    return 'Minimum share capital requirement is AED 10,000';
  }
  return null;
};

const validateValuePerShare = (value: number): string | null => {
  if (value > 0 && value < 10) {
    return 'Minimum value per share is AED 10';
  }
  return null;
};

// Enhanced investor visa count detection for both IFZA and DET
export const getInvestorVisaCount = (watchedData?: OfferData): number => {
  if (!watchedData?.visaCosts?.visaDetails) {
    return 0;
  }
  
  // Count visas where investorVisa is true (boolean) or "true" (string)
  // For IFZA: "true" = Enable Investor Visa
  // For DET: "true" = Investor Visa (vs "employment" = Employment Visa)
  return watchedData.visaCosts.visaDetails.filter(visa => 
    visa?.investorVisa === true || visa?.investorVisa === "true"
  ).length;
};

export const useFormattedInputs = (setValue: UseFormSetValue<OfferData>, watchedData?: OfferData) => {
  const [formattedInputs, setFormattedInputs] = useState<FormattedInputState>({
    shareCapitalFormatted: '',
    valuePerShareFormatted: '',
    companyStampFormatted: '600.00',
    emiratesPostFormatted: '1,500.00',
    citRegistrationFormatted: '2,921.00',
    citReturnFilingFormatted: '5,198.00',
    vatRegistrationFormatted: '3,625.00',
    personalBankFormatted: '3,000.00',
    digitalBankFormatted: '3,000.00',
    traditionalBankFormatted: '7,000.00',
    accountingFeeFormatted: '6,293.00',
  });

  const [shareCapitalAlert, setShareCapitalAlert] = useState<ShareCapitalAlert>({
    shouldHighlight: false,
    message: null,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    shareCapitalError: null,
    valuePerShareError: null,
  });

  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add ref to track if user is actively typing
  const isUserTypingRef = useRef(false);

  // Sync formatted inputs with form values on initialization and updates - BUT NOT when user is typing
  useEffect(() => {
    // Skip sync if user is actively typing
    if (isUserTypingRef.current) {
      return;
    }

    const shareCapital = watchedData?.authorityInformation?.shareCapitalAED;
    const valuePerShare = watchedData?.authorityInformation?.valuePerShareAED;
    
    if (shareCapital !== undefined && shareCapital > 0) {
      const formattedShareCapital = formatNumberWithSeparators(shareCapital.toString());
      if (formattedInputs.shareCapitalFormatted !== formattedShareCapital) {
        setFormattedInputs(prev => ({
          ...prev,
          shareCapitalFormatted: formattedShareCapital
        }));
      }
    }
    
    if (valuePerShare !== undefined && valuePerShare > 0) {
      const formattedValuePerShare = formatNumberWithSeparators(valuePerShare.toString());
      if (formattedInputs.valuePerShareFormatted !== formattedValuePerShare) {
        setFormattedInputs(prev => ({
          ...prev,
          valuePerShareFormatted: formattedValuePerShare
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedData?.authorityInformation?.shareCapitalAED, watchedData?.authorityInformation?.valuePerShareAED]);

  const createInputHandler = useCallback((
    stateKey: keyof FormattedInputState,
    formPath: string
  ) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const formatted = formatNumberWithSeparators(value);
      
      setFormattedInputs(prev => ({
        ...prev,
        [stateKey]: formatted
      }));
      
      const parsed = parseFormattedNumber(formatted);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue(formPath as any, parsed);
    };
  }, [setValue]);

  const handleShareCapitalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatNumberWithSeparators(value);
    const parsed = parseFormattedNumber(formatted);
    
    // Mark that user is actively typing to prevent sync interference
    isUserTypingRef.current = true;
    
    // ONLY update the formatted input - don't interfere with anything else while typing
    setFormattedInputs(prev => ({
      ...prev,
      shareCapitalFormatted: formatted
    }));
    
    setValue('authorityInformation.shareCapitalAED', parsed);
    
    // Clear any existing validation timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Only do validation/alerts after user stops typing completely
    validationTimeoutRef.current = setTimeout(() => {
      // User stopped typing
      isUserTypingRef.current = false;
      
      if (value && value.replace(/[,\s]/g, '').length >= 4) {
        const investorVisaCount = getInvestorVisaCount(watchedData);
        const error = validateShareCapital(parsed, investorVisaCount);
        setValidationErrors(prev => ({
          ...prev,
          shareCapitalError: error
        }));
      }
      
      // Clear alerts only after validation is done
      setShareCapitalAlert({
        shouldHighlight: false,
        message: null,
      });
    }, 1500); // Reduced from 2000ms to 1500ms for better UX
  }, [setValue, watchedData]);

  const handleValuePerShareChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatNumberWithSeparators(value);
    const parsed = parseFormattedNumber(formatted);
    
    setFormattedInputs(prev => ({
      ...prev,
      valuePerShareFormatted: formatted
    }));
    
    // Validate and set error
    const error = validateValuePerShare(parsed);
    setValidationErrors(prev => ({
      ...prev,
      valuePerShareError: error
    }));
    
    setValue('authorityInformation.valuePerShareAED', parsed);
  }, [setValue]);

  const handleRadioClick = useCallback((fieldName: string, value: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue(`clientDetails.${fieldName}` as any, value);
  }, [setValue]);

  // Watch specific visa investorVisa fields directly 
  const visa0InvestorVisa = watchedData?.visaCosts?.visaDetails?.[0]?.investorVisa;
  const visa1InvestorVisa = watchedData?.visaCosts?.visaDetails?.[1]?.investorVisa;
  const visa2InvestorVisa = watchedData?.visaCosts?.visaDetails?.[2]?.investorVisa;
  
  useEffect(() => {
    // CRITICAL: Don't interfere if user is actively typing
    if (isUserTypingRef.current) {
      return;
    }

    const currentInvestorVisaCount = getInvestorVisaCount(watchedData);
    const currentShareCapital = watchedData?.authorityInformation?.shareCapitalAED || 0;
    
    // Clear any existing alerts first
    setShareCapitalAlert({
      shouldHighlight: false,
      message: null,
    });
    
    if (currentInvestorVisaCount > 0) {
      const requiredShareCapital = currentInvestorVisaCount * 50000;
      
      // Alert user if current amount is below required
      if (currentShareCapital < requiredShareCapital) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          // Try multiple selectors to find the share capital field with improved targeting
          let shareCapitalField = document.querySelector('input[name="authorityInformation.shareCapitalAED"]') as HTMLInputElement;
          
          // If not found, try by placeholder text
          if (!shareCapitalField) {
            shareCapitalField = document.querySelector('input[placeholder*="10,000"], input[placeholder*="Share capital"]') as HTMLInputElement;
          }
          
          // Try finding by parent label or nearby text
          if (!shareCapitalField) {
            const labels = document.querySelectorAll('label, span, div');
            for (const label of labels) {
              if (label.textContent?.toLowerCase().includes('share capital')) {
                const nearbyInput = label.parentElement?.querySelector('input[type="text"]') as HTMLInputElement;
                if (nearbyInput) {
                  shareCapitalField = nearbyInput;
                  break;
                }
              }
            }
          }
          
          // Last resort: find input in authority info section
          if (!shareCapitalField) {
            const authoritySection = document.querySelector('[data-section="authority-info"], .authority-info');
            if (authoritySection) {
              shareCapitalField = authoritySection.querySelector('input[type="text"]') as HTMLInputElement;
            }
          }
          
          if (shareCapitalField) {
            shareCapitalField.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            
            // Add a visual highlight to the container
            const container = shareCapitalField.closest('div');
            if (container) {
              container.style.animation = 'pulse 2s ease-in-out';
              container.style.border = '2px solid #ff6b6b';
              setTimeout(() => {
                container.style.border = '';
              }, 3000);
            }
            
            // Focus the field after a short delay
            setTimeout(() => {
              (shareCapitalField as HTMLInputElement).focus();
              (shareCapitalField as HTMLInputElement).select();
            }, 600);
          }

          // Set alert state with improved message
          setShareCapitalAlert({
            shouldHighlight: true,
            message: `💡 Minimum AED ${requiredShareCapital.toLocaleString()} required for ${currentInvestorVisaCount} investor visa${currentInvestorVisaCount > 1 ? 's' : ''}.`,
          });

          // Clear alert after 4 seconds
          setTimeout(() => {
            setShareCapitalAlert({
              shouldHighlight: false,
              message: null,
            });
          }, 4000);
        }, 100);
      } else {
        // Share capital is adequate, clear any validation errors
        setValidationErrors(prev => ({
          ...prev,
          shareCapitalError: null
        }));
      }
    } else {
      // No investor visas selected, ensure no related validation errors
      setValidationErrors(prev => ({
        ...prev,
        shareCapitalError: null
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visa0InvestorVisa, visa1InvestorVisa, visa2InvestorVisa, watchedData?.authorityInformation?.shareCapitalAED]);

  const handlers: FormattedInputHandlers = {
    handleShareCapitalChange,
    handleValuePerShareChange,
    handleCompanyStampChange: createInputHandler('companyStampFormatted', 'additionalServices.companyStamp'),
    handleEmiratesPostChange: createInputHandler('emiratesPostFormatted', 'additionalServices.emiratesPost'),
    handleCitRegistrationChange: createInputHandler('citRegistrationFormatted', 'additionalServices.citRegistration'),
    handleCitReturnFilingChange: createInputHandler('citReturnFilingFormatted', 'additionalServices.citReturnFiling'),
    handleVatRegistrationChange: createInputHandler('vatRegistrationFormatted', 'additionalServices.vatRegistration'),
    handlePersonalBankChange: createInputHandler('personalBankFormatted', 'additionalServices.personalBank'),
    handleDigitalBankChange: createInputHandler('digitalBankFormatted', 'additionalServices.digitalBank'),
    handleTraditionalBankChange: createInputHandler('traditionalBankFormatted', 'additionalServices.traditionalBank'),
    handleAccountingFeeChange: createInputHandler('accountingFeeFormatted', 'additionalServices.accountingFee'),
    handleAccountingFrequencyChange: useCallback((frequency: 'yearly' | 'quarterly' | 'monthly') => {
      setValue('additionalServices.accountingFrequency', frequency);
      
      // Update amount based on frequency
      if (frequency === 'yearly') {
        setValue('additionalServices.accountingFee', 6293);
        setFormattedInputs(prev => ({ ...prev, accountingFeeFormatted: '6,293.00' }));
      } else if (frequency === 'quarterly') {
        setValue('additionalServices.accountingFee', 2098);
        setFormattedInputs(prev => ({ ...prev, accountingFeeFormatted: '2,098.00' }));
      } else if (frequency === 'monthly') {
        setValue('additionalServices.accountingFee', 2183);
        setFormattedInputs(prev => ({ ...prev, accountingFeeFormatted: '2,183.00' }));
      }
    }, [setValue]),
    handleRadioClick,
  };

  // Function to update formatted inputs directly
  const updateFormattedInput = useCallback((key: keyof FormattedInputState, value: string) => {
    setFormattedInputs(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  return {
    formattedInputs,
    handlers,
    validationErrors,
    shareCapitalAlert,
    formatNumberWithSeparators,
    parseFormattedNumber,
    updateFormattedInput,
  };
}; 