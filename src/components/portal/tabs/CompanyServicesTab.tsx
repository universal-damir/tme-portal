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
  const { clientInfo, updateClientInfo } = useSharedClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailDraftProps, setEmailDraftProps] = useState<EmailDraftGeneratorProps | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Form state management
  const {
    register,
    watch,
    setValue,
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

  // Review system integration
  const reviewApp = useCompanyServicesApplication({
    formData: watchedData,
    clientName: watchedData.companyName || `${watchedData.firstName} ${watchedData.lastName}`.trim() || 'Client'
  });

  // Initialize form with shared client context (only once on mount)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && (clientInfo.firstName || clientInfo.lastName || clientInfo.companyName)) {
      setValue('firstName', clientInfo.firstName || '');
      setValue('lastName', clientInfo.lastName || '');
      setValue('companyName', clientInfo.companyName || '');
      setValue('shortCompanyName', clientInfo.shortCompanyName || '');
      setValue('date', clientInfo.date);
      initializedRef.current = true;
    }
  }, [clientInfo, setValue]);

  // Update shared client info when form changes (debounced)
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
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
    updateClientInfo
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
    // Validate required data before generating PDF
    if (!data.firstName && !data.lastName && !data.companyName) {
      alert('Please enter either client name (first/last) or company name before generating the PDF.');
      return;
    }

    setIsGenerating(true);
    try {
      // Dynamic import to avoid bundling issues
      const { generateCompanyServicesPDFWithFilename } = await import('@/lib/pdf-generator');
      
      const { blob, filename } = await generateCompanyServicesPDFWithFilename(data, clientInfo);

      // Show email preview modal after successful PDF generation
      const { createEmailDataFromFormData } = await import('@/components/shared/EmailDraftGenerator');
      const emailProps = createEmailDataFromFormData(data, blob, filename, 'COMPANY_SERVICES');
      
      // Set email props to trigger the EmailDraftGenerator component
      setEmailDraftProps({
        ...emailProps,
        onSuccess: () => {
          // Clean up when email is sent successfully
          setEmailDraftProps(null);
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
          document_type: 'Company Services'
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
    // Validate required data before sending PDF
    if (!data.firstName && !data.lastName && !data.companyName) {
      alert('Please enter either client name (first/last) or company name before sending the PDF.');
      return;
    }

    setIsGenerating(true);

    try {
      // Generate PDF for sending
      const { generateCompanyServicesPDFWithFilename } = await import('@/lib/pdf-generator/utils/companyServicesGenerator');
      
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

  const handlePreviewPDF = async (data: CompanyServicesData): Promise<void> => {
    // Validate required data before generating PDF
    if (!data.firstName && !data.lastName && !data.companyName) {
      alert('Please enter either client name (first/last) or company name before generating the PDF.');
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
      console.log('🔧 Pre-filling Company Services form with application data:', applicationId);
      
      // Pre-fill the form with the application data
      Object.keys(formData).forEach((key) => {
        if (key in watchedData) {
          setValue(key as any, formData[key]);
        }
      });
      
      // Show a toast notification to inform the user
      toast.success('Form loaded with your previous data. You can now make changes and resubmit.', {
        duration: 4000,
        position: 'top-center'
      });
    };

    const handleSendApprovedApplication = (event: any) => {
      const { applicationId, formData } = event.detail;
      console.log('🔧 Sending approved Company Services application:', applicationId);
      
      // Send PDF to client using the saved form data
      handleSendPDF(formData);
    };

    window.addEventListener('edit-company-services-application', handleEditApplication);
    window.addEventListener('send-approved-application', handleSendApprovedApplication);

    return () => {
      window.removeEventListener('edit-company-services-application', handleEditApplication);
      window.removeEventListener('send-approved-application', handleSendApprovedApplication);
    };
  }, [handleSendPDF]); // Include handleSendPDF so it can be accessed in event handlers

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
            onClick={() => setIsReviewModalOpen(true)}
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
                <span>Send</span>
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
        applicationTitle={(() => {
          // Use the same filename generation as PDF export for consistency
          try {
            const { generateCompanyServicesFilename } = require('@/lib/pdf-generator/utils/companyServicesDataTransformer');
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
        onSubmit={reviewApp.submitForReview}
      />

      {/* Email Draft Generator with Preview Modal */}
      {emailDraftProps && (
        <EmailDraftGenerator {...emailDraftProps} />
      )}
    </div>
  );
};

export default CompanyServicesTab; 