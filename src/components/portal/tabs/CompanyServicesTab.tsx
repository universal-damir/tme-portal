'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Download, Eye, FileText } from 'lucide-react';
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
    // Update exchange rate based on currency (these are example rates)
    const rates = { EUR: 4.0, USD: 3.67, GBP: 4.5 };
    setValue('exchangeRate', rates[currency]);
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
      
      console.log('Generating Company Services PDF with data:', data);
      
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
      const { generateCompanyServicesPDF } = await import('@/lib/pdf-generator');
      
      console.log('Previewing Company Services PDF with data:', data);
      
      const blob = await generateCompanyServicesPDF(data, clientInfo);
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
      <div className="text-center">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            type="button"
            onClick={() => handlePreviewPDF(watchedData)}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center space-x-3"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Eye className="h-6 w-6" />
                <span>Preview PDF</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => handleGeneratePDF(watchedData)}
            disabled={isGenerating}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center space-x-3"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="h-6 w-6" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyServicesTab; 