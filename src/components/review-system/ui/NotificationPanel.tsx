// Notification Panel Component
// Dropdown panel showing notifications with TME design system

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText, 
  MoreHorizontal,
  Check,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Notification, NotificationType, Application } from '@/types/review-system';
import { useNotifications } from '@/hooks/useNotifications';
import { useReviewSystemConfig } from '@/lib/config/review-system';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick?: (notification: Notification) => void;
  maxHeight?: number;
}

// Notification type configurations
const NOTIFICATION_CONFIGS: Record<NotificationType, {
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}> = {
  review_requested: {
    icon: Eye,
    color: '#F59E0B', // amber-500
    bgColor: '#FEF3C7' // amber-100
  },
  review_completed: {
    icon: Clock,
    color: '#3B82F6', // blue-500
    bgColor: '#DBEAFE' // blue-100
  },
  application_approved: {
    icon: CheckCircle,
    color: '#10B981', // emerald-500
    bgColor: '#D1FAE5' // emerald-100
  },
  application_rejected: {
    icon: XCircle,
    color: '#EF4444', // red-500
    bgColor: '#FEE2E2' // red-100
  }
};

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClickNotification?: (notification: Notification) => void;
}> = ({ notification, onMarkAsRead, onClickNotification }) => {
  const config = NOTIFICATION_CONFIGS[notification.type];
  const IconComponent = config.icon;
  const isUnread = !notification.is_read;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`
        p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer
        ${isUnread ? 'bg-blue-50 border-l-4' : ''}
      `}
      style={{
        borderLeftColor: isUnread ? '#243F7B' : 'transparent'
      }}
      onClick={() => onClickNotification?.(notification)}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div
          className="flex-shrink-0 p-2 rounded-full"
          style={{ backgroundColor: config.bgColor }}
        >
          <IconComponent 
            className="w-4 h-4" 
            style={{ color: config.color }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p 
                className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                {notification.message}
              </p>
              
              {/* Timestamp */}
              <p className="text-xs text-gray-500 mt-2">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 ml-2">
              {isUnread && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
                  title="Mark as read"
                >
                  <Check 
                    className="w-3 h-3" 
                    style={{ color: '#243F7B' }}
                  />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  onNotificationClick,
  maxHeight = 400
}) => {
  const config = useReviewSystemConfig();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    error, 
    markAsRead, 
    markAllAsRead,
    refetch 
  } = useNotifications();
  
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  // Don't render if system is disabled
  if (!config.canShowNotifications) {
    return null;
  }

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAllRead) return;
    
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read immediately (optimistic update)
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Close panel first
    onClose();
    
    // Emit event to parent to handle modal opening
    onNotificationClick?.(notification);
  };


  const hasNotifications = notifications.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[998]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 right-4 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[999] overflow-hidden"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold" style={{ color: '#243F7B' }}>
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {/* Mark all as read */}
                  {unreadCount > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleMarkAllAsRead}
                      disabled={isMarkingAllRead}
                      className="px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200"
                      style={{ 
                        backgroundColor: '#D2BC99', 
                        color: '#243F7B' 
                      }}
                    >
                      {isMarkingAllRead ? 'Marking...' : 'Mark All Read'}
                    </motion.button>
                  )}

                  {/* Close button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ maxHeight }} className="overflow-y-auto">
              {/* Loading State */}
              {isLoading && notifications.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#243F7B' }}></div>
                  <span className="ml-2 text-sm text-gray-600">Loading notifications...</span>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="p-4 text-center">
                  <div className="text-sm text-red-600 mb-2">{error}</div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={refetch}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200"
                    style={{ backgroundColor: '#243F7B' }}
                  >
                    Try Again
                  </motion.button>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && !hasNotifications && (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    No notifications yet
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    You'll see updates about your applications here
                  </p>
                </div>
              )}

              {/* Notifications List */}
              {hasNotifications && (
                <div>
                  <AnimatePresence>
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onClickNotification={handleNotificationClick}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {hasNotifications && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                  Last updated: {notifications[0] ? formatDistanceToNow(new Date(), { addSuffix: true }) : 'Never'}
                </p>
              </div>
            )}
          </motion.div>

        </>
      )}
    </AnimatePresence>
  );
};