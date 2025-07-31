'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Download, Eye, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmailDraftGenerator, EmailDraftGeneratorProps } from '@/components/shared/EmailDraftGenerator';
import { TaxationData, TAXATION_DEFAULTS, CompanyType } from '@/types/taxation';
import { taxationSchema } from '@/lib/validations';
import { useSharedClient } from '@/contexts/SharedClientContext';
import {
  ClientDetailsSection,
  CITDisclaimerSection,
  CITShareholderDeclarationSection
} from '../../taxation';

const TaxationTab: React.FC = () => {
  const { clientInfo, updateClientInfo } = useSharedClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailDraftProps, setEmailDraftProps] = useState<EmailDraftGeneratorProps | null>(null);

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

    window.addEventListener('edit-taxation-application', handleEditApplication);

    return () => {
      window.removeEventListener('edit-taxation-application', handleEditApplication);
    };
  }, [setValue]);

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
            className="px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-3"
            style={{ 
              backgroundColor: isGenerating ? '#9CA3AF' : '#D2BC99', 
              color: '#243F7B' 
            }}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#243F7B' }}></div>
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
              className="px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-3"
              style={{ 
                backgroundColor: isGenerating ? '#9CA3AF' : '#D2BC99', 
                color: '#243F7B' 
              }}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#243F7B' }}></div>
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
      
      {/* Email Draft Generator with Preview Modal */}
      {emailDraftProps && (
        <EmailDraftGenerator {...emailDraftProps} />
      )}
    </div>
  );
};

export default TaxationTab; 