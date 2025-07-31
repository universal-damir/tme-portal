'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Download, Eye, FileText, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { GoldenVisaData, GOLDEN_VISA_DEFAULTS, GoldenVisaType } from '@/types/golden-visa';
import { goldenVisaSchema } from '@/lib/validations';
import { useSharedClient } from '@/contexts/SharedClientContext';
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [emailDraftProps, setEmailDraftProps] = useState<EmailDraftGeneratorProps | null>(null);


  // Form state management
  const {
    register,
    watch,
    setValue,
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
    },
  });

  const watchedData = watch();

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
    // Validate required client data
    if (!data.firstName && !data.lastName) {
      toast.error('Client Name Required', {
        description: 'Please enter client name (first and last name) before generating the PDF.'
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
      const emailProps = createEmailDataFromFormData(data, blob, filename, 'GOLDEN_VISA');
      
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

  const handlePreviewPDF = async (data: GoldenVisaData) => {
    // Validate required client data
    if (!data.firstName && !data.lastName) {
      toast.error('Client Name Required', {
        description: 'Please enter client name (first and last name) before generating the PDF.'
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
      console.log('🔧 Sending approved application:', applicationId);
      
      // Generate PDF and show email modal using the saved form data
      handleGeneratePDF(formData);
    };

    window.addEventListener('edit-golden-visa-application', handleEditApplication);
    window.addEventListener('send-approved-application', handleSendApprovedApplication);

    return () => {
      window.removeEventListener('edit-golden-visa-application', handleEditApplication);
      window.removeEventListener('send-approved-application', handleSendApprovedApplication);
    };
  }, [setValue]);

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

      {/* Golden Visa Type Selection with Integrated Authority Costs and TME Fee */}
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
        <div className="flex justify-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => handlePreviewPDF(watchedData)}
            disabled={isGenerating}
            className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center space-x-3"
            style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#243F7B' }}></div>
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            disabled={reviewApp.isLoading}
            className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-3"
            style={{ backgroundColor: '#F59E0B' }}
          >
            {reviewApp.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
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
          
          const visaTypeMap: { [key: string]: string } = {
            'property-investment': 'property',
            'time-deposit': 'deposit',
            'skilled-employee': 'skilled'
          };
          
          const visaTypeFormatted = visaTypeMap[watchedData.visaType] || watchedData.visaType;
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