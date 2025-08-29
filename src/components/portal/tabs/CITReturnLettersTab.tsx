'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, Send, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { CITReturnLettersData, CIT_RETURN_LETTERS_DEFAULTS, Client, LetterType, ConfAccDocsSelections, CITAssessmentConclusionData } from '@/types/cit-return-letters';
import { ClientDetailsSection, LetterDateSection, TaxPeriodSection, LetterTypeSection, CITEmailDraftGenerator, createCITEmailDataFromFormData } from '@/components/cit-return-letters';
import { ReviewSubmissionModal } from '@/components/review-system/modals/ReviewSubmissionModal';
import { ReviewModal } from '@/components/review-system/modals/ReviewModal';
import { useReviewSystemConfig } from '@/lib/config/review-system';
import { Application } from '@/types/review-system';
import { useCITReturnLettersApplication } from '@/hooks/useCITReturnLettersApplication';
import { generateCITReturnLettersPDFWithFilename, generateCITReturnLettersCombinedPreviewPDF, generateCITReturnLettersMultiFilename } from '@/lib/pdf-generator/utils';
import { useAuth } from '@/contexts/AuthContext';

const CITReturnLettersTab: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [conversationApplication, setConversationApplication] = useState<Application | null>(null);
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

  const handleLetterTypesChange = (letterTypes: LetterType[]) => {
    setValue('selectedLetterTypes', letterTypes);
    // Maintain backward compatibility
    setValue('letterType', letterTypes.length === 1 ? letterTypes[0] : '');
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

    if (!data.selectedLetterTypes || data.selectedLetterTypes.length === 0) {
      toast.error('Please select at least one letter type before generating the PDF.');
      return;
    }

    setIsGenerating(true);

    try {
      // Generate combined preview PDF with all selected letters in one document
      const combinedBlob = await generateCITReturnLettersCombinedPreviewPDF(data);
      
      // Create a URL for the combined blob and open it in a single tab for preview
      const url = URL.createObjectURL(combinedBlob);
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        newWindow.focus();
        toast.success(`Combined preview generated with ${data.selectedLetterTypes.length} letter${data.selectedLetterTypes.length > 1 ? 's' : ''}`);
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

    if (!watchedData.selectedLetterTypes || watchedData.selectedLetterTypes.length === 0) {
      toast.error('Please select at least one letter type before submitting for review.');
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

    if (!data.selectedLetterTypes || data.selectedLetterTypes.length === 0) {
      toast.error('Please select at least one letter type before downloading and sending.');
      return;
    }

    setIsGenerating(true);

    try {
      // Generate separate PDFs for each selected letter type
      const promises = data.selectedLetterTypes.map(async (letterType) => {
        const letterData = { ...data, letterType };
        return await generateCITReturnLettersPDFWithFilename(letterData);
      });
      
      const results = await Promise.all(promises);
      
      // Generate the new multi-filename format for email attachments
      const multiFilename = generateCITReturnLettersMultiFilename(data);
      
      // For email: always use individual PDFs with proper naming
      // For single selection, use the new multi-format name
      // For multiple selections, keep individual files with legacy names
      const emailResults = results.length === 1 
        ? [{ blob: results[0].blob, filename: multiFilename }] // Single letter uses new format
        : results; // Multiple letters keep individual legacy names
      
      // Prepare email props with renamed attachments
      const emailPropsData = await createCITEmailDataFromFormData(
        data.selectedClient,
        data.selectedLetterTypes, // Pass array of letter types
        emailResults, // Use consistently named attachments
        user ? {
          full_name: user.full_name,
          designation: user.designation,
          employee_code: user.employee_code,
          phone: user.phone,
          department: user.department
        } : undefined,
        data.taxPeriodEnd // Pass tax period end date for dynamic calculations
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
          document_type: `CIT Return Letters - ${data.selectedLetterTypes.join(', ')}`,
          filename: multiFilename
        }
      };

      setEmailProps(finalEmailProps);
      setCurrentPDFData({ blob: results[0].blob, filename: results[0].filename }); // For backward compatibility
      setShowEmailModal(true);
      
      toast.success(`${results.length} PDF${results.length > 1 ? 's' : ''} generated successfully`);
      
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

  // Handle resubmission from conversation modal
  const handleResubmitFromConversation = async (action: 'approve' | 'reject', comments: string): Promise<boolean> => {
    if (!conversationApplication || action !== 'reject') {
      // Only handle resubmissions (which come through as 'reject' from the user's perspective)
      return false;
    }

    try {
      // Submit the resubmission with updated form data
      const success = await reviewApp.submitForReview({
        reviewer_id: 1, // This will be updated by the backend
        urgency: 'standard',
        comments: comments.trim() || 'Resubmission with updates based on feedback'
      });

      if (success) {
        // Clear form and close modal after successful resubmission
        resetForm();
        setShowConversationModal(false);
        setConversationApplication(null);
        
        toast.success('Application resubmitted successfully', {
          description: 'Your updated application has been submitted for review.'
        });
        
        console.log('🟢 [CITReturnLettersTab] Successfully resubmitted application');
      } else {
        toast.error('Failed to resubmit application. Please try again.');
      }

      return success;
    } catch (error) {
      console.error('Error resubmitting application:', error);
      toast.error(`Failed to resubmit application: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
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
      
      if (formData) {
        // Restore the application for conversation history
        if (applicationId) {
          reviewApp.restoreApplication(applicationId, formData);
        }
        
        // Load form data
        loadFromApplication(formData);
        
        // Show a toast to inform the user
        toast.info('Application loaded for editing', {
          description: 'Your previous form data has been restored. You can make changes and resubmit.'
        });
      }
    };

    const handleSendApprovedApplication = (event: any) => {
      const { applicationType, applicationData } = event.detail;
      
      if (applicationType === 'cit-return-letters' && applicationData) {
        loadFromApplication(applicationData);
        
        toast.success('Approved application loaded', {
          description: 'The approved CIT return letters data has been loaded. You can generate the PDF or email draft.'
        });
      }
    };

    const handleTabReadinessCheck = (event: any) => {
      const { targetTab } = event.detail || {};
      
      // Only respond if this readiness check is for our tab
      if (targetTab === 'cit-return-letters') {
        const currentFormData = watchedData;
        const hasData = currentFormData.selectedClient !== null || 
                        currentFormData.letterDate !== '' ||
                        (currentFormData.selectedLetterTypes && currentFormData.selectedLetterTypes.length > 0) ||
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
      }
    };

    window.addEventListener('edit-cit-return-letters-application', handleEditApplication);
    window.addEventListener('send-approved-application', handleSendApprovedApplication);
    window.addEventListener('tab-readiness-check', handleTabReadinessCheck);

    return () => {
      window.removeEventListener('edit-cit-return-letters-application', handleEditApplication);
      window.removeEventListener('send-approved-application', handleSendApprovedApplication);
      window.removeEventListener('tab-readiness-check', handleTabReadinessCheck);
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

      {/* Letter Type Section - Now includes dynamic content under each checkbox */}
      <LetterTypeSection
        selectedLetterTypes={watchedData.selectedLetterTypes}
        onLetterTypesChange={handleLetterTypesChange}
        confAccDocsSelections={watchedData.confAccDocsSelections}
        onConfAccDocsSelectionsChange={handleConfAccDocsSelectionsChange}
        citAssessmentConclusion={watchedData.citAssessmentConclusion}
        onCITAssessmentConclusionChange={handleCITAssessmentConclusionChange}
        selectedClient={watchedData.selectedClient}
      />

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
            if (!watchedData.selectedClient || !watchedData.selectedLetterTypes || watchedData.selectedLetterTypes.length === 0) {
              return 'CIT Return Letters';
            }
            
            const date = new Date(watchedData.letterDate || new Date());
            const yy = date.getFullYear().toString().slice(-2);
            const mm = (date.getMonth() + 1).toString().padStart(2, '0');
            const dd = date.getDate().toString().padStart(2, '0');
            const formattedDate = `${yy}${mm}${dd}`;
            
            const companyShortName = watchedData.selectedClient?.company_name_short || 'Company';
            const letterTypes = watchedData.selectedLetterTypes.length === 1 
              ? watchedData.selectedLetterTypes[0] 
              : `${watchedData.selectedLetterTypes.length} Letters`;
            
            return `${formattedDate} ${companyShortName} CIT ${letterTypes}`;
          })()}
          documentType="cit-return-letters"
          onSubmit={async (submission) => {
            const success = await reviewApp.submitForReview(submission);
            
            if (success) {
              // Clear form after successful submission for fresh start
              resetForm();
              setShowReviewModal(false);
              
              toast.success('Application submitted for review', {
                description: 'The form has been cleared for the next application. Data is saved for the review process.'
              });
            }
            return success;
          }}
        />
      )}

      {/* Conversation Review Modal - Shows conversation history for resubmissions */}
      {config.canShowReviewComponents && (
        <ReviewModal
          isOpen={showConversationModal}
          onClose={() => {
            setShowConversationModal(false);
            setConversationApplication(null);
          }}
          application={conversationApplication}
          onReviewAction={handleResubmitFromConversation}
        />
      )}
    </div>
  );
};

export default CITReturnLettersTab;