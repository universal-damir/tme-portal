/**
 * ActionDropdown Component
 * Dropdown menu for follow-up actions with text-based options
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Clock, UserPlus, MoreVertical } from 'lucide-react';

interface ActionDropdownProps {
  followUpId: string;
  followUpNumber: number;
  clientName: string;
  onAction: (followUpId: string, action: string, data?: any) => void;
  onSelectManager?: (followUpId: string) => void;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({
  followUpId,
  followUpNumber,
  clientName,
  onAction,
  onSelectManager
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action: string) => {
    setSelectedAction(action);
    
    switch (action) {
      case 'complete':
        onAction(followUpId, 'complete', { reason: 'client_responded' });
        break;
      
      case 'snooze':
        // Snooze upgrades to next level and sends reminder
        onAction(followUpId, 'snooze');
        break;
      
      case 'no_response':
        // Open manager selection modal
        if (onSelectManager) {
          onSelectManager(followUpId);
        }
        break;
      
      default:
        break;
    }
    
    setIsOpen(false);
  };

  const getActionLabel = () => {
    if (selectedAction === 'complete') return 'Completed';
    if (selectedAction === 'snooze') return 'Reminder Sent';
    if (selectedAction === 'no_response') return 'Escalated';
    return 'Select Action';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 
          transition-all duration-200 min-w-[140px]
          ${selectedAction 
            ? 'bg-green-50 border-green-300 text-green-700' 
            : 'bg-white border-gray-300 hover:border-blue-400 text-gray-700'
          }
        `}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <span className="text-sm font-medium flex-1 text-left">
          {getActionLabel()}
        </span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className="py-1">
              {/* Completed Option */}
              <button
                onClick={() => handleAction('complete')}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <Check className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Completed</div>
                  <div className="text-xs text-gray-500">Client has responded</div>
                </div>
              </button>

              {/* Follow-up Reminder Sent (Snooze) - Only show if not 3rd attempt */}
              {followUpNumber < 3 && (
                <button
                  onClick={() => handleAction('snooze')}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <Clock className="w-4 h-4 text-orange-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Follow-up Reminder Sent</div>
                    <div className="text-xs text-gray-500">
                      Upgrade to {followUpNumber + 1}{followUpNumber === 1 ? 'nd' : 'rd'} attempt
                    </div>
                  </div>
                </button>
              )}

              {/* Client Did Not Respond (Escalate) */}
              <button
                onClick={() => handleAction('no_response')}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-t border-gray-100"
              >
                <UserPlus className="w-4 h-4 text-red-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Client Did Not Respond</div>
                  <div className="text-xs text-gray-500">Escalate to manager</div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActionDropdown;