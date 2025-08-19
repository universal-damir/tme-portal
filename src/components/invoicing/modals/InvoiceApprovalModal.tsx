'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertTriangle, CheckCircle, User, Building } from 'lucide-react';
import { Invoice } from '@/types/invoicing';

interface InvoiceApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSubmit: (submission: {
    reviewerId: string;
    reviewerType: 'individual' | 'department';
    urgency: 'standard' | 'urgent';
    comments?: string;
  }) => Promise<boolean>;
}

const REVIEWERS = [
  {
    id: 'uwe-hohman',
    name: 'UWE HOHMAN',
    type: 'individual' as const,
    title: 'Senior Manager',
    icon: User
  },
  {
    id: 'accounting-manager',
    name: 'Accounting Department Manager',
    type: 'department' as const,
    title: 'Department Head',
    icon: Building
  }
];

export const InvoiceApprovalModal: React.FC<InvoiceApprovalModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSubmit
}) => {
  const [selectedReviewer, setSelectedReviewer] = useState<typeof REVIEWERS[0] | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    
    if (!selectedReviewer) {
      setError('Please select an approver');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await onSubmit({
        reviewerId: selectedReviewer.id,
        reviewerType: selectedReviewer.type,
        urgency: isUrgent ? 'urgent' : 'standard',
        comments: comments.trim() || undefined
      });

      if (success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError('Failed to submit for approval. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Invoice approval submission error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
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
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] overflow-y-auto pointer-events-auto"
              style={{ fontFamily: 'Inter, sans-serif' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold" style={{ color: '#243F7B' }}>
                      Submit Invoice for Approval
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {invoice.invoiceNumber} - {formatCurrency(invoice.totalAmount)}
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
                      {selectedReviewer?.name} has been notified and will review your invoice.
                    </p>
                  </motion.div>
                ) : (
                  /* Form */
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Invoice Summary */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Invoice Details</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Client:</span>
                          <p className="font-medium">{invoice.client?.clientName}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <p className="font-medium">{formatCurrency(invoice.totalAmount)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Date:</span>
                          <p className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <p className="font-medium capitalize">{invoice.status.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Reviewer Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-3" style={{ color: '#243F7B' }}>
                        Select Approver
                      </label>
                      <div className="space-y-3">
                        {REVIEWERS.map((reviewer) => {
                          const Icon = reviewer.icon;
                          const isSelected = selectedReviewer?.id === reviewer.id;
                          
                          return (
                            <motion.label
                              key={reviewer.id}
                              whileHover={{ scale: 1.01 }}
                              className="flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200"
                              style={{
                                borderColor: isSelected ? '#243F7B' : '#e5e7eb',
                                backgroundColor: isSelected ? '#243F7B10' : 'white'
                              }}
                            >
                              <div className="flex items-center">
                                <div 
                                  className="w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center"
                                  style={{ 
                                    borderColor: isSelected ? '#243F7B' : '#d1d5db',
                                    backgroundColor: isSelected ? '#243F7B' : 'white'
                                  }}
                                >
                                  {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                  )}
                                </div>
                                <input
                                  type="radio"
                                  name="reviewer"
                                  value={reviewer.id}
                                  checked={isSelected}
                                  onChange={() => setSelectedReviewer(reviewer)}
                                  className="sr-only"
                                />
                              </div>
                              <Icon className="w-5 h-5 text-gray-500" />
                              <div className="flex-1">
                                <p className="font-medium" style={{ color: '#243F7B' }}>
                                  {reviewer.name}
                                </p>
                                <p className="text-xs text-gray-500">{reviewer.title}</p>
                              </div>
                            </motion.label>
                          );
                        })}
                      </div>
                    </div>

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
                          <span className="text-sm font-medium" style={{ color: '#243F7B' }}>
                            Urgent
                          </span>
                          <p className="text-xs text-gray-600 mt-1">
                            Mark as urgent for immediate attention. Default is standard priority.
                          </p>
                        </div>
                      </motion.label>
                    </div>

                    {/* Comments */}
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                        Comments (Optional)
                      </label>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add any specific instructions or context for the approver..."
                        rows={3}
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
                            <span>Submit for Approval</span>
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