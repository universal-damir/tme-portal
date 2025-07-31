'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Download, Eye, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { CompanyServicesData, COMPANY_SERVICES_DEFAULTS } from '@/types/company-services';
import { companyServicesSchema } from '@/lib/validations';
import { useSharedClient } from '@/contexts/SharedClientContext';
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

  // Email generation using reusable component
  const createOutlookEmailDraft = async (data: CompanyServicesData, pdfBlob: Blob, pdfFilename: string) => {
    const { useEmailDraftGenerator, createEmailDataFromFormData } = await import('@/components/shared/EmailDraftGenerator');
    const { generateEmailDraft } = useEmailDraftGenerator();
    const emailProps = createEmailDataFromFormData(data, pdfBlob, pdfFilename, 'COMPANY_SERVICES');
    
    await generateEmailDraft({
      ...emailProps,
      onSuccess: (draftId) => {
        console.log('Email draft created successfully:', draftId);
      },
      onError: (error) => {
        console.error('Email draft creation failed:', error);
      }
    });
  };

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
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Create Outlook email draft with PDF attachment
      await createOutlookEmailDraft(data, blob, filename);

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
                <span>Preview PDF</span>
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
                <Download className="h-5 w-5" />
                <span>Download and Send</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CompanyServicesTab; 