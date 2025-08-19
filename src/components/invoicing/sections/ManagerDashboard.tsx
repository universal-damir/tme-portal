'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Eye,
  User,
  Calendar,
  DollarSign,
  Building,
  FileText,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ApprovalItem {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  status: string;
  requestedAt: string;
  approvalDate?: string;
  comments?: string;
  client: {
    code: string;
    name: string;
    issuingCompany: string;
  };
  requestedBy: string;
  invoiceStatus: string;
  notes?: string;
  internalNotes?: string;
}

interface ManagerDashboardProps {
  onNavigate: (mode: string) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigate }) => {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'request_revision'>('approve');
  const [approvalComments, setApprovalComments] = useState('');

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/invoicing/approvals?status=pending', {
        credentials: 'same-origin'
      });
      const data = await response.json();
      
      if (response.ok) {
        setPendingApprovals(data.approvals || []);
      } else {
        toast.error('Failed to load pending approvals');
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovalAction = async () => {
    if (!selectedApproval) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/invoicing/invoices/${selectedApproval.invoiceId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          action: approvalAction,
          comments: approvalComments.trim() || undefined
        })
      });

      if (response.ok) {
        const actionText = {
          approve: 'approved',
          reject: 'rejected', 
          request_revision: 'revision requested'
        };
        
        toast.success(`Invoice ${selectedApproval.invoiceNumber} ${actionText[approvalAction]}`);
        setShowApprovalModal(false);
        setSelectedApproval(null);
        setApprovalComments('');
        fetchPendingApprovals(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Failed to process approval');
    } finally {
      setIsProcessing(false);
    }
  };

  const openApprovalModal = (approval: ApprovalItem, action: 'approve' | 'reject' | 'request_revision') => {
    setSelectedApproval(approval);
    setApprovalAction(action);
    setApprovalComments('');
    setShowApprovalModal(true);
  };

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border-2"
        style={{ borderColor: '#243F7B20' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center space-x-2" style={{ color: '#243F7B' }}>
              <Clock className="w-5 h-5" />
              <span>Manager Approval Dashboard</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and approve pending invoices
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#243F7B' }}>
              {pendingApprovals.length}
            </p>
            <p className="text-xs text-gray-500">Pending Approvals</p>
          </div>
        </div>
      </motion.div>

      {/* Pending Approvals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border-2"
        style={{ borderColor: '#243F7B20' }}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#243F7B' }}>
            Pending Approvals
          </h3>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading approvals...</p>
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-500">No pending approvals</p>
              <p className="text-sm text-gray-400">All invoices are up to date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <motion.div
                  key={approval.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
                      {/* Invoice Details */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4" style={{ color: '#243F7B' }} />
                          <span className="font-semibold text-sm" style={{ color: '#243F7B' }}>
                            {approval.invoiceNumber}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(approval.invoiceDate)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span className="font-medium">{formatCurrency(approval.totalAmount)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Client Details */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Building className="w-4 h-4" style={{ color: '#D2BC99' }} />
                          <span className="font-semibold text-sm">{approval.client.name}</span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>Code: {approval.client.code}</div>
                          <div>{approval.client.issuingCompany}</div>
                        </div>
                      </div>

                      {/* Request Details */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-sm">Requested by</span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>{approval.requestedBy}</div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(approval.requestedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Notes Preview */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-sm">Notes</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {approval.notes ? (
                            <p className="line-clamp-2">{approval.notes}</p>
                          ) : (
                            <p className="italic">No notes</p>
                          )}
                          {approval.internalNotes && (
                            <p className="line-clamp-1 mt-1 text-orange-600">
                              Internal: {approval.internalNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 ml-4">
                      <motion.button
                        onClick={() => openApprovalModal(approval, 'approve')}
                        className="flex items-center space-x-1 px-3 py-1 rounded-lg text-white text-xs font-medium"
                        style={{ backgroundColor: '#22c55e' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Approve</span>
                      </motion.button>
                      <motion.button
                        onClick={() => openApprovalModal(approval, 'request_revision')}
                        className="flex items-center space-x-1 px-3 py-1 rounded-lg text-white text-xs font-medium"
                        style={{ backgroundColor: '#f59e0b' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span>Revise</span>
                      </motion.button>
                      <motion.button
                        onClick={() => openApprovalModal(approval, 'reject')}
                        className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Reject</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Approval Modal */}
      {showApprovalModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: '#243F7B' }}>
                {approvalAction === 'approve' ? 'Approve Invoice' : 
                 approvalAction === 'reject' ? 'Reject Invoice' : 'Request Revision'}
              </h3>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Invoice: <span className="font-semibold">{selectedApproval.invoiceNumber}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Client: <span className="font-semibold">{selectedApproval.client.name}</span>
              </p>
              <p className="text-sm text-gray-600">
                Amount: <span className="font-semibold">{formatCurrency(selectedApproval.totalAmount)}</span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
                Comments {approvalAction !== 'approve' && '*'}
              </label>
              <textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
                rows={3}
                placeholder={`Enter ${approvalAction === 'approve' ? 'optional' : 'required'} comments...`}
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border-2 font-medium"
                style={{ borderColor: '#243F7B', color: '#243F7B' }}
              >
                Cancel
              </button>
              <motion.button
                onClick={handleApprovalAction}
                disabled={isProcessing || (approvalAction !== 'approve' && !approvalComments.trim())}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 ${
                  approvalAction === 'approve' ? 'bg-green-500' :
                  approvalAction === 'reject' ? 'bg-red-500' : 'bg-orange-500'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isProcessing ? 'Processing...' : 
                 approvalAction === 'approve' ? 'Approve' :
                 approvalAction === 'reject' ? 'Reject' : 'Request Revision'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};