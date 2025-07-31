/**
 * Email Preview Modal with Minimal Editing Capabilities
 * Shows formatted email preview with editable fields before sending via SMTP
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Edit2, Paperclip, Download } from 'lucide-react';

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
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  emailData,
  onSend,
  loading = false,
  pdfBlob,
  pdfFilename
}) => {
  const [editableSubject, setEditableSubject] = useState(emailData.subject);
  const [editableRecipients, setEditableRecipients] = useState(emailData.to.join(', '));
  const [editableContent, setEditableContent] = useState(emailData.htmlContent);
  const [plainTextContent, setPlainTextContent] = useState('');
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [isEditingRecipients, setIsEditingRecipients] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);

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

  const handleDownload = () => {
    if (pdfBlob && pdfFilename) {
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
                <button
                  onClick={() => setIsEditingContent(!isEditingContent)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isEditingContent ? 'Preview Mode' : 'Edit Mode'}
                >
                  <Edit2 size={16} />
                </button>
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
            {pdfBlob && pdfFilename && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                disabled={loading}
                className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
              >
                <Download size={16} />
                Download
              </motion.button>
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