'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, Send, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { CITReturnLettersData, CIT_RETURN_LETTERS_DEFAULTS, Client, LetterType } from '@/types/cit-return-letters';
import { ClientDetailsSection, TaxPeriodSection, LetterTypeSection } from '@/components/cit-return-letters';

const CITReturnLettersTab: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

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

  // PDF generation handlers (placeholder)
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

    console.log('Preview PDF:', data);
    toast.info('PDF preview functionality will be implemented');
  };

  const handleSubmitForReview = async (): Promise<void> => {
    // Validate required data before submitting for review
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

    console.log('Submit for review:', watchedData);
    toast.info('Review submission functionality will be implemented');
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

    console.log('Download and send:', data);
    toast.info('Download and send functionality will be implemented');
  };

  return (
    <div className="space-y-8">
      {/* Client Details Section */}
      <ClientDetailsSection
        selectedClient={watchedData.selectedClient}
        onClientSelect={handleClientSelect}
        searchTerm={watchedData.clientSearchTerm}
        onSearchTermChange={handleSearchTermChange}
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
          <motion.button
            type="button"
            onClick={handleSubmitForReview}
            disabled={isGenerating}
            whileHover={!isGenerating ? { scale: 1.02 } : {}}
            whileTap={!isGenerating ? { scale: 0.98 } : {}}
            className="px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-3"
            style={{ 
              backgroundColor: isGenerating ? '#9CA3AF' : '#D2BC99', 
              color: '#243F7B' 
            }}
          >
            {isGenerating ? (
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
    </div>
  );
};

export default CITReturnLettersTab;