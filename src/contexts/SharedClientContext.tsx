'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { SharedClientInfo, SharedClientContextType } from '@/types/portal';

// Action types for reducer
type SharedClientAction =
  | { type: 'UPDATE_CLIENT_INFO'; payload: Partial<SharedClientInfo> }
  | { type: 'CLEAR_CLIENT_INFO' }
  | { type: 'LOAD_CLIENT_INFO'; payload: SharedClientInfo };

// Initial state
const initialClientInfo: SharedClientInfo = {
  firstName: '',
  lastName: '',
  companyName: '',
  shortCompanyName: '',
  date: new Date().toISOString().split('T')[0],
};

// Reducer
const sharedClientReducer = (
  state: SharedClientInfo,
  action: SharedClientAction
): SharedClientInfo => {
  switch (action.type) {
    case 'UPDATE_CLIENT_INFO':
      return { ...state, ...action.payload };
    case 'CLEAR_CLIENT_INFO':
      return initialClientInfo;
    case 'LOAD_CLIENT_INFO':
      return action.payload;
    default:
      return state;
  }
};

// Context
const SharedClientContext = createContext<SharedClientContextType | undefined>(undefined);

// Storage key
const STORAGE_KEY = 'tme-portal-shared-client';

// Provider component
export const SharedClientProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [clientInfo, dispatch] = useReducer(sharedClientReducer, initialClientInfo);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored);
        dispatch({ type: 'LOAD_CLIENT_INFO', payload: parsedData });
      }
    } catch (error) {
      console.error('Failed to load shared client info from localStorage:', error);
    }
  }, []);

  // Save to localStorage when clientInfo changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clientInfo));
    } catch (error) {
      console.error('Failed to save shared client info to localStorage:', error);
    }
  }, [clientInfo]);

  const updateClientInfo = (info: Partial<SharedClientInfo>) => {
    dispatch({ type: 'UPDATE_CLIENT_INFO', payload: info });
  };

  const clearClientInfo = () => {
    dispatch({ type: 'CLEAR_CLIENT_INFO' });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear shared client info from localStorage:', error);
    }
  };

  const value: SharedClientContextType = {
    clientInfo,
    updateClientInfo,
    clearClientInfo,
  };

  return (
    <SharedClientContext.Provider value={value}>
      {children}
    </SharedClientContext.Provider>
  );
};

// Custom hook to use the context
export const useSharedClient = (): SharedClientContextType => {
  const context = useContext(SharedClientContext);
  if (context === undefined) {
    throw new Error('useSharedClient must be used within a SharedClientProvider');
  }
  return context;
}; 