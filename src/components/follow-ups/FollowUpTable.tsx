/**
 * FollowUpTable Component
 * Table view for displaying follow-ups with actions
 */

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Check, Clock, Mail, X, Copy } from 'lucide-react';
import { EmailFollowUp } from '@/types/follow-up';
import ConfirmationModal from './ConfirmationModal';

export interface FollowUpTableProps {
  followUps: EmailFollowUp[];
  onAction: (followUpId: string, action: string, data?: any) => void;
  loading?: boolean;
  emptyMessage?: string;
  variant?: 'pending' | 'completed' | 'no_response';
}

// Helper component for table row with checkbox hover state
const FollowUpRow: React.FC<{
  followUp: EmailFollowUp;
  index: number;
  loading?: boolean;
  onAction: (followUpId: string, action: string, data?: any) => void;
  formatDate: (date: Date | string) => string;
  getFollowUpLabel: (num: number) => string;
  isOverdue: (date: Date | string) => boolean;
  isDueToday: (date: Date | string) => boolean;
}> = ({ followUp, index, loading, onAction, formatDate, getFollowUpLabel, isOverdue, isDueToday }) => {
  const [checkboxHovered, setCheckboxHovered] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [subjectHovered, setSubjectHovered] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const overdue = isOverdue(followUp.due_date);
  const dueToday = isDueToday(followUp.due_date);
  
  const handleCopySubject = () => {
    navigator.clipboard.writeText(followUp.email_subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setShowConfirmModal(true);
      e.target.checked = false; // Reset checkbox while modal is open
    }
  };
  
  const handleConfirm = () => {
    onAction(followUp.id, 'complete', { reason: 'client_responded' });
    setShowConfirmModal(false);
  };
  
  const handleCancel = () => {
    setShowConfirmModal(false);
  };
  
  // Use portal for modal to avoid hydration issues
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <>
      <motion.tr
        key={followUp.id}
        className={`border-b border-gray-200 hover:bg-gray-50 transition-all duration-200 ${
          overdue ? 'bg-red-50 hover:bg-red-100' : dueToday ? 'bg-orange-50 hover:bg-orange-100' : 'even:bg-gray-50'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: loading ? 0 : index * 0.03 }}
      >
        <td className="py-4 px-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full ${
              followUp.follow_up_number === 1 ? 'bg-blue-100 text-blue-700' :
              followUp.follow_up_number === 2 ? 'bg-orange-100 text-orange-700' :
              'bg-red-100 text-red-700'
            }`}>
              {getFollowUpLabel(followUp.follow_up_number)}
            </span>
            {overdue && (
              <span className="text-xs font-medium text-red-600">Overdue</span>
            )}
          </div>
        </td>
        <td className="py-4 px-2 min-w-[300px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="space-y-1">
            <div className="font-semibold text-sm" style={{ color: '#243F7B' }}>
              {followUp.client_name}
            </div>
            <div 
              className="text-xs text-gray-600 cursor-pointer group flex items-start gap-1 hover:text-gray-800 transition-colors"
              onClick={handleCopySubject}
              onMouseEnter={() => setSubjectHovered(true)}
              onMouseLeave={() => setSubjectHovered(false)}
              title="Click to copy subject"
            >
              <span className="break-all">{followUp.email_subject}</span>
              {(subjectHovered || copiedSubject) && (
                <span className="flex-shrink-0 mt-0.5">
                  {copiedSubject ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-400" />
                  )}
                </span>
              )}
            </div>
          </div>
        </td>
        <td className="py-4 px-2 text-sm text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
          {formatDate(followUp.sent_date)}
        </td>
        <td className="py-4 px-2 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className={`font-semibold ${
            overdue ? 'text-red-600' : dueToday ? 'text-orange-600' : 'text-gray-700'
          }`}>
            {formatDate(followUp.due_date)}
            {dueToday && (
              <span className="block text-xs font-normal text-orange-600 mt-0.5">Due Today</span>
            )}
          </div>
        </td>
        <td className="py-4 px-2 text-center">
          <div className="flex justify-center">
            <label 
              className="relative inline-flex items-center cursor-pointer"
              onMouseEnter={() => setCheckboxHovered(true)}
              onMouseLeave={() => setCheckboxHovered(false)}
            >
              <input
                type="checkbox"
                className="sr-only peer"
                onChange={handleCheckboxChange}
              />
              <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                checkboxHovered ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
              } peer-checked:bg-blue-600 peer-checked:border-blue-600`}>
                <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
              </div>
            </label>
          </div>
        </td>
      </motion.tr>
      
      {/* Render modal via portal to avoid hydration issues */}
      {mounted && showConfirmModal && createPortal(
        <ConfirmationModal
          isOpen={showConfirmModal}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          title="Mark as Complete"
          message={`Mark this follow-up for ${followUp.client_name} as complete? This indicates the client has responded.`}
          confirmText="Mark Complete"
          cancelText="Cancel"
        />,
        document.body
      )}
    </>
  );
};

const FollowUpTable: React.FC<FollowUpTableProps> = ({
  followUps,
  onAction,
  loading = false,
  emptyMessage = 'No follow-ups found.',
  variant = 'pending'
}) => {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(2);
    return `${day}.${month}.${year}`;
  };

  const getFollowUpLabel = (num: number) => {
    switch (num) {
      case 1:
        return '1st Attempt';
      case 2:
        return '2nd Attempt';
      case 3:
        return '3rd Attempt';
      default:
        return `${num}th Attempt`;
    }
  };

  const isOverdue = (dueDate: Date | string) => {
    return new Date(dueDate) < new Date();
  };

  const isDueToday = (dueDate: Date | string) => {
    const due = new Date(dueDate);
    const today = new Date();
    return due.toDateString() === today.toDateString();
  };

  if (followUps.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  // Different layouts for different variants
  if (variant === 'completed') {
    return (
      <div className="p-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-300 bg-gray-50">
              <th className="text-left py-3 px-2 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: '#243F7B' }}>
                Client
              </th>
              <th className="text-left py-3 px-2 text-sm font-semibold min-w-[250px]" style={{ fontFamily: 'Inter, sans-serif', color: '#243F7B' }}>
                Subject
              </th>
              <th className="text-left py-3 px-2 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: '#243F7B' }}>
                Completed Date
              </th>
              <th className="text-left py-3 px-2 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: '#243F7B' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {followUps.map((followUp, index) => (
              <motion.tr
                key={followUp.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-all duration-200 even:bg-gray-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: loading ? 0 : index * 0.03 }}
              >
                <td className="py-4 px-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <div className="font-semibold text-sm" style={{ color: '#243F7B' }}>
                    {followUp.client_name}
                  </div>
                </td>
                <td className="py-4 px-2 text-sm text-gray-700 min-w-[250px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <div 
                    className="cursor-pointer hover:text-gray-900 transition-colors flex items-start gap-1 group"
                    onClick={() => {
                      navigator.clipboard.writeText(followUp.email_subject);
                    }}
                    title="Click to copy subject"
                  >
                    <span className="break-all">{followUp.email_subject}</span>
                    <Copy className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                  </div>
                </td>
                <td className="py-4 px-2 text-sm text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {followUp.completed_date ? formatDate(followUp.completed_date) : '-'}
                </td>
                <td className="py-4 px-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                    <Check className="w-3 h-3" />
                    {followUp.completed_reason === 'client_responded' ? 'Client Responded' :
                     followUp.completed_reason === 'signed' ? 'Signed' :
                     followUp.completed_reason === 'paid' ? 'Paid' :
                     'Completed'}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (variant === 'no_response') {
    return (
      <div className="p-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-300 bg-gray-50">
              <th className="text-left py-3 px-2 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: '#243F7B' }}>
                Client
              </th>
              <th className="text-left py-3 px-2 text-sm font-semibold min-w-[250px]" style={{ fontFamily: 'Inter, sans-serif', color: '#243F7B' }}>
                Subject
              </th>
              <th className="text-left py-3 px-2 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: '#243F7B' }}>
                Last Attempt
              </th>
              <th className="text-left py-3 px-2 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: '#243F7B' }}>
                Total Attempts
              </th>
              <th className="text-center py-3 px-2 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: '#243F7B' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {followUps.map((followUp, index) => (
              <NoResponseRow
                key={followUp.id}
                followUp={followUp}
                index={index}
                loading={loading}
                onAction={onAction}
                formatDate={formatDate}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Pending follow-ups (main view)
  return (
    <div className="p-4 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-300 bg-gray-50">
            <th className="text-left py-3 px-2 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: '#243F7B' }}>
              Attempt
            </th>
            <th className="text-left py-3 px-2 text-sm font-semibold min-w-[300px]" style={{ fontFamily: 'Inter, sans-serif', color: '#243F7B' }}>
              Client & Subject
            </th>
            <th className="text-left py-3 px-2 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: '#243F7B' }}>
              Originally Sent
            </th>
            <th className="text-left py-3 px-2 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: '#243F7B' }}>
              Next Follow-up
            </th>
            <th className="text-center py-3 px-2 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: '#243F7B' }}>
              Complete
            </th>
          </tr>
        </thead>
        <tbody>
          {followUps.map((followUp, index) => (
            <FollowUpRow
              key={followUp.id}
              followUp={followUp}
              index={index}
              loading={loading}
              onAction={onAction}
              formatDate={formatDate}
              getFollowUpLabel={getFollowUpLabel}
              isOverdue={isOverdue}
              isDueToday={isDueToday}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper component for no-response row with modal
const NoResponseRow: React.FC<{
  followUp: EmailFollowUp;
  index: number;
  loading?: boolean;
  onAction: (followUpId: string, action: string, data?: any) => void;
  formatDate: (date: Date | string) => string;
}> = ({ followUp, index, loading, onAction, formatDate }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleCopySubject = () => {
    navigator.clipboard.writeText(followUp.email_subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };
  
  const handleConfirm = () => {
    onAction(followUp.id, 'complete', { reason: 'client_responded' });
    setShowConfirmModal(false);
  };
  
  const handleCancel = () => {
    setShowConfirmModal(false);
  };
  
  return (
    <>
      <motion.tr
        key={followUp.id}
        className="border-b border-gray-200 hover:bg-gray-50 transition-all duration-200 even:bg-gray-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: loading ? 0 : index * 0.03 }}
      >
        <td className="py-4 px-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="font-semibold text-sm" style={{ color: '#243F7B' }}>
            {followUp.client_name}
          </div>
        </td>
        <td className="py-4 px-2 text-sm text-gray-700 min-w-[250px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div 
            className="cursor-pointer hover:text-gray-900 transition-colors flex items-start gap-1 group"
            onClick={handleCopySubject}
            title="Click to copy subject"
          >
            <span className="break-all">{followUp.email_subject}</span>
            {copiedSubject ? (
              <Check className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Copy className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
            )}
          </div>
        </td>
        <td className="py-4 px-2 text-sm text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
          {formatDate(followUp.due_date)}
        </td>
        <td className="py-4 px-2 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
          <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700">
            {followUp.follow_up_number} Attempts
          </span>
        </td>
        <td className="py-4 px-2 text-center">
          <motion.button
            className="px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200"
            style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#D2BC99', color: '#243F7B' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowConfirmModal(true)}
          >
            Mark Complete
          </motion.button>
        </td>
      </motion.tr>
      
      {/* Render modal via portal to avoid hydration issues */}
      {mounted && showConfirmModal && createPortal(
        <ConfirmationModal
          isOpen={showConfirmModal}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          title="Mark as Complete"
          message={`Mark this follow-up for ${followUp.client_name} as complete? This indicates the client eventually responded after ${followUp.follow_up_number} attempts.`}
          confirmText="Mark Complete"
          cancelText="Cancel"
        />,
        document.body
      )}
    </>
  );
};

export default FollowUpTable;