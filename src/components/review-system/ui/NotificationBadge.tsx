// Notification Badge Component
// Safe UI component with TME design system integration

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useReviewSystemConfig } from '@/lib/config/review-system';

interface NotificationBadgeProps {
  onClick?: () => void;
  className?: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  onClick,
  className = '',
  showCount = true,
  size = 'md'
}) => {
  const config = useReviewSystemConfig();
  const { unreadCount, isLoading, error } = useNotifications();

  // Don't render if system is disabled
  if (!config.canShowNotifications || !config.showNotificationBadge) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const badgeClasses = {
    sm: 'w-3 h-3 text-xs',
    md: 'w-4 h-4 text-xs',
    lg: 'w-5 h-5 text-sm'
  };

  const hasNotifications = unreadCount > 0;
  const showBadge = showCount && hasNotifications;

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative inline-flex items-center justify-center
        ${sizeClasses[size]}
        rounded-full transition-all duration-200
        hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2
        ${hasNotifications ? 'text-blue-600' : 'text-gray-400'}
        ${className}
      `}
      style={{
        focusRingColor: '#243F7B'
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={isLoading}
      aria-label={`Notifications${hasNotifications ? ` (${unreadCount} unread)` : ''}`}
    >
      {/* Bell Icon - Static, no animation */}
      {hasNotifications ? (
        <Bell className={sizeClasses[size]} />
      ) : (
        <Bell className={sizeClasses[size]} />
      )}

      {/* Notification Count Badge */}
      <AnimatePresence>
        {showBadge && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`
              absolute -top-1 -right-1
              ${badgeClasses[size]}
              bg-red-500 text-white font-bold
              rounded-full flex items-center justify-center
              min-w-max px-1
            `}
            style={{
              fontSize: size === 'sm' ? '10px' : size === 'md' ? '11px' : '12px'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Loading Indicator */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-gray-300 border-t-yellow-600"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Error Indicator */}
      {error && !isLoading && (
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </motion.button>
  );
};

// Compact version for smaller spaces
export const CompactNotificationBadge: React.FC<Omit<NotificationBadgeProps, 'size'>> = (props) => {
  return <NotificationBadge {...props} size="sm" showCount={false} />;
};

// Large version for main navigation
export const LargeNotificationBadge: React.FC<Omit<NotificationBadgeProps, 'size'>> = (props) => {
  return <NotificationBadge {...props} size="lg" />;
};