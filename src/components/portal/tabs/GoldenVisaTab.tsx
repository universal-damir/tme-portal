'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Download, Eye, FileText, Send, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { GoldenVisaData, GOLDEN_VISA_DEFAULTS, GoldenVisaType } from '@/types/golden-visa';
import { goldenVisaSchema } from '@/lib/validations';
import { useSharedClient } from '@/contexts/SharedClientContext';
import { useAuth } from '@/contexts/AuthContext';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { NumberInputField } from './NumberInputField';
import { EmailDraftGenerator, EmailDraftGeneratorProps } from '@/components/shared/EmailDraftGenerator';
import {
  ClientDetailsSection,
  VisaTypeSection,
  CompanySelectionSection,
  NOCRequirementsSection,
  DependentVisasSection
} from '../../golden-visa';
import { useGoldenVisaApplication } from '@/hooks/useGoldenVisaApplication';
import { ReviewSubmissionModal } from '@/components/review-system/modals/ReviewSubmissionModal';


const GoldenVisaTab: React.FC = () => {
  
  const { clientInfo, updateClientInfo } = useSharedClient();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [emailDraftProps, setEmailDraftProps] = useState<EmailDraftGeneratorProps | null>(null);
  const [showGermanButton, setShowGermanButton] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);


  // Form state management
  const {
    register,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<GoldenVisaData>({
    resolver: zodResolver(goldenVisaSchema),
    mode: 'onChange',
    defaultValues: {
      // Client Details
      firstName: '',
      lastName: '',
      companyName: '',
      date: new Date().toISOString().split('T')[0],
      
      // Secondary currency
      secondaryCurrency: GOLDEN_VISA_DEFAULTS.clientDetails.secondaryCurrency,
      exchangeRate: GOLDEN_VISA_DEFAULTS.clientDetails.exchangeRate,
      
      // Form data - Default to TME Management instead of FZCO
      companyType: 'management-consultants',
      visaType: 'property-investment',
      primaryVisaRequired: GOLDEN_VISA_DEFAULTS.primaryVisaRequired,
      governmentFee: GOLDEN_VISA_DEFAULTS.propertyInvestment.governmentFee,
      tmeServicesFee: GOLDEN_VISA_DEFAULTS.propertyInvestment.tmeServicesFee,
      requiresNOC: false,
      selectedFreezone: undefined,
      
      // Initialize authority fees
      propertyAuthorityFees: GOLDEN_VISA_DEFAULTS.propertyAuthorityFees,
      skilledEmployeeAuthorityFees: GOLDEN_VISA_DEFAULTS.skilledEmployeeAuthorityFees,
      
      dependents: {
        spouse: {
          required: false,
          governmentFee: GOLDEN_VISA_DEFAULTS.dependents.spouse.governmentFee,
          tmeServicesFee: GOLDEN_VISA_DEFAULTS.dependents.spouse.tmeServicesFee,
        },
        children: {
          count: 0,
          governmentFee: GOLDEN_VISA_DEFAULTS.dependents.child.governmentFee,
          tmeServicesFee: GOLDEN_VISA_DEFAULTS.dependents.child.tmeServicesFee,
        },
      },
      
      // Initialize dependent authority fees with default values
      dependentAuthorityFees: {
        professionalPassportPicture: 0,
        dependentFileOpening: 0,
        mandatoryUaeMedicalTest: 0,
        emiratesIdFee: 0,
        immigrationResidencyFeeSpouse: 0,
        immigrationResidencyFeeChild: 0,
        visaCancelation: false,
        visaCancelationFee: 0,
        thirdPartyCosts: 0,
      },
    },
  });

  const watchedData = watch();

  // Helper function to scroll to and highlight the first error field
  const scrollToFirstError = (validationError: any) => {
    const errors = validationError.errors || [];
    if (errors.length === 0) return;
    
    // Prioritize errors - mandatory fields first, then others
    const priorityOrder = [
      'firstName',
      'lastName',
      'email', // This will come from clientInfo validation
      'companyType',
      'visaType',
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
        }, 600);
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
    } else {
      // Simple fallback - scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Review system integration
  const reviewApp = useGoldenVisaApplication({
    formData: watchedData,
    clientName: clientInfo.companyName || `${watchedData.firstName} ${watchedData.lastName}`.trim()
  });

  // Initialize form with shared client context (only once on mount)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && (clientInfo.firstName || clientInfo.lastName)) {
      setValue('firstName', clientInfo.firstName || '');
      setValue('lastName', clientInfo.lastName || '');
      setValue('companyName', ''); // Golden Visa doesn't use company name
      setValue('date', clientInfo.date);
      initializedRef.current = true;
    }
  }, [clientInfo, setValue]);

  // Update shared client info when form changes (debounced)
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    const { firstName, lastName, date } = watchedData;
    
    // Clear previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Debounce the update to prevent rapid fire updates
    updateTimeoutRef.current = setTimeout(() => {
      updateClientInfo({
        firstName: firstName || '',
        lastName: lastName || '',
        companyName: '', // Golden Visa doesn't use company name
        date: date || new Date().toISOString().split('T')[0],
      });
    }, 100); // Small delay to prevent loops
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [
    watchedData.firstName, 
    watchedData.lastName, 
    watchedData.date,
    updateClientInfo
  ]);

  // Handle visa type change - update defaults
  const handleVisaTypeChange = (visaType: GoldenVisaType) => {
    setValue('visaType', visaType);
    
    switch (visaType) {
      case 'property-investment':
        setValue('governmentFee', GOLDEN_VISA_DEFAULTS.propertyInvestment.governmentFee);
        setValue('tmeServicesFee', GOLDEN_VISA_DEFAULTS.propertyInvestment.tmeServicesFee);
        // Set authority fees for property investment
        setValue('propertyAuthorityFees', GOLDEN_VISA_DEFAULTS.propertyAuthorityFees);
        // Clear other visa type fields
        setValue('freezoneNocFee', undefined);
        setValue('governmentCostsSkilledEmployee', undefined);
        setValue('skilledEmployeeAuthorityFees', undefined);
        setValue('requiresNOC', false);
        setValue('selectedFreezone', undefined);
        break;
      case 'time-deposit':
        setValue('governmentFee', GOLDEN_VISA_DEFAULTS.timeDeposit.governmentFee);
        setValue('tmeServicesFee', GOLDEN_VISA_DEFAULTS.timeDeposit.tmeServicesFee);
        // Set authority fees for time deposit (no DLD fee - same structure as skilled employee)
        setValue('skilledEmployeeAuthorityFees', GOLDEN_VISA_DEFAULTS.skilledEmployeeAuthorityFees);
        // Clear other visa type fields
        setValue('propertyAuthorityFees', undefined);
        setValue('freezoneNocFee', undefined);
        setValue('governmentCostsSkilledEmployee', undefined);
        setValue('requiresNOC', false);
        setValue('selectedFreezone', undefined);
        break;
      case 'skilled-employee':
        setValue('freezoneNocFee', GOLDEN_VISA_DEFAULTS.skilledEmployee.freezoneNocFee);
        setValue('governmentCostsSkilledEmployee', GOLDEN_VISA_DEFAULTS.skilledEmployee.governmentCostsSkilledEmployee);
        setValue('tmeServicesFee', GOLDEN_VISA_DEFAULTS.skilledEmployee.tmeServicesFee);
        // Set authority fees for skilled employee
        setValue('skilledEmployeeAuthorityFees', GOLDEN_VISA_DEFAULTS.skilledEmployeeAuthorityFees);
        // Clear other visa type fields
        setValue('governmentFee', 0);
        setValue('propertyAuthorityFees', undefined);
        setValue('requiresNOC', false);
        setValue('selectedFreezone', undefined); // Don't default to any freezone
        break;
    }
  };

  // Handle primary visa requirement change
  const handlePrimaryVisaChange = (required: boolean) => {
    setValue('primaryVisaRequired', required);
  };

  // Handle secondary currency radio click
  const handleSecondaryCurrencyChange = (currency: 'EUR' | 'USD' | 'GBP') => {
    setValue('secondaryCurrency', currency);
  };



  // PDF generation using Golden Visa template
  const handleGeneratePDF = async (data: GoldenVisaData) => {
    // Validate the entire form data using Zod schema
    try {
      await goldenVisaSchema.parseAsync(data);
    } catch (validationError: any) {
      // Trigger form validation to show field-level errors
      await trigger();
      
      // Scroll to and highlight the first error field
      scrollToFirstError(validationError);
      return;
    }

    // Additional check for email from form data
    const validEmails = data.clientEmails?.filter(email => email && email.trim() !== '') || [];
    if (validEmails.length === 0) {
      toast.error('Missing Information', {
        description: 'Email is required. Please provide at least one client email address.'
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Generate PDF document
      const { generateGoldenVisaPDFWithFilename } = await import('@/lib/pdf-generator/utils/goldenVisaGenerator');
      // Convert form data to shared client format for PDF generation
      const clientInfo = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        companyName: data.companyName || '',
        date: data.date,
      };
      const { blob, filename } = await generateGoldenVisaPDFWithFilename(data, clientInfo);

      // Log PDF generation activity
      try {
        await fetch('/api/user/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'pdf_generated',
            resource: 'golden_visa',
            details: {
              filename: filename,
              client_name: data.companyName || `${data.firstName} ${data.lastName}`.trim(),
              visa_type: data.visaType,
              document_type: 'Golden Visa'
            }
          })
        });
      } catch (error) {
        console.error('Failed to log PDF generation activity:', error);
      }

      // Show email preview modal after successful PDF generation
      const { createEmailDataFromFormData } = await import('@/components/shared/EmailDraftGenerator');
      const emailProps = createEmailDataFromFormData(data, blob, filename, 'GOLDEN_VISA', user || undefined);
      
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

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('PDF Generation Failed', {
        description: `Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        action: {
          label: 'Retry',
          onClick: () => handleGeneratePDF(data)
        }
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // German PDF preview handler
  const handlePreviewGermanPDF = async (data: GoldenVisaData) => {
    // Validate the entire form data using Zod schema
    try {
      await goldenVisaSchema.parseAsync(data);
    } catch (validationError: any) {
      // Trigger form validation to show field-level errors
      await trigger();
      
      // Scroll to and highlight the first error field
      scrollToFirstError(validationError);
      return;
    }
    // Additional check for email from form data
    const validEmails = data.clientEmails?.filter(email => email && email.trim() !== '') || [];
    if (validEmails.length === 0) {
      toast.error('Missing Information', {
        description: 'Email is required. Please provide at least one client email address.'
      });
      return;
    }
    setIsGenerating(true);
    try {
      // Generate German preview document
      const { generateGoldenVisaPDFWithFilename } = await import('@/lib/pdf-generator/utils/goldenVisaGenerator');
      // Convert form data to shared client format for PDF generation
      const clientInfo = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        companyName: data.companyName || '',
        date: data.date,
      };
      const { blob, filename } = await generateGoldenVisaPDFWithFilename(data, clientInfo, 'de');
      
      // Open PDF in new tab for preview
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      toast.success('German Preview Generated', {
        description: 'German PDF preview opened in new tab 🇩🇪'
      });
    } catch (error) {
      console.error('Error generating German PDF preview:', error);
      toast.error('German Preview Failed', {
        description: 'Error generating German PDF preview. Please try again.',
        action: {
          label: 'Retry',
          onClick: () => handlePreviewGermanPDF(data)
        }
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit for review validation handler
  const handleSubmitForReview = async () => {
    // Validate the entire form data using Zod schema
    try {
      await goldenVisaSchema.parseAsync(watchedData);
    } catch (validationError: any) {
      // Trigger form validation to show field-level errors
      await trigger();
      
      // Scroll to and highlight the first error field
      scrollToFirstError(validationError);
      return;
    }

    // Additional check for email from form data
    const validEmails = watchedData.clientEmails?.filter(email => email && email.trim() !== '') || [];
    if (validEmails.length === 0) {
      toast.error('Missing Information', {
        description: 'Email is required. Please provide at least one client email address.'
      });
      return;
    }

    // If validation passes, open review modal
    setIsReviewModalOpen(true);
  };

  const handlePreviewPDF = async (data: GoldenVisaData) => {
    // Validate the entire form data using Zod schema
    try {
      await goldenVisaSchema.parseAsync(data);
    } catch (validationError: any) {
      // Trigger form validation to show field-level errors
      await trigger();
      
      // Scroll to and highlight the first error field
      scrollToFirstError(validationError);
      return;
    }

    // Additional check for email from form data
    const validEmails = data.clientEmails?.filter(email => email && email.trim() !== '') || [];
    if (validEmails.length === 0) {
      toast.error('Missing Information', {
        description: 'Email is required. Please provide at least one client email address.'
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Generate preview document
      const { generateGoldenVisaPDFWithFilename } = await import('@/lib/pdf-generator/utils/goldenVisaGenerator');
      // Convert form data to shared client format for PDF generation
      const clientInfo = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        companyName: data.companyName || '',
        date: data.date,
      };
      const { blob, filename } = await generateGoldenVisaPDFWithFilename(data, clientInfo);
      
      // Open PDF in new tab for preview
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      // Log PDF preview activity
      try {
        await fetch('/api/user/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'pdf_previewed',
            resource: 'golden_visa',
            details: {
              filename: filename,
              client_name: data.companyName || `${data.firstName} ${data.lastName}`.trim(),
              visa_type: data.visaType,
              document_type: 'Golden Visa'
            }
          })
        });
      } catch (error) {
        console.error('Failed to log PDF preview activity:', error);
      }

    } catch (error) {
      console.error('Error generating PDF preview:', error);
      toast.error('Preview Generation Failed', {
        description: 'Error generating PDF preview. Please try again.',
        action: {
          label: 'Retry',
          onClick: () => handlePreviewPDF(data)
        }
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle sending PDF to client (for approved applications)
  const handleSendPDF = useCallback(async (data: GoldenVisaData) => {
    console.log('🔧 Golden Visa handleSendPDF called with data:', data);
    
    // Validate required client data
    if (!data.firstName && !data.lastName) {
      console.error('🔧 Golden Visa missing client name:', data);
      toast.error('Client Name Required', {
        description: 'The saved application data is missing client name information.'
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Generate PDF document
      const { generateGoldenVisaPDFWithFilename } = await import('@/lib/pdf-generator/utils/goldenVisaGenerator');
      // Convert form data to shared client format for PDF generation
      const clientInfo = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        companyName: data.companyName || '',
        date: data.date,
      };

      const { blob, filename } = await generateGoldenVisaPDFWithFilename(data, clientInfo);

      // Log PDF sent activity (different from generation)
      try {
        await fetch('/api/user/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'pdf_sent',
            resource: 'golden_visa',
            details: {
              filename: filename,
              client_name: data.companyName || `${data.firstName} ${data.lastName}`.trim(),
              visa_type: data.visaType,
              document_type: 'Golden Visa'
            }
          })
        });
      } catch (error) {
        console.error('Failed to log PDF sent activity:', error);
      }

      // Show email preview modal after successful PDF generation
      const { createEmailDataFromFormData } = await import('@/components/shared/EmailDraftGenerator');
      const emailProps = createEmailDataFromFormData(data, blob, filename, 'GOLDEN_VISA', user || undefined);
      
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
        },
        activityLogging: {
          resource: 'golden_visa',
          client_name: data.companyName || `${data.firstName} ${data.lastName}`.trim(),
          document_type: 'Golden Visa',
          filename: filename
        }
      });

    } catch (error) {
      console.error('Error sending PDF:', error);
      toast.error('PDF Send Failed', {
        description: `Error sending PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        action: {
          label: 'Retry',
          onClick: () => handleSendPDF(data)
        }
      });
    } finally {
      setIsGenerating(false);
    }
  }, []);

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
      console.log('🔧 Pre-filling form with application data:', applicationId);
      
      // Pre-fill the form with the application data
      Object.keys(formData).forEach((key) => {
        if (key in watchedData) {
          setValue(key as any, formData[key]);
        }
      });
      
      // Special handling for client emails to update the component's local state
      if (formData.clientEmails) {
        const emailUpdateEvent = new CustomEvent('update-client-emails', {
          detail: { emails: formData.clientEmails }
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
      console.log('🔧 GOLDEN-VISA-TAB: Event received - send approved application:', applicationId);
      console.log('🔧 GOLDEN-VISA-TAB: Form data received:', formData);
      console.log('🔧 GOLDEN-VISA-TAB: Current tab active?', window.location.hash === '#golden-visa');
      
      // Send confirmation that the event was received
      const confirmationEvent = new CustomEvent('send-approved-application-confirmed', {
        detail: { applicationId, formType: 'golden-visa' }
      });
      window.dispatchEvent(confirmationEvent);
      
      // Send PDF to client using the saved form data
      handleSendPDF(formData);
    };

    const handleTabReadinessCheck = (event: any) => {
      const { targetTab } = event.detail;
      console.log('🔧 GOLDEN-VISA-TAB: Readiness check received for tab:', targetTab);
      
      // Only respond if this is our tab
      if (targetTab === 'golden-visa') {
        console.log('🔧 GOLDEN-VISA-TAB: Confirming tab readiness');
        const readinessEvent = new CustomEvent('tab-readiness-confirmed', {
          detail: { tab: 'golden-visa', ready: true }
        });
        window.dispatchEvent(readinessEvent);
      }
    };

    window.addEventListener('edit-golden-visa-application', handleEditApplication);
    window.addEventListener('send-approved-application', handleSendApprovedApplication);
    window.addEventListener('tab-readiness-check', handleTabReadinessCheck);

    console.log('🔧 GOLDEN-VISA-TAB: Event listeners registered');

    return () => {
      window.removeEventListener('edit-golden-visa-application', handleEditApplication);
      window.removeEventListener('send-approved-application', handleSendApprovedApplication);
      window.removeEventListener('tab-readiness-check', handleTabReadinessCheck);
      console.log('🔧 GOLDEN-VISA-TAB: Event listeners removed');
    };
  }, [handleSendPDF]); // Include handleSendPDF so it can be accessed in event handlers

  // Long press handlers for German preview
  const handleLongPressStart = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setShowGermanButton(true);
    }, 800); // 0.8 second long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePreviewClick = () => {
    // Small delay to check if this was a long press
    setTimeout(() => {
      if (!isLongPressRef.current) {
        handlePreviewPDF(watchedData);
      }
      isLongPressRef.current = false;
    }, 50);
  };

  return (
    <div className="space-y-8" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Client Details Section */}
      <ClientDetailsSection
        data={watchedData}
        register={register}
        errors={errors}
        onSecondaryCurrencyChange={handleSecondaryCurrencyChange}
        setValue={setValue}
      />

      {/* Company Selection */}
      <CompanySelectionSection
        register={register}
      />

      {/* Golden Visa Type Selection with Authority Costs on Right */}
      <VisaTypeSection
        register={register}
        errors={errors}
        onVisaTypeChange={handleVisaTypeChange}
        primaryVisaRequired={watchedData.primaryVisaRequired}
        onPrimaryVisaChange={handlePrimaryVisaChange}
        currentVisaType={watchedData.visaType}
        data={watchedData}
        onFieldChange={(path, value) => setValue(path as any, value)}
      />

      {/* Dependents Section */}
      <DependentVisasSection
        data={watchedData}
        register={register}
        onFieldChange={(path, value) => setValue(path as any, value)}
      />

      {/* Generate PDF Buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-center"
      >
        <div className="flex justify-center space-x-4 relative">
          <div className="relative">
            <motion.button
              whileHover={!isGenerating ? { scale: 1.02 } : {}}
              whileTap={!isGenerating ? { scale: 0.98 } : {}}
              type="button"
              onClick={handlePreviewClick}
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              disabled={isGenerating}
              className="px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center space-x-3 border-2"
              style={{ 
                backgroundColor: isGenerating ? '#f3f4f6' : 'transparent',
                borderColor: isGenerating ? '#9CA3AF' : '#243F7B',
                color: isGenerating ? '#9CA3AF' : '#243F7B'
              }}
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
            </motion.button>

            {/* Hidden German Preview Button - Shows on long press */}
            {showGermanButton && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-20"
                style={{ pointerEvents: 'auto' }}
              >
                {/* Background overlay to capture clicks outside */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowGermanButton(false)}
                />
                
                <div className="relative z-20">
                  {/* Small arrow pointing down */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div 
                      className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
                      style={{ borderTopColor: '#D2BC99' }}
                    />
                  </div>
                  
                  <motion.button
                    whileHover={!isGenerating ? { scale: 1.05 } : {}}
                    whileTap={!isGenerating ? { scale: 0.95 } : {}}
                    type="button"
                    onClick={() => {
                      handlePreviewGermanPDF(watchedData);
                      setShowGermanButton(false); // Hide after use
                    }}
                    disabled={isGenerating}
                    className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center space-x-2 border-2 shadow-lg backdrop-blur-sm"
                    style={{ 
                      backgroundColor: isGenerating ? '#f3f4f6' : '#D2BC99',
                      borderColor: isGenerating ? '#9CA3AF' : '#243F7B',
                      color: isGenerating ? '#9CA3AF' : '#243F7B'
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#9CA3AF' }}></div>
                        <span className="text-sm">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-5 w-5" />
                        <span>German Preview 🇩🇪</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Submit for Review Button */}
          <motion.button
            whileHover={!reviewApp.isLoading ? { scale: 1.02 } : {}}
            whileTap={!reviewApp.isLoading ? { scale: 0.98 } : {}}
            type="button"
            onClick={handleSubmitForReview}
            disabled={reviewApp.isLoading}
            className="px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-3"
            style={{ 
              backgroundColor: reviewApp.isLoading ? '#9CA3AF' : '#D2BC99', 
              color: '#243F7B' 
            }}
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
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => handleGeneratePDF(watchedData)}
            disabled={isGenerating}
            className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center space-x-3"
            style={{ backgroundColor: '#243F7B' }}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>Send</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
      
      {/* Review Submission Modal */}
      <ReviewSubmissionModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        applicationId={reviewApp.application?.id?.toString() || 'new'}
        applicationTitle={(() => {
          // Generate title using PDF naming convention
          const date = new Date(watchedData.date || new Date());
          const yy = date.getFullYear().toString().slice(-2);
          const mm = (date.getMonth() + 1).toString().padStart(2, '0');
          const dd = date.getDate().toString().padStart(2, '0');
          const formattedDate = `${yy}${mm}${dd}`;
          
          let nameForTitle = '';
          if (clientInfo.companyName) {
            nameForTitle = clientInfo.companyName;
          } else if (watchedData.lastName && watchedData.firstName) {
            nameForTitle = `${watchedData.lastName} ${watchedData.firstName}`;
          } else if (watchedData.firstName) {
            nameForTitle = watchedData.firstName;
          } else if (watchedData.lastName) {
            nameForTitle = watchedData.lastName;
          } else {
            nameForTitle = 'Client';
          }
          
          // Determine if this is a dependent-only visa (no primary holder)
          const isDependentOnly = !watchedData.primaryVisaRequired;
          
          let visaTypeFormatted: string;
          
          if (isDependentOnly) {
            // If only dependents are getting visas, use "dependent" suffix
            visaTypeFormatted = 'dependent';
          } else {
            // Format visa type for title (shortened versions)
            const visaTypeMap: { [key: string]: string } = {
              'property-investment': 'property',
              'time-deposit': 'deposit',
              'skilled-employee': 'skilled'
            };
            
            visaTypeFormatted = visaTypeMap[watchedData.visaType] || watchedData.visaType;
          }
          
          return `${formattedDate} ${nameForTitle} offer golden visa ${visaTypeFormatted}`;
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

export default GoldenVisaTab; 