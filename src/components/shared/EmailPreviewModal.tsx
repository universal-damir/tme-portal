/**
 * Email Preview Modal with Minimal Editing Capabilities
 * Shows formatted email preview with editable fields before sending via SMTP
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Edit2, Paperclip, Download, Languages } from 'lucide-react';
import { EMAIL_TEMPLATES, EMAIL_TEMPLATES_DE, EmailTemplate, EmailRecipientData, processEmailTemplate, createFormattedEmailHTML } from './EmailDraftGenerator';

export interface EmailPreviewData {
  to: string[];
  subject: string;
  htmlContent: string;
  attachments?: {
    filename: string;
    contentType: string;
    size?: number;
  }[];
}

export interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailData: EmailPreviewData;
  onSend: (emailData: EmailPreviewData) => Promise<void>;
  loading?: boolean;
  pdfBlob?: Blob;
  pdfFilename?: string;
  additionalPdfs?: Array<{
    blob: Blob;
    filename: string;
  }>;
  // Optional props for activity logging
  activityLogging?: {
    resource: string; // e.g., 'golden_visa', 'cost_overview'
    client_name: string; // e.g., 'Novalic Damir' or 'Company Name'
    document_type: string; // e.g., 'Golden Visa', 'Cost Overview'
    filename?: string; // e.g., '250806 Novalic Damir IFZA 1 0 0 0 0 setup AED EUR.pdf'
  };
  // Props for language switching
  templateType?: keyof typeof EMAIL_TEMPLATES; // e.g., 'COST_OVERVIEW', 'GOLDEN_VISA'
  recipientData?: EmailRecipientData;
  // Function to regenerate PDF when language changes
  onRegeneratePDF?: (language: 'en' | 'de') => Promise<{ blob: Blob; filename: string }> | null;
  // Callback to update the attachment in parent component
  onAttachmentUpdate?: (blob: Blob, filename: string) => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  emailData,
  onSend,
  loading = false,
  pdfBlob,
  pdfFilename,
  additionalPdfs = [],
  activityLogging,
  templateType,
  recipientData,
  onRegeneratePDF,
  onAttachmentUpdate
}) => {
  const [editableSubject, setEditableSubject] = useState(emailData.subject);
  const [editableRecipients, setEditableRecipients] = useState(emailData.to.join(', '));
  const [editableContent, setEditableContent] = useState(emailData.htmlContent);
  const [plainTextContent, setPlainTextContent] = useState('');
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [isEditingRecipients, setIsEditingRecipients] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  const [currentPdfBlob, setCurrentPdfBlob] = useState<Blob | undefined>(pdfBlob);
  const [currentPdfFilename, setCurrentPdfFilename] = useState<string | undefined>(pdfFilename);
  const [isRegeneratingPdf, setIsRegeneratingPdf] = useState(false);

  // Convert HTML to plain text for editing (preserve some formatting indicators)
  const htmlToPlainText = (html: string): string => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Get text content but preserve some structure
    let text = '';
    const elements = tempDiv.querySelectorAll('p, span, div');
    
    elements.forEach((element, index) => {
      const content = element.textContent || '';
      if (content.trim()) {
        // Add visual indicators for colored/styled content
        const style = element.getAttribute('style') || '';
        if (style.includes('color: #0066cc')) {
          text += `🔵 ${content}\n`; // Blue text indicator
        } else if (style.includes('color: #006600')) {
          text += `✅ ${content}\n`; // Green text indicator  
        } else if (style.includes('color: #DAA520')) {
          text += `⚠️ ${content}\n`; // Orange text indicator
        } else if (style.includes('color: #cc0000')) {
          text += `❗ ${content}\n`; // Red text indicator
        } else {
          text += `${content}\n`;
        }
      }
    });
    
    return text.trim();
  };

  // Convert plain text back to formatted HTML (restore color formatting)
  const plainTextToHtml = (text: string): string => {
    // Split by lines and wrap in proper HTML
    const lines = text.split('\n').filter(line => line.trim() !== '');
    let htmlContent = '<div style="font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #333;">\n';
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        let processedLine = line.trim();
        let style = 'margin-bottom: 12px;';
        
        // Convert emoji indicators back to HTML colors
        if (processedLine.startsWith('🔵 ')) {
          processedLine = processedLine.substring(3); // Remove emoji
          style += ' color: #0066cc; font-weight: bold;';
        } else if (processedLine.startsWith('✅ ')) {
          processedLine = processedLine.substring(3);
          style += ' color: #006600; font-weight: bold;';
        } else if (processedLine.startsWith('⚠️ ')) {
          processedLine = processedLine.substring(3);
          style += ' color: #DAA520;';
        } else if (processedLine.startsWith('❗ ')) {
          processedLine = processedLine.substring(3);
          style += ' color: #cc0000; text-decoration: underline;';
        }
        
        htmlContent += `  <p style="${style}">${processedLine}</p>\n`;
      }
    });
    
    htmlContent += '</div>';
    return htmlContent;
  };

  // Initialize plain text content when component mounts or content changes
  useEffect(() => {
    setPlainTextContent(htmlToPlainText(editableContent));
  }, []);

  const handleSend = async () => {
    const updatedEmailData: EmailPreviewData = {
      ...emailData,
      to: editableRecipients.split(',').map(email => email.trim()),
      subject: editableSubject,
      htmlContent: editableContent
    };

    try {
      await onSend(updatedEmailData);
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const handleDownload = async (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Log download activity if logging data is provided
    if (activityLogging) {
      try {
        await fetch('/api/user/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'pdf_downloaded',
            resource: activityLogging.resource,
            details: {
              filename: activityLogging.filename || filename,
              client_name: activityLogging.client_name,
              document_type: activityLogging.document_type
            }
          })
        });
      } catch (error) {
        console.error('Failed to log PDF download activity:', error);
      }
    }
  };

  const handleDownloadAll = async () => {
    // Download main PDF (use current PDF if available, otherwise original)
    if (currentPdfBlob && currentPdfFilename) {
      await handleDownload(currentPdfBlob, currentPdfFilename);
    }
    
    // Download additional PDFs
    for (const pdf of additionalPdfs) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to prevent browser blocking
      await handleDownload(pdf.blob, pdf.filename);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl mx-4 flex flex-col"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold" style={{ color: '#243F7B' }}>
              Email Preview
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>

          {/* Email Preview Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Recipients Field */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                To:
              </label>
              <div className="flex items-center gap-2">
                {isEditingRecipients ? (
                  <input
                    type="text"
                    value={editableRecipients}
                    onChange={(e) => setEditableRecipients(e.target.value)}
                    onBlur={() => setIsEditingRecipients(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingRecipients(false)}
                    className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                    onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                    autoFocus
                  />
                ) : (
                  <div
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 h-[42px] flex items-center cursor-pointer hover:bg-gray-50"
                    onClick={() => setIsEditingRecipients(true)}
                  >
                    <span className="text-gray-900">{editableRecipients}</span>
                  </div>
                )}
                <button
                  onClick={() => setIsEditingRecipients(!isEditingRecipients)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>

            {/* Subject Field */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Subject:
              </label>
              <div className="flex items-center gap-2">
                {isEditingSubject ? (
                  <input
                    type="text"
                    value={editableSubject}
                    onChange={(e) => setEditableSubject(e.target.value)}
                    onBlur={() => setIsEditingSubject(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingSubject(false)}
                    className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                    onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                    autoFocus
                  />
                ) : (
                  <div
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 h-[42px] flex items-center cursor-pointer hover:bg-gray-50"
                    onClick={() => setIsEditingSubject(true)}
                  >
                    <span className="text-gray-900">{editableSubject}</span>
                  </div>
                )}
                <button
                  onClick={() => setIsEditingSubject(!isEditingSubject)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>

            {/* Attachments */}
            {emailData.attachments && emailData.attachments.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                  Attachments:
                </label>
                <div className="space-y-2">
                  {emailData.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border"
                    >
                      <Paperclip size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700">{attachment.filename}</span>
                      {attachment.size && (
                        <span className="text-xs text-gray-500">
                          ({Math.round(attachment.size / 1024)} KB)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Content Preview/Editor */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium" style={{ color: '#243F7B' }}>
                  Email Content:
                </label>
                <div className="flex items-center gap-2">
                  {/* Language Toggle Switch */}
                  {templateType && recipientData && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: '#243F7B' }}>EN</span>
                      <motion.button
                        whileHover={!isRegeneratingPdf ? { scale: 1.05 } : {}}
                        whileTap={!isRegeneratingPdf ? { scale: 0.95 } : {}}
                        disabled={isRegeneratingPdf}
                        onClick={async () => {
                          const newLang = language === 'en' ? 'de' : 'en';
                          setLanguage(newLang);
                          
                          // Get the appropriate template
                          const templates = newLang === 'de' ? EMAIL_TEMPLATES_DE : EMAIL_TEMPLATES;
                          const template = templates[templateType];
                          
                          // Process template with recipient data
                          const processedTemplate = processEmailTemplate(template, recipientData);
                          
                          // Generate new HTML content
                          const newHtmlContent = createFormattedEmailHTML(processedTemplate);
                          
                          // Update content states
                          setEditableContent(newHtmlContent);
                          setPlainTextContent(htmlToPlainText(newHtmlContent));
                          
                          // Regenerate PDF if function is provided
                          if (onRegeneratePDF) {
                            setIsRegeneratingPdf(true);
                            try {
                              const result = await onRegeneratePDF(newLang);
                              if (result) {
                                setCurrentPdfBlob(result.blob);
                                setCurrentPdfFilename(result.filename);
                                // Update the attachment in parent component
                                onAttachmentUpdate?.(result.blob, result.filename);
                              }
                            } catch (error) {
                              console.error('Failed to regenerate PDF:', error);
                            } finally {
                              setIsRegeneratingPdf(false);
                            }
                          }
                        }}
                        className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                          language === 'de' ? 'shadow-sm' : ''
                        } ${isRegeneratingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ 
                          backgroundColor: language === 'de' ? '#243F7B' : '#e5e7eb' 
                        }}
                        title="Switch Language"
                      >
                        <motion.div
                          animate={{ 
                            x: language === 'de' ? 20 : 2,
                          }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </motion.button>
                      <span className="text-xs font-medium" style={{ color: '#243F7B' }}>DE</span>
                    </div>
                  )}
                  <button
                    onClick={() => setIsEditingContent(!isEditingContent)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={isEditingContent ? 'Preview Mode' : 'Edit Mode'}
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
              
              {isEditingContent ? (
                /* Editable textarea with plain text */
                <textarea
                  value={plainTextContent}
                  onChange={(e) => {
                    setPlainTextContent(e.target.value);
                    // Convert back to HTML and update editableContent
                    setEditableContent(plainTextToHtml(e.target.value));
                  }}
                  className="w-full border rounded-lg p-4 bg-white min-h-[300px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ 
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '10pt',
                    lineHeight: '1.4'
                  }}
                  placeholder="Edit your email content here (plain text)..."
                />
              ) : (
                /* Preview mode */
                <div 
                  className="border rounded-lg p-4 bg-white min-h-[300px] cursor-pointer hover:bg-gray-50"
                  style={{ 
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '10pt',
                    lineHeight: '1.4'
                  }}
                  onClick={() => setIsEditingContent(true)}
                  dangerouslySetInnerHTML={{ __html: editableContent }}
                />
              )}
              
              {isEditingContent && (
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setIsEditingContent(false)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Preview
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </motion.button>
            {(currentPdfBlob && currentPdfFilename) && (
              <>
                {additionalPdfs.length > 0 ? (
                  // Multiple PDFs - show "Download All" button
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownloadAll}
                    disabled={loading || isRegeneratingPdf}
                    className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
                  >
                    <Download size={16} />
                    Download All ({additionalPdfs.length + 1})
                  </motion.button>
                ) : (
                  // Single PDF - show regular download button
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDownload(currentPdfBlob!, currentPdfFilename!)}
                    disabled={loading || isRegeneratingPdf}
                    className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
                  >
                    <Download size={16} />
                    Download
                  </motion.button>
                )}
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSend}
              disabled={loading}
              className="px-6 py-2 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: '#243F7B' }}
            >
              <Send size={16} />
              {loading ? 'Sending...' : 'Send Email'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EmailPreviewModal;