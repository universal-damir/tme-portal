'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Download, Eye } from 'lucide-react';
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
      
      // Always download CIT Disclaimer
      const disclaimerResult = await generateTaxationPDFWithFilename(data, clientInfo);
      const disclaimerUrl = URL.createObjectURL(disclaimerResult.blob);
      const disclaimerLink = document.createElement('a');
      disclaimerLink.href = disclaimerUrl;
      disclaimerLink.download = disclaimerResult.filename;
      document.body.appendChild(disclaimerLink);
      disclaimerLink.click();
      document.body.removeChild(disclaimerLink);
      URL.revokeObjectURL(disclaimerUrl);

      // Download CIT Shareholder Declaration
      if (shouldShowCITShareholderDeclaration()) {
        // Validate CIT Shareholder specific fields
        if (data.citShareholderDeclaration?.clientContactNumber && data.citShareholderDeclaration?.designation) {
          const shareholderResult = await generateCITShareholderDeclarationPDFWithFilename(data, clientInfo);
          const shareholderUrl = URL.createObjectURL(shareholderResult.blob);
          const shareholderLink = document.createElement('a');
          shareholderLink.href = shareholderUrl;
          shareholderLink.download = shareholderResult.filename;
          document.body.appendChild(shareholderLink);
          shareholderLink.click();
          document.body.removeChild(shareholderLink);
          URL.revokeObjectURL(shareholderUrl);
        }
      }
      
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

      {/* Generate and Preview Buttons - Three buttons in one row */}
      <div className="text-center">
        <div className="flex gap-3 justify-center items-center max-w-4xl mx-auto">
          {/* Button 1: Preview CIT Disclaimer */}
          <button
            type="button"
            onClick={() => handlePreviewPDF(watchedData)}
            disabled={isGenerating}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center justify-center space-x-2 text-sm"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Preview CIT Disclaimer</span>
              </>
            )}
          </button>

          {/* Button 2: Preview Declaration */}
          {shouldShowCITShareholderDeclaration() && (
            <button
              type="button"
              onClick={() => handlePreviewDeclaration(watchedData)}
              disabled={isGenerating}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center justify-center space-x-2 text-sm"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>
                    Preview {watchedData.companyType === 'management-consultants' ? 'Mgt Declaration' : 'Mgt Declaration'}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Button 3: Download All */}
          <button
            type="button"
            onClick={() => handleDownloadAll(watchedData)}
            disabled={isGenerating}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center justify-center space-x-2 text-sm"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download All</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaxationTab; 