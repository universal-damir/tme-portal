/**
 * Email Preview Modal with Minimal Editing Capabilities
 * Shows formatted email preview with editable fields before sending via SMTP
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Edit2, Paperclip, Download, Languages } from 'lucide-react';
import { EMAIL_TEMPLATES, EMAIL_TEMPLATES_DE, EmailTemplate, EmailRecipientData, processEmailTemplate, createFormattedEmailHTML } from './EmailDraftGenerator';

export interface EmailPreviewData {
  to: string[];
  cc?: string[];
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
  const [editableCc, setEditableCc] = useState(emailData.cc?.join(', ') || '');
  const [editableContent, setEditableContent] = useState(emailData.htmlContent);
  const [plainTextContent, setPlainTextContent] = useState('');
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [isEditingRecipients, setIsEditingRecipients] = useState(false);
  const [isEditingCc, setIsEditingCc] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  const [currentPdfBlob, setCurrentPdfBlob] = useState<Blob | undefined>(pdfBlob);
  const [currentPdfFilename, setCurrentPdfFilename] = useState<string | undefined>(pdfFilename);
  const [isRegeneratingPdf, setIsRegeneratingPdf] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const tempContentRef = useRef<string>(emailData.htmlContent);

  // Helper function to extract preview text from HTML content
  const extractPreviewTextFromHTML = (htmlContent: string): string | null => {
    const previewMatch = htmlContent.match(/<div style="display: none[^>]*>([^<]*)<\/div>/);
    return previewMatch ? previewMatch[1] : null;
  };

  // Helper function to preserve original preview text in edited content
  const preserveOriginalPreviewText = (editedContent: string, originalPreviewText: string | null): string => {
    if (!originalPreviewText) return editedContent;
    
    // Remove any existing preview text div from edited content
    const contentWithoutPreview = editedContent.replace(/<div style="display: none[^>]*>[^<]*<\/div>\s*/g, '');
    
    // Add the original preview text back at the beginning with separator to prevent email clients from reading further
    const previewSeparator = '‌'.repeat(100); // Zero-width non-joiner repeated 100 times
    const previewDiv = `    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${originalPreviewText}${previewSeparator}</div>\n`;
    
    return previewDiv + contentWithoutPreview;
  };

  // Convert HTML to plain text for editing (preserve some formatting indicators)
  const htmlToPlainText = (html: string): string => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Get text content but preserve some structure
    let text = '';
    
    // Only process direct <p> elements to avoid duplication from nested elements
    const paragraphs = tempDiv.querySelectorAll('p');
    
    if (paragraphs.length > 0) {
      // Process paragraph elements
      paragraphs.forEach((element) => {
        const content = element.textContent || '';
        if (content.trim()) {
          // Add visual indicators for colored/styled content
          const style = element.getAttribute('style') || '';
          
          // Check for colored spans within the paragraph
          const hasColoredSpan = element.querySelector('span[style*="color"]');
          let colorFound = false;
          
          if (hasColoredSpan) {
            const spanStyle = hasColoredSpan.getAttribute('style') || '';
            if (spanStyle.includes('color: #0066cc') || spanStyle.includes('color: rgb(0, 102, 204)')) {
              text += `🔵 ${content.trim()}\n`; // Blue text indicator
              colorFound = true;
            } else if (spanStyle.includes('color: #006600') || spanStyle.includes('color: rgb(0, 102, 0)')) {
              text += `✅ ${content.trim()}\n`; // Green text indicator
              colorFound = true;
            } else if (spanStyle.includes('color: #DAA520') || spanStyle.includes('color: rgb(218, 165, 32)')) {
              text += `⚠️ ${content.trim()}\n`; // Yellow text indicator
              colorFound = true;
            } else if (spanStyle.includes('color: #FF8C00') || spanStyle.includes('color: rgb(255, 140, 0)')) {
              text += `🟠 ${content.trim()}\n`; // Orange text indicator
              colorFound = true;
            } else if (spanStyle.includes('color: #cc0000') || spanStyle.includes('color: rgb(204, 0, 0)')) {
              text += `❗ ${content.trim()}\n`; // Red text indicator
              colorFound = true;
            }
          }
          
          // If no colored span, check the paragraph itself
          if (!colorFound) {
            if (style.includes('color: #0066cc') || style.includes('color: rgb(0, 102, 204)')) {
              text += `🔵 ${content.trim()}\n`; // Blue text indicator
            } else if (style.includes('color: #006600') || style.includes('color: rgb(0, 102, 0)')) {
              text += `✅ ${content.trim()}\n`; // Green text indicator  
            } else if (style.includes('color: #DAA520') || style.includes('color: rgb(218, 165, 32)')) {
              text += `⚠️ ${content.trim()}\n`; // Yellow text indicator
            } else if (style.includes('color: #FF8C00') || style.includes('color: rgb(255, 140, 0)')) {
              text += `🟠 ${content.trim()}\n`; // Orange text indicator
            } else if (style.includes('color: #cc0000') || style.includes('color: rgb(204, 0, 0)')) {
              text += `❗ ${content.trim()}\n`; // Red text indicator
            } else {
              text += `${content.trim()}\n`;
            }
          }
        }
      });
    } else {
      // Fallback: if no paragraphs, try to get clean text from the root
      const lines = tempDiv.innerText || tempDiv.textContent || '';
      text = lines.trim();
    }
    
    return text.trim();
  };

  // Convert plain text back to formatted HTML (restore color formatting)
  const plainTextToHtml = (text: string): string => {
    // Split by lines and wrap in proper HTML
    const lines = text.split('\n');
    let htmlContent = '<div style="font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #333;">\n';
    
    lines.forEach((line) => {
      let processedLine = line.trim();
      if (processedLine) {
        let style = 'margin-bottom: 12px;';
        let hasColor = false;
        
        // Convert emoji indicators back to HTML colors - check for colored keywords
        if (processedLine.startsWith('🔵 ')) {
          processedLine = processedLine.substring(3).trim(); // Remove emoji and trim
          // Check if this line contains the word "blue" to apply color to the whole line or just the word
          if (processedLine.toLowerCase().includes('blue')) {
            // Apply color to just the word "blue" in a span
            processedLine = processedLine.replace(/(blue)/gi, '<span style="color: #0066cc; font-weight: bold;">$1</span>');
          } else {
            style += ' color: #0066cc; font-weight: bold;';
          }
          hasColor = true;
        } else if (processedLine.startsWith('✅ ')) {
          processedLine = processedLine.substring(3).trim();
          if (processedLine.toLowerCase().includes('green')) {
            processedLine = processedLine.replace(/(green)/gi, '<span style="color: #006600; font-weight: bold;">$1</span>');
          } else {
            style += ' color: #006600; font-weight: bold;';
          }
          hasColor = true;
        } else if (processedLine.startsWith('⚠️ ')) {
          processedLine = processedLine.substring(3).trim();
          if (processedLine.toLowerCase().includes('yellow')) {
            processedLine = processedLine.replace(/(yellow)/gi, '<span style="color: #DAA520; font-weight: bold;">$1</span>');
          } else {
            style += ' color: #DAA520; font-weight: bold;';
          }
          hasColor = true;
        } else if (processedLine.startsWith('🟠 ')) {
          processedLine = processedLine.substring(3).trim();
          if (processedLine.toLowerCase().includes('orange')) {
            processedLine = processedLine.replace(/(orange)/gi, '<span style="color: #FF8C00; font-weight: bold;">$1</span>');
          } else {
            style += ' color: #FF8C00; font-weight: bold;';
          }
          hasColor = true;
        } else if (processedLine.startsWith('❗ ')) {
          processedLine = processedLine.substring(3).trim();
          style += ' color: #cc0000; font-weight: bold;';
          hasColor = true;
        }
        
        // Only escape HTML if we haven't already added HTML spans for color keywords
        if (!hasColor || (!processedLine.includes('<span'))) {
          processedLine = processedLine
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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

  // Update contentEditable when switching to edit mode
  useEffect(() => {
    if (isEditingContent && contentEditableRef.current) {
      // Set the content when entering edit mode
      contentEditableRef.current.innerHTML = editableContent;
      // Update temp ref
      tempContentRef.current = editableContent;
    }
  }, [isEditingContent]);
  
  // Handle saving content when exiting edit mode
  useEffect(() => {
    if (!isEditingContent && tempContentRef.current !== editableContent) {
      // Content was changed, update it
      setEditableContent(tempContentRef.current);
    }
  }, [isEditingContent]);

  const handleSend = async () => {
    // Get the current template's preview text based on language
    const templates = language === 'de' ? EMAIL_TEMPLATES_DE : EMAIL_TEMPLATES;
    const currentTemplate = templateType ? templates[templateType] : null;
    const currentPreviewText = currentTemplate?.previewText || extractPreviewTextFromHTML(emailData.htmlContent);
    const editedContentWithOriginalPreview = preserveOriginalPreviewText(editableContent, currentPreviewText);
    
    const updatedEmailData: EmailPreviewData = {
      ...emailData,
      to: editableRecipients.split(',').map(email => email.trim()),
      cc: editableCc ? editableCc.split(',').map(email => email.trim()) : undefined,
      subject: editableSubject,
      htmlContent: editedContentWithOriginalPreview
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

            {/* CC Field - Show dynamically based on template type */}
            {(emailData.cc && emailData.cc.length > 0) || editableCc ? (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                  CC:
                </label>
                <div className="flex items-center gap-2">
                  {isEditingCc ? (
                    <input
                      type="text"
                      value={editableCc}
                      onChange={(e) => setEditableCc(e.target.value)}
                      onBlur={() => setIsEditingCc(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingCc(false)}
                      className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
                      onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                      autoFocus
                    />
                  ) : (
                    <div
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 h-[42px] flex items-center cursor-pointer hover:bg-gray-50"
                      onClick={() => setIsEditingCc(true)}
                    >
                      <span className="text-gray-700">{editableCc || 'No CC recipients'}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setIsEditingCc(!isEditingCc)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            ) : null}

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
                /* Rich text editor with contentEditable */
                <>
                  <div
                    ref={contentEditableRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                      // Store content in ref to avoid re-renders that cause cursor jumps
                      tempContentRef.current = e.currentTarget.innerHTML;
                    }}
                    onBlur={(e) => {
                      // Save the final content when losing focus
                      const newContent = e.currentTarget.innerHTML;
                      tempContentRef.current = newContent;
                      setEditableContent(newContent);
                      setPlainTextContent(htmlToPlainText(newContent));
                    }}
                    className="w-full border-2 rounded-lg p-4 bg-white min-h-[300px] focus:outline-none focus:border-blue-500 transition-colors"
                    style={{ 
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '10pt',
                      lineHeight: '1.4',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      backgroundColor: '#fafafa'
                    }}
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Tip: Click on the text above to edit. Colors and formatting are preserved.
                  </div>
                </>
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