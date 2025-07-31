/**
 * Reusable Email Draft Generator Component
 * Creates formatted Outlook email drafts with PDF attachments using Microsoft Graph API
 */

import React from 'react';

// Email template interface for customization
export interface EmailTemplate {
  subject: string;
  greeting: string;
  bodyContent: readonly string[];
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
  fallbackToMailto?: boolean;
}

// Default email templates for different tabs
export const EMAIL_TEMPLATES = {
  COST_OVERVIEW: {
    subject: '', // Will be set from PDF filename
    greeting: 'Dear {firstName}, this is an offer as we discussed.',
    bodyContent: [
      '<span style="color: green;">Text example green</span>',
      '<span style="color: red;">Text example red</span>',
      '<span style="color: #DAA520;">Text example yellow</span> THIS WILL BE CHANGED LATER. JUST NEED TO TEST IT.'
    ],
    includeColoredText: true,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  },
  GOLDEN_VISA: {
    subject: '', // Will be set from PDF filename
    greeting: 'Dear {firstName}, please find your Golden Visa application details.',
    bodyContent: [
      'We have prepared your Golden Visa documentation as discussed.',
      'Please review the attached documents and let us know if you need any clarification.'
    ],
    includeColoredText: false,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  },
  COMPANY_SERVICES: {
    subject: '', // Will be set from PDF filename
    greeting: 'Dear {firstName}, your company services proposal is ready.',
    bodyContent: [
      'Please find attached the detailed proposal for your company services requirements.',
      'We look forward to discussing this further with you.'
    ],
    includeColoredText: false,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  },
  TAXATION: {
    subject: '', // Will be set from PDF filename
    greeting: 'Dear {firstName}, your taxation services proposal is attached.',
    bodyContent: [
      'Please review the taxation services proposal attached to this email.',
      'Our team is available to answer any questions you may have.'
    ],
    includeColoredText: false,
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt'
  }
} as const;

// Email Draft Generator Hook
export const useEmailDraftGenerator = () => {
  
  const generateEmailDraft = async ({
    recipients,
    template,
    attachments = [],
    onSuccess,
    onError,
    fallbackToMailto = true
  }: EmailDraftGeneratorProps) => {
    
    try {
      // Dynamic import to avoid SSR issues
      const { createUserEmailDraft } = await import('@/lib/graph-api');
      const { signInAndGetToken, getCachedToken } = await import('@/lib/auth/azure-auth');
      
      // Get user access token for Graph API
      let userAccessToken = await getCachedToken();
      if (!userAccessToken) {
        userAccessToken = await signInAndGetToken();
      }

      // Process template variables
      const processedTemplate = processEmailTemplate(template, recipients);
      
      // Create email data for Graph API
      const emailData = {
        to: recipients.emails,
        subject: processedTemplate.subject,
        clientFirstName: recipients.firstName || 'Client',
        pdfBlob: attachments[0]?.blob, // Primary attachment (backward compatibility)
        pdfFilename: attachments[0]?.filename || 'document.pdf'
      };

      // Create the email draft using Graph API
      const result = await createUserEmailDraft(emailData, userAccessToken);
      
      if (result.success) {
        onSuccess?.(result.draftId);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Error creating email draft:', error);
      
      if (fallbackToMailto) {
        // Fallback to mailto if Graph API fails
        handleMailtoFallback(recipients, template, attachments);
        onError?.('Graph API failed, used mailto fallback');
      } else {
        onError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  };

  return { generateEmailDraft };
};

// Process email template with dynamic variables
const processEmailTemplate = (template: EmailTemplate, recipients: EmailRecipientData): EmailTemplate => {
  const firstName = recipients.firstName || 'Client';
  const lastName = recipients.lastName || '';
  const companyName = recipients.companyName || '';

  // Replace template variables
  const processText = (text: string): string => {
    return text
      .replace(/{firstName}/g, firstName)
      .replace(/{lastName}/g, lastName)
      .replace(/{companyName}/g, companyName);
  };

  return {
    ...template,
    greeting: processText(template.greeting),
    bodyContent: template.bodyContent.map(processText),
    signature: template.signature ? processText(template.signature) : undefined
  };
};

// Fallback to mailto if Graph API is not available
const handleMailtoFallback = (
  recipients: EmailRecipientData, 
  template: EmailTemplate, 
  attachments: EmailAttachment[]
) => {
  const processedTemplate = processEmailTemplate(template, recipients);
  
  // Create plain text version of the email
  let emailBody = processedTemplate.greeting + '\n\n';
  
  processedTemplate.bodyContent.forEach(content => {
    // Strip HTML tags for plain text
    const plainText = content.replace(/<[^>]*>/g, '');
    emailBody += plainText + '\n';
  });

  if (attachments.length > 0) {
    emailBody += '\n\nNote: Please attach the downloaded files manually.\n';
  }

  emailBody += '\nNote: Please format this email with Arial 10pt font and apply the indicated colors before sending.';

  const mailtoUrl = `mailto:${recipients.emails.join(',')}?subject=${encodeURIComponent(processedTemplate.subject)}&body=${encodeURIComponent(emailBody)}`;
  window.open(mailtoUrl, '_blank');
};

// React Component version (if you prefer component over hook)
export const EmailDraftGenerator: React.FC<EmailDraftGeneratorProps> = (props) => {
  const { generateEmailDraft } = useEmailDraftGenerator();
  
  // This component doesn't render anything - it's just a utility
  React.useEffect(() => {
    generateEmailDraft(props);
  }, []);

  return null;
};

// Helper function to create email data from common form data
export const createEmailDataFromFormData = (
  formData: any,
  pdfBlob: Blob,
  pdfFilename: string,
  templateType: keyof typeof EMAIL_TEMPLATES
): EmailDraftGeneratorProps => {
  
  // Extract client details (handles different form structures)
  const clientDetails = formData.clientDetails || formData;
  
  const recipients: EmailRecipientData = {
    emails: clientDetails.clientEmails || [],
    firstName: clientDetails.firstName,
    lastName: clientDetails.lastName,
    companyName: clientDetails.companyName
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