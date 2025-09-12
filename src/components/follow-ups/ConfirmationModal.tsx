/**
 * ConfirmationModal Component
 * Modal dialog following TME UI design principles
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onCancel}
          />
          
          {/* Modal */}
          <motion.div
            key="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl z-50"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: variant === 'danger' ? '#FEE2E2' : '#EBF5FF' }}
                  >
                    <AlertCircle 
                      className="w-5 h-5" 
                      style={{ color: variant === 'danger' ? '#DC2626' : '#243F7B' }}
                    />
                  </div>
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: '#243F7B' }}
                  >
                    {title}
                  </h3>
                </div>
                <motion.button
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCancel}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>
              
              {/* Message */}
              <p className="text-sm text-gray-700 mb-6 pl-11">
                {message}
              </p>
              
              {/* Actions */}
              <div className="flex justify-end gap-3">
                <motion.button
                  className="px-6 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancel}
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg"
                  style={{ 
                    backgroundColor: variant === 'danger' ? '#DC2626' : '#243F7B'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                >
                  {confirmText}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;