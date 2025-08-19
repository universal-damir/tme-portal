'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Invoice } from '@/types/invoicing';
import { toast } from 'sonner';

interface PaymentRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onPaymentRecorded: (payment: any) => void;
}

interface PaymentData {
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
}

const PAYMENT_METHODS = [
  'Bank Transfer',
  'Check',
  'Cash',
  'Credit Card',
  'Online Payment',
  'Wire Transfer',
  'Other'
];

export const PaymentRecordingModal: React.FC<PaymentRecordingModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentRecorded
}) => {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount: invoice.balanceDue || invoice.totalAmount,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<PaymentData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentData> = {};

    if (!paymentData.amount || paymentData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (paymentData.amount > (invoice.balanceDue || invoice.totalAmount)) {
      newErrors.amount = 'Amount cannot exceed the outstanding balance';
    }

    if (!paymentData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }

    if (!paymentData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    if (!paymentData.referenceNumber.trim()) {
      newErrors.referenceNumber = 'Reference number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/invoicing/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        const payment = await response.json();
        toast.success(`Payment of ${formatCurrency(paymentData.amount)} recorded successfully`);
        onPaymentRecorded(payment);
        onClose();
        
        // Reset form
        setPaymentData({
          amount: invoice.balanceDue || invoice.totalAmount,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'Bank Transfer',
          referenceNumber: '',
          notes: ''
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '.');
  };

  const balanceAfterPayment = (invoice.balanceDue || invoice.totalAmount) - paymentData.amount;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#243F7B' }}>
                Record Payment
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Invoice: <span className="font-semibold">{invoice.invoiceNumber}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Invoice Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium mb-3" style={{ color: '#243F7B' }}>
              Invoice Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Client:</div>
                <div className="font-medium">{invoice.client?.clientName}</div>
              </div>
              <div>
                <div className="text-gray-600">Invoice Date:</div>
                <div className="font-medium">{formatDate(invoice.invoiceDate)}</div>
              </div>
              <div>
                <div className="text-gray-600">Due Date:</div>
                <div className="font-medium">
                  {invoice.dueDate ? formatDate(invoice.dueDate) : 'Not set'}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Total Amount:</div>
                <div className="font-medium">{formatCurrency(invoice.totalAmount)}</div>
              </div>
              <div>
                <div className="text-gray-600">Paid Amount:</div>
                <div className="font-medium">{formatCurrency(invoice.paidAmount || 0)}</div>
              </div>
              <div>
                <div className="text-gray-600">Outstanding Balance:</div>
                <div className="font-medium text-red-600">
                  {formatCurrency(invoice.balanceDue || invoice.totalAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                  Payment Amount *
                </label>
                <input
                  type="text"
                  value={paymentData.amount === 0 ? '' : paymentData.amount.toLocaleString('en-US')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d.]/g, '');
                    if (value === '') {
                      setPaymentData(prev => ({ ...prev, amount: 0 }));
                    } else {
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue)) {
                        setPaymentData(prev => ({ ...prev, amount: numValue }));
                      }
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-all duration-200 h-[42px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    errors.amount ? 'border-red-500' : 'border-gray-200'
                  }`}
                  onFocus={(e) => !errors.amount && (e.target.style.borderColor = '#243F7B')}
                  onBlur={(e) => !errors.amount && (e.target.style.borderColor = '#e5e7eb')}
                  placeholder="Enter amount"
                />
                {errors.amount && (
                  <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.amount}</span>
                  </p>
                )}
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData(prev => ({
                    ...prev,
                    paymentDate: e.target.value
                  }))}
                  className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-all duration-200 h-[42px] ${
                    errors.paymentDate ? 'border-red-500' : 'border-gray-200'
                  }`}
                  onFocus={(e) => !errors.paymentDate && (e.target.style.borderColor = '#243F7B')}
                  onBlur={(e) => !errors.paymentDate && (e.target.style.borderColor = '#e5e7eb')}
                />
                {errors.paymentDate && (
                  <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.paymentDate}</span>
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                  Payment Method *
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData(prev => ({
                    ...prev,
                    paymentMethod: e.target.value
                  }))}
                  className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-all duration-200 h-[42px] ${
                    errors.paymentMethod ? 'border-red-500' : 'border-gray-200'
                  }`}
                  onFocus={(e) => !errors.paymentMethod && (e.target.style.borderColor = '#243F7B')}
                  onBlur={(e) => !errors.paymentMethod && (e.target.style.borderColor = '#e5e7eb')}
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
                {errors.paymentMethod && (
                  <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.paymentMethod}</span>
                  </p>
                )}
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                  Reference Number *
                </label>
                <input
                  type="text"
                  value={paymentData.referenceNumber}
                  onChange={(e) => setPaymentData(prev => ({
                    ...prev,
                    referenceNumber: e.target.value
                  }))}
                  className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-all duration-200 h-[42px] ${
                    errors.referenceNumber ? 'border-red-500' : 'border-gray-200'
                  }`}
                  onFocus={(e) => !errors.referenceNumber && (e.target.style.borderColor = '#243F7B')}
                  onBlur={(e) => !errors.referenceNumber && (e.target.style.borderColor = '#e5e7eb')}
                  placeholder="Transaction/Check/Reference number"
                />
                {errors.referenceNumber && (
                  <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.referenceNumber}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Notes (Optional)
              </label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
                rows={3}
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                placeholder="Additional notes about this payment..."
              />
            </div>

            {/* Payment Summary */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-medium mb-2" style={{ color: '#243F7B' }}>
                Payment Summary
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Payment Amount:</span>
                  <span className="font-medium">AED {paymentData.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining Balance:</span>
                  <span className={`font-medium ${balanceAfterPayment <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.max(0, balanceAfterPayment))}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span>Invoice Status:</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    balanceAfterPayment <= 0 
                      ? 'bg-green-100 text-green-700' 
                      : balanceAfterPayment < (invoice.balanceDue || invoice.totalAmount)
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {balanceAfterPayment <= 0 ? 'Paid in Full' : 
                     balanceAfterPayment < (invoice.balanceDue || invoice.totalAmount) ? 'Partially Paid' : 'Outstanding'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 rounded-lg border-2 font-medium disabled:opacity-50"
                style={{ borderColor: '#243F7B', color: '#243F7B' }}
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
                style={{ backgroundColor: '#243F7B' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Recording...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Record Payment</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};