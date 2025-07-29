// Review System Components Export
// Centralized exports for all review system components

// UI Components
export { NotificationBadge, CompactNotificationBadge, LargeNotificationBadge } from './ui/NotificationBadge';
export { NotificationPanel } from './ui/NotificationPanel';

// Services (for internal use)
export { ApplicationsService, NotificationsService } from '@/lib/services/review-system';

// Configuration
export { getReviewSystemConfig, useReviewSystemConfig, isFeatureEnabled } from '@/lib/config/review-system';

// Hooks
export { useNotifications } from '@/hooks/useNotifications';

// Types
export * from '@/types/review-system';