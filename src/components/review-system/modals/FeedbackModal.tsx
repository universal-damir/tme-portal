// Feedback Notification Modal Component
// Shows reviewer feedback to submitters with form preview and side-by-side editing capability

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, FileText, User, Calendar, AlertCircle, CheckCircle, Edit3, Send } from 'lucide-react';
import { Application } from '@/types/review-system';
import { useReviewSystemConfig } from '@/lib/config/review-system';
import { GoldenVisaData } from '@/types/golden-visa';
import { SharedClientInfo } from '@/types/portal';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onEditForm?: () => void; // Callback to open form for editing
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  application,
  onEditForm
}) => {
  const config = useReviewSystemConfig();
  // Removed viewMode state as we're removing the tabs
  const [error, setError] = useState<string | null>(null);

  // Don't render if feature is disabled
  if (!config.canShowReviewComponents) {
    return null;
  }

  // Helper function to generate form title using PDF naming convention
  const getFormTitle = (): string => {
    if (!application?.form_data) return application?.title || 'Application';
    
    try {
      const formData = application.form_data as GoldenVisaData;
      const date = new Date(formData.date || new Date());
      const yy = date.getFullYear().toString().slice(-2);
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      const formattedDate = `${yy}${mm}${dd}`;
      
      let nameForTitle = '';
      if (formData.companyName) {
        nameForTitle = formData.companyName;
      } else if (formData.lastName && formData.firstName) {
        nameForTitle = `${formData.lastName} ${formData.firstName}`;
      } else if (formData.firstName) {
        nameForTitle = formData.firstName;
      } else if (formData.lastName) {
        nameForTitle = formData.lastName;
      } else {
        nameForTitle = 'Client';
      }
      
      const visaTypeMap: { [key: string]: string } = {
        'property-investment': 'property',
        'time-deposit': 'deposit',
        'skilled-employee': 'skilled'
      };
      
      const visaTypeFormatted = visaTypeMap[formData.visaType] || formData.visaType;
      return `${formattedDate} ${nameForTitle} offer golden visa ${visaTypeFormatted}`;
    } catch (error) {
      return application?.title || 'Golden Visa Application';
    }
  };

  const handlePreviewPDF = async () => {
    if (!application?.form_data) return;
    
    try {
      setError(null);
      const { generateGoldenVisaPDFWithFilename } = await import('@/lib/pdf-generator/utils/goldenVisaGenerator');
      const formData = application.form_data as GoldenVisaData;
      
      const clientInfo: SharedClientInfo = {
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
      console.error('Error generating PDF preview:', error);
      setError('Failed to generate PDF preview. Please try again.');
    }
  };

  const handleSendPDF = () => {
    if (!application) return;
    
    // Navigate to Golden Visa tab and trigger send functionality
    window.location.hash = '#golden-visa';
    
    // Close the feedback modal
    onClose();
    
    // Dispatch event to load form data and trigger PDF generation/email
    const sendEvent = new CustomEvent('send-approved-application', {
      detail: {
        applicationId: application.id,
        formData: application.form_data
      }
    });
    
    // Small delay to ensure the tab has loaded before dispatching the event
    setTimeout(() => {
      window.dispatchEvent(sendEvent);
    }, 100);
  };

  const handleEditForm = () => {
    if (onEditForm) {
      onEditForm();
    }
    onClose();
  };

  const resetState = () => {
    setError(null);
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen, application?.id]);

  if (!application) return null;

  const isApproved = application.status === 'approved';
  const isRejected = application.status === 'rejected';

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
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col"
              style={{ fontFamily: 'Inter, sans-serif' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {isApproved ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                      )}
                      <h2 className="text-xl font-semibold" style={{ color: '#243F7B' }}>
                        {isApproved ? 'Application Approved' : 'Feedback Received'}
                      </h2>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-2">
                      {getFormTitle()}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>Reviewed by {application.reviewer?.full_name || 'Reviewer'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{application.reviewed_at ? new Date(application.reviewed_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.') : 'Recently'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </motion.button>
                </div>
              </div>

              {/* Removed View Toggle Tabs */}

              {/* Content */}
              <div className="px-6 py-6 overflow-y-auto flex-1">
                {
                  <div className="space-y-6">
                    {/* Status Message */}
                    <div className={`p-4 rounded-lg border ${
                      isApproved 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-orange-50 border-orange-200'
                    }`}>
                      <h3 className={`font-semibold text-sm mb-2 ${
                        isApproved ? 'text-green-800' : 'text-orange-800'
                      }`}>
                        {isApproved 
                          ? '✅ Your application has been approved!'
                          : '📝 Your application needs revisions'
                        }
                      </h3>
                      <p className={`text-sm ${
                        isApproved ? 'text-green-700' : 'text-orange-700'
                      }`}>
                        {isApproved
                          ? 'Your application has been approved and is ready for processing.'
                          : 'Please review the feedback below and make the necessary changes before resubmitting.'
                        }
                      </p>
                    </div>

                    {/* Reviewer Feedback */}
                    <div>
                      <label className="block text-sm font-medium mb-3" style={{ color: '#243F7B' }}>
                        <MessageSquare className="w-4 h-4 inline mr-2" />
                        Reviewer Comments
                      </label>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {application.review_comments || (isApproved ? 'Application approved' : 'No specific feedback provided.')}
                        </p>
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                      </motion.div>
                    )}

                    {/* Action Buttons */}
                    <div className={isApproved ? "flex justify-center" : "grid grid-cols-2 gap-3"}>
                      {/* Go to Form Editor button - only show when not approved */}
                      {!isApproved && (
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          type="button"
                          onClick={handleEditForm}
                          className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200"
                          style={{ 
                            backgroundColor: '#FEE2E2', 
                            color: '#DC2626' 
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Go to Form Editor</span>
                        </motion.button>
                      )}
                      
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="button"
                        onClick={isApproved ? handleSendPDF : handlePreviewPDF}
                        className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg font-semibold text-white transition-all duration-200"
                        style={{ backgroundColor: isApproved ? '#243F7B' : '#D2BC99', color: isApproved ? 'white' : '#243F7B' }}
                      >
                        {isApproved ? (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Send</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4" />
                            <span>Preview PDF</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                }
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};