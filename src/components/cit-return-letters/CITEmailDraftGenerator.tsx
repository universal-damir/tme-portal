'use client';

/**
 * CIT Return Letters Email Draft Generator Component
 * Creates formatted emails for CIT return letter documents with PDF attachments
 */

import React, { useState, useRef } from 'react';
import { EmailPreviewModal, EmailPreviewData } from '../shared/EmailPreviewModal';
import { useEmailSender } from '@/hooks/useEmailSender';
import { getDepartmentPhone } from '@/lib/department-phones';
import { Client, LetterType } from '@/types/cit-return-letters';

// Email template interface for CIT letters
export interface CITEmailTemplate {
  subject: string;
  greeting: string;
  bodyContent: readonly string[];
  previewText?: string;
  signature?: string;
  includeColoredText?: boolean;
  fontFamily?: string;
  fontSize?: string;
}

// Email recipient data interface for CIT letters
export interface CITEmailRecipientData {
  emails: string[];
  ccEmails?: string[];
  firstName?: string;
  lastName?: string;
  companyName?: string;
  companyShortName?: string;
  companyCode?: string;
  senderName?: string;
  senderDesignation?: string;
  senderPhone?: string;
  senderDepartment?: string;
  senderEmployeeCode?: string;
}

// PDF attachment data interface
export interface CITEmailAttachment {
  blob: Blob;
  filename: string;
  contentType?: string;
}

// Main props interface for CIT Email Draft Generator
export interface CITEmailDraftGeneratorProps {
  recipients: CITEmailRecipientData;
  template: CITEmailTemplate;
  attachments?: CITEmailAttachment[];
  onSuccess?: (draftId: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  fallbackToMailto?: boolean;
  // Optional props for activity logging
  activityLogging?: {
    resource: string;
    client_name: string;
    document_type: string;
    filename?: string;
  };
}

// New CIT Return Filing email template
export const CIT_RETURN_FILING_EMAIL_TEMPLATE = {
  subject: '{dynamicSubject}',
  greeting: 'Dear {firstName},',
  bodyContent: [
    '<span style="font-family: Arial, sans-serif; font-size: 10pt;">With reference to the subject matter, the first CIT return filing for your company is due for submission by {dueDate}.</span>',
    '<span style="font-family: Arial, sans-serif; font-size: 10pt;">In this regard, we have prepared the following documents for your review and signature. Kindly sign and stamp ALL the pages of the attached {letterWord}:</span>',
    '<span style="font-family: Arial, sans-serif; font-size: 10pt;">{dynamicLetterList}</span>',
    '<span style="font-family: Arial, sans-serif; font-size: 10pt;">As soon as we receive the signed and stamped documents, we will proceed to file the CIT returns and share the acknowledgement issued by the FTA with you.</span>',
    '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Additionally, please find attached the relevant documents prepared for your review.</span>',
    '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Please let us know if you have any questions in the meantime.</span>',
    '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Best regards,</span>',
    '<br><br><span style="font-family: Arial, sans-serif; font-size: 12pt; font-weight: bold; color: #243F7B;">{senderName}</span><br><span style="font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; color: #666;">{senderDesignation}</span><br>{senderPhone}'
  ],
  includeColoredText: false,
  fontFamily: 'Arial, sans-serif',
  fontSize: '10pt'
} as const;

// Legacy templates - maintained for backward compatibility
export const CIT_EMAIL_TEMPLATES = {
  'CIT TP': {
    subject: 'CIT Transfer Pricing Documentation',
    greeting: 'Dear {firstName},',
    bodyContent: [
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Please find attached the Corporate Income Tax Transfer Pricing documentation for {companyName} (Client Code: {companyCode}).</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">This document provides comprehensive transfer pricing documentation in accordance with UAE Corporate Income Tax requirements.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">The documentation includes detailed analysis of related party transactions and compliance with arm\'s length principles as required by UAE CIT regulations.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Should you require any clarification or have questions regarding this documentation, please do not hesitate to contact us.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Best regards,</span>',
      '<br><br><span style="font-family: Arial, sans-serif; font-size: 12pt; font-weight: bold; color: #243F7B;">{senderName}</span><br><span style="font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; color: #666;">{senderDesignation}</span><br>{senderPhone}'
    ],
    includeColoredText: false,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  },
  'Conf acc docs + FS': {
    subject: 'Confirmation of Accounting Documents and Financial Statements',
    greeting: 'Dear {firstName},',
    bodyContent: [
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Please find attached the confirmation letter for accounting documents and Financial Statements for {companyName} (Client Code: {companyCode}).</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">This document confirms the accuracy and completeness of the accounting records and financial statements prepared for Corporate Income Tax compliance purposes.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">The confirmation covers all relevant accounting treatments, adjustments, and compliance with International Financial Reporting Standards (IFRS) as applicable under UAE CIT regulations.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Please review the attached documentation and let us know if you require any additional information or clarification.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Best regards,</span>',
      '<br><br><span style="font-family: Arial, sans-serif; font-size: 12pt; font-weight: bold; color: #243F7B;">{senderName}</span><br><span style="font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; color: #666;">{senderDesignation}</span><br>{senderPhone}'
    ],
    includeColoredText: false,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  },
  'CIT assess+concl, non deduct, elect': {
    subject: 'CIT Assessment, Conclusions and Elections',
    greeting: 'Dear {firstName},',
    bodyContent: [
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Please find attached the Corporate Income Tax assessment, conclusions, and elections documentation for {companyName} (Client Code: {companyCode}).</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">This comprehensive document includes our assessment of the CIT impact, conclusions regarding tax obligations, non-deductible expenses analysis, and relevant elections under UAE CIT law.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">The document covers key areas including QFZP benefit assessments, small business relief calculations, transitional rules elections, and detailed analysis of non-deductible expenses.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">We recommend reviewing this documentation carefully and discussing any questions or concerns with our tax advisory team.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Best regards,</span>',
      '<br><br><span style="font-family: Arial, sans-serif; font-size: 12pt; font-weight: bold; color: #243F7B;">{senderName}</span><br><span style="font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; color: #666;">{senderDesignation}</span><br>{senderPhone}'
    ],
    includeColoredText: false,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  }
} as const;

// CIT Email Draft Generator Hook
export const useCITEmailDraftGenerator = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [emailPreviewData, setEmailPreviewData] = useState<EmailPreviewData | null>(null);
  const [currentAttachments, setCurrentAttachments] = useState<CITEmailAttachment[]>([]);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string | null>(null);
  const { sendEmail, loading } = useEmailSender();
  
  // Store callbacks in refs so they can be accessed in handleSendEmail
  const onSuccessRef = useRef<((draftId: string) => void) | undefined>(undefined);
  const onErrorRef = useRef<((error: string) => void) | undefined>(undefined);
  const onCloseRef = useRef<(() => void) | undefined>(undefined);
  
  const generateEmailDraft = async ({
    recipients,
    template,
    attachments = [],
    onSuccess,
    onError,
    onClose
  }: CITEmailDraftGeneratorProps) => {
    
    // Store callbacks in refs
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    onCloseRef.current = onClose;
    
    try {
      // Process template variables
      const processedTemplate = processCITEmailTemplate(template, recipients);
      
      // Create formatted HTML email content
      const htmlContent = createFormattedEmailHTML(processedTemplate);
      
      // Prepare email preview data
      const previewData: EmailPreviewData = {
        to: recipients.emails,
        cc: recipients.ccEmails,
        subject: processedTemplate.subject,
        htmlContent,
        attachments: attachments.map(att => ({
          filename: att.filename,
          contentType: att.contentType || 'application/pdf',
          size: att.blob.size
        }))
      };
      
      // Store data for modal
      setEmailPreviewData(previewData);
      setCurrentAttachments(attachments);
      
      // Store PDF blob and filename if available
      if (attachments.length > 0) {
        setPdfBlob(attachments[0].blob);
        setPdfFilename(attachments[0].filename);
        // Store additional PDFs if there are more than one
        if (attachments.length > 1) {
          setCurrentAttachments(attachments);
        }
      }
      
      setShowPreview(true);
      
    } catch (error) {
      console.error('Error preparing CIT email preview:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleSendEmail = async (emailData: EmailPreviewData, additionalAttachments?: Array<{ blob: Blob; filename: string; contentType: string }>) => {
    try {
      // Rebuild the attachment list with blobs
      // emailData.attachments contains metadata for all files (original PDFs + user uploads)
      // We need to map them back to blob format for sending
      
      // Start with original PDF attachments (they have blobs in currentAttachments)
      const attachmentsWithBlobs: EmailAttachment[] = currentAttachments.map(att => ({
        blob: att.blob,
        filename: att.filename,
        contentType: att.contentType || 'application/pdf'
      }));
      
      // Add any additional user-uploaded attachments from the modal
      if (additionalAttachments) {
        attachmentsWithBlobs.push(...additionalAttachments);
      }
      
      await sendEmail(emailData, attachmentsWithBlobs);
      // Call success callback if provided
      if (onSuccessRef.current) {
        onSuccessRef.current('email-sent');
      }
    } catch (error) {
      if (onErrorRef.current) {
        onErrorRef.current(error instanceof Error ? error.message : 'Unknown error');
      }
      throw error; // Let modal handle the error display
    }
  };

  const closePreview = (onCloseCallback?: () => void) => {
    setShowPreview(false);
    setEmailPreviewData(null);
    setCurrentAttachments([]);
    setPdfBlob(null);
    setPdfFilename(null);
    // Call the onClose callback if provided
    if (onCloseCallback) {
      onCloseCallback();
    }
  };

  return { 
    generateEmailDraft, 
    showPreview, 
    emailPreviewData, 
    handleSendEmail, 
    closePreview, 
    loading,
    pdfBlob,
    pdfFilename,
    currentAttachments,
    // Setter functions for updating attachment state
    setPdfBlob,
    setPdfFilename,
    setCurrentAttachments
  };
};

// Process CIT email template with dynamic variables
export const processCITEmailTemplate = (template: CITEmailTemplate, recipients: CITEmailRecipientData): CITEmailTemplate => {
  const firstName = recipients.firstName || 'Client';
  const lastName = recipients.lastName || '';
  const companyName = recipients.companyName || 'Company';
  const companyCode = recipients.companyCode || '';
  const senderName = recipients.senderName || 'TME Services Team';
  const senderDesignation = recipients.senderDesignation || '';
  
  // Build phone numbers string with both UAE personal and German department numbers
  let phoneNumbers = '';
  
  // Add UAE phone if available
  if (recipients.senderPhone) {
    phoneNumbers += `<br><span style="font-family: Arial, sans-serif; font-size: 10pt;"><span style="color: #243F7B;">M UAE:</span> <span style="color: #666;">${recipients.senderPhone}</span></span>`;
  }
  
  // Add German department phone if available
  const departmentPhone = getDepartmentPhone(recipients.senderDepartment, recipients.senderEmployeeCode);
  if (departmentPhone) {
    phoneNumbers += `<br><span style="font-family: Arial, sans-serif; font-size: 10pt;"><span style="color: #243F7B;">T GER:</span> <span style="color: #666;">${departmentPhone}</span></span>`;
  }
  
  const senderPhone = phoneNumbers;

  // Replace template variables
  const processText = (text: string): string => {
    return text
      .replace(/{firstName}/g, firstName)
      .replace(/{lastName}/g, lastName)
      .replace(/{companyName}/g, companyName)
      .replace(/{companyCode}/g, companyCode)
      .replace(/{senderName}/g, senderName)
      .replace(/{senderDesignation}/g, senderDesignation)
      .replace(/{senderPhone}/g, senderPhone);
  };

  return {
    ...template,
    greeting: processText(template.greeting),
    bodyContent: template.bodyContent.map(processText),
    signature: template.signature ? processText(template.signature) : undefined
  };
};

// Create formatted HTML email content
export const createFormattedEmailHTML = (template: CITEmailTemplate): string => {
  const { greeting, bodyContent, signature, previewText, fontFamily = 'Arial, sans-serif', fontSize = '10pt' } = template;
  
  let htmlContent = ``;
  
  htmlContent += `
    <div style="font-family: ${fontFamily}; font-size: ${fontSize}; line-height: 1.4; color: #333;">
      <p style="margin-bottom: 12px;">${greeting}</p>
  `;
  
  // Add body content with proper spacing
  bodyContent.forEach((content, index) => {
    htmlContent += `      <p style="margin-bottom: 12px;">${content}</p>\n`;
  });
  
  // Add signature if provided
  if (signature) {
    htmlContent += `      <br>\n      <p style="margin-top: 16px;">${signature}</p>\n`;
  }
  
  htmlContent += `    </div>`;
  
  return htmlContent;
};

// React Component version with Preview Modal (no language toggle)
export const CITEmailDraftGenerator: React.FC<CITEmailDraftGeneratorProps> = (props) => {
  const { 
    generateEmailDraft, 
    showPreview, 
    emailPreviewData, 
    handleSendEmail, 
    closePreview, 
    loading,
    pdfBlob,
    pdfFilename,
    currentAttachments,
    setPdfBlob,
    setPdfFilename,
    setCurrentAttachments
  } = useCITEmailDraftGenerator();
  
  // Generate email preview when component mounts
  React.useEffect(() => {
    generateEmailDraft(props);
  }, []);

  return (
    <>
      {showPreview && emailPreviewData && (
        <EmailPreviewModal
          isOpen={showPreview}
          onClose={() => closePreview(props.onClose)}
          emailData={emailPreviewData}
          onSend={handleSendEmail}
          loading={loading}
          pdfBlob={pdfBlob || undefined}
          pdfFilename={pdfFilename || undefined}
          additionalPdfs={currentAttachments.length > 1 ? currentAttachments.slice(1).map(att => ({ blob: att.blob, filename: att.filename })) : undefined}
          activityLogging={props.activityLogging}
        />
      )}
    </>
  );
};

// Helper function to calculate CIT return due date (9 months from tax period end - 1 day)
const calculateCITDueDate = (taxPeriodEnd: string): string => {
  const endDate = new Date(taxPeriodEnd);
  
  // Add 9 months to the tax period end date, then subtract 1 day
  const dueDate = new Date(endDate);
  dueDate.setMonth(dueDate.getMonth() + 9);
  dueDate.setDate(dueDate.getDate() - 1);
  
  // Format as dd.mm.yyyy
  const day = dueDate.getDate().toString().padStart(2, '0');
  const month = (dueDate.getMonth() + 1).toString().padStart(2, '0');
  const year = dueDate.getFullYear();
  
  return `${day}.${month}.${year}`;
};

// Helper function to extract tax year from tax period end date
const getTaxYear = (taxPeriodEnd: string): string => {
  const endDate = new Date(taxPeriodEnd);
  return endDate.getFullYear().toString();
};

// Process the new CIT Return Filing email template
export const processCITReturnFilingEmailTemplate = (
  template: CITEmailTemplate,
  recipients: CITEmailRecipientData,
  letterTypes: LetterType[],
  taxPeriodEnd: string
): CITEmailTemplate => {
  const firstName = recipients.firstName || 'Client';
  const companyName = recipients.companyName || 'Company';
  const companyShortName = recipients.companyShortName || companyName || 'Company';
  const companyCode = recipients.companyCode || '';
  const senderName = recipients.senderName || 'TME Services Team';
  const senderDesignation = recipients.senderDesignation || '';
  
  // Calculate dynamic values from tax period end date
  const taxYear = getTaxYear(taxPeriodEnd);
  const dueDate = calculateCITDueDate(taxPeriodEnd);
  
  // Generate dynamic subject line with client code at the beginning
  const generateDynamicSubject = (): string => {
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const formattedDate = `${yy}${mm}${dd}`;
    
    const companyShort = companyShortName; // Use company SHORT name for subject
    
    // Clean letter type names for subject
    const letterTypeParts = letterTypes.map((type: string) => {
      switch (type) {
        case 'CIT TP':
          return 'CIT TP';
        case 'Conf acc docs + FS':
          return 'Conf acc docs FS';
        case 'CIT assess+concl, non deduct, elect':
          return 'CIT assess concl non deduct elect';
        default:
          return type.replace(/[+,]/g, '').replace(/\s+/g, ' ').trim();
      }
    });
    
    const letterTypeString = letterTypeParts.join(' - ');
    
    // Add client code at the beginning of the subject
    return `${companyCode} ${formattedDate} ${companyShort} ${letterTypeString} ${taxYear}`;
  };
  
  const dynamicSubject = generateDynamicSubject();
  
  // Build phone numbers string
  let phoneNumbers = '';
  if (recipients.senderPhone) {
    phoneNumbers += `<br><span style="font-family: Arial, sans-serif; font-size: 10pt;"><span style="color: #243F7B;">M UAE:</span> <span style="color: #666;">${recipients.senderPhone}</span></span>`;
  }
  
  const departmentPhone = getDepartmentPhone(recipients.senderDepartment, recipients.senderEmployeeCode);
  if (departmentPhone) {
    phoneNumbers += `<br><span style="font-family: Arial, sans-serif; font-size: 10pt;"><span style="color: #243F7B;">T GER:</span> <span style="color: #666;">${departmentPhone}</span></span>`;
  }
  
  const senderPhone = phoneNumbers;

  // Determine singular/plural for letter word
  const letterWord = letterTypes.length === 1 ? 'letter' : 'letters';

  // Generate dynamic letter list based on selected types with proper numbering
  const letterList = letterTypes.map((type, index) => {
    const itemNumber = index + 1; // Start from 1
    switch (type) {
      case 'CIT TP':
        return `<span style="font-family: Arial, sans-serif; font-size: 10pt;">${itemNumber}. CIT TP</span>`;
      case 'Conf acc docs + FS':
        return `<span style="font-family: Arial, sans-serif; font-size: 10pt;">${itemNumber}. Conf acc docs + FS</span>`;
      case 'CIT assess+concl, non deduct, elect':
        return `<span style="font-family: Arial, sans-serif; font-size: 10pt;">${itemNumber}. CIT assess + concl, non-deduct, elect</span>`;
      default:
        return '';
    }
  }).filter(Boolean).join('<br>');

  // Replace template variables
  const processText = (text: string): string => {
    return text
      .replace(/{firstName}/g, firstName)
      .replace(/{companyName}/g, companyName)
      .replace(/{clientCode}/g, companyCode)
      .replace(/{clientName}/g, companyName)
      .replace(/{taxYear}/g, taxYear)
      .replace(/{dueDate}/g, dueDate)
      .replace(/{senderName}/g, senderName)
      .replace(/{senderDesignation}/g, senderDesignation)
      .replace(/{senderPhone}/g, senderPhone)
      .replace(/{dynamicLetterList}/g, letterList)
      .replace(/{dynamicSubject}/g, dynamicSubject)
      .replace(/{letterWord}/g, letterWord);
  };

  return {
    ...template,
    subject: processText(template.subject),
    greeting: processText(template.greeting),
    bodyContent: template.bodyContent.map(processText),
    signature: template.signature ? processText(template.signature) : undefined
  };
};

// Helper function to create email data from CIT form data and client info - Updated for multiple letters
export const createCITEmailDataFromFormData = async (
  client: Client,
  letterTypes: LetterType | LetterType[], // Support both single and multiple
  pdfResults: { blob: Blob; filename: string } | { blob: Blob; filename: string }[], // Support both single and multiple PDFs
  userInfo?: { full_name?: string; designation?: string; employee_code?: string; phone?: string; department?: string },
  taxPeriodEnd?: string, // Add tax period end parameter
  citReturnLettersData?: any // Add full CIT data to access custom receiver details
): Promise<CITEmailDraftGeneratorProps> => {
  
  // Normalize inputs to arrays
  const normalizedLetterTypes = Array.isArray(letterTypes) ? letterTypes : [letterTypes];
  const normalizedPdfResults = Array.isArray(pdfResults) ? pdfResults : [pdfResults];
  
  // Add CC email for CIT return letters
  const ccEmails = ['CIT@TME-Services.com'];

  // Determine if we should use custom receiver details
  const useCustomReceiver = citReturnLettersData?.useCustomReceiverDetails && 
                           citReturnLettersData?.customReceiverFirstName &&
                           citReturnLettersData?.customReceiverEmail;

  const recipients: CITEmailRecipientData = {
    emails: useCustomReceiver 
      ? [citReturnLettersData.customReceiverEmail]
      : [client.management_email],
    ccEmails: ccEmails,
    firstName: useCustomReceiver 
      ? citReturnLettersData.customReceiverFirstName
      : client.management_name?.split(' ')[0] || 'Client',
    lastName: useCustomReceiver
      ? citReturnLettersData.customReceiverLastName || ''
      : client.management_name?.split(' ').slice(1).join(' ') || '',
    companyName: client.company_name,
    companyShortName: client.company_name_short, // Add the company short name
    companyCode: client.company_code,
    senderName: userInfo?.full_name || 'TME Services Team',
    senderDesignation: userInfo?.designation || '',
    senderPhone: userInfo?.phone || '',
    senderDepartment: userInfo?.department || '',
    senderEmployeeCode: userInfo?.employee_code || ''
  };

  // Use the tax period end date provided, or fallback to current year end
  const effectiveTaxPeriodEnd = taxPeriodEnd || `${new Date().getFullYear()}-12-31`;

  // Use new template for multiple letters or single letter
  const template: CITEmailTemplate = processCITReturnFilingEmailTemplate(
    CIT_RETURN_FILING_EMAIL_TEMPLATE,
    recipients,
    normalizedLetterTypes,
    effectiveTaxPeriodEnd
  );

  const attachments: CITEmailAttachment[] = normalizedPdfResults.map(result => ({
    blob: result.blob,
    filename: result.filename,
    contentType: 'application/pdf'
  }));

  return {
    recipients,
    template,
    attachments
  };
};

// Legacy function - maintained for backward compatibility
export const createCITEmailDataFromFormDataLegacy = async (
  client: Client,
  letterType: LetterType,
  pdfBlob: Blob,
  pdfFilename: string,
  userInfo?: { full_name?: string; designation?: string; employee_code?: string; phone?: string; department?: string }
): Promise<CITEmailDraftGeneratorProps> => {
  
  const ccEmails = ['CIT@TME-Services.com'];

  const recipients: CITEmailRecipientData = {
    emails: [client.management_email],
    ccEmails: ccEmails,
    firstName: client.management_name?.split(' ')[0] || 'Client',
    lastName: client.management_name?.split(' ').slice(1).join(' ') || '',
    companyName: client.company_name,
    companyShortName: client.company_name_short, // Add the company short name
    companyCode: client.company_code,
    senderName: userInfo?.full_name || 'TME Services Team',
    senderDesignation: userInfo?.designation || '',
    senderPhone: userInfo?.phone || '',
    senderDepartment: userInfo?.department || '',
    senderEmployeeCode: userInfo?.employee_code || ''
  };

  const template: CITEmailTemplate = {
    ...CIT_EMAIL_TEMPLATES[letterType],
    subject: pdfFilename.replace('.pdf', '')
  };

  const attachments: CITEmailAttachment[] = [{
    blob: pdfBlob,
    filename: pdfFilename,
    contentType: 'application/pdf'
  }];

  return {
    recipients,
    template,
    attachments
  };
};

export default CITEmailDraftGenerator;