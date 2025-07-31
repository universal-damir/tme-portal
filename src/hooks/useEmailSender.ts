/**
 * Email Sender Hook for SMTP functionality
 * Handles sending emails via Brevo SMTP API with proper error handling
 */

import { useState } from 'react';
import { EmailPreviewData } from '@/components/shared/EmailPreviewModal';

export interface EmailAttachment {
  blob: Blob;
  filename: string;
  contentType?: string;
}

export interface UseEmailSenderReturn {
  sendEmail: (emailData: EmailPreviewData, attachments?: EmailAttachment[]) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const useEmailSender = (): UseEmailSenderReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendEmail = async (emailData: EmailPreviewData, attachments: EmailAttachment[] = []) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Convert blob attachments to base64 for API
      const processedAttachments = await Promise.all(
        attachments.map(async (attachment) => {
          const buffer = await attachment.blob.arrayBuffer();
          const base64Content = Buffer.from(buffer).toString('base64');
          
          return {
            filename: attachment.filename,
            contentType: attachment.contentType || 'application/pdf',
            content: base64Content,
            encoding: 'base64' // Specify encoding explicitly
          };
        })
      );

      const requestBody = {
        to: emailData.to,
        subject: emailData.subject,
        htmlContent: emailData.htmlContent,
        attachments: processedAttachments
      };

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      setSuccess(true);
      console.log('Email sent successfully:', result.messageId);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Email sending failed:', err);
      throw err; // Re-throw to allow calling component to handle
    } finally {
      setLoading(false);
    }
  };

  return {
    sendEmail,
    loading,
    error,
    success
  };
};

export default useEmailSender;