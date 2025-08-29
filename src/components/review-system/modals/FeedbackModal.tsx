// Feedback Notification Modal Component
// Shows reviewer feedback to submitters with form preview and side-by-side editing capability

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, FileText, User, Calendar, AlertCircle, CheckCircle, Edit3, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Application, ReviewMessage } from '@/types/review-system';
import { EmailDraftGenerator, EmailDraftGeneratorProps, createEmailDataFromFormData } from '@/components/shared/EmailDraftGenerator';
import { CITEmailDraftGenerator, CITEmailDraftGeneratorProps } from '@/components/cit-return-letters/CITEmailDraftGenerator';
import { useReviewSystemConfig } from '@/lib/config/review-system';
import { GoldenVisaData } from '@/types/golden-visa';
import { OfferData } from '@/types/offer';
import { CompanyServicesData } from '@/types/company-services';
import { CITReturnLettersData } from '@/types/cit-return-letters';
import { SharedClientInfo } from '@/types/portal';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/ui/user-avatar';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onEditForm?: () => void; // Callback to open form for editing
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  application,
  onEditForm
}) => {
  const config = useReviewSystemConfig();
  const { user } = useAuth();
  // Removed viewMode state as we're removing the tabs
  const [error, setError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPreviewLoadingSecondary, setIsPreviewLoadingSecondary] = useState(false);
  const [isSendLoading, setIsSendLoading] = useState(false);
  const [emailDraftProps, setEmailDraftProps] = useState<EmailDraftGeneratorProps | null>(null);
  const [citEmailDraftProps, setCitEmailDraftProps] = useState<CITEmailDraftGeneratorProps | null>(null);
  const [messageHistory, setMessageHistory] = useState<ReviewMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Don't render if feature is disabled
  if (!config.canShowReviewComponents) {
    return null;
  }

  // Helper function to generate form title using PDF naming convention
  const getFormTitle = (): string => {
    if (!application?.form_data) return application?.title || 'Application';
    
    try {
      if (application.type === 'golden-visa') {
        const formData = application.form_data as GoldenVisaData;
        
        try {
          // Use the actual filename generator for consistency with PDF generation
          const { generateGoldenVisaFilename } = require('@/lib/pdf-generator/integrations/FilenameIntegrations');
          const clientInfo = {
            firstName: formData.firstName || '',
            lastName: formData.lastName || '',
            companyName: formData.companyName || '',
            date: formData.date || new Date().toISOString().split('T')[0],
          };
          const filename = generateGoldenVisaFilename(formData, clientInfo);
          // Remove the .pdf extension for display
          return filename.replace('.pdf', '');
        } catch (error) {
          console.error('🔧 FEEDBACK-MODAL: Failed to generate Golden Visa filename, using fallback:', error);
          
          // Enhanced fallback that matches new format
          const date = new Date(formData.date || new Date());
          const yy = date.getFullYear().toString().slice(-2);
          const mm = (date.getMonth() + 1).toString().padStart(2, '0');
          const dd = date.getDate().toString().padStart(2, '0');
          const formattedDate = `${yy}${mm}${dd}`;
          
          const nameForTitle = formData.lastName && formData.firstName 
            ? `${formData.lastName} ${formData.firstName}`
            : formData.firstName || formData.lastName || 'Client';
          
          // Simplified visa type mapping
          const visaTypeMap: { [key: string]: string } = {
            'property-investment': 'Property',
            'time-deposit': 'Deposit',
            'skilled-employee': 'Skilled'
          };
          const visaType = visaTypeMap[formData.visaType] || 'Property';
          
          // Match new filename format: YYMMDD MGT LastName FirstName Golden {Property/Deposit/Skilled/Dependent}
          return `${formattedDate} MGT ${nameForTitle} Golden ${visaType}`;
        }
      } else if (application.type === 'cost-overview') {
        const formData = application.form_data as OfferData;
        
        try {
          // Use the actual filename generator for consistency with PDF generation
          const { generateDynamicFilename } = require('@/lib/pdf-generator/integrations/FilenameIntegrations');
          const filename = generateDynamicFilename(formData);
          // Remove the .pdf extension for display
          return filename.replace('.pdf', '');
        } catch (error) {
          console.error('🔧 FEEDBACK-MODAL: Failed to generate Cost Overview filename, using fallback:', error);
          
          // Enhanced fallback that matches new format
          const date = new Date(formData.clientDetails?.date || new Date());
          const yy = date.getFullYear().toString().slice(-2);
          const mm = (date.getMonth() + 1).toString().padStart(2, '0');
          const dd = date.getDate().toString().padStart(2, '0');
          const formattedDate = `${yy}${mm}${dd}`;
          
          const authority = formData.authorityInformation?.responsibleAuthority || 'Unknown Authority';
          const isDET = authority === 'DET (Dubai Department of Economy and Tourism)';
          
          let nameForTitle = '';
          if (formData.clientDetails?.addressToCompany && formData.clientDetails?.companyName) {
            nameForTitle = formData.clientDetails.companyName;
          } else if (formData.clientDetails?.lastName && formData.clientDetails?.firstName) {
            nameForTitle = `${formData.clientDetails.lastName} ${formData.clientDetails.firstName}`;
          } else if (formData.clientDetails?.firstName) {
            nameForTitle = formData.clientDetails.firstName;
          } else {
            nameForTitle = 'CLIENT';
          }
          
          // Add company short name if available and not using address to company
          const shortName = formData.clientDetails?.companyName && !formData.clientDetails?.addressToCompany 
            ? formData.clientDetails.companyName : '';
          
          if (isDET) {
            const setupType = formData.clientDetails?.companySetupType === 'Corporate Setup' ? 'CORP' : 'INDIV';
            const currency = formData.clientDetails?.secondaryCurrency || 'USD';
            return `${formattedDate} MGT ${nameForTitle} ${shortName ? shortName + ' ' : ''}Setup DET ${setupType} AED ${currency}`;
          } else {
            const years = formData.ifzaLicense?.licenseYears || 1;
            const visaQuota = formData.ifzaLicense?.visaQuota || 0;
            const visaUsed = formData.visaCosts?.numberOfVisas || 0;
            const spouseVisas = formData.visaCosts?.spouseVisa ? 1 : 0;
            const childrenVisas = formData.visaCosts?.numberOfChildVisas || 0;
            const currency = formData.clientDetails?.secondaryCurrency || 'USD';
            
            return `${formattedDate} FZCO ${nameForTitle} ${shortName ? shortName + ' ' : ''}Setup IFZA ${years} ${visaQuota} ${visaUsed} ${spouseVisas} ${childrenVisas} AED ${currency}`;
          }
        }
      } else if (application.type === 'company-services') {
        const formData = application.form_data as CompanyServicesData;
        
        try {
          // Use the actual filename generator for consistency with PDF generation
          const { generateCompanyServicesFilename } = require('@/lib/pdf-generator/integrations/FilenameIntegrations');
          const clientInfo = {
            firstName: formData.firstName || '',
            lastName: formData.lastName || '',
            companyName: formData.companyName || '',
            shortCompanyName: formData.shortCompanyName || '',
            date: formData.date || new Date().toISOString().split('T')[0],
          };
          const filename = generateCompanyServicesFilename(formData, clientInfo);
          // Remove the .pdf extension for display
          return filename.replace('.pdf', '');
        } catch (error) {
          console.error('🔧 FEEDBACK-MODAL: Failed to generate filename, using fallback:', error);
          
          // Enhanced fallback that matches new format
          const date = new Date(formData.date || new Date());
          const yy = date.getFullYear().toString().slice(-2);
          const mm = (date.getMonth() + 1).toString().padStart(2, '0');
          const dd = date.getDate().toString().padStart(2, '0');
          const formattedDate = `${yy}${mm}${dd}`;
          
          const nameForTitle = formData.companyName || 
            (formData.firstName && formData.lastName ? `${formData.lastName} ${formData.firstName}` : formData.firstName || formData.lastName || 'Client');
          
          // Match new filename format - no hyphen separators, use spaces
          return `${formattedDate} ${nameForTitle} FZCO CIT VAT ACC PRO COMPL`;
        }
      } else if (application.type === 'taxation') {
        const formData = application.form_data as any; // TaxationData type
        const date = new Date(formData.date || new Date());
        const yy = date.getFullYear().toString().slice(-2);
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        const formattedDate = `${yy}${mm}${dd}`;
        
        // Get company abbreviation from company type
        const companyAbbreviation = formData.companyType === 'management-consultants' ? 'MGT' : 'FZCO';
        
        // Get company short name
        const companyShortName = formData.shortCompanyName || 'Company';
        
        // Format tax end period as dd.mm.yyyy
        const formatTaxEndPeriod = () => {
          const toDate = formData.citDisclaimer?.taxPeriodRange?.toDate;
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
      } else if (application.type === 'cit-return-letters') {
        const formData = application.form_data as CITReturnLettersData;
        const date = new Date(formData.letterDate || new Date());
        const yy = date.getFullYear().toString().slice(-2);
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        const formattedDate = `${yy}${mm}${dd}`;
        
        const companyShortName = formData.selectedClient?.company_name_short || 'Company';
        
        // Handle both new multi-select and legacy single selection
        let letterTypes: string;
        if (formData.selectedLetterTypes && formData.selectedLetterTypes.length > 0) {
          letterTypes = formData.selectedLetterTypes.length === 1 
            ? formData.selectedLetterTypes[0] 
            : `${formData.selectedLetterTypes.length} Letters`;
        } else {
          letterTypes = formData.letterType || 'Letter';
        }
        
        // Format: YYMMDD CompanyShort CIT Letter Type(s)
        return `${formattedDate} ${companyShortName} CIT ${letterTypes}`;
      }
      
      return application?.title || 'Application';
    } catch (error) {
      return application?.title || `${application.type.charAt(0).toUpperCase() + application.type.slice(1).replace('-', ' ')} Application`;
    }
  };

  const handlePreviewPDF = async () => {
    if (!application?.form_data) return;
    
    try {
      setError(null);
      setIsPreviewLoading(true);
      
      // Show toast notification about PDF generation and new window
      toast.info('Generating PDF preview...', {
        description: 'PDF will open in a new window when ready',
        duration: 3000
      });
      
      if (application.type === 'golden-visa') {
        const { generateGoldenVisaPDFWithFilename } = await import('@/lib/pdf-generator');
        const formData = application.form_data as GoldenVisaData;
        
        const clientInfo: SharedClientInfo = {
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          companyName: formData.companyName || '',
          date: formData.date || new Date().toISOString().split('T')[0],
        };
        
        const { blob } = await generateGoldenVisaPDFWithFilename(formData, clientInfo);
        
        // Open PDF in new tab for preview
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Clean up the URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      } else if (application.type === 'cost-overview') {
        const { generatePDFWithFilename } = await import('@/lib/pdf-generator');
        const formData = application.form_data as OfferData;
        
        const { blob } = await generatePDFWithFilename(formData);
        
        // Open PDF in new tab for preview
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Clean up the URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      } else if (application.type === 'company-services') {
        const { generateCompanyServicesPDFWithFilename } = await import('@/lib/pdf-generator');
        const formData = application.form_data as CompanyServicesData;
        
        const clientInfo: SharedClientInfo = {
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          companyName: formData.companyName || '',
          shortCompanyName: formData.shortCompanyName || '',
          date: formData.date || new Date().toISOString().split('T')[0],
        };
        
        const { blob } = await generateCompanyServicesPDFWithFilename(formData, clientInfo);
        
        // Open PDF in new tab for preview
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Clean up the URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      } else if (application.type === 'taxation') {
        const { generateTaxationPDFWithFilename } = await import('@/lib/pdf-generator/utils/taxationGenerator');
        const formData = application.form_data as any; // TaxationData type
        
        const clientInfo: SharedClientInfo = {
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          companyName: formData.companyName || '',
          shortCompanyName: formData.shortCompanyName || '',
          date: formData.date || new Date().toISOString().split('T')[0],
        };
        
        const { blob } = await generateTaxationPDFWithFilename(formData, clientInfo);
        
        // Open PDF in new tab for preview
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Clean up the URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      } else if (application.type === 'cit-return-letters') {
        const { generateCITReturnLettersCombinedPreviewPDF } = await import('@/lib/pdf-generator/utils/citReturnLettersGenerator');
        const formData = application.form_data as CITReturnLettersData;
        
        const clientInfo: SharedClientInfo = {
          firstName: formData.selectedClient?.management_name?.split(' ')[0] || '',
          lastName: formData.selectedClient?.management_name?.split(' ').slice(1).join(' ') || '',
          companyName: formData.selectedClient?.company_name || '',
          shortCompanyName: formData.selectedClient?.company_name_short || '',
          date: formData.letterDate || new Date().toISOString().split('T')[0],
        };
        
        // Use combined preview PDF generator for consistent experience
        const blob = await generateCITReturnLettersCombinedPreviewPDF(formData, clientInfo);
        
        // Open combined PDF in new tab for preview
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Clean up the URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      } else {
        setError('PDF preview not supported for this application type.');
        return;
      }
      
      // Show success toast when PDF is successfully generated and opened
      toast.success('PDF preview opened in new window', {
        duration: 2000
      });
      
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      setError('Failed to generate PDF preview. Please try again.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handlePreviewTaxationSecondaryPDF = async () => {
    if (!application?.form_data || application.type !== 'taxation') return;
    
    try {
      setError(null);
      setIsPreviewLoadingSecondary(true);
      
      // Show toast notification about PDF generation and new window
      toast.info('Generating CIT Shareholder Declaration preview...', {
        description: 'PDF will open in a new window when ready',
        duration: 3000
      });
      
      const { generateCITShareholderDeclarationPDFWithFilename } = await import('@/lib/pdf-generator/utils/taxationGenerator');
      const formData = application.form_data as any; // TaxationData type
      
      const clientInfo: SharedClientInfo = {
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        companyName: formData.companyName || '',
        shortCompanyName: formData.shortCompanyName || '',
        date: formData.date || new Date().toISOString().split('T')[0],
      };
      
      const { blob } = await generateCITShareholderDeclarationPDFWithFilename(formData, clientInfo);
      
      // Open PDF in new tab for preview
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      // Show success toast when PDF is successfully generated and opened
      toast.success('CIT Shareholder Declaration preview opened in new window', {
        duration: 2000
      });
      
    } catch (error) {
      console.error('Error generating CIT Shareholder Declaration preview:', error);
      setError('Failed to generate CIT Shareholder Declaration preview. Please try again.');
    } finally {
      setIsPreviewLoadingSecondary(false);
    }
  };

  const handleSendPDF = async () => {
    if (!application) return;
    
    console.log('📧 GENERATING ACTUAL PDF for application:', application.id);
    console.log('🔧 FORM DATA:', application.form_data);
    
    // Helper functions for activity logging data
    const getClientName = (formData: any, appType: string): string => {
      // Normalize type to handle both hyphen and underscore formats
      const normalizedType = appType.replace('-', '_');
      
      if (normalizedType === 'cost_overview') {
        const costData = formData as any;
        return costData.clientDetails?.companyName || 
               `${costData.clientDetails?.firstName || ''} ${costData.clientDetails?.lastName || ''}`.trim();
      } else if (normalizedType === 'golden_visa') {
        return formData.companyName || `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
      } else if (normalizedType === 'company_services' || normalizedType === 'taxation') {
        return formData.companyName || `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
      } else if (normalizedType === 'cit_return_letters') {
        const citData = formData as CITReturnLettersData;
        return citData.selectedClient?.company_name || 'Unknown Client';
      }
      return 'Unknown Client';
    };

    const getDocumentType = (appType: string): string => {
      // Normalize type to handle both hyphen and underscore formats
      const normalizedType = appType.replace('-', '_');
      
      const typeMapping = {
        'cost_overview': 'Cost Overview',
        'golden_visa': 'Golden Visa',
        'company_services': 'Company Services',
        'taxation': 'Taxation',
        'cit_return_letters': 'CIT Return Letters'
      } as const;
      return typeMapping[normalizedType as keyof typeof typeMapping] || 'Document';
    };
    
    setIsSendLoading(true);
    
    try {
      let pdfBlob: Blob;
      let filename: string;
      
      // Generate actual PDF based on application type (handle both underscore and hyphen formats)
      const appType = application.type === 'golden-visa' ? 'golden-visa' : 
                     application.type === 'cost-overview' ? 'cost-overview' :
                     application.type === 'company-services' ? 'company-services' :
                     application.type;
      
      if (appType === 'golden-visa' || application.type === 'golden-visa') {
        const { generateGoldenVisaPDFWithFilename } = await import('@/lib/pdf-generator');
        const formData = application.form_data as GoldenVisaData;
        
        // Extract client info from form data
        const clientInfo: SharedClientInfo = {
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          companyName: formData.companyName || '',
          date: formData.date || new Date().toISOString().split('T')[0],
        };
        
        const result = await generateGoldenVisaPDFWithFilename(formData, clientInfo);
        pdfBlob = result.blob;
        filename = result.filename;
        
      } else if (appType === 'cost-overview' || application.type === 'cost-overview') {
        const { generatePDFWithFilename } = await import('@/lib/pdf-generator');
        const formData = application.form_data as OfferData;
        
        const result = await generatePDFWithFilename(formData);
        pdfBlob = result.blob;
        filename = result.filename;
        
      } else if (appType === 'company-services' || application.type === 'company-services') {
        const { generateCompanyServicesPDFWithFilename } = await import('@/lib/pdf-generator');
        const formData = application.form_data as CompanyServicesData;
        
        // Extract client info from form data
        const clientInfo: SharedClientInfo = {
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          companyName: formData.companyName || '',
          shortCompanyName: formData.shortCompanyName || '',
          date: formData.date || new Date().toISOString().split('T')[0],
        };
        
        const result = await generateCompanyServicesPDFWithFilename(formData, clientInfo);
        pdfBlob = result.blob;
        filename = result.filename;
        
      } else if (appType === 'taxation' || application.type === 'taxation') {
        const { generateTaxationPDFWithFilename } = await import('@/lib/pdf-generator/utils/taxationGenerator');
        const formData = application.form_data as any; // TaxationData type
        
        // Extract client info from form data
        const clientInfo: SharedClientInfo = {
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          companyName: formData.companyName || '',
          shortCompanyName: formData.shortCompanyName || '',
          date: formData.date || new Date().toISOString().split('T')[0],
        };
        
        const result = await generateTaxationPDFWithFilename(formData, clientInfo);
        pdfBlob = result.blob;
        filename = result.filename;
        
      } else if (appType === 'cit-return-letters' || application.type === 'cit-return-letters') {
        const { generateCITReturnLettersPDFWithFilename } = await import('@/lib/pdf-generator/utils/citReturnLettersGenerator');
        const formData = application.form_data as CITReturnLettersData;
        
        // Extract client info from form data
        const clientInfo: SharedClientInfo = {
          firstName: formData.selectedClient?.management_name?.split(' ')[0] || '',
          lastName: formData.selectedClient?.management_name?.split(' ').slice(1).join(' ') || '',
          companyName: formData.selectedClient?.company_name || '',
          shortCompanyName: formData.selectedClient?.company_name_short || '',
          date: formData.letterDate || new Date().toISOString().split('T')[0],
        };
        
        // Handle both new multi-select and legacy single selection
        const letterTypes = formData.selectedLetterTypes && formData.selectedLetterTypes.length > 0 
          ? formData.selectedLetterTypes 
          : (formData.letterType ? [formData.letterType] : []);
          
        if (letterTypes.length === 0) {
          throw new Error('No letter types found for CIT return letters application');
        }
        
        // For simplicity, use the first letter type for PDF generation in feedback modal
        // In practice, this could be expanded to handle multiple PDFs
        const firstLetterType = letterTypes[0];
        const letterData = { ...formData, letterType: firstLetterType };
        
        const result = await generateCITReturnLettersPDFWithFilename(letterData, clientInfo);
        pdfBlob = result.blob;
        filename = result.filename;
        
      } else {
        throw new Error(`PDF generation not supported for application type: ${application.type}`);
      }
      
      console.log('📧 GENERATED PDF:', { filename, size: pdfBlob.size, type: pdfBlob.type });
      
      // Determine template type based on application type (handle both formats)
      const getTemplateType = (appType: string) => {
        // Normalize the application type to handle both hyphen and underscore formats
        const normalizedType = appType.replace('-', '_');
        
        const templateMapping = {
          'cost_overview': 'COST_OVERVIEW',
          'golden_visa': 'GOLDEN_VISA', 
          'company_services': 'COMPANY_SERVICES',
          'company_incorporation': 'COMPANY_SERVICES',
          'taxation': 'TAXATION',
          'cit_return_letters': 'CIT_RETURN_LETTERS'
        } as const;
        
        return templateMapping[normalizedType as keyof typeof templateMapping] || 'COST_OVERVIEW';
      };
      
      const templateType = getTemplateType(application.type);
      
      // Use different email creation based on application type
      let emailProps: any;
      
      if (application.type === 'cit-return-letters') {
        // Use specialized CIT email generator
        const { createCITEmailDataFromFormData } = await import('@/components/cit-return-letters/CITEmailDraftGenerator');
        const formData = application.form_data as CITReturnLettersData;
        
        // Handle both new multi-select and legacy single selection for email
        const letterTypes = formData.selectedLetterTypes && formData.selectedLetterTypes.length > 0 
          ? formData.selectedLetterTypes 
          : (formData.letterType ? [formData.letterType] : []);
        
        const citEmailProps = await createCITEmailDataFromFormData(
          formData.selectedClient!,
          letterTypes.length === 1 ? letterTypes[0] : letterTypes, // Pass single type or array
          { blob: pdfBlob, filename }, // Convert to expected format
          user || undefined,
          formData.taxPeriodEnd // Pass tax period end date for dynamic calculations
        );
        
        // Set CIT email props to trigger the CITEmailDraftGenerator component
        setCitEmailDraftProps({
          ...citEmailProps,
          onSuccess: () => {
            console.log('📧 CIT EMAIL SENT SUCCESSFULLY!');
            setCitEmailDraftProps(null);
            setIsSendLoading(false);
            onClose();
          },
          onError: (error) => {
            console.error('📧 CIT EMAIL SEND ERROR:', error);
            toast.error('Failed to send email: ' + error);
            setCitEmailDraftProps(null);
            setIsSendLoading(false);
          },
          onClose: () => {
            console.log('📧 CIT EMAIL MODAL CLOSED');
            setCitEmailDraftProps(null);
            setIsSendLoading(false);
            onClose(); // Also close the feedback modal
          },
          activityLogging: {
            resource: 'cit-return-letters',
            client_name: getClientName(application.form_data, 'cit_return_letters'),
            document_type: getDocumentType('cit_return_letters'),
            filename: filename
          }
        });
        
        return; // Don't continue with regular email flow
      } else {
        // Use the EXISTING working function to create email props with user authentication
        emailProps = await createEmailDataFromFormData(
          application.form_data,
          pdfBlob,
          filename,
          templateType,
          user || undefined
        );
      }
      
      console.log('📧 CREATED EMAIL PROPS USING EXISTING SYSTEM:', emailProps);

      // Set email props to trigger the EmailDraftGenerator component (EXISTING WORKING WAY)
      setEmailDraftProps({
        ...emailProps,
        onSuccess: () => {
          console.log('📧 EMAIL SENT SUCCESSFULLY!');
          setEmailDraftProps(null);
          setIsSendLoading(false);
          onClose();
        },
        onError: (error) => {
          console.error('📧 EMAIL SEND ERROR:', error);
          toast.error('Failed to send email: ' + error);
          setEmailDraftProps(null);
          setIsSendLoading(false);
        },
        onClose: () => {
          console.log('📧 EMAIL MODAL CLOSED');
          setEmailDraftProps(null);
          setIsSendLoading(false);
          onClose(); // Also close the feedback modal
        },
        activityLogging: {
          resource: application.type.replace('_', '_'), // Keep original format for resource
          client_name: getClientName(application.form_data, application.type),
          document_type: getDocumentType(application.type),
          filename: filename
        }
      });
      
      // Don't close feedback modal immediately - let EmailDraftGenerator handle it
      
    } catch (error) {
      console.error('📧 ERROR GENERATING PDF OR SETTING UP EMAIL:', error);
      toast.error('Failed to generate PDF or prepare email: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsSendLoading(false);
    }
  };

  // Note: handleEditForm removed - now using onEditForm prop from TMEPortalHeader

  const resetState = () => {
    setError(null);
    setIsPreviewLoading(false);
    setIsPreviewLoadingSecondary(false);
    setIsSendLoading(false);
    setEmailDraftProps(null);
    setCitEmailDraftProps(null);
    setMessageHistory([]);
  };

  const fetchMessageHistory = async () => {
    if (!application?.id) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/applications/${application.id}/messages`);
      if (response.ok) {
        const messages = await response.json();
        setMessageHistory(messages);
      } else {
        console.error('Failed to fetch message history');
      }
    } catch (error) {
      console.error('Error fetching message history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };


  const renderMessageHistory = () => {
    if (messageHistory.length === 0) return (
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3" style={{ color: '#243F7B' }}>
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Conversation
        </label>
        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No conversation yet</p>
        </div>
      </div>
    );

    return (
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3" style={{ color: '#243F7B' }}>
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Conversation
        </label>
        <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg bg-white">
          {isLoadingHistory ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mx-auto mb-3"></div>
              Loading conversation...
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {messageHistory.map((message, index) => {
                const isChecker = message.user_role === 'reviewer';
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex gap-3 ${isChecker ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Sender Avatar (left side) */}
                    {!isChecker && (
                      <div className="flex-shrink-0">
                        {message.user ? (
                          <UserAvatar 
                            user={{
                              id: message.user.id,
                              employee_code: message.user.employee_code,
                              full_name: message.user.full_name,
                              email: message.user.email,
                              department: message.user.department,
                              designation: '',
                              status: 'active' as const,
                              must_change_password: false,
                              role: message.user.role
                            }}
                            size="sm"
                            className=""
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-semibold">
                            S
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Message Content */}
                    <div className={`flex-1 min-w-0 max-w-xs ${isChecker ? 'text-right' : 'text-left'}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isChecker ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-sm font-semibold text-gray-900">
                          {message.user?.full_name || 'User'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isChecker
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {isChecker ? 'Checker' : 'Sender'}
                        </span>
                      </div>
                      <div className={`p-3 rounded-lg ${
                        isChecker
                          ? 'bg-blue-50 border border-blue-100'
                          : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {message.message}
                        </p>
                      </div>
                    </div>

                    {/* Checker Avatar (right side) */}
                    {isChecker && (
                      <div className="flex-shrink-0">
                        {message.user ? (
                          <UserAvatar 
                            user={{
                              id: message.user.id,
                              employee_code: message.user.employee_code,
                              full_name: message.user.full_name,
                              email: message.user.email,
                              department: message.user.department,
                              designation: '',
                              status: 'active' as const,
                              must_change_password: false,
                              role: message.user.role
                            }}
                            size="sm"
                            className="ring-2 ring-blue-600"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: '#243F7B' }}>
                            C
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
      fetchMessageHistory();
    }
  }, [isOpen, application?.id]);

  if (!application) return null;

  const isApproved = application.status === 'approved';
  const isRejected = application.status === 'rejected';

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="feedback-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col"
            style={{ fontFamily: 'Inter, sans-serif' }}
            onClick={(e) => e.stopPropagation()}
          >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {isApproved ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                      )}
                      <h2 className="text-xl font-semibold" style={{ color: '#243F7B' }}>
                        {isApproved ? 'Application Approved' : 'Feedback Received'}
                      </h2>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-2">
                      {getFormTitle()}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>Checked by {application.reviewer?.full_name || 'Reviewer'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{application.reviewed_at ? new Date(application.reviewed_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.') : 'Recently'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </motion.button>
                </div>
              </div>

              {/* Removed View Toggle Tabs */}

              {/* Content */}
              <div className="px-6 py-6 overflow-y-auto flex-1">
                {
                  <div className="space-y-6">
                    {/* Status Message */}
                    <div className="mb-4">
                      <h3 className={`font-semibold text-sm mb-2 ${
                        isApproved ? 'text-green-800' : 'text-gray-800'
                      }`}>
                        {isApproved 
                          ? 'Your application has been approved!'
                          : 'Your application needs revisions'
                        }
                      </h3>
                      <p className={`text-sm ${
                        isApproved ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {isApproved
                          ? 'Your application has been approved and is ready for processing.'
                          : 'Review the conversation below for details.'
                        }
                      </p>
                    </div>

                    {/* Message History - Enhanced UI */}
                    {renderMessageHistory()}

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                      </motion.div>
                    )}

                    {/* Action Buttons - Special handling for taxation */}
                    {isApproved ? (
                      /* Approved: Single Send Button */
                      <div className="flex justify-center">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          type="button"
                          onClick={handleSendPDF}
                          disabled={isSendLoading}
                          className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: '#243F7B' }}
                        >
                          {isSendLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Opening form...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Send</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    ) : application.type === 'taxation' ? (
                      /* Rejected Taxation: Go to Form Editor + Dual Preview Buttons */
                      <div className="space-y-3">
                        {/* Go to Form Editor button */}
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          type="button"
                          onClick={onEditForm}
                          className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200"
                          style={{ 
                            backgroundColor: '#FEE2E2', 
                            color: '#DC2626' 
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Go to Form Editor</span>
                        </motion.button>
                        
                        {/* Dual Preview Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* CIT Disclaimer Preview */}
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="button"
                            onClick={handlePreviewPDF}
                            disabled={isPreviewLoading}
                            className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
                          >
                            {isPreviewLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#243F7B' }}></div>
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4" />
                                <span>Preview CIT Disclaimer</span>
                              </>
                            )}
                          </motion.button>
                          
                          {/* CIT Shareholder Declaration Preview */}
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="button"
                            onClick={handlePreviewTaxationSecondaryPDF}
                            disabled={isPreviewLoadingSecondary}
                            className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#F3F4F6', color: '#243F7B', border: '2px solid #243F7B' }}
                          >
                            {isPreviewLoadingSecondary ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#243F7B' }}></div>
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4" />
                                <span>Preview Mgt Declaration</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      /* Rejected Other Types: Go to Form Editor + Single Preview Button */
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          type="button"
                          onClick={onEditForm}
                          className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200"
                          style={{ 
                            backgroundColor: '#FEE2E2', 
                            color: '#DC2626' 
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Go to Form Editor</span>
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          type="button"
                          onClick={handlePreviewPDF}
                          disabled={isPreviewLoading}
                          className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
                        >
                          {isPreviewLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#243F7B' }}></div>
                              <span>Generating PDF...</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              <span>Preview PDF</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    )}
                  </div>
                }
              </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Email Draft Generator - EXISTING WORKING SYSTEM */}
      {emailDraftProps && (
        <EmailDraftGenerator {...emailDraftProps} />
      )}
      
      {/* CIT Email Draft Generator - FOR CIT RETURN LETTERS */}
      {citEmailDraftProps && (
        <CITEmailDraftGenerator {...citEmailDraftProps} />
      )}
    </AnimatePresence>
  );
};