// Notifications Hook
// Thin wrapper around centralized notification context

'use client';

import { useNotificationContext } from '@/contexts/NotificationContext';

// Legacy hook that now uses centralized context
export function useNotifications() {
  return useNotificationContext();
}