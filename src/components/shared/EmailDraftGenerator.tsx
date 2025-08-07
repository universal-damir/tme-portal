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
  senderDesignation?: string;
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
  // Props for language switching in modal
  templateType?: keyof typeof EMAIL_TEMPLATES;
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
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Kindly review the attached overview and return a signed copy for our records.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">If you have any questions or need clarification, please don\'t hesitate to reply to this email. A member of our team will get back to you promptly.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">We look forward to hearing from you.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Regards</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt; font-weight: bold; margin-bottom: 3px;">{senderName}<br><span style="font-weight: normal;">{senderDesignation}</span></span>'
    ],
    includeColoredText: true,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  },
  GOLDEN_VISA: {
    subject: '', // Will be set from PDF filename
    greeting: 'Hello {firstName},',
    previewText: 'Your UAE Golden Visa offer is ready - personalized documentation and pricing included',
    bodyContent: [
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">We are happy to share a personalized offer for the UAE Golden Visa, tailored to your specific needs.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">The document includes an overview of the visa requirements, a breakdown of the process, and our scope of services. Please review the offer and return a signed copy for our records.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Once we receive your confirmation, we will coordinate the next steps and provide guidance on the required documents and appointments.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">If you have any questions, feel free to reach out.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Regards</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt; font-weight: bold; margin-bottom: 3px;">{senderName}<br><span style="font-weight: normal;">{senderDesignation}</span></span>'
    ],
    includeColoredText: true,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  },
  COMPANY_SERVICES: {
    subject: '', // Will be set from PDF filename
    greeting: 'Hello {firstName},',
    previewText: 'Your customized company services proposal is ready - tailored for your UAE business needs',
    bodyContent: [
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Attached is a customized overview of our services and pricing, tailored to support your business setup and compliance needs in the UAE.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">The proposal outlines the areas where we can assist and gives you a clear picture of how we can add value to your operations.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Please feel free to reach out if you have any questions or would like to proceed.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Regards</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt; font-weight: bold; margin-bottom: 3px;">{senderName}<br><span style="font-weight: normal;">{senderDesignation}</span></span>'
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

// German email templates
export const EMAIL_TEMPLATES_DE = {
  COST_OVERVIEW: {
    subject: '', // Will be set from PDF filename
    greeting: 'Hallo {firstName},',
    previewText: 'Ihre Kostenübersicht für die UAE Firmengründung ist bereit - detaillierte Preise und Services inklusive',
    bodyContent: [
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">anbei erhalten Sie unsere Kostenübersicht für die Gründung einer Gesellschaft unter der {authorityName} in Dubai.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Die <span style="color: #006600; font-weight: bold;">grün</span> markierten Positionen stellen einmalige Kosten im Zusammenhang mit der Firmengründung dar.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Die <span style="color: #0066cc; font-weight: bold;">blau</span> markierten Positionen beziehen sich auf Visakosten; jedes Visum ist zwei Jahre gültig.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Die <span style="color: #DAA520; font-weight: bold;">gelb</span> markierten Positionen zeigen die jährlichen Lizenzverlängerungsgebühren, die ab dem zweiten Jahr anfallen.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Die <span style="color: #FF8C00; font-weight: bold;">orange</span> markierten Positionen betreffen zusätzliche Serviceleistungen, die häufig benötigt werden.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Bitte prüfen Sie die beigefügte Übersicht und senden Sie uns eine unterschriebene Kopie zur Ablage zurück.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Falls Sie Fragen haben oder weitere Informationen benötigen, antworten Sie gerne auf diese E-Mail. Ein Mitglied unseres Teams wird sich zeitnah bei Ihnen melden.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Wir freuen uns auf Ihre Rückmeldung.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Mit freundlichen Grüßen</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt; font-weight: bold; margin-bottom: 3px;">{senderName}<br><span style="font-weight: normal;">{senderDesignation}</span></span>'
    ],
    includeColoredText: true,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  },
  GOLDEN_VISA: {
    subject: '', // Will be set from PDF filename
    greeting: 'Hallo {firstName},',
    previewText: 'Ihr UAE Golden Visa Angebot ist bereit - personalisierte Dokumentation und Preise inklusive',
    bodyContent: [
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">wir freuen uns, Ihnen ein personalisiertes Angebot für das UAE Golden Visa zu unterbreiten, das auf Ihre spezifischen Bedürfnisse zugeschnitten ist.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Das Dokument enthält eine Übersicht über die Visa-Anforderungen, eine Aufschlüsselung des Prozesses und unseren Leistungsumfang. Bitte prüfen Sie das Angebot und senden Sie uns eine unterschriebene Kopie zur Ablage zurück.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Nach Erhalt Ihrer Bestätigung werden wir die nächsten Schritte koordinieren und Sie bei den erforderlichen Dokumenten und Terminen unterstützen.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Mit freundlichen Grüßen</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt; font-weight: bold; margin-bottom: 3px;">{senderName}<br><span style="font-weight: normal;">{senderDesignation}</span></span>'
    ],
    includeColoredText: true,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  },
  COMPANY_SERVICES: {
    subject: '', // Will be set from PDF filename
    greeting: 'Hallo {firstName},',
    previewText: 'Ihr maßgeschneidertes Unternehmensservice-Angebot ist bereit - zugeschnitten auf Ihre UAE Geschäftsbedürfnisse',
    bodyContent: [
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">anbei finden Sie eine maßgeschneiderte Übersicht unserer Services und Preise, die darauf ausgerichtet sind, Ihre Unternehmensgründung und Compliance-Anforderungen in den VAE zu unterstützen.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Das Angebot beschreibt die Bereiche, in denen wir Sie unterstützen können und gibt Ihnen einen klaren Überblick darüber, wie wir Mehrwert für Ihre Geschäftstätigkeit schaffen können.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Bitte zögern Sie nicht, sich zu melden, falls Sie Fragen haben oder fortfahren möchten.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Mit freundlichen Grüßen</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt; font-weight: bold; margin-bottom: 3px;">{senderName}<br><span style="font-weight: normal;">{senderDesignation}</span></span>'
    ],
    includeColoredText: true,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  },
  TAXATION: {
    subject: '', // Will be set from PDF filename
    greeting: 'Liebe/r {firstName},',
    previewText: 'Ihr Steuerberatungs-Angebot ist bereit',
    bodyContent: [
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">anbei finden Sie unser Angebot für Steuerberatungsleistungen.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Bitte prüfen Sie das beigefügte Angebot.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Unser Team steht Ihnen für Fragen gerne zur Verfügung.</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt;">Mit freundlichen Grüßen</span>',
      '<span style="font-family: Arial, sans-serif; font-size: 10pt; font-weight: bold; margin-bottom: 3px;">{senderName}<br><span style="font-weight: normal;">{senderDesignation}</span></span>'
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
export const processEmailTemplate = (template: EmailTemplate, recipients: EmailRecipientData): EmailTemplate => {
  const firstName = recipients.firstName || 'Client';
  const lastName = recipients.lastName || '';
  const companyName = recipients.companyName || '';
  const authorityName = recipients.authorityName || 'Authority';
  const senderName = recipients.senderName || 'TME Services Team';
  const senderDesignation = recipients.senderDesignation || '';

  // Replace template variables
  const processText = (text: string): string => {
    return text
      .replace(/{firstName}/g, firstName)
      .replace(/{lastName}/g, lastName)
      .replace(/{companyName}/g, companyName)
      .replace(/{authorityName}/g, authorityName)
      .replace(/{senderName}/g, senderName)
      .replace(/{senderDesignation}/g, senderDesignation);
  };

  return {
    ...template,
    greeting: processText(template.greeting),
    bodyContent: template.bodyContent.map(processText),
    signature: template.signature ? processText(template.signature) : undefined
  };
};

// Create formatted HTML email content
export const createFormattedEmailHTML = (template: EmailTemplate): string => {
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
          templateType={props.templateType}
          recipientData={props.recipients}
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
  userInfo?: { full_name?: string; designation?: string } // Optional user info parameter
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
    senderName: userInfo?.full_name || 'TME Services Team', // Use actual user name if available
    senderDesignation: userInfo?.designation || '' // Use actual user designation if available
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
    attachments,
    templateType
  };
};

export default EmailDraftGenerator;