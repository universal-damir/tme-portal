// Centralized Notification Context
// Single source of truth for all notification data and polling

'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Notification } from '@/types/review-system';
import { useReviewSystemConfig } from '@/lib/config/review-system';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  connectionStatus: 'connected' | 'rate_limited' | 'auth_error' | 'disconnected';
  currentInterval: number;
  refetch: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isPolling: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

// Global polling instance check to prevent multiple pollers
let globalPollingInstance: string | null = null;

export function NotificationProvider({ children }: NotificationProviderProps) {
  const config = useReviewSystemConfig();
  const instanceId = React.useRef(Math.random().toString(36).substring(7));
  
  const [state, setState] = useState({
    notifications: [] as Notification[],
    unreadCount: 0,
    isLoading: false,
    error: null as string | null,
    lastUpdated: null as Date | null,
    connectionStatus: 'connected' as 'connected' | 'rate_limited' | 'auth_error' | 'disconnected'
  });
  
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();
  
  // Smart polling state
  const currentIntervalRef = useRef(30000); // Start with 30 seconds
  const rateLimitBackoffRef = useRef(1);
  const isTabVisibleRef = useRef(true);
  const consecutiveErrorsRef = useRef(0);
  
  // Constants
  const BASE_INTERVAL = 60000; // 60 seconds 
  const MAX_INTERVAL = 600000; // 10 minutes
  const MAX_CONSECUTIVE_ERRORS = 3;

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
      
      if (document.hidden) {
        if (config.debugMode) {
          console.log('🔧 Tab hidden - pausing notification polling');
        }
      } else {
        if (config.debugMode) {
          console.log('🔧 Tab visible - resuming notification polling');
        }
        if (isPolling) {
          // Fetch immediately when tab becomes visible
          const currentFetch = fetchNotifications;
          setTimeout(() => currentFetch(), 0);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPolling, config.debugMode]);

  // Smart fetch function with rate limiting protection
  const fetchNotifications = useCallback(async (): Promise<void> => {
    if (!config.canShowNotifications) {
      setState(prev => ({
        ...prev,
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        error: null,
        connectionStatus: 'disconnected'
      }));
      return;
    }

    // Don't fetch if tab is hidden
    if (!isTabVisibleRef.current) {
      if (config.debugMode) {
        console.log('🔧 Skipping notification fetch - tab is hidden');
      }
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/notifications', {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      // Handle different response statuses
      if (response.status === 429) {
        // Rate limited - aggressive backoff
        rateLimitBackoffRef.current = Math.min(rateLimitBackoffRef.current * 3, 20);
        currentIntervalRef.current = Math.min(BASE_INTERVAL * rateLimitBackoffRef.current, MAX_INTERVAL);
        consecutiveErrorsRef.current++;
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          connectionStatus: 'rate_limited',
          error: 'Rate limited - reducing polling frequency'
        }));
        
        if (config.debugMode) {
          console.log(`🔧 Rate limited (429) - aggressive backoff to ${(currentIntervalRef.current / 1000 / 60).toFixed(1)} minutes`);
        }
        
        // Stop polling temporarily for rate limited cases
        if (rateLimitBackoffRef.current > 5) {
          setTimeout(() => {
            if (isPolling) scheduleNextPoll();
          }, currentIntervalRef.current);
          stopPolling();
        }
        
        return;
      }

      if (response.status === 401 || response.status === 403) {
        // Auth error - stop polling completely
        consecutiveErrorsRef.current++;
        setState(prev => ({
          ...prev,
          isLoading: false,
          connectionStatus: 'auth_error',
          error: null
        }));
        
        if (config.debugMode) {
          console.log(`🔧 Auth error (${response.status}) - stopping polling`);
        }
        
        // Stop polling on auth errors
        stopPolling();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Success - reset all error counters
      consecutiveErrorsRef.current = 0;
      rateLimitBackoffRef.current = 1;
      currentIntervalRef.current = BASE_INTERVAL;

      setState(prev => ({
        ...prev,
        notifications: data.notifications || [],
        unreadCount: data.unread_count || 0,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
        connectionStatus: 'connected'
      }));

      if (config.debugMode) {
        console.log(`🔧 Notifications fetched successfully - ${data.notifications?.length || 0} notifications`);
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      consecutiveErrorsRef.current++;
      
      if (config.debugMode) {
        console.log('🔧 Failed to fetch notifications:', error);
      }
      
      const shouldShowError = consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: shouldShowError ? 'Connection issues - notifications may be outdated' : null,
        connectionStatus: shouldShowError ? 'disconnected' : prev.connectionStatus,
        notifications: shouldShowError ? [] : prev.notifications,
        unreadCount: shouldShowError ? 0 : prev.unreadCount
      }));

      if (consecutiveErrorsRef.current > 2) {
        currentIntervalRef.current = Math.min(currentIntervalRef.current * 1.5, MAX_INTERVAL);
      }
    }
  }, [config.canShowNotifications, config.debugMode]);

  // Smart polling with dynamic intervals
  const scheduleNextPoll = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(() => {
      fetchNotifications();
    }, currentIntervalRef.current);

    if (config.debugMode) {
      console.log(`🔧 Scheduled next poll in ${currentIntervalRef.current}ms`);
    }
  }, [config.debugMode]); // Removed fetchNotifications dependency to prevent infinite loop

  // Start/stop polling functions
  const startPolling = useCallback(() => {
    if (!config.canShowNotifications || isPolling) return;

    // Check if another instance is already polling
    if (globalPollingInstance && globalPollingInstance !== instanceId.current) {
      if (config.debugMode) {
        console.log(`🔧 Another notification polling instance is active (${globalPollingInstance}), skipping`);
      }
      return;
    }

    globalPollingInstance = instanceId.current;
    setIsPolling(true);
    
    // Reset intervals on start
    currentIntervalRef.current = BASE_INTERVAL;
    rateLimitBackoffRef.current = 1;
    consecutiveErrorsRef.current = 0;
    
    // Initial fetch
    fetchNotifications();
    
    // Set up smart polling
    scheduleNextPoll();

    if (config.debugMode) {
      console.log(`🔧 Started centralized notification polling every ${currentIntervalRef.current}ms (instance: ${instanceId.current})`);
    }
  }, [config.canShowNotifications, config.debugMode, isPolling, scheduleNextPoll]); // Removed fetchNotifications

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = undefined;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear global instance if this instance was polling
    if (globalPollingInstance === instanceId.current) {
      globalPollingInstance = null;
    }
    
    setIsPolling(false);

    if (config.debugMode) {
      console.log(`🔧 Stopped centralized notification polling (instance: ${instanceId.current})`);
    }
  }, [config.debugMode]);

  // Auto-start polling (only once)
  useEffect(() => {
    if (config.canShowNotifications) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [config.canShowNotifications]); // Removed startPolling, stopPolling to prevent infinite loop

  // Manual refetch
  const refetch = useCallback(async (): Promise<void> => {
    consecutiveErrorsRef.current = 0;
    rateLimitBackoffRef.current = 1;
    currentIntervalRef.current = BASE_INTERVAL;
    await fetchNotifications();
  }, [fetchNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string): Promise<void> => {
    if (!config.canShowNotifications) return;

    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST'
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n =>
            n.id === id ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1)
        }));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [config.canShowNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!config.canShowNotifications) return;

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
          unreadCount: 0
        }));
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [config.canShowNotifications]);

  const value: NotificationContextType = {
    ...state,
    currentInterval: currentIntervalRef.current,
    refetch,
    markAsRead,
    markAllAsRead,
    isPolling
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}