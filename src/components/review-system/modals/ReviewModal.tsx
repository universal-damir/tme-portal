// Simplified Review Modal Component
// Streamlined reviewer interface with PDF preview, comments, and 3 action buttons

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, FileText, Send } from 'lucide-react';
import { Application } from '@/types/review-system';
import { useReviewSystemConfig } from '@/lib/config/review-system';
import { GoldenVisaData } from '@/types/golden-visa';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onReviewAction: (action: 'approve' | 'reject', comments: string) => Promise<boolean>;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  application,
  onReviewAction
}) => {
  const config = useReviewSystemConfig();
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Don't render if feature is disabled
  if (!config.canShowReviewComponents || !config.allowReviewActions) {
    return null;
  }

  const resetForm = () => {
    setComments('');
    setError(null);
    setSuccess(false);
    setIsSubmitting(false);
  };

  const handlePreviewPDF = async () => {
    if (!application?.form_data) return;
    
    try {
      // Generate PDF for review using the same logic as Golden Visa tab preview
      const { generateGoldenVisaPDFWithFilename } = await import('@/lib/pdf-generator/utils/goldenVisaGenerator');
      const formData = application.form_data as GoldenVisaData;
      
      // Extract client info from form data
      const clientInfo = {
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
      
    } catch (error) {
      console.error('Error generating PDF for review:', error);
      setError('Failed to generate PDF for review. Please try again.');
    }
  };

  const handleActionClick = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !comments.trim()) {
      setError('Please provide feedback when sending back for revision');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const finalComments = action === 'approve' && !comments.trim() 
        ? 'Application approved' 
        : comments.trim();
        
      const success = await onReviewAction(action, finalComments);

      if (success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError('Failed to submit review. Please try again.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, application?.id]);

  if (!application) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto"
              style={{ fontFamily: 'Inter, sans-serif' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold" style={{ color: '#243F7B' }}>
                      Review Application
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {application.title}
                    </p>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                {success ? (
                  /* Success State */
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                  >
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Review Submitted Successfully!
                    </h3>
                    <p className="text-sm text-gray-600">
                      The applicant has been notified of your decision.
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    {/* PDF Preview Button */}
                    <div className="text-center">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handlePreviewPDF}
                        className="flex items-center justify-center space-x-3 w-full px-6 py-4 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg"
                        style={{ backgroundColor: '#243F7B' }}
                      >
                        <FileText className="w-5 h-5" />
                        <span>Preview PDF</span>
                      </motion.button>
                      <p className="text-xs text-gray-500 mt-2">
                        Opens in new tab for review
                      </p>
                    </div>

                    {/* Comments */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                        Feedback
                      </label>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add your review comments or feedback..."
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 resize-none"
                        onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                      </motion.div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 gap-3">
                      {/* Send Back for Revision */}
                      <motion.button
                        whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                        whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                        type="button"
                        onClick={() => handleActionClick('reject')}
                        disabled={isSubmitting}
                        className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                        style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                      >
                        <Send className="w-4 h-4" />
                        <span>Send Back for Revision</span>
                      </motion.button>

                      {/* Approve */}
                      <motion.button
                        whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                        whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                        type="button"
                        onClick={() => handleActionClick('approve')}
                        disabled={isSubmitting}
                        className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50"
                        style={{ backgroundColor: '#10B981' }}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

