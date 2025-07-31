// Review Submission Modal Component
// Safe UI component for submitting applications for review

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import { ReviewerDropdown } from '../ui/ReviewerDropdown';
import { Reviewer, UrgencyLevel } from '@/types/review-system';
import { useReviewSystemConfig } from '@/lib/config/review-system';

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  applicationTitle: string;
  onSubmit: (submission: {
    reviewer_id: number;
    urgency: UrgencyLevel;
    comments?: string;
  }) => Promise<boolean>;
}

export const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  applicationTitle,
  onSubmit
}) => {
  const config = useReviewSystemConfig();
  const [selectedReviewer, setSelectedReviewer] = useState<{ id: number; reviewer: Reviewer } | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Don't render if feature is disabled
  if (!config.canShowReviewComponents || !config.showReviewModal) {
    return null;
  }

  const resetForm = () => {
    setSelectedReviewer(null);
    setIsUrgent(false);
    setComments('');
    setError(null);
    setSuccess(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const urgency: UrgencyLevel = isUrgent ? 'urgent' : 'standard';
    console.log('🔧 ReviewSubmissionModal: Form submitted', { selectedReviewer, urgency, comments });
    
    if (!selectedReviewer) {
      setError('Please select a reviewer');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await onSubmit({
        reviewer_id: selectedReviewer.id,
        urgency,
        comments: comments.trim() || undefined
      });

      if (success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError('Failed to submit for review. Please try again.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backup-blur-sm z-50 flex items-center justify-center p-4"
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
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] overflow-y-auto pointer-events-auto"
              style={{ fontFamily: 'Inter, sans-serif' }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: '#243F7B' }}>
                    Submit for Review
                  </h2>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {applicationTitle}
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
            <div className="px-6 py-4">
              {success ? (
                /* Success State */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Submitted Successfully!
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedReviewer?.reviewer.full_name} has been notified and will review your application.
                  </p>
                </motion.div>
              ) : (
                /* Form */
                <form 
                  onSubmit={handleSubmit} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target !== e.currentTarget) {
                      e.preventDefault();
                    }
                  }}
                  className="space-y-6"
                >
                  {/* Reviewer Selection */}
                  <ReviewerDropdown
                    value={selectedReviewer?.id}
                    onChange={(id, reviewer) => {
                      console.log('🔧 ReviewSubmissionModal: Reviewer selected', { id, reviewer });
                      setSelectedReviewer({ id, reviewer });
                      setError(null);
                    }}
                    error={error && !selectedReviewer ? 'Please select a reviewer' : undefined}
                  />

                  {/* Urgent Checkbox */}
                  <div>
                    <motion.label
                      whileHover={{ scale: 1.01 }}
                      className="flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 border-gray-200 hover:border-gray-300"
                    >
                      <div className="flex items-center h-[42px]">
                        <div 
                          className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
                          style={{ 
                            borderColor: isUrgent ? '#243F7B' : '#d1d5db',
                            backgroundColor: isUrgent ? '#243F7B' : 'white'
                          }}
                        >
                          {isUrgent && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={isUrgent}
                          onChange={(e) => setIsUrgent(e.target.checked)}
                          className="sr-only"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center h-[42px]">
                          <span className="text-sm font-medium" style={{ color: '#243F7B' }}>
                            Urgent
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Mark as urgent for immediate attention. Default is standard priority.
                        </p>
                      </div>
                    </motion.label>
                  </div>

                  {/* Comments (Optional) */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                      Comments
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add any specific instructions or context for the reviewer..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 resize-none"
                      style={{
                        borderColor: '#e5e7eb'
                      }}
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
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4">
                    <motion.button
                      whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                      whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 rounded-lg font-semibold text-gray-700 transition-all duration-200 disabled:opacity-50"
                      style={{ backgroundColor: '#F3F4F6' }}
                    >
                      Cancel
                    </motion.button>
                    
                    <motion.button
                      whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                      whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                      type="submit"
                      disabled={isSubmitting || !selectedReviewer}
                      className="flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                      style={{ backgroundColor: '#243F7B' }}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit for Review</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              )}
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};