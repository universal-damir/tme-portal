'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, Send, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { CITReturnLettersData, CIT_RETURN_LETTERS_DEFAULTS, Client, LetterType, ConfAccDocsSelections, CITAssessmentConclusionData } from '@/types/cit-return-letters';
import { ClientDetailsSection, LetterDateSection, TaxPeriodSection, LetterTypeSection, ConfAccDocsSelectionSection, CITAssessmentConclusionSection, CITEmailDraftGenerator, createCITEmailDataFromFormData } from '@/components/cit-return-letters';
import { ReviewSubmissionModal } from '@/components/review-system/modals/ReviewSubmissionModal';
import { useReviewSystemConfig } from '@/lib/config/review-system';
import { useCITReturnLettersApplication } from '@/hooks/useCITReturnLettersApplication';
import { generateCITReturnLettersPDFWithFilename } from '@/lib/pdf-generator/utils';
import { useAuth } from '@/contexts/AuthContext';

const CITReturnLettersTab: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentPDFData, setCurrentPDFData] = useState<{ blob: Blob; filename: string } | null>(null);
  const [emailProps, setEmailProps] = useState<any>(null);
  const { user } = useAuth();
  const config = useReviewSystemConfig();

  // Form state management
  const {
    register,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CITReturnLettersData>({
    mode: 'onChange',
    defaultValues: CIT_RETURN_LETTERS_DEFAULTS,
  });

  const watchedData = watch();

  // Review system integration
  const reviewApp = useCITReturnLettersApplication({
    formData: watchedData,
    clientName: watchedData.selectedClient?.company_name || 'Unknown Client'
  });

  // Handler functions for child components
  const handleClientSelect = (client: Client | null) => {
    setValue('selectedClient', client);
  };

  const handleSearchTermChange = (term: string) => {
    setValue('clientSearchTerm', term);
  };

  const handleStartDateChange = (date: string) => {
    setValue('taxPeriodStart', date);
  };

  const handleEndDateChange = (date: string) => {
    setValue('taxPeriodEnd', date);
  };

  const handleLetterTypeChange = (letterType: LetterType | '') => {
    setValue('letterType', letterType);
  };

  const handleLetterDateChange = (date: string) => {
    setValue('letterDate', date);
  };

  const handleConfAccDocsSelectionsChange = (selections: ConfAccDocsSelections) => {
    setValue('confAccDocsSelections', selections);
  };

  const handleCITAssessmentConclusionChange = (data: CITAssessmentConclusionData) => {
    setValue('citAssessmentConclusion', data);
  };

  // PDF generation handlers
  const handlePreviewPDF = async (data: CITReturnLettersData): Promise<void> => {
    // Validate required data before generating PDF
    if (!data.selectedClient) {
      toast.error('Please select a client before generating the PDF.');
      return;
    }

    if (!data.taxPeriodStart || !data.taxPeriodEnd) {
      toast.error('Please select tax period dates before generating the PDF.');
      return;
    }

    if (!data.letterType) {
      toast.error('Please select a letter type before generating the PDF.');
      return;
    }

    setIsGenerating(true);

    try {
      // Generate the PDF using our new CIT return letters generator
      const { blob, filename } = await generateCITReturnLettersPDFWithFilename(data);
      
      // Create a URL for the blob and open it in a new tab for preview
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        newWindow.focus();
        toast.success(`Preview generated: ${filename}`);
      } else {
        toast.error('Unable to open preview. Please check your popup blocker settings.');
      }
      
      // Clean up the URL after a delay to free memory
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitForReview = (): void => {
    // Validate required data before opening review modal
    if (!watchedData.selectedClient) {
      toast.error('Please select a client before submitting for review.');
      return;
    }

    if (!watchedData.taxPeriodStart || !watchedData.taxPeriodEnd) {
      toast.error('Please select tax period dates before submitting for review.');
      return;
    }

    if (!watchedData.letterType) {
      toast.error('Please select a letter type before submitting for review.');
      return;
    }

    if (!watchedData.letterDate) {
      toast.error('Please select a letter date before submitting for review.');
      return;
    }

    // Open review submission modal
    setShowReviewModal(true);
  };

  const handleDownloadAndSend = async (data: CITReturnLettersData): Promise<void> => {
    // Validate required data before downloading and sending
    if (!data.selectedClient) {
      toast.error('Please select a client before downloading and sending.');
      return;
    }

    if (!data.taxPeriodStart || !data.taxPeriodEnd) {
      toast.error('Please select tax period dates before downloading and sending.');
      return;
    }

    if (!data.letterType) {
      toast.error('Please select a letter type before downloading and sending.');
      return;
    }

    setIsGenerating(true);

    try {
      // Generate the PDF using our new CIT return letters generator
      const { blob, filename } = await generateCITReturnLettersPDFWithFilename(data);
      
      // Prepare email props
      const emailPropsData = await createCITEmailDataFromFormData(
        data.selectedClient,
        data.letterType as LetterType,
        blob,
        filename,
        user ? {
          full_name: user.full_name,
          designation: user.designation,
          employee_code: user.employee_code,
          phone: user.phone,
          department: user.department
        } : undefined
      );

      // Add activity logging
      const finalEmailProps = {
        ...emailPropsData,
        onSuccess: handleEmailSuccess,
        onError: handleEmailError,
        onClose: handleEmailClose,
        activityLogging: {
          resource: 'cit_return_letters',
          client_name: `${data.selectedClient.company_code} ${data.selectedClient.company_name}`,
          document_type: `CIT Return Letter - ${data.letterType}`,
          filename: filename
        }
      };

      setEmailProps(finalEmailProps);
      setCurrentPDFData({ blob, filename });
      setShowEmailModal(true);
      
      toast.success(`PDF generated: ${filename}`);
      
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle email modal success
  const handleEmailSuccess = (draftId: string) => {
    toast.success('Email sent successfully!');
    setShowEmailModal(false);
    setCurrentPDFData(null);
    setEmailProps(null);
  };

  // Handle email modal error
  const handleEmailError = (error: string) => {
    toast.error(`Failed to send email: ${error}`);
  };

  // Handle email modal close
  const handleEmailClose = () => {
    setShowEmailModal(false);
    setCurrentPDFData(null);
    setEmailProps(null);
  };

  // Reset form function
  const resetForm = useCallback(() => {
    reset(CIT_RETURN_LETTERS_DEFAULTS);
    console.log('🔧 [CITReturnLettersTab] Form reset to defaults');
  }, [reset]);

  // Function to load form data from application (for edit scenarios)
  const loadFromApplication = useCallback((applicationData: any) => {
    if (applicationData && typeof applicationData === 'object') {
      console.log('🟡 [CITReturnLettersTab] Loading form data from application:', applicationData);
      reset({
        ...CIT_RETURN_LETTERS_DEFAULTS,
        ...applicationData
      });
    }
  }, [reset]);

  // Listen for edit application events from review modal or notifications
  useEffect(() => {
    const handleEditApplication = (event: any) => {
      const { applicationId, formData } = event.detail;
      console.log('🟡 [CITReturnLettersTab] Received edit-cit-return-letters-application event', event.detail);
      
      if (formData) {
        loadFromApplication(formData);
        console.log('🟢 [CITReturnLettersTab] Form data loaded from rejected/returned application');
        
        // Show a toast to inform the user
        toast.info('Application loaded for editing', {
          description: 'Your previous form data has been restored. You can make changes and resubmit.'
        });
      }
    };

    const handleSendApprovedApplication = (event: any) => {
      const { applicationType, applicationData } = event.detail;
      console.log('🟡 [CITReturnLettersTab] Received send-approved-application event', event.detail);
      
      if (applicationType === 'cit-return-letters' && applicationData) {
        loadFromApplication(applicationData);
        
        toast.success('Approved application loaded', {
          description: 'The approved CIT return letters data has been loaded. You can generate the PDF or email draft.'
        });
      }
    };

    const handleTabReadinessCheck = (event: any) => {
      console.log('🟡 [CITReturnLettersTab] Received tab-readiness-check event');
      // Respond that this tab is ready
      // Get current form data dynamically when the event occurs
      const currentFormData = watchedData;
      const hasData = currentFormData.selectedClient !== null || 
                      currentFormData.letterDate !== '' ||
                      currentFormData.letterType !== '' ||
                      currentFormData.taxPeriodStart !== '' ||
                      currentFormData.taxPeriodEnd !== '';
      
      const readinessEvent = new CustomEvent('tab-readiness-response', {
        detail: { 
          tab: 'cit-return-letters',
          ready: true,
          hasData
        }
      });
      window.dispatchEvent(readinessEvent);
    };

    window.addEventListener('edit-cit-return-letters-application', handleEditApplication);
    window.addEventListener('send-approved-application', handleSendApprovedApplication);
    window.addEventListener('tab-readiness-check', handleTabReadinessCheck);

    console.log('🔧 CIT-RETURN-LETTERS-TAB: Event listeners registered');

    return () => {
      window.removeEventListener('edit-cit-return-letters-application', handleEditApplication);
      window.removeEventListener('send-approved-application', handleSendApprovedApplication);
      window.removeEventListener('tab-readiness-check', handleTabReadinessCheck);
      console.log('🔧 CIT-RETURN-LETTERS-TAB: Event listeners removed');
    };
  }, [loadFromApplication]);

  return (
    <div className="space-y-8">
      {/* Client Details Section */}
      <ClientDetailsSection
        selectedClient={watchedData.selectedClient}
        onClientSelect={handleClientSelect}
        searchTerm={watchedData.clientSearchTerm}
        onSearchTermChange={handleSearchTermChange}
      />

      {/* Letter Date Section */}
      <LetterDateSection
        letterDate={watchedData.letterDate}
        onLetterDateChange={handleLetterDateChange}
      />

      {/* Tax Period Section */}
      <TaxPeriodSection
        startDate={watchedData.taxPeriodStart}
        endDate={watchedData.taxPeriodEnd}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
      />

      {/* Letter Type Section */}
      <LetterTypeSection
        selectedLetterType={watchedData.letterType}
        onLetterTypeChange={handleLetterTypeChange}
      />

      {/* Conf Acc Docs Selection Section - Only show when 'Conf acc docs + FS' is selected */}
      {watchedData.letterType === 'Conf acc docs + FS' && (
        <ConfAccDocsSelectionSection
          selections={watchedData.confAccDocsSelections}
          onSelectionsChange={handleConfAccDocsSelectionsChange}
        />
      )}

      {/* CIT Assessment Conclusion Section - Only show when 'CIT assess+concl, non deduct, elect' is selected */}
      {watchedData.letterType === 'CIT assess+concl, non deduct, elect' && (
        <CITAssessmentConclusionSection
          data={watchedData.citAssessmentConclusion}
          onDataChange={handleCITAssessmentConclusionChange}
          selectedClient={watchedData.selectedClient}
        />
      )}

      {/* Action Buttons */}
      <div className="text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Preview Button */}
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
                <span>Preview</span>
              </>
            )}
          </motion.button>

          {/* Submit for Review Button */}
          {config.canShowReviewComponents && (
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
          )}
          
          {/* Download and Send Button */}
          <motion.button
            type="button"
            onClick={() => handleDownloadAndSend(watchedData)}
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

      {/* CIT Email Draft Generator Modal */}
      {showEmailModal && emailProps && (
        <CITEmailDraftGenerator
          {...emailProps}
        />
      )}

      {/* Review Submission Modal */}
      {config.canShowReviewComponents && (
        <ReviewSubmissionModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          applicationId={reviewApp.application?.id?.toString() || 'new'}
          applicationTitle={(() => {
            if (!watchedData.selectedClient || !watchedData.letterType) return 'CIT Return Letters';
            
            const date = new Date(watchedData.letterDate || new Date());
            const yy = date.getFullYear().toString().slice(-2);
            const mm = (date.getMonth() + 1).toString().padStart(2, '0');
            const dd = date.getDate().toString().padStart(2, '0');
            const formattedDate = `${yy}${mm}${dd}`;
            
            const companyShortName = watchedData.selectedClient?.company_name_short || 'Company';
            const letterType = watchedData.letterType || 'Letter';
            
            return `${formattedDate} ${companyShortName} CIT ${letterType}`;
          })()}
          documentType="cit-return-letters"
          onSubmit={async (submission) => {
            const success = await reviewApp.submitForReview(submission);
            if (success) {
              // Clear form after successful submission but preserve data for review workflow
              resetForm();
              setShowReviewModal(false);
              console.log('🟢 [CITReturnLettersTab] Successfully submitted for review');
              
              toast.success('Application submitted for review', {
                description: 'The form has been cleared for the next application. Data is saved for the review process.'
              });
            }
            return success;
          }}
        />
      )}
    </div>
  );
};

export default CITReturnLettersTab;