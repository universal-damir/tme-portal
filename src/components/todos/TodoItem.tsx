/**
 * TodoItem Component  
 * Individual todo item with actions, animations, and TME design system
 * Phase 3: Frontend Components Implementation
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Eye, 
  Phone, 
  Calendar,
  MoreHorizontal,
  Play,
  X,
  Archive,
  ExternalLink,
  Check
} from 'lucide-react';
import { Todo, TodoStatus } from '@/types/todo';

export interface TodoItemProps {
  todo: Todo;
  onStatusUpdate: (status: TodoStatus) => void;
  onSelect?: () => void;
  className?: string;
  showActions?: boolean;
  compact?: boolean;
  selected?: boolean;
  variant?: 'default' | 'minimal';
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onStatusUpdate,
  onSelect,
  className = '',
  showActions = true,
  compact = false,
  selected = false,
  variant = 'default'
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  // Helper functions
  const isOverdue = () => {
    if (!todo.due_date || todo.status === 'completed' || todo.status === 'dismissed') {
      return false;
    }
    return new Date(todo.due_date) < new Date();
  };

  const isDueSoon = () => {
    if (!todo.due_date || todo.status === 'completed' || todo.status === 'dismissed') {
      return false;
    }
    const dueDate = new Date(todo.due_date);
    const now = new Date();
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDue > 0 && hoursUntilDue <= 24;
  };

  const getTimeUntilDue = () => {
    if (!todo.due_date) return null;
    
    const dueDate = new Date(todo.due_date);
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    
    if (diffMs < 0) {
      const hoursOverdue = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60));
      return `${hoursOverdue}h overdue`;
    }
    
    const hoursUntil = Math.ceil(diffMs / (1000 * 60 * 60));
    if (hoursUntil < 24) {
      return `${hoursUntil}h remaining`;
    }
    
    const daysUntil = Math.ceil(hoursUntil / 24);
    return `${daysUntil}d remaining`;
  };

  const formatDueDate = () => {
    if (!todo.due_date) return null;
    
    const dueDate = new Date(todo.due_date);
    const now = new Date();
    const isToday = dueDate.toDateString() === now.toDateString();
    const isTomorrow = dueDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    
    // Format as DD.MM
    const day = dueDate.getDate().toString().padStart(2, '0');
    const month = (dueDate.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  };

  // Status and priority styling
  const getPriorityConfig = () => {
    switch (todo.priority) {
      case 'urgent':
        return { color: '#374151', bg: '#F3F4F6', label: 'URGENT' };
      case 'standard':
        return { color: '#6B7280', bg: '#F9FAFB', label: '' };
      default:
        return { color: '#6B7280', bg: '#F9FAFB', label: '' };
    }
  };

  const getCategoryConfig = () => {
    switch (todo.category) {
      case 'to_send':
        return { icon: Send, color: '#374151', bg: '#F3F4F6', actionLabel: 'Send' };
      case 'to_check':
        return { icon: Eye, color: '#374151', bg: '#F3F4F6', actionLabel: 'Check' };
      case 'to_follow_up':
        return { icon: Phone, color: '#374151', bg: '#F3F4F6', actionLabel: 'Follow Up' };
      default:
        return { icon: Eye, color: '#374151', bg: '#F3F4F6', actionLabel: 'Check' };
    }
  };

  const handleStatusUpdate = async (status: TodoStatus) => {
    setIsUpdating(true);
    try {
      await onStatusUpdate(status);
    } catch (error) {
      console.error('Failed to update todo status:', error);
    } finally {
      setIsUpdating(false);
      setShowMoreActions(false);
    }
  };

  const priorityConfig = getPriorityConfig();
  const categoryConfig = getCategoryConfig();
  const CategoryIcon = categoryConfig.icon;
  const overdue = isOverdue();
  const dueSoon = isDueSoon();

  // Render minimal variant
  if (variant === 'minimal') {
    return (
      <motion.div
        className={`relative flex items-center gap-2 p-2 transition-all duration-200 hover:bg-gray-50 cursor-pointer w-full max-w-full overflow-hidden ${
          selected ? 'bg-blue-50' : ''
        } ${className}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -50 }}
        whileHover={{ scale: 1.005 }}
        onClick={onSelect}
        layout
      >
        {/* Content - takes up available space minus checkbox */}
        <div className="flex-1 min-w-0 overflow-hidden pr-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0 overflow-hidden">
              <h4 
                className={`font-normal text-xs truncate block w-full ${
                  todo.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                }`}
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  maxWidth: '100%'
                }}
                title={todo.title}
              >
                {todo.title}
              </h4>
            </div>
            
            {/* Context line - compact */}
            {todo.status !== 'completed' && todo.status !== 'dismissed' && todo.due_date && (
              <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                <span className={`${overdue ? 'text-red-600 font-medium' : dueSoon ? 'text-orange-600' : ''}`} style={{ fontSize: '9px' }}>
                  {formatDueDate()}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Button - minimal variant */}
        {showActions && todo.status !== 'completed' && todo.status !== 'dismissed' && (
          <motion.button
            className="px-3 py-1 text-xs font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
            style={{ fontFamily: 'Inter, sans-serif' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              handleStatusUpdate('completed');
            }}
            disabled={isUpdating}
            title={`Click to ${categoryConfig.actionLabel.toLowerCase()}`}
          >
            <categoryConfig.icon className="w-3 h-3 inline mr-1" />
            {categoryConfig.actionLabel}
          </motion.button>
        )}
        
        {/* No checkmark for completed tasks - removed */}
        
        {/* Loading overlay */}
        {isUpdating && (
          <motion.div
            className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Default variant (existing design)
  return (
    <motion.div
      className={`relative p-4 border-b border-gray-200 transition-all duration-200 hover:bg-gray-50 cursor-pointer ${
        selected ? 'bg-blue-50' : ''
      } ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      whileHover={{ scale: 1.01 }}
      onClick={onSelect}
      layout
    >
      {/* Priority indicator */}
      {todo.priority === 'urgent' && (
        <motion.div 
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}

      {/* Main content */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Category icon */}
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: categoryConfig.bg }}
          >
            <CategoryIcon className="w-4 h-4" style={{ color: categoryConfig.color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title and priority */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 
                className={`font-medium text-sm leading-tight ${
                  todo.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {todo.title}
              </h4>
              
              {todo.priority === 'urgent' && (
                <span 
                  className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700 whitespace-nowrap"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  URGENT
                </span>
              )}
            </div>

            {/* Description */}
            {!compact && todo.description && (
              <p 
                className="text-sm text-gray-600 mb-2 line-clamp-2"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {todo.description}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {/* Client info */}
              {todo.client_name && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>{todo.client_name}</span>
                </div>
              )}

              {/* Document type */}
              {todo.document_type && (
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>{todo.document_type}</span>
                </div>
              )}

              {/* Due date */}
              {todo.due_date && (
                <div className={`flex items-center gap-1 ${
                  overdue ? 'text-red-600' : dueSoon ? 'text-orange-600' : ''
                }`}>
                  <Calendar className="w-3 h-3" />
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>
                    {formatDueDate()}
                    {(overdue || dueSoon) && (
                      <span className="ml-1 font-medium">({getTimeUntilDue()})</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {showActions && todo.status !== 'completed' && todo.status !== 'dismissed' && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Primary Action Button */}
            <motion.button
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                // This will be the action to open document/form/contact client
                handleStatusUpdate('completed');
              }}
              disabled={isUpdating}
              title={`Click to ${categoryConfig.actionLabel.toLowerCase()}`}
            >
              <categoryConfig.icon className="w-4 h-4 inline mr-2" />
              {categoryConfig.actionLabel}
            </motion.button>

            {/* More actions dropdown */}
            <div className="relative">
              <motion.button
                className="w-8 h-8 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreActions(!showMoreActions);
                }}
                title="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </motion.button>

              {showMoreActions && (
                <motion.div
                  className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[120px]"
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                >
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate('dismissed');
                    }}
                    disabled={isUpdating}
                  >
                    <Archive className="w-4 h-4 text-gray-500" />
                    Dismiss
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Checked checkbox for completed/dismissed tasks */}
        {(todo.status === 'completed' || todo.status === 'dismissed') && (
          <div 
            className="w-5 h-5 rounded border-2 flex items-center justify-center"
            style={{ 
              borderColor: todo.status === 'completed' ? '#10b981' : '#6b7280',
              backgroundColor: todo.status === 'completed' ? '#10b981' : '#6b7280'
            }}
          >
            {todo.status === 'completed' && (
              <Check className="w-3 h-3 text-white" />
            )}
            {todo.status === 'dismissed' && (
              <X className="w-3 h-3 text-white" />
            )}
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {isUpdating && (
        <motion.div
          className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default TodoItem;