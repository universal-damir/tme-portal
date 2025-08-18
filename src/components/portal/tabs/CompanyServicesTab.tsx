'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Download, Eye, FileText, Send, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmailDraftGenerator, EmailDraftGeneratorProps } from '@/components/shared/EmailDraftGenerator';
import { ReviewSubmissionModal } from '@/components/review-system/modals/ReviewSubmissionModal';
import { CompanyServicesData, COMPANY_SERVICES_DEFAULTS } from '@/types/company-services';
import { companyServicesSchema } from '@/lib/validations';
import { useSharedClient } from '@/contexts/SharedClientContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyServicesApplication } from '@/hooks/useCompanyServicesApplication';
import { FormSection } from '../../cost-overview/ui/FormSection';
import { 
  ClientDetailsSection,
  CompanySelectionSection,
  TaxConsultingServicesSection,
  AccountingServicesSection,
  BackOfficeServicesSection,
  ComplianceServicesSection
} from '../../company-services';

const CompanyServicesTab: React.FC = () => {
  const { 
    clientInfo, 
    updateClientInfo, 
    clearClientInfo, 
    setWorkflowState, 
    workflowState,
    loadFromApplication,
    getPreservedFormData 
  } = useSharedClient();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailDraftProps, setEmailDraftProps] = useState<EmailDraftGeneratorProps | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  // Debug logging for workflow state
  React.useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('DEBUG_SHARED_CONTEXT') === 'true') {
      console.log('[CompanyServicesTab] Current workflow state:', workflowState);
    }
  }, [workflowState]);

  // Form state management
  const {
    register,
    watch,
    setValue,
    trigger,
    reset,
    getValues,
    formState: { errors },
  } = useForm<CompanyServicesData>({
    resolver: zodResolver(companyServicesSchema),
    mode: 'onChange',
    defaultValues: {
      // Client Details
      firstName: '',
      lastName: '',
      companyName: '',
      shortCompanyName: '',
      date: new Date().toISOString().split('T')[0],
      
      // Secondary currency
      secondaryCurrency: COMPANY_SERVICES_DEFAULTS.clientDetails.secondaryCurrency,
      exchangeRate: COMPANY_SERVICES_DEFAULTS.clientDetails.exchangeRate,
      
      // Company selection
      companyType: COMPANY_SERVICES_DEFAULTS.form.companyType,
      
      // Tax consulting services
      taxConsultingServices: COMPANY_SERVICES_DEFAULTS.form.taxConsultingServices,
      
      // Accounting services
      accountingServices: COMPANY_SERVICES_DEFAULTS.form.accountingServices,
      
      // Back-office services
      backOfficeServices: COMPANY_SERVICES_DEFAULTS.form.backOfficeServices,
      
      // Compliance services
      complianceServices: COMPANY_SERVICES_DEFAULTS.form.complianceServices,
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
      'companyName',
      'shortCompanyName',
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
  const reviewApp = useCompanyServicesApplication({
    formData: watchedData,
    clientName: watchedData.companyName || `${watchedData.firstName} ${watchedData.lastName}`.trim() || 'Client'
  });

  // Initialize form with shared client context (only once on mount)
  const initializedRef = useRef(false);
  const isLoadingRejectedRef = useRef(false); // Track if we're loading a rejected application
  useEffect(() => {
    // NEVER sync/clear when in review-rejected or review-approved state or when loading
    if (workflowState === 'review-rejected' || workflowState === 'review-approved' || isLoadingRejectedRef.current) {
      return; // Don't touch the form data when loading from review
    }
    
    // Check if context is cleared (all fields empty) and we're in fresh state
    const isContextCleared = !clientInfo.firstName && !clientInfo.lastName && !clientInfo.companyName && !clientInfo.shortCompanyName;
    const shouldSyncWhenCleared = isContextCleared && workflowState === 'fresh' && initializedRef.current && !isLoadingRejectedRef.current;
    
    if (!initializedRef.current && (clientInfo.firstName || clientInfo.lastName || clientInfo.companyName)) {
      setValue('firstName', clientInfo.firstName || '');
      setValue('lastName', clientInfo.lastName || '');
      setValue('companyName', clientInfo.companyName || '');
      setValue('shortCompanyName', clientInfo.shortCompanyName || '');
      setValue('date', clientInfo.date);
      initializedRef.current = true;
    } else if (shouldSyncWhenCleared) {
      // Also sync when context is cleared (all fields empty) and we're in fresh state
      setValue('firstName', '');
      setValue('lastName', '');
      setValue('companyName', '');
      setValue('shortCompanyName', '');
      setValue('date', new Date().toISOString().split('T')[0]);
      // Reset the flag so we can sync again if needed
      initializedRef.current = false;
    }
  }, [clientInfo, setValue, workflowState]);

  // Update shared client info when form changes (debounced)
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    // DON'T update SharedClientContext when in review states - let the form data stay as-is
    if (workflowState === 'review-rejected' || workflowState === 'review-approved') {
      return; // Don't sync to SharedClientContext when working with review data
    }
    
    const { firstName, lastName, companyName, shortCompanyName, date } = watchedData;
    
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
        shortCompanyName: shortCompanyName || '',
        date: date || new Date().toISOString().split('T')[0],
      });
    }, 100);
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [
    watchedData.firstName, 
    watchedData.lastName, 
    watchedData.companyName, 
    watchedData.shortCompanyName,
    watchedData.date,
    workflowState // Also watch workflowState to skip updates during review
    // updateClientInfo removed - it's stable from context and was causing infinite loop
  ]);

  // Handle company type change
  const handleCompanyTypeChange = (companyType: 'tme-fzco' | 'management-consultants') => {
    setValue('companyType', companyType);
  };

  // Handle secondary currency change
  const handleSecondaryCurrencyChange = (currency: 'EUR' | 'USD' | 'GBP') => {
    setValue('secondaryCurrency', currency);
    // Update exchange rate based on currency - all currencies use 4 as default
    const rates = { EUR: 4.0, USD: 4.0, GBP: 4.0 };
    setValue('exchangeRate', rates[currency]);
  };

  // Email generation removed - now handled by EmailDraftGenerator component

  // PDF generation handlers
  const handleGeneratePDF = async (data: CompanyServicesData): Promise<void> => {
    // Validate the entire form data using Zod schema
    try {
      await companyServicesSchema.parseAsync(data);
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
      // Dynamic import to avoid bundling issues
      const { generateCompanyServicesPDFWithFilename } = await import('@/lib/pdf-generator');
      
      const { blob, filename } = await generateCompanyServicesPDFWithFilename(data, clientInfo);

      // Show email preview modal after successful PDF generation
      const { createEmailDataFromFormData } = await import('@/components/shared/EmailDraftGenerator');
      const emailProps = await createEmailDataFromFormData(data, blob, filename, 'COMPANY_SERVICES', user || undefined);
      
      // Set email props to trigger the EmailDraftGenerator component
      setEmailDraftProps({
        ...emailProps,
        onSuccess: () => {
          // Clean up when email is sent successfully
          setEmailDraftProps(null);
          // Clear form after successfully sending the email
          reset();
          // Clear shared client info completely after email sent (final step)
          clearClientInfo({ 
            completeReset: true,
            source: 'email-sent'
          });
          setWorkflowState('fresh');
          toast.success('Email sent successfully', {
            description: 'The form has been cleared for the next application.'
          });
        },
        onError: (error: string) => {
          console.error('Email sending failed:', error);
          alert('Failed to send email: ' + error);
          setEmailDraftProps(null);
        },
        onClose: () => {
          // Clean up when modal is closed/canceled
          setEmailDraftProps(null);
        },
        activityLogging: {
          resource: 'company_services',
          client_name: data.companyName || `${data.firstName} ${data.lastName}`.trim(),
          document_type: 'Company Services',
          filename: filename
        }
      });

      // Log PDF generation activity
      try {
        await fetch('/api/user/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'pdf_generated',
            resource: 'company_services',
            details: {
              filename: filename,
              client_name: data.companyName || `${data.firstName} ${data.lastName}`.trim(),
              company_type: data.companyType,
              document_type: 'Company Services'
            }
          })
        });
      } catch (error) {
        console.error('Failed to log PDF generation activity:', error);
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle sending PDF to client (for approved applications)
  const handleSendPDF = async (data: CompanyServicesData): Promise<void> => {
    console.log('🔧 Company Services handleSendPDF called with data:', data);
    
    // Validate required data before sending PDF
    if (!data.firstName && !data.lastName && !data.companyName) {
      console.error('🔧 Company Services missing client/company name:', data);
      toast.error('Client Information Required', {
        description: 'The saved application data is missing client or company name information.'
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Generate PDF for sending
      const { generateCompanyServicesPDFWithFilename } = await import('@/lib/pdf-generator');
      
      const clientInfo = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        companyName: data.companyName || '',
        shortCompanyName: data.shortCompanyName || '',
        date: data.date,
      };

      const { blob, filename } = await generateCompanyServicesPDFWithFilename(data, clientInfo);

      // Log PDF sent activity (different from generation)
      try {
        await fetch('/api/user/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'pdf_sent',
            resource: 'company_services',
            details: {
              filename: filename,
              client_name: data.companyName || `${data.firstName} ${data.lastName}`.trim(),
              company_type: data.companyType,
              document_type: 'Company Services'
            }
          })
        });
      } catch (error) {
        console.error('Failed to log PDF sent activity:', error);
      }

      // Create and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error sending PDF:', error);
      alert(`Error sending PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit for review validation handler
  const handleSubmitForReview = async () => {
    // Validate the entire form data using Zod schema
    try {
      await companyServicesSchema.parseAsync(watchedData);
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

  const handlePreviewPDF = async (data: CompanyServicesData): Promise<void> => {
    // Validate the entire form data using Zod schema
    try {
      await companyServicesSchema.parseAsync(data);
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
      // Dynamic import to avoid bundling issues
      const { generateCompanyServicesPDFWithFilename } = await import('@/lib/pdf-generator');
      
      const { blob, filename } = await generateCompanyServicesPDFWithFilename(data, clientInfo);
      const url = URL.createObjectURL(blob);
      
      // Open PDF in new tab for preview
      window.open(url, '_blank');
      
      // Clean up the URL after a delay to allow the browser to load it
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
            resource: 'company_services',
            details: {
              filename: filename,
              client_name: data.companyName || `${data.firstName} ${data.lastName}`.trim(),
              company_type: data.companyType,
              document_type: 'Company Services'
            }
          })
        });
      } catch (error) {
        console.error('Failed to log PDF preview activity:', error);
      }
      
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      alert('Error generating PDF preview. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Listen for edit application events from review modal or notifications
  React.useEffect(() => {
    const handleEditApplication = (event: any) => {
      const { applicationId, formData } = event.detail;
      console.log('🟡 [CompanyServicesTab] Received edit-company-services-application event', event.detail);
      
      // Set loading flag FIRST to prevent any clearing
      isLoadingRejectedRef.current = true;
      
      // Reset the initialization flag to prevent re-syncing
      initializedRef.current = true;
      
      // Don't use reset() - manually set each field to ensure proper updates
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined) {
          setValue(key as any, formData[key], {
            shouldValidate: false,
            shouldDirty: true,
            shouldTouch: true
          });
        }
      });
      
      // Double-check critical fields with a delay
      setTimeout(() => {
        console.log('🟡 [CompanyServicesTab] Double-checking critical fields');
        if (formData.firstName) {
          setValue('firstName', formData.firstName, { 
            shouldValidate: true, 
            shouldDirty: true,
            shouldTouch: true 
          });
        }
        if (formData.lastName) {
          setValue('lastName', formData.lastName, { 
            shouldValidate: true, 
            shouldDirty: true,
            shouldTouch: true 
          });
        }
        if (formData.companyName) {
          setValue('companyName', formData.companyName, { 
            shouldValidate: true, 
            shouldDirty: true,
            shouldTouch: true 
          });
        }
        
        // Force a re-render by triggering validation
        trigger(['firstName', 'lastName', 'companyName']);
      }, 100);
      
      // NOW set workflow state after data is loaded
      setWorkflowState('review-rejected');
      
      // Clear loading flag after a short delay to ensure all effects have run
      setTimeout(() => {
        isLoadingRejectedRef.current = false;
      }, 500);
      
      console.log('🟡 [CompanyServicesTab] Form loaded with rejected application data (NOT in SharedClient)');
      
      // Show a toast notification to inform the user
      toast.success('Form loaded with your previous data. You can now make changes and resubmit.', {
        duration: 4000,
        position: 'top-center'
      });
    };

    const handleSendApprovedApplication = (event: any) => {
      const { applicationId, formData } = event.detail;
      console.log('🟢 [CompanyServicesTab] Received send-approved-application event', { applicationId, hasFormData: !!formData });
      
      // DON'T load into SharedClientContext - just use the formData directly
      setWorkflowState('review-approved');
      
      console.log('🟢 [CompanyServicesTab] Processing approved application data');
      
      // Send confirmation that the event was received
      const confirmationEvent = new CustomEvent('send-approved-application-confirmed', {
        detail: { applicationId, formType: 'company-services' }
      });
      window.dispatchEvent(confirmationEvent);
      
      // Send PDF to client using the saved form data
      handleSendPDF(formData);
    };

    const handleTabReadinessCheck = (event: any) => {
      const { targetTab } = event.detail;
      
      // Only respond if this is our tab
      if (targetTab === 'company-services') {
        const readinessEvent = new CustomEvent('tab-readiness-confirmed', {
          detail: { 
            tab: 'company-services', 
            ready: true,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(readinessEvent);
      }
    };

    window.addEventListener('edit-company-services-application', handleEditApplication);
    window.addEventListener('send-approved-application', handleSendApprovedApplication);
    window.addEventListener('tab-readiness-check', handleTabReadinessCheck);

    return () => {
      window.removeEventListener('edit-company-services-application', handleEditApplication);
      window.removeEventListener('send-approved-application', handleSendApprovedApplication);
      window.removeEventListener('tab-readiness-check', handleTabReadinessCheck);
    };
  }, [handleSendPDF, loadFromApplication, setWorkflowState]); // Include dependencies for event handlers

  return (
    <div className="space-y-8">
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
        companyType={watchedData.companyType}
        onCompanyTypeChange={handleCompanyTypeChange}
      />

      {/* Tax Consulting Services Section */}
      <TaxConsultingServicesSection
        register={register}
        errors={errors}
        data={watchedData}
        setValue={setValue}
        watchedData={watchedData}
      />

      {/* Accounting Services Section */}
      <AccountingServicesSection
        register={register}
        errors={errors}
        setValue={setValue}
        watchedData={watchedData}
      />

      {/* Back-Office Services Section */}
      <BackOfficeServicesSection
        register={register}
        errors={errors}
        data={watchedData}
        setValue={setValue}
        watchedData={watchedData}
      />

      {/* Compliance Services Section */}
      <ComplianceServicesSection
        register={register}
        errors={errors}
        data={watchedData}
        setValue={setValue}
        watchedData={watchedData}
      />

      {/* Generate and Preview Buttons */}
      <div className="text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <motion.button
            type="button"
            onClick={() => handlePreviewPDF(watchedData)}
            disabled={isGenerating}
            whileHover={!isGenerating ? { scale: 1.02 } : {}}
            whileTap={!isGenerating ? { scale: 0.98 } : {}}
            className="px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-3 border-2"
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

          {/* Submit for Review Button */}
          <motion.button
            type="button"
            onClick={handleSubmitForReview}
            disabled={reviewApp.isLoading}
            whileHover={!reviewApp.isLoading ? { scale: 1.02 } : {}}
            whileTap={!reviewApp.isLoading ? { scale: 0.98 } : {}}
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
            type="button"
            onClick={() => handleGeneratePDF(watchedData)}
            disabled={isGenerating}
            whileHover={!isGenerating ? { scale: 1.02 } : {}}
            whileTap={!isGenerating ? { scale: 0.98 } : {}}
            className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-3"
            style={{ 
              backgroundColor: isGenerating ? '#9CA3AF' : '#243F7B' 
            }}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>Download and Send</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
      
      {/* Review Submission Modal */}
      <ReviewSubmissionModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        applicationId={reviewApp.application?.id?.toString() || 'new'}
        documentType="company-services"
        applicationTitle={(() => {
          // Use the same filename generation as PDF export for consistency
          try {
            // Ensure watchedData has required fields before calling
            if (!watchedData || !watchedData.date) {
              const date = new Date();
              const yy = date.getFullYear().toString().slice(-2);
              const mm = (date.getMonth() + 1).toString().padStart(2, '0');
              const dd = date.getDate().toString().padStart(2, '0');
              return `${yy}${mm}${dd} TME Services Application`;
            }
            
            const { generateCompanyServicesFilename } = require('@/lib/pdf-generator/integrations/FilenameIntegrations');
            const filename = generateCompanyServicesFilename(watchedData, clientInfo);
            return filename.replace('.pdf', '');
          } catch (error) {
            // Fallback to basic format if generation fails
            const date = new Date(watchedData.date || new Date());
            const yy = date.getFullYear().toString().slice(-2);
            const mm = (date.getMonth() + 1).toString().padStart(2, '0');
            const dd = date.getDate().toString().padStart(2, '0');
            const formattedDate = `${yy}${mm}${dd}`;
            
            let nameForTitle = '';
            if (watchedData.companyName) {
              nameForTitle = watchedData.companyName;
            } else if (watchedData.lastName && watchedData.firstName) {
              nameForTitle = `${watchedData.lastName} ${watchedData.firstName}`;
            } else if (watchedData.firstName) {
              nameForTitle = watchedData.firstName;
            } else if (watchedData.lastName) {
              nameForTitle = watchedData.lastName;
            } else {
              nameForTitle = 'Client';
            }
            
            return `${formattedDate} ${nameForTitle} company services`;
          }
        })()}
        onSubmit={async (submission) => {
          const success = await reviewApp.submitForReview(submission);
          if (success) {
            console.log('🟢 [CompanyServicesTab] Successfully submitted for review');
            
            // Clear form completely - data is now in DB
            reset();
            clearClientInfo({ 
              source: 'review-submit'
            });
            setWorkflowState('fresh');
            toast.success('Application submitted for review', {
              description: 'The form has been cleared for the next application.'
            });
            
            console.log('🟢 [CompanyServicesTab] Form cleared after review submission');
          }
          return success;
        }}
      />

      {/* Email Draft Generator with Preview Modal */}
      {emailDraftProps && (
        <EmailDraftGenerator {...emailDraftProps} />
      )}
    </div>
  );
};

export default CompanyServicesTab; 