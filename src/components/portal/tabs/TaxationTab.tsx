'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, Send, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmailDraftGenerator, EmailDraftGeneratorProps } from '@/components/shared/EmailDraftGenerator';
import { ReviewSubmissionModal } from '@/components/review-system/modals/ReviewSubmissionModal';
import { TaxationData, TAXATION_DEFAULTS, CompanyType } from '@/types/taxation';
import { taxationSchema } from '@/lib/validations';
import { useSharedClient } from '@/contexts/SharedClientContext';
import { useTaxationApplication } from '@/hooks/useTaxationApplication';
import {
  ClientDetailsSection,
  CITDisclaimerSection,
  CITShareholderDeclarationSection
} from '../../taxation';

const TaxationTab: React.FC = () => {
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
  } = useForm<TaxationData>({
    resolver: zodResolver(taxationSchema),
    mode: 'onChange',
    defaultValues: {
      // Client Details
      firstName: '',
      lastName: '',
      companyName: '',
      shortCompanyName: '',
      date: new Date().toISOString().split('T')[0],
      
      // Company selection
      companyType: TAXATION_DEFAULTS.form.companyType,
      
      // Main sections
      citDisclaimer: TAXATION_DEFAULTS.form.citDisclaimer,
      citShareholderDeclaration: TAXATION_DEFAULTS.form.citShareholderDeclaration,
    },
  });

  const watchedData = watch();

  // Review system integration
  const reviewApp = useTaxationApplication({
    formData: watchedData,
    clientName: watchedData.companyName || `${watchedData.firstName} ${watchedData.lastName}`.trim() || 'Client'
  });

  // Always show CIT Shareholder Declaration when CIT Disclaimer is enabled
  const shouldShowCITShareholderDeclaration = () => {
    const disclaimerEnabled = watchedData.citDisclaimer?.enabled || false;
    return disclaimerEnabled;
  };

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
    }, 300); // Small delay to prevent loops
    
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
  const handleCompanyTypeChange = (companyType: CompanyType) => {
    setValue('companyType', companyType);
  };

  // Email generation removed - now handled by EmailDraftGenerator component

  // PDF generation handlers
  const handleGeneratePDF = async (data: TaxationData): Promise<void> => {
    // Validate required data before generating PDF
    if (!data.firstName && !data.lastName && !data.companyName) {
      alert('Please enter either client name (first/last) or company name before generating the PDF.');
      return;
    }

    setIsGenerating(true);
    try {
      // Dynamic import to avoid bundling issues
      const { generateTaxationPDFWithFilename } = await import('@/lib/pdf-generator/utils/taxationGenerator');
      
      // Generating Taxation PDF
      
      const { blob, filename } = await generateTaxationPDFWithFilename(data, clientInfo);

      // Show email preview modal after successful PDF generation
      const { createEmailDataFromFormData } = await import('@/components/shared/EmailDraftGenerator');
      const emailProps = createEmailDataFromFormData(data, blob, filename, 'TAXATION');
      
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
          resource: 'taxation',
          client_name: data.companyName || `${data.firstName} ${data.lastName}`.trim(),
          document_type: 'Taxation Services',
          filename: filename
        }
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewPDF = async (data: TaxationData): Promise<void> => {
    // Validate required data before generating PDF
    if (!data.firstName && !data.lastName && !data.companyName) {
      alert('Please enter either client name (first/last) or company name before generating the PDF.');
      return;
    }

    setIsGenerating(true);
    try {
      // Dynamic import to avoid bundling issues
      const { generateTaxationPDF } = await import('@/lib/pdf-generator/utils/taxationGenerator');
      
      // Previewing Taxation PDF
      
      const blob = await generateTaxationPDF(data, clientInfo);
      const url = URL.createObjectURL(blob);
      
      // Open PDF in new tab for preview
      window.open(url, '_blank');
      
      // Clean up the URL after a delay to allow the browser to load it
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      alert('Error generating PDF preview. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // CIT Shareholder Declaration PDF generation handlers
  const handleGenerateCITShareholderPDF = async (data: TaxationData): Promise<void> => {
    // Validate required data before generating PDF
    if (!data.firstName && !data.lastName && !data.companyName) {
      alert('Please enter either client name (first/last) or company name before generating the PDF.');
      return;
    }

    // Validate CIT Shareholder specific fields
    if (!data.citShareholderDeclaration?.clientContactNumber || !data.citShareholderDeclaration?.designation) {
      alert('Please fill in the required CIT Shareholder Declaration fields (contact number and designation) before generating the PDF.');
      return;
    }

    setIsGenerating(true);
    try {
      // Dynamic import to avoid bundling issues
      const { generateCITShareholderDeclarationPDFWithFilename } = await import('@/lib/pdf-generator/utils/taxationGenerator');
      
      // Generating CIT Shareholder Declaration PDF
      
      const { blob, filename } = await generateCITShareholderDeclarationPDFWithFilename(data, clientInfo);

      // Show email preview modal after successful PDF generation
      const { createEmailDataFromFormData } = await import('@/components/shared/EmailDraftGenerator');
      const emailProps = createEmailDataFromFormData(data, blob, filename, 'TAXATION');
      
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
          resource: 'taxation',
          client_name: data.companyName || `${data.firstName} ${data.lastName}`.trim(),
          document_type: 'Taxation Services',
          filename: filename
        }
      });
      
    } catch (error) {
      console.error('Error generating CIT Shareholder Declaration PDF:', error);
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewCITShareholderPDF = async (data: TaxationData): Promise<void> => {
    // Validate required data before generating PDF
    if (!data.firstName && !data.lastName && !data.companyName) {
      alert('Please enter either client name (first/last) or company name before generating the PDF.');
      return;
    }

    // Validate CIT Shareholder specific fields
    if (!data.citShareholderDeclaration?.clientContactNumber || !data.citShareholderDeclaration?.designation) {
      alert('Please fill in the required CIT Shareholder Declaration fields (contact number and designation) before generating the PDF.');
      return;
    }

    setIsGenerating(true);
    try {
      // Dynamic import to avoid bundling issues
      const { generateCITShareholderDeclarationPDF } = await import('@/lib/pdf-generator/utils/taxationGenerator');
      
      // Previewing CIT Shareholder Declaration PDF
      
      const blob = await generateCITShareholderDeclarationPDF(data, clientInfo);
      const url = URL.createObjectURL(blob);
      
      // Open PDF in new tab for preview
      window.open(url, '_blank');
      
      // Clean up the URL after a delay to allow the browser to load it
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
    } catch (error) {
      console.error('Error generating CIT Shareholder Declaration PDF preview:', error);
      alert('Error generating PDF preview. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };



  // Handle Download All - downloads all applicable documents
  const handleDownloadAll = async (data: TaxationData): Promise<void> => {
    // Validate required data before generating PDF
    if (!data.firstName && !data.lastName && !data.companyName) {
      alert('Please enter either client name (first/last) or company name before generating the PDF.');
      return;
    }

    setIsGenerating(true);
    try {
      const { generateTaxationPDFWithFilename, generateCITShareholderDeclarationPDFWithFilename } = await import('@/lib/pdf-generator/utils/taxationGenerator');
      
      // Always generate CIT Disclaimer
      const disclaimerResult = await generateTaxationPDFWithFilename(data, clientInfo);
      
      // Generate CIT Shareholder Declaration if applicable
      let shareholderResult = null;
      if (shouldShowCITShareholderDeclaration() && 
          data.citShareholderDeclaration?.clientContactNumber && 
          data.citShareholderDeclaration?.designation) {
        shareholderResult = await generateCITShareholderDeclarationPDFWithFilename(data, clientInfo);
      }

      // Prepare attachments array
      const attachments = [
        {
          blob: disclaimerResult.blob,
          filename: disclaimerResult.filename,
          contentType: 'application/pdf'
        }
      ];
      
      // Add shareholder declaration if generated
      if (shareholderResult) {
        attachments.push({
          blob: shareholderResult.blob,
          filename: shareholderResult.filename,
          contentType: 'application/pdf'
        });
      }

      // Show email preview modal after successful PDF generation
      const { createEmailDataFromFormData, EMAIL_TEMPLATES } = await import('@/components/shared/EmailDraftGenerator');
      
      // Create email props with multiple attachments  
      const emailProps = {
        recipients: {
          emails: data.clientEmails || [],
          firstName: data.firstName,
          lastName: data.lastName,
          companyName: data.companyName
        },
        template: {
          ...EMAIL_TEMPLATES.TAXATION,
          subject: disclaimerResult.filename.replace('.pdf', '')
        },
        attachments
      };
      
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
          resource: 'taxation',
          client_name: data.companyName || `${data.firstName} ${data.lastName}`.trim(),
          document_type: 'Taxation Services',
          filename: disclaimerResult.filename
        }
      });
      
    } catch (error) {
      console.error('Error generating PDFs:', error);
      alert(`Error generating PDFs: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Preview Declaration - previews CIT Shareholder Declaration
  const handlePreviewDeclaration = async (data: TaxationData): Promise<void> => {
    if (shouldShowCITShareholderDeclaration()) {
      await handlePreviewCITShareholderPDF(data);
    }
  };

  // Listen for edit application events from review modal or notifications
  React.useEffect(() => {
    const handleEditApplication = (event: any) => {
      const { applicationId, formData } = event.detail;
      console.log('🔧 Pre-filling Taxation form with application data:', applicationId);
      
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
      console.log('🔧 Sending approved Taxation application:', applicationId);
      
      // Generate PDF and show email modal using the saved form data
      handleDownloadAll(formData);
    };

    window.addEventListener('edit-taxation-application', handleEditApplication);
    window.addEventListener('send-approved-application', handleSendApprovedApplication);

    return () => {
      window.removeEventListener('edit-taxation-application', handleEditApplication);
      window.removeEventListener('send-approved-application', handleSendApprovedApplication);
    };
  }, []); // Remove dependencies to prevent listener re-registration

  return (
    <div className="space-y-8">
      {/* Client Details Section */}
      <ClientDetailsSection
        data={watchedData}
        register={register}
        errors={errors}
        setValue={setValue}
      />

      {/* CIT Disclaimer Section */}
      <CITDisclaimerSection
        data={watchedData}
        register={register}
        errors={errors}
        setValue={setValue}
        onCompanyTypeChange={handleCompanyTypeChange}
      />

      {/* CIT Shareholder Declaration Section */}
      {shouldShowCITShareholderDeclaration() && (
        <CITShareholderDeclarationSection
          data={watchedData}
          register={register}
          errors={errors}
          setValue={setValue}
        />
      )}

      {/* Generate and Preview Buttons */}
      <div className="text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Preview CIT Disclaimer Button */}
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
                <span>Preview CIT Disclaimer</span>
              </>
            )}
          </motion.button>

          {/* Preview Management Declaration Button */}
          {shouldShowCITShareholderDeclaration() && (
            <motion.button
              type="button"
              onClick={() => handlePreviewDeclaration(watchedData)}
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
                  <span>Preview Mgt Declaration</span>
                </>
              )}
            </motion.button>
          )}

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
          
          {/* Download All Button */}
          <motion.button
            type="button"
            onClick={() => handleDownloadAll(watchedData)}
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
            const { generateTaxationFilename } = require('@/lib/pdf-generator/utils/taxationDataTransformer');
            const filename = generateTaxationFilename(watchedData, clientInfo);
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
            
            // Get company abbreviation from company type
            const companyAbbreviation = watchedData.companyType === 'management-consultants' ? 'MGT' : 'FZCO';
            
            // Get company short name
            const companyShortName = watchedData.shortCompanyName || 'Company';
            
            // Format tax end period as dd.mm.yyyy
            const formatTaxEndPeriod = () => {
              const toDate = watchedData.citDisclaimer?.taxPeriodRange?.toDate;
              if (toDate) {
                const endDate = new Date(toDate);
                const day = endDate.getDate().toString().padStart(2, '0');
                const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
                const year = endDate.getFullYear();
                return `${day}.${month}.${year}`;
              }
              return '31.12.2025'; // Default fallback
            };
            
            return `${formattedDate} ${companyAbbreviation} ${companyShortName} CIT Disclaimer ${formatTaxEndPeriod()}`;
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

export default TaxationTab; 