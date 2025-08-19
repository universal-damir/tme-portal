'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Save, Send } from 'lucide-react';
import { toast } from 'sonner';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any; // Preview invoice data
  onCreateDraft?: () => void;
  onSubmitForApproval?: () => void;
  isCreating?: boolean;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onCreateDraft,
  onSubmitForApproval,
  isCreating = false
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCompanyDetails = (company: string) => {
    switch (company) {
      case 'DET':
        return {
          name: 'Dynamic Experts Trading LLC',
          address: 'Office 123, Business Center, Dubai, United Arab Emirates',
          trn: 'TRN: 100000000000003'
        };
      case 'FZCO':
        return {
          name: 'TME Professional Services FZCO',
          address: 'Free Zone Office 456, Dubai, United Arab Emirates',
          trn: 'TRN: 100000000000003'
        };
      case 'DMCC':
        return {
          name: 'TME Global Services DMCC',
          address: 'DMCC Business Centre, Dubai, United Arab Emirates',
          trn: 'TRN: 100000000000003'
        };
      default:
        return {
          name: 'TME Professional Services',
          address: 'Dubai, United Arab Emirates',
          trn: 'TRN: 100000000000003'
        };
    }
  };

  const handleGeneratePreviewPDF = async () => {
    if (!invoice) {
      toast.error('No invoice data available');
      return;
    }

    try {
      // Use the existing PDF generation system for previews
      const { InvoicePDFGenerator } = await import('@/lib/invoicing/invoice-pdf-generator');
      
      const { blob, filename } = await InvoicePDFGenerator.generatePDFWithFilename(invoice);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating preview PDF:', error);
      toast.error('Failed to generate PDF - please try again');
    }
  };

  if (!isOpen || !invoice) return null;

  const companyDetails = getCompanyDetails(invoice.client?.issuingCompany || 'FZCO');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6" style={{ color: '#243F7B' }} />
              <div>
                <h2 className="text-xl font-semibold" style={{ color: '#243F7B' }}>
                  Invoice Preview
                </h2>
                <p className="text-sm text-gray-600">
                  {invoice.invoiceNumber} • {invoice.client?.clientName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={handleGeneratePreviewPDF}
                className="flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </motion.button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto bg-white invoice-preview-content">
              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: '#243F7B' }}>
                    {companyDetails.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{companyDetails.address}</p>
                  <p className="text-sm text-gray-600">{companyDetails.trn}</p>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-bold" style={{ color: '#243F7B' }}>INVOICE</h1>
                  <p className="text-lg font-semibold mt-1" style={{ color: '#243F7B' }}>
                    {invoice.invoiceNumber}
                  </p>
                </div>
              </div>

              {/* Invoice and Client Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-sm font-semibold mb-3" style={{ color: '#243F7B' }}>
                    BILL TO:
                  </h4>
                  <div className="text-sm">
                    <p className="font-semibold">{invoice.client?.clientName}</p>
                    <p>{invoice.client?.clientAddress}</p>
                    {invoice.client?.vatNumber && (
                      <p>VAT Number: {invoice.client.vatNumber}</p>
                    )}
                    <p>Client Code: {invoice.client?.clientCode}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3" style={{ color: '#243F7B' }}>
                    INVOICE DETAILS:
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Invoice Date:</span>
                      <span>{formatDate(invoice.invoiceDate)}</span>
                    </div>
                    {invoice.dueDate && (
                      <div className="flex justify-between">
                        <span>Due Date:</span>
                        <span>{formatDate(invoice.dueDate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Currency:</span>
                      <span>AED</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT Rate:</span>
                      <span>{invoice.vatRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: '#F8F9FA' }}>
                      <th className="border p-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Description
                      </th>
                      <th className="border p-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Qty
                      </th>
                      <th className="border p-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Unit
                      </th>
                      <th className="border p-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Unit Price
                      </th>
                      <th className="border p-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Net Amount
                      </th>
                      <th className="border p-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        VAT (5%)
                      </th>
                      <th className="border p-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Gross Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.sections?.map((section: any, sectionIndex: number) => (
                      <React.Fragment key={sectionIndex}>
                        {/* Section Header */}
                        <tr style={{ backgroundColor: '#E8F0FF' }}>
                          <td colSpan={7} className="border p-2">
                            <strong style={{ color: '#243F7B' }}>{section.name}</strong>
                          </td>
                        </tr>
                        {/* Section Items */}
                        {section.items?.map((item: any, itemIndex: number) => {
                          const netAmount = item.quantity * item.unit_price;
                          const vatAmount = netAmount * 0.05;
                          const grossAmount = netAmount + vatAmount;
                          
                          return (
                            <tr key={itemIndex}>
                              <td className="border p-2 text-sm">{item.description}</td>
                              <td className="border p-2 text-sm text-center">{item.quantity}</td>
                              <td className="border p-2 text-sm text-center">{item.unit || '-'}</td>
                              <td className="border p-2 text-sm text-right">
                                {formatCurrency(item.unit_price)}
                              </td>
                              <td className="border p-2 text-sm text-right">
                                {formatCurrency(netAmount)}
                              </td>
                              <td className="border p-2 text-sm text-right">
                                {formatCurrency(vatAmount)}
                              </td>
                              <td className="border p-2 text-sm text-right font-semibold">
                                {formatCurrency(grossAmount)}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-80">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Subtotal:</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">VAT ({invoice.vatRate}%):</span>
                    <span>{formatCurrency(invoice.vatAmount)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-gray-300">
                    <span className="text-lg font-bold" style={{ color: '#243F7B' }}>
                      Total Amount:
                    </span>
                    <span className="text-lg font-bold" style={{ color: '#243F7B' }}>
                      {formatCurrency(invoice.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="mb-8">
                  <h4 className="text-sm font-semibold mb-3" style={{ color: '#243F7B' }}>
                    NOTES:
                  </h4>
                  <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    {invoice.notes}
                  </p>
                </div>
              )}

              {/* Payment Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold mb-3" style={{ color: '#243F7B' }}>
                  PAYMENT INFORMATION
                </h4>
                <div className="text-sm text-gray-700">
                  <p>Bank: Emirates NBD Bank</p>
                  <p>Account Name: {companyDetails.name}</p>
                  <p>Account Number: 1234567890</p>
                  <p>IBAN: AE070260001234567890</p>
                  <p>Swift Code: EBILAEAD</p>
                  <p className="mt-2 font-medium">
                    Please reference invoice number {invoice.invoiceNumber} in your payment.
                  </p>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 mt-6">
                This is a preview of your invoice. No data has been saved yet.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex items-center space-x-3">
              {onCreateDraft && (
                <motion.button
                  onClick={onCreateDraft}
                  disabled={isCreating}
                  className="flex items-center space-x-2 px-6 py-2 rounded-lg border-2 font-medium disabled:opacity-50 transition-all duration-200"
                  style={{ borderColor: '#243F7B', color: '#243F7B' }}
                  whileHover={!isCreating ? { scale: 1.02 } : {}}
                  whileTap={!isCreating ? { scale: 0.98 } : {}}
                >
                  <Save className="w-4 h-4" />
                  <span>{isCreating ? 'Creating...' : 'Save as Draft'}</span>
                </motion.button>
              )}
              
              {onSubmitForApproval && (
                <motion.button
                  onClick={onSubmitForApproval}
                  disabled={isCreating}
                  className="flex items-center space-x-2 px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50 transition-all duration-200"
                  style={{ backgroundColor: '#243F7B' }}
                  whileHover={!isCreating ? { scale: 1.02 } : {}}
                  whileTap={!isCreating ? { scale: 0.98 } : {}}
                >
                  <Send className="w-4 h-4" />
                  <span>{isCreating ? 'Creating...' : 'Submit for Approval'}</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};