// Simplified Review Modal Component
// Streamlined reviewer interface with PDF preview, comments, and 3 action buttons

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, FileText, Send, User, MessageSquare, Calendar, Tag, Edit } from 'lucide-react';
import { Application } from '@/types/review-system';
import { useReviewSystemConfig } from '@/lib/config/review-system';
import { GoldenVisaData } from '@/types/golden-visa';
import { OfferData } from '@/types/offer';
import { CompanyServicesData } from '@/types/company-services';
import { SharedClientInfo } from '@/types/portal';
import { toast } from 'sonner';

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
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Don't render if feature is disabled
  if (!config.canShowReviewComponents || !config.allowReviewActions) {
    return null;
  }

  const resetForm = () => {
    setComments('');
    setError(null);
    setSuccess(false);
    setIsSubmitting(false);
    setIsPreviewLoading(false);
  };

  // Helper function to generate form title using PDF naming convention
  const getFormTitle = (): string => {
    if (!application?.form_data) return application?.title || 'Application';
    
    try {
      if (application.type === 'golden-visa') {
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
      } else if (application.type === 'cost-overview') {
        const formData = application.form_data as OfferData;
        const date = new Date(formData.clientDetails?.date || new Date());
        const yy = date.getFullYear().toString().slice(-2);
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        const formattedDate = `${yy}${mm}${dd}`;
        
        let nameForTitle = '';
        if (formData.clientDetails?.companyName) {
          nameForTitle = formData.clientDetails.companyName;
        } else if (formData.clientDetails?.lastName && formData.clientDetails?.firstName) {
          nameForTitle = `${formData.clientDetails.lastName} ${formData.clientDetails.firstName}`;
        } else if (formData.clientDetails?.firstName) {
          nameForTitle = formData.clientDetails.firstName;
        } else if (formData.clientDetails?.lastName) {
          nameForTitle = formData.clientDetails.lastName;
        } else {
          nameForTitle = 'Client';
        }
        
        const authority = formData.authorityInformation?.responsibleAuthority || 'setup';
        return `${formattedDate} ${nameForTitle} offer ${authority}`;
      } else if (application.type === 'company-services') {
        const formData = application.form_data as CompanyServicesData;
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
        
        return `${formattedDate} TME Services ${nameForTitle}`;
      }
      
      return application?.title || 'Application';
    } catch (error) {
      return application?.title || `${application.type.charAt(0).toUpperCase() + application.type.slice(1).replace('-', ' ')} Application`;
    }
  };

  const handlePreviewPDF = async () => {
    if (!application?.form_data) return;
    
    try {
      setIsPreviewLoading(true);
      setError(null);
      
      // Show toast notification about PDF generation
      toast.info('Generating PDF preview...', {
        description: 'PDF will open in a new window when ready',
        duration: 3000
      });
      if (application.type === 'golden-visa') {
        // Generate Golden Visa PDF for review
        const { generateGoldenVisaPDFWithFilename } = await import('@/lib/pdf-generator/utils/goldenVisaGenerator');
        const formData = application.form_data as GoldenVisaData;
        
        // Extract client info from form data
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
      } else if (application.type === 'cost-overview') {
        // Generate Cost Overview PDF for review
        const { generatePDFWithFilename } = await import('@/lib/pdf-generator');
        const formData = application.form_data as OfferData;
        
        const { blob } = await generatePDFWithFilename(formData);
        
        // Open PDF in new tab for preview
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Clean up the URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      } else if (application.type === 'company-services') {
        // Generate Company Services PDF for review
        const { generateCompanyServicesPDFWithFilename } = await import('@/lib/pdf-generator/utils/companyServicesGenerator');
        const formData = application.form_data as CompanyServicesData;
        
        // Extract client info from form data
        const clientInfo: SharedClientInfo = {
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          companyName: formData.companyName || '',
          shortCompanyName: formData.shortCompanyName || '',
          date: formData.date || new Date().toISOString().split('T')[0],
        };
        
        const { blob } = await generateCompanyServicesPDFWithFilename(formData, clientInfo);
        
        // Open PDF in new tab for preview
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Clean up the URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      } else {
        setError('PDF preview not supported for this application type.');
        return;
      }
      
      // Show success toast when PDF is successfully generated and opened
      toast.success('PDF preview opened in new window', {
        duration: 2000
      });
      
    } catch (error) {
      console.error('Error generating PDF for review:', error);
      setError('Failed to generate PDF for review. Please try again.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleActionClick = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && (!comments.trim() || comments.trim().length < 10)) {
      setError('Please provide detailed feedback when rejecting (minimum 10 characters)');
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

  const handleEditApplication = () => {
    if (!application?.form_data) return;
    
    // Map application types to tab names
    const tabMapping: Record<string, string> = {
      'golden-visa': 'golden-visa',
      'cost-overview': 'cost-overview', 
      'company-services': 'company-services',
      'taxation': 'taxation',
      'corporate-changes': 'corporate-changes'
    };
    
    const targetTab = tabMapping[application.type];
    
    // Navigate to the correct tab first
    if (targetTab) {
      const tabEvent = new CustomEvent('navigate-to-tab', {
        detail: { tab: targetTab }
      });
      window.dispatchEvent(tabEvent);
    }
    
    // Dispatch event to pre-fill the form based on application type
    const eventName = `edit-${application.type}-application`;
    const editEvent = new CustomEvent(eventName, {
      detail: {
        applicationId: application.id,
        formData: application.form_data
      }
    });
    
    // Delay the form data loading slightly to ensure tab navigation completes
    setTimeout(() => {
      window.dispatchEvent(editEvent);
    }, 100);
    
    // Close the review modal
    handleClose();
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
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col"
              style={{ fontFamily: 'Inter, sans-serif' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold" style={{ color: '#243F7B' }}>
                      Review {application.type === 'golden-visa' ? 'Golden Visa' : application.type === 'cost-overview' ? 'Cost Overview' : 'Application'}
                    </h2>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {getFormTitle()}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{application.submitted_by?.full_name || 'Unknown User'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(application.submitted_at || application.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span className="capitalize">{application.urgency} Priority</span>
                      </div>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 overflow-y-auto flex-1">
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
                    {/* Submitter Message */}
                    {(() => {
                      // Get submitter message from temporary storage in form_data
                      const submitterMessage = application.submitter_message || 
                        (application.form_data as any)?._submitter_message;
                      
                      if (!submitterMessage) return null;
                      
                      return (
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                            <MessageSquare className="w-4 h-4 inline mr-1" />
                            Message
                          </label>
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {submitterMessage}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* PDF Preview Button */}
                    <div className="text-center">
                      <motion.button
                        whileHover={!isPreviewLoading ? { scale: 1.02 } : {}}
                        whileTap={!isPreviewLoading ? { scale: 0.98 } : {}}
                        type="button"
                        onClick={handlePreviewPDF}
                        disabled={isPreviewLoading}
                        className="flex items-center justify-center space-x-2 w-1/2 mx-auto px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: isPreviewLoading ? '#9CA3AF' : '#243F7B' }}
                      >
                        {isPreviewLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4" />
                            <span>Preview PDF</span>
                          </>
                        )}
                      </motion.button>
                      <p className="text-xs text-gray-500 mt-2">
                        Opens in new tab for review
                      </p>
                    </div>

                    {/* Comments */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium" style={{ color: '#243F7B' }}>
                          Feedback
                        </label>
                        <span className="text-xs text-gray-500">
                          {comments.length} characters {comments.length < 10 ? `(${10 - comments.length} more needed for rejection)` : ''}
                        </span>
                      </div>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add your review comments or feedback... (Minimum 10 characters required for rejection)"
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
                    <div className="grid grid-cols-3 gap-3">
                      {/* Send Back for Revision */}
                      <motion.button
                        whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                        whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                        type="button"
                        onClick={() => handleActionClick('reject')}
                        disabled={isSubmitting}
                        className="flex items-center justify-center space-x-2 w-full px-3 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                        style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                      >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Send Back</span>
                        <span className="sm:hidden">Reject</span>
                      </motion.button>

                      {/* Edit Application */}
                      <motion.button
                        whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                        whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                        type="button"
                        onClick={handleEditApplication}
                        disabled={isSubmitting}
                        className="flex items-center justify-center space-x-2 w-full px-3 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                        style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </motion.button>

                      {/* Approve */}
                      <motion.button
                        whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                        whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                        type="button"
                        onClick={() => handleActionClick('approve')}
                        disabled={isSubmitting}
                        className="flex items-center justify-center space-x-2 w-full px-3 py-3 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50"
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

