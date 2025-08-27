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

// CIT Return Letters email templates
export const CIT_EMAIL_TEMPLATES = {
  'CIT TP': {
    subject: 'CIT Transfer Pricing Documentation', // Will be overridden by PDF filename
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
      }
      
      setShowPreview(true);
      
    } catch (error) {
      console.error('Error preparing CIT email preview:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleSendEmail = async (emailData: EmailPreviewData, additionalAttachments?: Array<{ blob: Blob; filename: string; contentType: string }>) => {
    try {
      // Combine original attachments with additional ones
      const allAttachments = [
        ...currentAttachments,
        ...(additionalAttachments || [])
      ];
      
      await sendEmail(emailData, allAttachments);
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
          activityLogging={props.activityLogging}
        />
      )}
    </>
  );
};

// Helper function to create email data from CIT form data and client info
export const createCITEmailDataFromFormData = async (
  client: Client,
  letterType: LetterType,
  pdfBlob: Blob,
  pdfFilename: string,
  userInfo?: { full_name?: string; designation?: string; employee_code?: string; phone?: string; department?: string }
): Promise<CITEmailDraftGeneratorProps> => {
  
  // Add CC email for CIT return letters
  const ccEmails = ['CIT@TME-Services.com'];

  const recipients: CITEmailRecipientData = {
    emails: [client.management_email],
    ccEmails: ccEmails,
    firstName: client.management_name?.split(' ')[0] || 'Client',
    lastName: client.management_name?.split(' ').slice(1).join(' ') || '',
    companyName: client.company_name,
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