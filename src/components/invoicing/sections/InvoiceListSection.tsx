'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Download,
  Send,
  Eye,
  Edit2,
  Banknote,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  Plus
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '@/types/invoicing';
import { toast } from 'sonner';
import { EmailPreviewModal, EmailPreviewData } from '@/components/shared/EmailPreviewModal';
import { generateInvoiceEmailContent, generateInvoiceEmailSubject, InvoiceEmailData } from '@/lib/invoicing/invoice-email-templates';
import { PaymentRecordingModal } from './PaymentRecordingModal';

interface InvoiceListSectionProps {
  selectedInvoice?: Invoice | null;
  onInvoiceSelect?: (invoice: Invoice) => void;
  onCreateNew?: () => void;
}

export const InvoiceListSection: React.FC<InvoiceListSectionProps> = ({
  selectedInvoice,
  onInvoiceSelect,
  onCreateNew
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('month');
  const [sortBy, setSortBy] = useState<'date' | 'number' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<Invoice | null>(null);
  const [emailData, setEmailData] = useState<EmailPreviewData | null>(null);
  const [isEmailSending, setIsEmailSending] = useState(false);

  // Payment recording modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterAndSortInvoices();
  }, [invoices, searchTerm, statusFilter, dateFilter, sortBy, sortOrder]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoicing/invoices', {
        credentials: 'same-origin'
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      } else {
        console.error('Failed to fetch invoices:', response.status);
        toast.error('Failed to load invoices');
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortInvoices = () => {
    let filtered = [...invoices];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client?.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client?.clientCode.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Date filter
    const now = new Date();
    if (dateFilter !== 'all') {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.invoiceDate);
        switch (dateFilter) {
          case 'today':
            return invoiceDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return invoiceDate >= weekAgo;
          case 'month':
            return invoiceDate.getMonth() === now.getMonth() && 
                   invoiceDate.getFullYear() === now.getFullYear();
          case 'year':
            return invoiceDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
          break;
        case 'number':
          comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
        case 'amount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredInvoices(filtered);
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'pending_approval': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'partially_paid': return <Banknote className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'pending_approval': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'sent': return '#3B82F6';
      case 'partially_paid': return '#8B5CF6';
      case 'paid': return '#10B981';
      case 'overdue': return '#EF4444';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleSendEmail = async (invoice: Invoice) => {
    if (!invoice.client) {
      toast.error('Client information is missing');
      return;
    }

    try {
      // Generate PDF for attachment
      let pdfBlob: Blob | undefined;
      let pdfFilename: string | undefined;

      try {
        const pdfResponse = await fetch(`/api/invoicing/invoices/${invoice.id}/pdf`, {
          method: 'POST',
          credentials: 'same-origin'
        });

        if (pdfResponse.ok) {
          const pdfData = await pdfResponse.json();
          // Convert base64 back to blob
          const byteCharacters = atob(pdfData.data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
          pdfFilename = pdfData.filename;
        }
      } catch (pdfError) {
        console.warn('Failed to generate PDF for email attachment:', pdfError);
        // Continue without PDF attachment
      }

      // Generate email content
      const emailTemplateData: InvoiceEmailData = {
        invoice,
        clientName: invoice.client.clientName,
        managerName: invoice.client.managerName,
        companyName: invoice.client.issuingCompany,
      };

      const subject = generateInvoiceEmailSubject(invoice, invoice.client.clientName);
      const htmlContent = generateInvoiceEmailContent(emailTemplateData);

      // Prepare email data for modal
      const emailPreviewData: EmailPreviewData = {
        to: [invoice.client.managerName ? `${invoice.client.managerName}@example.com` : 'manager@example.com'], // TODO: Get actual email from client data
        subject,
        htmlContent,
        attachments: pdfFilename ? [
          {
            filename: pdfFilename,
            contentType: 'application/pdf',
            size: pdfBlob?.size
          }
        ] : []
      };

      setSelectedInvoiceForEmail(invoice);
      setEmailData(emailPreviewData);
      setShowEmailModal(true);
    } catch (error) {
      console.error('Error preparing email:', error);
      toast.error('Failed to prepare email');
    }
  };

  const handleEmailSend = async (emailData: EmailPreviewData) => {
    if (!selectedInvoiceForEmail) {
      toast.error('No invoice selected');
      return;
    }

    try {
      setIsEmailSending(true);
      
      const response = await fetch(`/api/invoicing/invoices/${selectedInvoiceForEmail.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Invoice ${selectedInvoiceForEmail.invoiceNumber} sent successfully`);
        
        // Update the invoice status in the local state
        setInvoices(prev => prev.map(inv => 
          inv.id === selectedInvoiceForEmail.id 
            ? { ...inv, status: 'sent' as InvoiceStatus, sentAt: result.sentAt }
            : inv
        ));
        
        setShowEmailModal(false);
        setSelectedInvoiceForEmail(null);
        setEmailData(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send invoice');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleViewPDF = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/invoicing/invoices/${invoice.id}/pdf`, {
        credentials: 'same-origin'
      });

      if (response.ok) {
        // Create blob from response
        const blob = await response.blob();
        
        // Open PDF in new tab
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Clean up the URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);

        toast.success('PDF opened in new tab');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to open PDF');
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      toast.error('Failed to open PDF');
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/invoicing/invoices/${invoice.id}/pdf`, {
        credentials: 'same-origin'
      });

      if (response.ok) {
        // Create blob from response
        const blob = await response.blob();
        
        // Get filename from response headers or generate one
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `Invoice_${invoice.invoiceNumber}.pdf`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Downloaded ${filename}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setShowPaymentModal(true);
  };

  const handlePaymentRecorded = (paymentResult: any) => {
    // Update the local invoice data with new payment information
    setInvoices(prev => prev.map(inv => 
      inv.id === paymentResult.invoiceId 
        ? { 
            ...inv, 
            paidAmount: paymentResult.invoice.paidAmount,
            balanceDue: paymentResult.invoice.balanceDue,
            status: paymentResult.invoice.status as InvoiceStatus
          }
        : inv
    ));

    setShowPaymentModal(false);
    setSelectedInvoiceForPayment(null);
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border-2" style={{ borderColor: '#243F7B20' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: '#243F7B' }}>
            Invoice Management
          </h2>
          <motion.button
            onClick={onCreateNew}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: '#D2BC99' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </motion.button>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="all">All Status</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="sent">Sent</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px]"
            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="date">Sort by Date</option>
            <option value="number">Sort by Number</option>
            <option value="amount">Sort by Amount</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-600">
            {filteredInvoices.length} invoices found
          </span>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>
      </div>

      {/* Invoice Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#243F7B' }}></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border-2 overflow-hidden" style={{ borderColor: '#243F7B20' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ backgroundColor: '#243F7B10' }}>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredInvoices.map((invoice, index) => (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onInvoiceSelect?.(invoice)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium" style={{ color: '#243F7B' }}>
                          {invoice.invoiceNumber}
                        </div>
                        {invoice.isRecurring && (
                          <span className="text-xs text-gray-500">Recurring</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.client?.clientName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {invoice.client?.clientCode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(invoice.invoiceDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.totalAmount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          VAT: {formatCurrency(invoice.vatAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: getStatusColor(invoice.status) + '20',
                            color: getStatusColor(invoice.status)
                          }}
                        >
                          {getStatusIcon(invoice.status)}
                          <span className="capitalize">{invoice.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invoice.balanceDue && invoice.balanceDue > 0 ? (
                          <div>
                            <div className="text-sm font-medium text-red-600">
                              {formatCurrency(invoice.balanceDue)}
                            </div>
                            {invoice.paidAmount > 0 && (
                              <div className="text-xs text-gray-500">
                                Paid: {formatCurrency(invoice.paidAmount)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-green-600 font-medium">Paid</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPDF(invoice);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="View PDF in new tab"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(invoice);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4 text-green-600" />
                          </motion.button>
                          {invoice.status === 'approved' && (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendEmail(invoice);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Send to client"
                            >
                              <Send className="w-4 h-4 text-blue-600" />
                            </motion.button>
                          )}
                          {(invoice.balanceDue && invoice.balanceDue > 0) && (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRecordPayment(invoice);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Record payment"
                            >
                              <Banknote className="w-4 h-4 text-purple-600" />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No invoices found</p>
              <button
                onClick={onCreateNew}
                className="mt-4 text-sm font-medium"
                style={{ color: '#243F7B' }}
              >
                Create your first invoice
              </button>
            </div>
          )}
        </div>
      )}

      {/* Email Preview Modal */}
      {showEmailModal && emailData && (
        <EmailPreviewModal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setSelectedInvoiceForEmail(null);
            setEmailData(null);
          }}
          emailData={emailData}
          onSend={handleEmailSend}
          loading={isEmailSending}
          // TODO: Add PDF generation here when implemented
          // pdfBlob={invoicePdfBlob}
          // pdfFilename={`${selectedInvoiceForEmail?.invoiceNumber}.pdf`}
        />
      )}

      {/* Payment Recording Modal */}
      {showPaymentModal && selectedInvoiceForPayment && (
        <PaymentRecordingModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoiceForPayment(null);
          }}
          invoice={selectedInvoiceForPayment}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}
    </div>
  );
};