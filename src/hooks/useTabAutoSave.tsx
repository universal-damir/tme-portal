'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AutoSaveConfig, AutoSaveState } from '@/types/portal';

const DEFAULT_DEBOUNCE_MS = 1000;

export const useTabAutoSave = <T extends Record<string, any>>(
  config: AutoSaveConfig,
  data: T | null
): AutoSaveState<T> & {
  save: () => void;
  load: () => T | null;
  clear: () => void;
} => {
  const [state, setState] = useState<AutoSaveState<T>>({
    data: null,
    lastSaved: null,
    isDirty: false,
    isLoading: false,
  });

  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const dataRef = useRef<T | null>(data);
  const { key, debounceMs = DEFAULT_DEBOUNCE_MS, enabled = true } = config;

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Load data from localStorage on mount
  const load = useCallback((): T | null => {
    if (!enabled) return null;
    
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsedData = JSON.parse(stored);
        return parsedData.data || null;
      }
    } catch (error) {
      console.error(`Failed to load auto-save data for key "${key}":`, error);
    }
    return null;
  }, [key, enabled]);

  // Save data to localStorage (manual save)
  const save = useCallback(() => {
    const currentData = dataRef.current;
    if (!enabled || !currentData) return;

    try {
      const saveData = {
        data: currentData,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(saveData));
      
      setState(prev => ({
        ...prev,
        lastSaved: new Date(),
        isDirty: false,
      }));
    } catch (error) {
      console.error(`Failed to manually save data for key "${key}":`, error);
    }
  }, [key, enabled]); // No circular dependency!

  // Clear saved data
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setState(prev => ({
        ...prev,
        data: null,
        lastSaved: null,
        isDirty: false,
      }));
    } catch (error) {
      console.error(`Failed to clear auto-save data for key "${key}":`, error);
    }
  }, [key]);

  // Load initial data on mount
  useEffect(() => {
    if (!enabled) return;

    setState(prev => ({ ...prev, isLoading: true }));
    
    const loadedData = load();
    setState(prev => ({
      ...prev,
      data: loadedData,
      isLoading: false,
    }));
  }, [load, enabled]);

  // Auto-save with debouncing when data changes
  useEffect(() => {
    if (!enabled || !data) return;

    // Mark as dirty
    setState(prev => ({ ...prev, isDirty: true }));

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounced save - inline save logic to avoid circular deps
    debounceRef.current = setTimeout(() => {
      try {
        const saveData = {
          data,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(saveData));
        
        setState(prev => ({
          ...prev,
          lastSaved: new Date(),
          isDirty: false,
        }));
      } catch (error) {
        console.error(`Failed to auto-save data for key "${key}":`, error);
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [data, debounceMs, enabled, key]); // Remove save from dependencies

  // Save on page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      const currentData = dataRef.current;
      if (currentData && state.isDirty) {
        // Synchronous save for page unload
        try {
          const saveData = {
            data: currentData,
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem(key, JSON.stringify(saveData));
        } catch (error) {
          console.error(`Failed to save on unload for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [key, state.isDirty, enabled]); // Remove data dependency

  return {
    ...state,
    save,
    load,
    clear,
  };
}; 