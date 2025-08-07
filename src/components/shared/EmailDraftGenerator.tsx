'use client';

/**
 * Reusable Email Draft Generator Component
 * Creates formatted emails with PDF attachments using SMTP with preview modal
 */

import React, { useState } from 'react';
import { EmailPreviewModal, EmailPreviewData } from './EmailPreviewModal';
import { useEmailSender } from '@/hooks/useEmailSender';

// Email template interface for customization
export interface EmailTemplate {
  subject: string;
  greeting: string;
  bodyContent: readonly string[];
  previewText?: string; // Short preview text for notifications (up to 100 chars)
  signature?: string;
  includeColoredText?: boolean;
  fontFamily?: string;
  fontSize?: string;
}

// Email recipient data interface
export interface EmailRecipientData {
  emails: string[];
  firstName?: string;
  lastName?: string;
  companyName?: string;
  authorityName?: string;
  senderName?: string;
}

// PDF attachment data interface
export interface EmailAttachment {
  blob: Blob;
  filename: string;
  contentType?: string;
}

// Main props interface
export interface EmailDraftGeneratorProps {
  recipients: EmailRecipientData;
  template: EmailTemplate;
  attachments?: EmailAttachment[];
  onSuccess?: (draftId: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void; // Add onClose callback
  fallbackToMailto?: boolean;
  // Optional props for activity logging
  activityLogging?: {
    resource: string; // e.g., 'golden_visa', 'cost_overview'
    client_name: string; // e.g., 'Novalic Damir' or 'Company Name'
    document_type: string; // e.g., 'Golden Visa', 'Cost Overview'
    filename?: string; // e.g., '250806 Novalic Damir IFZA 1 0 0 0 0 setup AED EUR.pdf'
  };
}

// Default email templates for different tabs with Arial 10pt formatting
export const EMAIL_TEMPLATES = {
  COST_OVERVIEW: {
    subject: '', // Will be set from PDF filename
    greeting: 'Hello {firstName},',
    previewText: 'Your UAE business setup offer is ready - detailed pricing and services included',
    bodyContent: [
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">We are sharing with you our cost overview for setting up a company under the {authorityName} in Dubai.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">The items marked in <span style="color: #006600; font-weight: bold;">green</span> represent one-time costs related to the company formation.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">The items marked in <span style="color: #0066cc; font-weight: bold;">blue</span> indicate visa-related costs; each visa is valid for two years.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">The items marked in <span style="color: #DAA520; font-weight: bold;">yellow</span> reflect the annual license renewal fees, which apply from the second year onward.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">The items marked in <span style="color: #FF8C00; font-weight: bold;">orange</span> represent additional service offerings that are commonly required.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">If you have any questions or need clarification, please don\'t hesitate to reply to this email. A member of our team will get back to you promptly.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">We look forward to hearing from you.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Regards</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">{senderName}</span>'
    ],
    includeColoredText: true,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  },
  GOLDEN_VISA: {
    subject: '', // Will be set from PDF filename
    greeting: 'Dear {firstName},',
    previewText: 'Your Golden Visa offer is ready for review - complete documentation and pricing included',
    bodyContent: [
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">I hope this email finds you well.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Following our discussion regarding your Golden Visa application, I am pleased to provide you with the comprehensive documentation and cost breakdown as requested.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt; color: #0066cc; font-weight: bold;">📋 What\'s Included:</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">• Complete Golden Visa application requirements and timeline</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">• Detailed cost breakdown including government fees and our service charges</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">• Step-by-step process explanation</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">• Required documentation checklist</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt; color: #006600; font-weight: bold;">✓ Next Steps:</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Please review the attached proposal at your convenience. Should you have any questions or require clarification on any aspect, I would be happy to schedule a call to discuss further.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Thank you for considering TME Services for your Golden Visa application. We look forward to assisting you with this important milestone.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Best regards,<br>TME Services Team</span>'
    ],
    includeColoredText: true,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  },
  COMPANY_SERVICES: {
    subject: '', // Will be set from PDF filename
    greeting: 'Dear {firstName}, your company services proposal is ready.',
    bodyContent: [
      '<span style="font-family: Arial, sans-serif; font-size: 10pt; color: #0066cc; font-weight: bold;">📋 Company Services Proposal</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Please find attached the detailed proposal for your company services requirements.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt; color: #006600;">✓ Customized service packages included</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt; color: #0066cc; text-decoration: underline;">We look forward to discussing this further with you.</span>'
    ],
    includeColoredText: true,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  },
  TAXATION: {
    subject: '', // Will be set from PDF filename
    greeting: 'Dear {firstName}, your taxation services proposal is attached.',
    bodyContent: [
      '<span style="font-family: Arial, sans-serif; font-size: 10pt; color: #cc0000; font-weight: bold;">🏛️ Taxation Services Proposal</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Please review the taxation services proposal attached to this email.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt; color: #006600;">✓ Compliance requirements covered</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt; color: #0066cc;">Our team is available to answer any questions you may have.</span>'
    ],
    includeColoredText: true,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  }
} as const;

// Email Draft Generator Hook with SMTP Preview
export const useEmailDraftGenerator = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [emailPreviewData, setEmailPreviewData] = useState<EmailPreviewData | null>(null);
  const [currentAttachments, setCurrentAttachments] = useState<EmailAttachment[]>([]);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string | null>(null);
  const [additionalPdfs, setAdditionalPdfs] = useState<Array<{blob: Blob; filename: string}>>([]);
  const { sendEmail, loading } = useEmailSender();
  
  const generateEmailDraft = async ({
    recipients,
    template,
    attachments = [],
    onSuccess,
    onError,
    onClose
  }: EmailDraftGeneratorProps) => {
    
    try {
      // Process template variables
      const processedTemplate = processEmailTemplate(template, recipients);
      
      // Create formatted HTML email content
      const htmlContent = createFormattedEmailHTML(processedTemplate);
      
      // Prepare email preview data
      const previewData: EmailPreviewData = {
        to: recipients.emails,
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
        
        // Store additional PDFs if available
        if (attachments.length > 1) {
          const additionalPdfData = attachments.slice(1).map(att => ({
            blob: att.blob,
            filename: att.filename
          }));
          setAdditionalPdfs(additionalPdfData);
        } else {
          setAdditionalPdfs([]);
        }
      }
      setShowPreview(true);
      
    } catch (error) {
      console.error('Error preparing email preview:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleSendEmail = async (emailData: EmailPreviewData) => {
    try {
      await sendEmail(emailData, currentAttachments);
      // Call success callback if provided
      // onSuccess?.('email-sent'); // Could be enhanced to return email ID
    } catch (error) {
      throw error; // Let modal handle the error display
    }
  };

  const closePreview = (onCloseCallback?: () => void) => {
    setShowPreview(false);
    setEmailPreviewData(null);
    setCurrentAttachments([]);
    setPdfBlob(null);
    setPdfFilename(null);
    setAdditionalPdfs([]);
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
    additionalPdfs
  };
};

// Process email template with dynamic variables
const processEmailTemplate = (template: EmailTemplate, recipients: EmailRecipientData): EmailTemplate => {
  const firstName = recipients.firstName || 'Client';
  const lastName = recipients.lastName || '';
  const companyName = recipients.companyName || '';
  const authorityName = recipients.authorityName || 'Authority';
  const senderName = recipients.senderName || 'TME Services Team';

  // Replace template variables
  const processText = (text: string): string => {
    return text
      .replace(/{firstName}/g, firstName)
      .replace(/{lastName}/g, lastName)
      .replace(/{companyName}/g, companyName)
      .replace(/{authorityName}/g, authorityName)
      .replace(/{senderName}/g, senderName);
  };

  return {
    ...template,
    greeting: processText(template.greeting),
    bodyContent: template.bodyContent.map(processText),
    signature: template.signature ? processText(template.signature) : undefined
  };
};

// Create formatted HTML email content
const createFormattedEmailHTML = (template: EmailTemplate): string => {
  const { greeting, bodyContent, signature, previewText, fontFamily = 'Arial, sans-serif', fontSize = '10pt' } = template;
  
  let htmlContent = ``;
  
  // Add preview text for email clients (hidden but used for notifications)
  if (previewText) {
    htmlContent += `    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: ${fontFamily}; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${previewText}</div>\n`;
  }
  
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

// React Component version with Preview Modal
export const EmailDraftGenerator: React.FC<EmailDraftGeneratorProps> = (props) => {
  const { 
    generateEmailDraft, 
    showPreview, 
    emailPreviewData, 
    handleSendEmail, 
    closePreview, 
    loading,
    pdfBlob,
    pdfFilename,
    additionalPdfs
  } = useEmailDraftGenerator();
  
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
          additionalPdfs={additionalPdfs}
          activityLogging={props.activityLogging}
        />
      )}
    </>
  );
};

// Helper function to create email data from common form data
export const createEmailDataFromFormData = (
  formData: any,
  pdfBlob: Blob,
  pdfFilename: string,
  templateType: keyof typeof EMAIL_TEMPLATES,
  userInfo?: { full_name?: string } // Optional user info parameter
): EmailDraftGeneratorProps => {
  
  // Extract client details (handles different form structures)
  const clientDetails = formData.clientDetails || formData;
  
  const recipients: EmailRecipientData = {
    emails: clientDetails.clientEmails || [],
    firstName: clientDetails.firstName,
    lastName: clientDetails.lastName,
    companyName: clientDetails.companyName,
    // Add additional data for template processing
    authorityName: formData.authorityInformation?.responsibleAuthority || 'Authority',
    senderName: userInfo?.full_name || 'TME Services Team' // Use actual user name if available
  };

  const template: EmailTemplate = {
    ...EMAIL_TEMPLATES[templateType],
    subject: pdfFilename.replace('.pdf', '')
  };

  const attachments: EmailAttachment[] = [{
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

export default EmailDraftGenerator;