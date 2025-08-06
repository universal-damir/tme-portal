'use client';

import React, { useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Send, Eye, UserCheck } from 'lucide-react';
import { OfferData } from '@/types/offer';
import { offerDataSchema } from '@/lib/validations';
import { 
  generatePDF, 
  generatePDFWithFilename, 
  generateFamilyVisaPDF,
  generateFamilyVisaPDFWithFilename,
  hasFamilyVisas,
  generateDynamicFilename
} from '@/lib/pdf-generator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Import our section components
import { ClientDetailsSection } from '../../cost-overview/sections/ClientDetailsSection';
import { CompanySetupSection } from '../../cost-overview/sections/CompanySetupSection';
import { AuthorityInfoSection } from '../../cost-overview/sections/AuthorityInfoSection';
import { LicenseFeesSection } from '../../cost-overview/sections/LicenseFeesSection';
import { VisaCostsSection } from '../../cost-overview/sections/VisaCostsSection';
import { SpouseVisaSection } from '../../cost-overview/sections/SpouseVisaSection';
import { ChildVisaSection } from '../../cost-overview/sections/ChildVisaSection';
import { CostSummarySection } from '../../cost-overview/sections/CostSummarySection';
import { AdditionalServicesSection } from '../../cost-overview/sections/AdditionalServicesSection';
import { SectionWithStickySummary } from '../../cost-overview/ui/SectionWithStickySummary';

// Import our custom hooks
import { useFormattedInputs } from '../../cost-overview/hooks/useFormattedInputs';
import { useAuthorityConfig } from '../../cost-overview/hooks/useAuthorityConfig';
import { useCostCalculation } from '../../cost-overview/hooks/useCostCalculation';
import { useSharedClient } from '@/contexts/SharedClientContext';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useChatPanel } from '@/hooks/useChatPanel';
import { useCostOverviewApplication } from '@/hooks/useCostOverviewApplication';

// Import AI Assistant components
import { ChatInterface } from '@/components/ai-assistant';

// Import Email components
import { EmailDraftGenerator, EmailDraftGeneratorProps } from '@/components/shared/EmailDraftGenerator';

// Import Review System components
import { ReviewSubmissionModal } from '@/components/review-system/modals/ReviewSubmissionModal';

// Progress tracking interface
interface PDFGenerationProgress {
  step: string;
  progress: number;
  isVisible: boolean;
}

interface CostOverviewTabProps {
  // No props needed anymore as we're using global bottom panel
}

const CostOverviewTab: React.FC<CostOverviewTabProps> = () => {
  const { clientInfo, updateClientInfo } = useSharedClient();
  const chatPanel = useChatPanel();
  const [emailDraftProps, setEmailDraftProps] = React.useState<EmailDraftGeneratorProps | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);

  // Form state management
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    trigger,
    clearErrors,
    formState: { errors },
  } = useForm<OfferData>({
    resolver: zodResolver(offerDataSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      clientDetails: {
        firstName: '',
        lastName: '',
        companyName: '',
        addressToCompany: false,
        date: new Date().toISOString().split('T')[0],
        companySetupType: '',
        secondaryCurrency: 'EUR',
        exchangeRate: 4.0,
        clientEmails: [],
      },
      authorityInformation: {
        responsibleAuthority: '',
        areaInUAE: '',
        legalEntity: '',
        shareCapitalAED: 0,
        valuePerShareAED: 0,
        numberOfShares: 0,
        activitiesToBeConfirmed: true,
      },
      activityCodes: [],
      ifzaLicense: {
        visaQuota: 0,
        licenseYears: 1,
        crossBorderLicense: false,
        mofaOwnersDeclaration: false,
        mofaCertificateOfIncorporation: false,
        mofaActualMemorandumOrArticles: false,
        mofaCommercialRegister: false,
        mofaPowerOfAttorney: false,
        rentOfficeRequired: false,
        officeRentAmount: 0,
        depositWithLandlord: false,
        depositAmount: 0,
        thirdPartyApproval: false,
        thirdPartyApprovalAmount: 0,
        tmeServicesFee: 0,
        applyPriceReduction: false,
        reductionAmount: 0,
        activitiesToBeConfirmed: true,
      },
      detLicense: {
        mofaOwnersDeclaration: false,
        mofaCertificateOfIncorporation: false,
        mofaActualMemorandumOrArticles: false,
        mofaCommercialRegister: false,
        mofaPowerOfAttorney: false,
        licenseType: 'commercial',
        rentType: 'business-center',
        officeRentAmount: 0,
        landlordDepositAmount: 0,
        thirdPartyApproval: false,
        thirdPartyApprovalAmount: 0,
        tmeServicesFee: 0,
        applyPriceReduction: false,
        reductionAmount: 0,
        activitiesToBeConfirmed: true,
      },
      visaCosts: {
        numberOfVisas: 0,
        visaDetails: [],
        enableVisaStatusChange: false,
        visaStatusChange: 0,
        reducedVisaCost: 0,
        vipStamping: false,
        vipStampingVisas: 0,
        spouseVisa: false,
        childVisa: false,
        numberOfChildVisas: 0,
        childVisaDetails: [],
      },
      additionalServices: {
        companyStamp: 600,
        emiratesPost: 1500,
        citRegistration: 2921,
        citReturnFiling: 5198,
        vatRegistration: 3625,
        personalBank: 3000,
        digitalBank: 3000,
        traditionalBank: 7000,
        accountingFee: 6293,
        accountingFrequency: 'yearly',
      },
    },
  });

  // Field arrays for dynamic sections
  const activityCodesArray = useFieldArray({
    control,
    name: 'activityCodes',
  });

  const visaDetailsArray = useFieldArray({
    control,
    name: 'visaCosts.visaDetails',
  });

  // Watch form data for real-time updates
  const watchedData = watch();
  const { authorityInformation } = watchedData;
  
  // Clear errors when specific fields change to provide immediate feedback
  React.useEffect(() => {
    if (watchedData.clientDetails?.firstName) {
      clearErrors('clientDetails.firstName');
    }
  }, [watchedData.clientDetails?.firstName, clearErrors]);
  
  React.useEffect(() => {
    if (watchedData.clientDetails?.lastName) {
      clearErrors('clientDetails.lastName');
    }
  }, [watchedData.clientDetails?.lastName, clearErrors]);
  
  React.useEffect(() => {
    if (watchedData.clientDetails?.companySetupType) {
      clearErrors('clientDetails.companySetupType');
    }
  }, [watchedData.clientDetails?.companySetupType, clearErrors]);
  
  React.useEffect(() => {
    if (watchedData.authorityInformation?.responsibleAuthority) {
      clearErrors('authorityInformation.responsibleAuthority');
    }
  }, [watchedData.authorityInformation?.responsibleAuthority, clearErrors]);
  
  React.useEffect(() => {
    if (watchedData.authorityInformation?.valuePerShareAED && watchedData.authorityInformation.valuePerShareAED > 0) {
      clearErrors('authorityInformation.valuePerShareAED');
    }
  }, [watchedData.authorityInformation?.valuePerShareAED, clearErrors]);
  
  React.useEffect(() => {
    if (watchedData.authorityInformation?.shareCapitalAED && watchedData.authorityInformation.shareCapitalAED > 0) {
      clearErrors('authorityInformation.shareCapitalAED');
    }
  }, [watchedData.authorityInformation?.shareCapitalAED, clearErrors]);
  
  React.useEffect(() => {
    if (watchedData.clientDetails?.clientEmails && watchedData.clientDetails.clientEmails.length > 0) {
      clearErrors('clientDetails.clientEmails');
    }
  }, [watchedData.clientDetails?.clientEmails, clearErrors]);

  // Auto-save removed to prevent infinite re-rendering issues

  // Custom hooks
  const { formattedInputs, handlers, validationErrors, shareCapitalAlert, formatNumberWithSeparators, parseFormattedNumber, updateFormattedInput } = useFormattedInputs(setValue, watchedData);
  const { authorityConfig, isAuthoritySelected } = useAuthorityConfig(
    authorityInformation?.responsibleAuthority, 
    setValue
  );
  const { costs, hasCalculations } = useCostCalculation(authorityConfig, watchedData);
  
  // Review system integration
  const reviewApp = useCostOverviewApplication({
    formData: watchedData,
    clientName: clientInfo.companyName || 
      (watchedData.clientDetails?.companyName) || 
      `${watchedData.clientDetails?.firstName || ''} ${watchedData.clientDetails?.lastName || ''}`.trim()
  });

  // Track authority configuration changes
  React.useEffect(() => {
    // Authority configuration updated
  }, [authorityInformation?.responsibleAuthority, isAuthoritySelected, authorityConfig?.id, watchedData.visaCosts?.numberOfVisas]);

  // AI Assistant integration
  const aiAssistant = useAIAssistant({
    setValue,
    currentFormData: watchedData,
    trigger,
    onFormUpdate: (summary) => {
      // Don't show duplicate success toast since useAIAssistant handles it
    },
    onAutoGeneratePDF: (updatedData) => handlePreviewPDF(updatedData) // Use merged data
  });

  // Sync AI assistant state with chat panel
  React.useEffect(() => {
    if (aiAssistant.isOpen !== chatPanel.isOpen) {
      if (aiAssistant.isOpen) {
        chatPanel.openPanel();
      } else {
        chatPanel.closePanel();
      }
    }
  }, [aiAssistant.isOpen, chatPanel]);

  // Override AI assistant open/close to also control chat panel
  const handleOpenChat = () => {
    aiAssistant.openChat();
    chatPanel.openPanel();
  };

  const handleCloseChat = () => {
    aiAssistant.closeChat();
    chatPanel.closePanel();
  };

  // PDF generation states
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [pdfProgress, setPdfProgress] = React.useState<PDFGenerationProgress>({
    step: '',
    progress: 0,
    isVisible: false
  });

  // Initialize form with shared client context (only once on mount)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && (clientInfo.firstName || clientInfo.lastName || clientInfo.companyName)) {
      setValue('clientDetails.firstName', clientInfo.firstName || '');
      setValue('clientDetails.lastName', clientInfo.lastName || '');
      setValue('clientDetails.companyName', clientInfo.companyName || '');
      setValue('clientDetails.date', clientInfo.date);
      initializedRef.current = true;
    }
  }, [clientInfo, setValue]); // Include proper dependencies

  // Update shared client info when form changes (simplified to prevent infinite loops)
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    const { firstName, lastName, companyName, date } = watchedData.clientDetails || {};
    
    // Clear previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Debounce the update to prevent rapid fire updates
    updateTimeoutRef.current = setTimeout(() => {
      updateClientInfo({
        firstName: firstName || '',
        lastName: lastName || '',
        companyName: companyName || '',
        date: date || new Date().toISOString().split('T')[0],
      });
    }, 100); // Small delay to prevent loops
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [
    watchedData.clientDetails?.firstName, 
    watchedData.clientDetails?.lastName, 
    watchedData.clientDetails?.companyName, 
    watchedData.clientDetails?.date,
    updateClientInfo
  ]);

  // Progress tracking helper
  const updateProgress = (step: string, progress: number) => {
    setPdfProgress({ step, progress, isVisible: true });
  };

  // Auto-save data loading removed

  // Email generation removed - now handled by EmailDraftGenerator component

  // Helper function to scroll to and highlight the first error field
  const scrollToFirstError = (validationError: any) => {
    const errors = validationError.errors || [];
    if (errors.length === 0) return;
    
    // Prioritize errors - mandatory fields first, then others
    const priorityOrder = [
      'clientDetails.firstName',
      'clientDetails.lastName', 
      'clientDetails.companySetupType',
      'authorityInformation.responsibleAuthority',
      'authorityInformation.valuePerShareAED',
      'authorityInformation.shareCapitalAED',
      'clientDetails.clientEmails',
      'visaCosts.reducedVisaCost',
      'ifzaLicense.visaQuota',
      'activityCodes' // Activity codes should be last priority
    ];
    
    // Sort errors by priority
    const sortedErrors = [...errors].sort((a, b) => {
      const aPath = a.path.join('.');
      const bPath = b.path.join('.');
      const aIndex = priorityOrder.findIndex(p => aPath.startsWith(p));
      const bIndex = priorityOrder.findIndex(p => bPath.startsWith(p));
      
      // If both found in priority list, use that order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only one found, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      // If neither found, keep original order
      return 0;
    });
    
    const firstError = sortedErrors[0];
    const fieldPath = firstError.path;
    const pathStr = fieldPath.join('.');
    
    // Enhanced field mapping with multiple selector strategies
    const getFieldElement = (path: string[]) => {
      const pathStr = path.join('.');
      
      // Primary selectors - exact field targeting
      const selectors = [
        `input[name="${pathStr}"]`,
        `select[name="${pathStr}"]`,
        `textarea[name="${pathStr}"]`,
        `[data-field="${pathStr}"]`,
        // Radio button groups
        `input[name="${pathStr}"][type="radio"]`,
        // Custom dropdown button for authority
        pathStr === 'authorityInformation.responsibleAuthority' ? 'button[type="button"]:has(+ div):not([data-radix-collection-item])' : null,
        // Company setup type radio group container
        pathStr === 'clientDetails.companySetupType' ? 'input[name="clientDetails.companySetupType"][type="radio"]' : null,
        // Client emails section
        pathStr === 'clientDetails.clientEmails' ? 'input[type="email"]' : null,
      ].filter(Boolean);
      
      // Try each selector until we find an element
      for (const selector of selectors) {
        const element = document.querySelector(selector as string);
        if (element) {
          return element;
        }
      }
      
      // Fallback: try to find by partial name match
      const fallbackElement = document.querySelector(`[name*="${fieldPath[fieldPath.length - 1]}"]`);
      if (fallbackElement) {
        return fallbackElement;
      }
      
      return null;
    };
    
    let fieldElement = getFieldElement(fieldPath);
    
    // Special handling for authority dropdown - find the button
    if (!fieldElement && pathStr === 'authorityInformation.responsibleAuthority') {
      // Look for the authority dropdown button by its text content
      const buttons = document.querySelectorAll('button[type="button"]');
      for (const button of buttons) {
        if (button.textContent?.includes('Select responsible authority') || 
            button.textContent?.includes('responsible authority')) {
          fieldElement = button;
          break;
        }
      }
    }
    
    // Special handling for company setup type - find the first radio in the group
    if (!fieldElement && pathStr === 'clientDetails.companySetupType') {
      fieldElement = document.querySelector('input[name="clientDetails.companySetupType"]');
    }
    
    if (fieldElement) {
      // Scroll to the field with smooth animation
      fieldElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Add visual highlight effect with enhanced styling
      const originalTransition = (fieldElement as HTMLElement).style.transition;
      fieldElement.classList.add('ring-4', 'ring-red-400', 'ring-opacity-75');
      (fieldElement as HTMLElement).style.transition = 'all 0.3s ease';
      (fieldElement as HTMLElement).style.transform = 'scale(1.02)';
      
      // For custom dropdowns and radio groups, also highlight the container
      const container = fieldElement.closest('.space-y-4, .grid, .flex');
      if (container && container !== fieldElement) {
        container.classList.add('bg-red-50', 'rounded-lg');
      }
      
      // Focus the field if it's focusable
      if (fieldElement instanceof HTMLInputElement || 
          fieldElement instanceof HTMLSelectElement || 
          fieldElement instanceof HTMLButtonElement ||
          fieldElement instanceof HTMLTextAreaElement) {
        setTimeout(() => {
          fieldElement.focus();
        }, 600); // Slightly longer delay to ensure scroll completes
      }
      
      // Remove highlight after 4 seconds
      setTimeout(() => {
        fieldElement.classList.remove('ring-4', 'ring-red-400', 'ring-opacity-75');
        (fieldElement as HTMLElement).style.transform = '';
        (fieldElement as HTMLElement).style.transition = originalTransition;
        
        // Remove container highlight
        if (container && container !== fieldElement) {
          container.classList.remove('bg-red-50', 'rounded-lg');
        }
      }, 4000);
      
      // Field found and scrolled successfully
    } else {
      // Could not find field element
      // Try to scroll to the section containing this field type
      const sectionSelectors = [
        pathStr.includes('clientDetails') ? 'h3:contains("Client Details")' : null,
        pathStr.includes('authorityInformation') ? 'h3:contains("Authority Information")' : null,
        pathStr.includes('visaCosts') ? 'h3:contains("Visa")' : null,
        pathStr.includes('ifzaLicense') ? 'h3:contains("License")' : null,
      ].filter(Boolean);
      
      // Simple fallback - scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // PDF generation handlers with progress tracking
  const handleGeneratePDF = async (data: OfferData): Promise<void> => {
    // Validate the entire form data using Zod schema
    try {
      await offerDataSchema.parseAsync(data);
    } catch (validationError: any) {
      // Trigger form validation to show field-level errors
      await trigger();
      
      // Scroll to and highlight the first error field
      scrollToFirstError(validationError);
      return;
    }

    // Additional basic checks for backwards compatibility
    if (!data || !data.clientDetails || !data.authorityInformation) {
      toast.error('Missing Information', {
        description: 'Please fill out the required client details and authority information before generating the PDF.'
      });
      return;
    }

    setIsGenerating(true);
    const hasFamilyVisaDoc = hasFamilyVisas(data);
    const totalSteps = hasFamilyVisaDoc ? 4 : 2;
    let currentStep = 0;

    const loadingToast = toast.loading('Generating PDF documents...', {
      description: 'Please wait while we create your cost overview documents.'
    });

    try {
      // Step 1: Validate data
      updateProgress('Validating form data...', (++currentStep / totalSteps) * 100);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 2: Generate main document
      updateProgress('Generating main cost overview document...', (++currentStep / totalSteps) * 100);
      const { blob: mainPdfBlob, filename: mainFilename } = await generatePDFWithFilename(data);

      // Step 3: Generate family visa document if needed
      if (hasFamilyVisaDoc) {
        updateProgress('Generating family visa document...', (++currentStep / totalSteps) * 100);
        const { blob: familyPdfBlob, filename: familyFilename } = await generateFamilyVisaPDFWithFilename(data);
        // Family visa will be handled separately - for now we focus on the main document
      }

      // Final step: Complete
      updateProgress('Finalizing documents...', (++currentStep / totalSteps) * 100);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Log PDF generation activity
      try {
        await fetch('/api/user/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'pdf_generated',
            resource: 'cost_overview',
            details: {
              filename: mainFilename,
              client_name: data.clientDetails.companyName || `${data.clientDetails.firstName} ${data.clientDetails.lastName}`.trim(),
              authority: data.authorityInformation?.responsibleAuthority || 'Not specified',
              has_family_visa: hasFamilyVisaDoc,
              document_type: 'Cost Overview'
            }
          })
        });
      } catch (error) {
        console.error('Failed to log PDF generation activity:', error);
      }

      // Show email preview modal after successful PDF generation
      const { createEmailDataFromFormData } = await import('@/components/shared/EmailDraftGenerator');
      const emailProps = createEmailDataFromFormData(data, mainPdfBlob, mainFilename, 'COST_OVERVIEW');
      
      // Set email props to trigger the EmailDraftGenerator component
      setEmailDraftProps({
        ...emailProps,
        onSuccess: () => {
          // Clean up when email is sent successfully
          setEmailDraftProps(null);
        },
        onError: (error: string) => {
          console.error('Email sending failed:', error);
          toast.error('Failed to send email: ' + error);
          setEmailDraftProps(null);
        },
        onClose: () => {
          // Clean up when modal is closed/canceled
          setEmailDraftProps(null);
        }
      });

      // Dismiss loading toast
      toast.dismiss(loadingToast);

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss(loadingToast);
      toast.error('PDF Generation Failed', {
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        action: {
          label: 'Retry',
          onClick: () => handleGeneratePDF(data)
        }
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewPDF = async (data: OfferData): Promise<void> => {
    // Validate the entire form data using Zod schema
    try {
      await offerDataSchema.parseAsync(data);
    } catch (validationError: any) {
      // Trigger form validation to show field-level errors
      await trigger();
      
      // Scroll to and highlight the first error field
      scrollToFirstError(validationError);
      return;
    }

    // Additional basic checks for backwards compatibility  
    if (!data || !data.clientDetails || !data.authorityInformation) {
      toast.error('Missing Information', {
        description: 'Please fill out the required client details and authority information before generating the PDF.'
      });
      return;
    }

    setIsGenerating(true);
    const hasFamilyVisaDoc = hasFamilyVisas(data);

    try {
      // Generate main preview
      const { blob: mainPdfBlob, filename: mainFilename } = await generatePDFWithFilename(data);
      const mainUrl = URL.createObjectURL(mainPdfBlob);
      
      // Open main PDF in new tab for preview
      window.open(mainUrl, '_blank');
      
      // Clean up the URL after a delay to allow the browser to load it
      setTimeout(() => {
        URL.revokeObjectURL(mainUrl);
      }, 1000);

      // Generate family visa preview if needed
      if (hasFamilyVisaDoc) {
        const familyPdfBlob = await generateFamilyVisaPDF(data);
        const familyUrl = URL.createObjectURL(familyPdfBlob);
        
        // Open family visa PDF in new tab for preview
        setTimeout(() => {
          window.open(familyUrl, '_blank');
          
          // Clean up the URL after a delay
          setTimeout(() => {
            URL.revokeObjectURL(familyUrl);
          }, 1000);
        }, 500); // Slight delay to prevent browser popup blocker
      }

      // Log PDF preview activity
      try {
        await fetch('/api/user/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'pdf_previewed',
            resource: 'cost_overview',
            details: {
              filename: mainFilename,
              client_name: data.clientDetails.companyName || `${data.clientDetails.firstName} ${data.clientDetails.lastName}`.trim(),
              authority: data.authorityInformation?.responsibleAuthority || 'Not specified',
              has_family_visa: hasFamilyVisaDoc,
              document_type: 'Cost Overview'
            }
          })
        });
      } catch (error) {
        console.error('Failed to log PDF preview activity:', error);
      }

    } catch (error) {
      console.error('Error generating PDF preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Listen for PDF generation events from header buttons
  React.useEffect(() => {
    const handleGeneratePDFEvent = () => handleGeneratePDF(watchedData);
    const handlePreviewEvent = () => handlePreviewPDF(watchedData);

    window.addEventListener('generate-pdf', handleGeneratePDFEvent);
    window.addEventListener('preview-document', handlePreviewEvent);

    return () => {
      window.removeEventListener('generate-pdf', handleGeneratePDFEvent);
      window.removeEventListener('preview-document', handlePreviewEvent);
    };
  }, [watchedData]);

  // Listen for edit application events from review modal or notifications
  React.useEffect(() => {
    const handleEditApplication = (event: any) => {
      const { applicationId, formData } = event.detail;
      console.log('🔧 Pre-filling Cost Overview form with application data:', applicationId);
      
      // Pre-fill the form with the application data
      Object.keys(formData).forEach((key) => {
        if (key in watchedData) {
          setValue(key as any, formData[key]);
        }
      });
      
      // Special handling for client emails to update the component's local state
      if (formData.clientDetails?.clientEmails) {
        const emailUpdateEvent = new CustomEvent('update-client-emails', {
          detail: { emails: formData.clientDetails.clientEmails }
        });
        window.dispatchEvent(emailUpdateEvent);
      }
      
      // Show a toast notification to inform the user
      toast.success('Form loaded with your previous data. You can now make changes and resubmit.', {
        duration: 4000,
        position: 'top-center'
      });
    };

    const handleSendApprovedApplication = (event: any) => {
      const { applicationId, formData } = event.detail;
      console.log('🔧 Sending approved Cost Overview application:', applicationId);
      
      // Generate PDF and show email modal using the saved form data
      handleGeneratePDF(formData);
    };

    window.addEventListener('edit-cost-overview-application', handleEditApplication);
    window.addEventListener('send-approved-application', handleSendApprovedApplication);

    return () => {
      window.removeEventListener('edit-cost-overview-application', handleEditApplication);
      window.removeEventListener('send-approved-application', handleSendApprovedApplication);
    };
  }, [setValue]);

  return (
    <div className="space-y-8">

      {/* Enhanced Progress Dialog for PDF Generation */}
      {pdfProgress.isVisible && (
        <>
          {/* Backdrop overlay */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          
          {/* Progress dialog */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 min-w-[400px] max-w-md">
            <div className="text-center space-y-6">
              {/* Header with icon */}
              <div className="flex flex-col items-center space-y-3">
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  Generating PDF Document
                </div>
              </div>
              
              {/* Current step */}
              <div className="text-sm text-gray-600 font-medium">
                {pdfProgress.step}
              </div>
              
              {/* Progress bar with enhanced styling */}
              <div className="space-y-3">
                <Progress 
                  value={pdfProgress.progress} 
                  className="w-full h-3 bg-gray-100" 
                />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-semibold text-blue-600">
                    {Math.round(pdfProgress.progress)}%
                  </span>
                </div>
              </div>
              
              {/* Animated dots */}
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Basic Information Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Client Details Section */}
        <ClientDetailsSection 
          register={register}
          errors={errors}
          watchedData={watchedData}
          handlers={handlers}
          setValue={setValue}
        />

        {/* Company Setup Section */}
        <CompanySetupSection
          register={register}
          errors={errors}
          watchedData={watchedData}
          handlers={handlers}
          setValue={setValue}
          formattedInputs={formattedInputs}
          validationErrors={validationErrors}
          shareCapitalAlert={shareCapitalAlert}
        />

        {/* Authority Information Section */}
        <AuthorityInfoSection 
          register={register}
          errors={errors}
          watchedData={watchedData}
          setValue={setValue}
          formattedInputs={formattedInputs}
          handlers={handlers}
          validationErrors={validationErrors}
          shareCapitalAlert={shareCapitalAlert}
          activityCodesArray={activityCodesArray}
          authorityConfig={authorityConfig}
        />
      </div>

      {/* Authority-Specific Sections */}
      {isAuthoritySelected && authorityConfig && (
        <>
          {/* License Fees Section with sticky summary */}
          <SectionWithStickySummary
            sectionId="license-fees"
            summaryTitle="Initial Setup Cost"
            costs={costs?.initialSetup}
            watchedData={watchedData}
            authorityConfig={authorityConfig}
            gradientColors="bg-gradient-to-r from-green-100 to-emerald-100 border-green-200"
            iconColor="bg-green-600"
            includeDeposits={true}
            showSummary={hasCalculations && !!costs?.initialSetup}
          >
            <LicenseFeesSection 
              register={register}
              errors={errors}
              watchedData={watchedData}
              setValue={setValue}
              authorityConfig={authorityConfig}
              formatNumberWithSeparators={formatNumberWithSeparators}
              parseFormattedNumber={parseFormattedNumber}
            />
          </SectionWithStickySummary>

          {/* Visa Costs Section with sticky summary (only if authority supports visas) */}
          {authorityConfig.visaCosts && (
            <SectionWithStickySummary
              sectionId="visa-costs"
              summaryTitle="Visa Costs Summary"
              costs={costs?.visaCosts}
              watchedData={watchedData}
              authorityConfig={authorityConfig}
              gradientColors="bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200"
              iconColor="bg-blue-600"
              showSummary={hasCalculations && !!costs?.visaCosts}
            >
              <VisaCostsSection 
                register={register}
                errors={errors}
                watchedData={watchedData}
                authorityConfig={authorityConfig}
                visaDetailsArray={visaDetailsArray}
                setValue={setValue}
              />
            </SectionWithStickySummary>
          )}

          {/* Spouse Visa Section (for authorities that support it) */}
          {authorityConfig.visaCosts?.spouseVisaStandardFee && (
            <SectionWithStickySummary
              sectionId="spouse-visa"
              summaryTitle="Spouse Visa Summary"
              costs={costs?.visaCosts}
              watchedData={watchedData}
              authorityConfig={authorityConfig}
              gradientColors="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200"
              iconColor="bg-pink-500"
              showSummary={hasCalculations && !!(costs?.visaCosts && watchedData.visaCosts?.spouseVisa)}
              visaType="spouse"
            >
              <SpouseVisaSection 
                register={register}
                errors={errors}
                watchedData={watchedData}
                authorityConfig={authorityConfig}
                setValue={setValue}
              />
            </SectionWithStickySummary>
          )}

          {/* Child Visa Section (for authorities that support it) */}
          {authorityConfig.visaCosts?.childVisaStandardFee && (
            <SectionWithStickySummary
              sectionId="child-visa"
              summaryTitle="Child Visa Summary"
              costs={costs?.visaCosts}
              watchedData={watchedData}
              authorityConfig={authorityConfig}
              gradientColors="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200"
              iconColor="bg-purple-500"
              showSummary={hasCalculations && !!(costs?.visaCosts && watchedData.visaCosts?.childVisa)}
              visaType="child"
            >
              <ChildVisaSection 
                register={register}
                errors={errors}
                watchedData={watchedData}
                authorityConfig={authorityConfig}
                setValue={setValue}
              />
            </SectionWithStickySummary>
          )}

          {/* Additional Services Section with yearly running summary */}
          <SectionWithStickySummary
            sectionId="additional-services"
            summaryTitle={(() => {
              const licenseYears = watchedData.ifzaLicense?.licenseYears || 1;
              const isMultiYear = authorityConfig.id === 'ifza' && licenseYears > 1;
              return isMultiYear 
                ? `Yearly Running Cost (After ${licenseYears} Years)`
                : "Yearly Running Cost";
            })()}
            costs={costs?.yearlyRunning}
            watchedData={watchedData}
            authorityConfig={authorityConfig}
            gradientColors="bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200"
            iconColor="bg-yellow-500"
            showSummary={hasCalculations && !!costs?.yearlyRunning}
          >
            <AdditionalServicesSection 
              formattedInputs={formattedInputs}
              handlers={handlers}
              updateFormattedInput={updateFormattedInput}
            />
          </SectionWithStickySummary>

          {/* Full Cost Summaries - COMMENTED OUT - Detailed breakdown sections under additional services */}
          {/* {hasCalculations && costs && (
            <div className="space-y-8 mt-12">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Cost Overview</h2>
                <p className="text-gray-600">Detailed breakdown of all costs</p>
              </div>

              {/* Initial Setup Cost Summary */}
              {/* {costs.initialSetup && (
                <CostSummarySection 
                  title="Initial Setup Cost Summary"
                  costs={costs.initialSetup}
                  watchedData={watchedData}
                  authorityConfig={authorityConfig}
                  gradientColors="bg-gradient-to-r from-green-100 to-emerald-100 border-green-200"
                  iconColor="bg-green-600"
                  includeDeposits={true}
                />
              )} */}

              {/* Visa Cost Summary (only if has visa costs) */}
              {/* {costs.visaCosts && costs.visaCosts.total > 0 && (
                <CostSummarySection 
                  title="Visa Cost Summary for 2 Year Employment Visa"
                  costs={costs.visaCosts}
                  watchedData={watchedData}
                  authorityConfig={authorityConfig}
                  gradientColors="bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200"
                  iconColor="bg-blue-600"
                />
              )} */}

              {/* Yearly Running Cost Summary */}
              {/* {costs.yearlyRunning && (() => {
                const licenseYears = watchedData.ifzaLicense?.licenseYears || 1;
                const isMultiYear = authorityConfig.id === 'ifza' && licenseYears > 1;
                const title = isMultiYear 
                  ? `Yearly Running Cost Summary (After ${licenseYears} Years)`
                  : "Yearly Running Cost Summary";
                
                return (
                  <CostSummarySection 
                    title={title}
                    costs={costs.yearlyRunning}
                    watchedData={watchedData}
                    authorityConfig={authorityConfig}
                    gradientColors="bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200"
                    iconColor="bg-yellow-500"
                  />
                );
              })()} */}
            {/* </div>
          )} */}
        </>
      )}

      {/* Generate and Preview Buttons - Only show when authority is selected or AI assistant has been used */}
      {(isAuthoritySelected || aiAssistant.hasBeenUsed) && (
        <div className="text-center animate-in slide-in-from-bottom duration-500">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              type="button"
              onClick={() => handlePreviewPDF(watchedData)}
              disabled={isGenerating}
              className="px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-3 border-2"
              style={{ 
                backgroundColor: isGenerating ? '#f3f4f6' : 'transparent',
                borderColor: isGenerating ? '#9CA3AF' : '#243F7B',
                color: isGenerating ? '#9CA3AF' : '#243F7B',
                fontFamily: 'Inter, sans-serif'
              }}
              onMouseEnter={(e) => !isGenerating && ((e.target as HTMLElement).style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => !isGenerating && ((e.target as HTMLElement).style.transform = 'scale(1)')}
              onMouseDown={(e) => !isGenerating && ((e.target as HTMLElement).style.transform = 'scale(0.98)')}
              onMouseUp={(e) => !isGenerating && ((e.target as HTMLElement).style.transform = 'scale(1.02)')}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#9CA3AF' }}></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5" />
                  <span>Preview PDF</span>
                </>
              )}
            </button>
            
            {/* Submit for Review Button */}
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              disabled={reviewApp.isLoading}
              className="px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-3"
              style={{ 
                backgroundColor: reviewApp.isLoading ? '#9CA3AF' : '#D2BC99',
                color: '#243F7B',
                fontFamily: 'Inter, sans-serif'
              }}
              onMouseEnter={(e) => !reviewApp.isLoading && ((e.target as HTMLElement).style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => !reviewApp.isLoading && ((e.target as HTMLElement).style.transform = 'scale(1)')}
              onMouseDown={(e) => !reviewApp.isLoading && ((e.target as HTMLElement).style.transform = 'scale(0.98)')}
              onMouseUp={(e) => !reviewApp.isLoading && ((e.target as HTMLElement).style.transform = 'scale(1.02)')}
            >
              {reviewApp.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#243F7B' }}></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-5 w-5" />
                  <span>Submit for Review</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => handleGeneratePDF(watchedData)}
              disabled={isGenerating}
              className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-3"
              style={{ 
                backgroundColor: isGenerating ? '#9CA3AF' : '#243F7B',
                fontFamily: 'Inter, sans-serif'
              }}
              onMouseEnter={(e) => !isGenerating && ((e.target as HTMLElement).style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => !isGenerating && ((e.target as HTMLElement).style.transform = 'scale(1)')}
              onMouseDown={(e) => !isGenerating && ((e.target as HTMLElement).style.transform = 'scale(0.98)')}
              onMouseUp={(e) => !isGenerating && ((e.target as HTMLElement).style.transform = 'scale(1.02)')}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}


      {/* AI Assistant Chat Interface - Modal Mode */}
      <ChatInterface
        isOpen={chatPanel.isOpen}
        isMinimized={chatPanel.isMinimized}
        onClose={handleCloseChat}
        onOpen={handleOpenChat}
        onToggleMinimize={chatPanel.toggleMinimize}
        messages={aiAssistant.messages}
        onSendMessage={aiAssistant.sendMessage}
        onClearHistory={aiAssistant.clearHistory}
        isLoading={aiAssistant.isLoading}
        error={aiAssistant.error}
      />
      
      {/* Review Submission Modal */}
      <ReviewSubmissionModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        applicationId={reviewApp.application?.id?.toString() || 'new'}
        applicationTitle={(() => {
          // Use the same filename generation as the actual PDF export
          try {
            const filename = generateDynamicFilename(watchedData);
            // Remove the .pdf extension for display
            return filename.replace('.pdf', '');
          } catch (error) {
            // Fallback to basic format if generation fails
            const date = new Date(watchedData.clientDetails?.date || new Date());
            const yy = date.getFullYear().toString().slice(-2);
            const mm = (date.getMonth() + 1).toString().padStart(2, '0');
            const dd = date.getDate().toString().padStart(2, '0');
            const formattedDate = `${yy}${mm}${dd}`;
            
            let nameForTitle = '';
            if (watchedData.clientDetails?.companyName) {
              nameForTitle = watchedData.clientDetails.companyName;
            } else if (watchedData.clientDetails?.lastName && watchedData.clientDetails?.firstName) {
              nameForTitle = `${watchedData.clientDetails.lastName} ${watchedData.clientDetails.firstName}`;
            } else if (watchedData.clientDetails?.firstName) {
              nameForTitle = watchedData.clientDetails.firstName;
            } else if (watchedData.clientDetails?.lastName) {
              nameForTitle = watchedData.clientDetails.lastName;
            } else {
              nameForTitle = 'Client';
            }
            
            const authority = watchedData.authorityInformation?.responsibleAuthority || 'setup';
            return `${formattedDate} ${nameForTitle} offer ${authority}`;
          }
        })()}
        onSubmit={reviewApp.submitForReview}
      />
      
      {/* Email Draft Generator with Preview Modal */}
      {emailDraftProps && (
        <EmailDraftGenerator {...emailDraftProps} />
      )}
    </div>
  );
};

export default CostOverviewTab; 