'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { SharedClientInfo, SharedClientContextType } from '@/types/portal';

// Debug logging helper
const DEBUG = typeof window !== 'undefined' && localStorage.getItem('DEBUG_SHARED_CONTEXT') === 'true';
const log = (action: string, data?: any) => {
  if (DEBUG) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    console.log(`🔵 [SharedClient ${timestamp}] ${action}`, data || '');
  }
};

// Enable debug logging by default for testing
if (typeof window !== 'undefined' && !localStorage.getItem('DEBUG_SHARED_CONTEXT')) {
  localStorage.setItem('DEBUG_SHARED_CONTEXT', 'true');
  console.log('🔵 [SharedClient] Debug logging enabled');
}

// Initial state for client info
const initialClientInfo: SharedClientInfo = {
  firstName: '',
  lastName: '',
  companyName: '',
  shortCompanyName: '',
  date: new Date().toISOString().split('T')[0],
};

// Simplified state - no more preserved data in client storage
interface SharedClientState {
  clientInfo: SharedClientInfo;
  isLoadingFromReview: boolean; // Flag when loading from review/rejection
}

const initialState: SharedClientState = {
  clientInfo: initialClientInfo,
  isLoadingFromReview: false,
};

// Action types
type SharedClientAction =
  | { type: 'UPDATE_CLIENT_INFO'; payload: Partial<SharedClientInfo> }
  | { type: 'CLEAR_CLIENT_INFO' }
  | { type: 'LOAD_CLIENT_INFO'; payload: SharedClientInfo }
  | { type: 'SET_LOADING_FROM_REVIEW'; payload: boolean };

// Simplified reducer
const sharedClientReducer = (
  state: SharedClientState,
  action: SharedClientAction
): SharedClientState => {
  log(`Action: ${action.type}`, action);
  
  switch (action.type) {
    case 'UPDATE_CLIENT_INFO':
      const newState = { 
        ...state, 
        clientInfo: { ...state.clientInfo, ...action.payload } 
      };
      log('Updated client info', newState.clientInfo);
      return newState;
    
    case 'CLEAR_CLIENT_INFO':
      log('Clearing client info');
      return {
        ...state,
        clientInfo: initialClientInfo,
        isLoadingFromReview: false,
      };
    
    case 'LOAD_CLIENT_INFO':
      log('Loading client info from application', action.payload);
      return { 
        ...state, 
        clientInfo: action.payload,
        isLoadingFromReview: true,
      };
    
    case 'SET_LOADING_FROM_REVIEW':
      log('Setting loading from review flag', action.payload);
      return {
        ...state,
        isLoadingFromReview: action.payload,
      };
    
    default:
      return state;
  }
};

// Context
const SharedClientContext = createContext<SharedClientContextType | undefined>(undefined);

// Storage key for localStorage (only for basic client info)
const STORAGE_KEY = 'tme-portal-shared-client';

// Provider component
export const SharedClientProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(sharedClientReducer, initialState);

  // DISABLED: No localStorage persistence to prevent data leakage
  // Client info should NOT persist across sessions or page refreshes
  useEffect(() => {
    log('Component mounting - localStorage disabled for client info');
    // Clear any existing localStorage data on mount
    try {
      localStorage.removeItem(STORAGE_KEY);
      log('Cleared any existing client info from localStorage');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }, []);

  // DISABLED: No saving to localStorage to prevent firstName/lastName persistence
  useEffect(() => {
    log('localStorage saving DISABLED - client info will not persist');
    // Always clear localStorage to prevent any persistence
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Ignore errors
    }
  }, [state.clientInfo]);

  const updateClientInfo = (info: Partial<SharedClientInfo>) => {
    log('updateClientInfo called', info);
    dispatch({ type: 'UPDATE_CLIENT_INFO', payload: info });
  };

  const clearClientInfo = (options?: any) => {
    log('clearClientInfo called', options);
    
    // Always clear localStorage when explicitly clearing
    try {
      localStorage.removeItem(STORAGE_KEY);
      log('Removed client info from localStorage');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
    
    dispatch({ type: 'CLEAR_CLIENT_INFO' });
    
    // Log the clear reason
    if (options?.source) {
      log(`Clear source: ${options.source}`);
    }
  };

  const loadFromApplication = (applicationData: any) => {
    log('loadFromApplication called', { 
      hasData: !!applicationData,
      keys: applicationData ? Object.keys(applicationData).slice(0, 5) : [],
      type: applicationData?.type || 'unknown'
    });
    
    // Extract client info from the application data
    const clientInfo: SharedClientInfo = {
      firstName: applicationData.clientDetails?.firstName || applicationData.firstName || '',
      lastName: applicationData.clientDetails?.lastName || applicationData.lastName || '',
      companyName: applicationData.clientDetails?.companyName || applicationData.companyName || '',
      shortCompanyName: applicationData.clientDetails?.shortCompanyName || applicationData.shortCompanyName || '',
      date: applicationData.clientDetails?.date || applicationData.date || new Date().toISOString().split('T')[0],
    };
    
    log('Extracted client info from application', clientInfo);
    // This will set isLoadingFromReview to true, which prevents localStorage save
    dispatch({ type: 'LOAD_CLIENT_INFO', payload: clientInfo });
  };

  // New function to fetch rejected applications from DB
  const fetchRejectedApplications = async () => {
    log('fetchRejectedApplications called');
    try {
      const response = await fetch('/api/applications?status=rejected');
      const data = await response.json();
      
      log('Fetched rejected applications', { 
        count: data.applications?.length || 0,
        applications: data.applications?.map((app: any) => ({
          id: app.id,
          type: app.type,
          status: app.status,
          title: app.title
        }))
      });
      
      return data.applications || [];
    } catch (error) {
      console.error('Failed to fetch rejected applications:', error);
      return [];
    }
  };

  // Load a specific rejected application
  const loadRejectedApplication = async (applicationId: string) => {
    log('loadRejectedApplication called', { applicationId });
    try {
      const response = await fetch(`/api/applications/${applicationId}`);
      const data = await response.json();
      
      if (data.application) {
        log('Loaded rejected application', {
          id: data.application.id,
          type: data.application.type,
          hasFormData: !!data.application.form_data
        });
        
        // Load the form data
        loadFromApplication(data.application.form_data);
        return data.application.form_data;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load rejected application:', error);
      return null;
    }
  };

  const getPreservedFormData = () => {
    log('getPreservedFormData called (deprecated - use DB instead)');
    return null; // No longer using client-side preservation
  };

  const setWorkflowState = (newState: string) => {
    log('setWorkflowState called (compatibility mode)', newState);
    // Track if we're loading from review
    const isReview = newState.includes('review') || newState.includes('rejected');
    dispatch({ type: 'SET_LOADING_FROM_REVIEW', payload: isReview });
  };

  const value: SharedClientContextType = {
    clientInfo: state.clientInfo,
    updateClientInfo,
    clearClientInfo,
    loadFromApplication,
    getPreservedFormData,
    setWorkflowState,
    workflowState: state.isLoadingFromReview ? 'review-pending' : 'fresh', // Compatibility
    fetchRejectedApplications,
    loadRejectedApplication,
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