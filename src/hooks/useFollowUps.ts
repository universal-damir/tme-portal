/**
 * useFollowUps Hook
 * React hook for email follow-up management with API integration
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { EmailFollowUp, FollowUpStats, CreateFollowUpInput, UseFollowUpsReturn } from '@/types/follow-up';

export interface UseFollowUpsOptions {
  status?: 'pending' | 'completed' | 'no_response';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useFollowUps(options: UseFollowUpsOptions = {}): UseFollowUpsReturn {
  const {
    status,
    autoRefresh = false,
    refreshInterval = 60000 // 1 minute
  } = options;

  // State
  const [followUps, setFollowUps] = useState<{
    pending: EmailFollowUp[];
    completed: EmailFollowUp[];
    noResponse: EmailFollowUp[];
  }>({
    pending: [],
    completed: [],
    noResponse: []
  });
  const [stats, setStats] = useState<FollowUpStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController>();
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Track if it's the first load
  const isFirstLoadRef = useRef(true);

  // Fetch follow-ups from API
  const fetchFollowUps = useCallback(async (skipLoading = false): Promise<void> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Only show loading on initial load or manual refresh, not auto-refresh
      if (!skipLoading) {
        setLoading(true);
      }
      setError(null);

      // Fetch all statuses in parallel with better error handling
      const fetchOptions = {
        signal: abortControllerRef.current.signal,
        credentials: 'include' as RequestCredentials,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const [pendingRes, completedRes, noResponseRes] = await Promise.all([
        fetch('/api/user/follow-ups?status=pending', fetchOptions).catch(err => {
          // Silently handle in development - tables might not exist yet
          return { ok: false, json: async () => ({ follow_ups: [], stats: null }) };
        }),
        fetch('/api/user/follow-ups?status=completed&limit=20', fetchOptions).catch(err => {
          return { ok: false, json: async () => ({ follow_ups: [], stats: null }) };
        }),
        fetch('/api/user/follow-ups?status=no_response', fetchOptions).catch(err => {
          return { ok: false, json: async () => ({ follow_ups: [], stats: null }) };
        })
      ]);

      // Handle responses gracefully even if some fail
      if (!pendingRes.ok && !completedRes.ok && !noResponseRes.ok) {
        // Tables probably don't exist yet - this is normal in development before migration
        if (process.env.NODE_ENV === 'development') {
          console.log('📋 Follow-ups system not initialized. Run: npm run migrate:follow-ups');
        }
        // Don't throw - just set empty data
        setFollowUps({
          pending: [],
          completed: [],
          noResponse: []
        });
        setStats(null);
        return;
      }

      const [pendingData, completedData, noResponseData] = await Promise.all([
        pendingRes.json(),
        completedRes.json(),
        noResponseRes.json()
      ]);

      // Update data with smooth transition
      requestAnimationFrame(() => {
        setFollowUps({
          pending: pendingData.follow_ups || [],
          completed: completedData.follow_ups || [],
          noResponse: noResponseData.follow_ups || []
        });

        // Use stats from pending response (most relevant)
        setStats(pendingData.stats || null);
      });

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch follow-ups:', err);
        setError(err.message || 'Failed to fetch follow-ups');
      }
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Update follow-up status
  const updateFollowUp = useCallback(async (
    followUpId: string,
    action: string,
    data?: any
  ): Promise<void> => {
    try {
      const response = await fetch('/api/user/follow-ups', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          follow_up_id: followUpId,
          action,
          ...data
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update follow-up');
      }

      // Refresh the list (show loading for user-triggered actions)
      await fetchFollowUps(false);

    } catch (err: any) {
      console.error('Failed to update follow-up:', err);
      setError(err.message || 'Failed to update follow-up');
      throw err;
    }
  }, [fetchFollowUps]);

  // Create new follow-up
  const createFollowUp = useCallback(async (input: CreateFollowUpInput): Promise<EmailFollowUp> => {
    try {
      const response = await fetch('/api/user/follow-ups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create follow-up');
      }

      const data = await response.json();
      
      // Refresh the list (show loading for user-triggered actions)
      await fetchFollowUps(false);
      
      return data.follow_up;

    } catch (err: any) {
      console.error('Failed to create follow-up:', err);
      setError(err.message || 'Failed to create follow-up');
      throw err;
    }
  }, [fetchFollowUps]);

  // Initial fetch
  useEffect(() => {
    const initialFetch = async () => {
      await fetchFollowUps(false);
      isFirstLoadRef.current = false;
    };
    initialFetch();
  }, []);

  // Auto-refresh with graceful updates
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && !isFirstLoadRef.current) {
      refreshTimeoutRef.current = setInterval(() => {
        // Skip loading state for auto-refresh to prevent flickering
        fetchFollowUps(true);
      }, refreshInterval);

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    followUps,
    stats,
    loading,
    error,
    refetch: () => fetchFollowUps(false),
    updateFollowUp,
    createFollowUp
  };
}