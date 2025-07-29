// Golden Visa Application State Management Hook
// Ultra-safe hook that handles application persistence and review system integration

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { GoldenVisaData } from '@/types/golden-visa';
import { Application, ApplicationStatus } from '@/types/review-system';
import { useReviewSystemConfig } from '@/lib/config/review-system';

interface UseGoldenVisaApplicationProps {
  formData: GoldenVisaData;
  clientName: string;
}

interface UseGoldenVisaApplicationReturn {
  // Application state
  application: Application | null;
  applicationStatus: ApplicationStatus;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  saveApplication: () => Promise<boolean>;
  submitForReview: (submission: {
    reviewer_id: number;
    urgency: 'low' | 'medium' | 'high';
    comments?: string;
  }) => Promise<boolean>;
  
  // Status helpers
  canDownloadPDF: boolean;
  needsApproval: boolean;
  statusMessage: string;
}

export const useGoldenVisaApplication = ({
  formData,
  clientName
}: UseGoldenVisaApplicationProps): UseGoldenVisaApplicationReturn => {
  const config = useReviewSystemConfig();
  
  // State management
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-save management
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  
  // Generate application title from form data
  const generateApplicationTitle = useCallback((data: GoldenVisaData): string => {
    const clientPart = clientName || `${data.firstName} ${data.lastName}`.trim() || 'Unnamed Client';
    const visaType = data.visaType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `${clientPart} - ${visaType} Golden Visa`;
  }, [clientName]);
  
  // Load existing application on mount
  useEffect(() => {
    console.log('🔧 useGoldenVisaApplication - Config Check:', {
      canUseGoldenVisaReview: config.canUseGoldenVisaReview,
      enabled: config.enabled,
      enableGoldenVisaReview: config.enableGoldenVisaReview
    });
    
    if (!config.canUseGoldenVisaReview) {
      console.log('🔧 Review system disabled for Golden Visa');
      return; // Don't load anything if review system is disabled
    }
    
    console.log('🔧 Loading existing application...');
    loadExistingApplication();
  }, [config.canUseGoldenVisaReview]);
  
  const loadExistingApplication = async () => {
    if (!config.canUseGoldenVisaReview) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/applications?type=golden-visa&status=draft&limit=1');
      if (!response.ok) {
        if (response.status === 404) {
          // No existing draft application found - this is fine
          return;
        }
        throw new Error(`Failed to load application: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.applications && data.applications.length > 0) {
        const app = data.applications[0];
        setApplication(app);
        
        if (config.debugMode) {
          console.log('Loaded existing Golden Visa application:', app.id);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load application';
      setError(errorMessage);
      
      if (config.debugMode) {
        console.error('Error loading application:', err);
      }
      
      // Don't show error toast for network issues - fail silently
      if (!errorMessage.includes('fetch')) {
        toast.error('Application Load Error', {
          description: 'Could not load existing application. Starting fresh.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save application to database
  const saveApplication = async (): Promise<boolean> => {
    if (!config.canUseGoldenVisaReview) {
      return true; // Return success if review system is disabled
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const title = generateApplicationTitle(formData);
      
      if (application) {
        // Update existing application
        const response = await fetch(`/api/applications/${application.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            form_data: formData,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update application: ${response.statusText}`);
        }
        
        const updatedApp = await response.json();
        setApplication(updatedApp);
        
        if (config.debugMode) {
          console.log('Updated Golden Visa application:', updatedApp.id);
        }
      } else {
        // Create new application
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'golden-visa',
            title,
            form_data: formData,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create application: ${response.statusText}`);
        }
        
        const newApp = await response.json();
        setApplication(newApp);
        
        if (config.debugMode) {
          console.log('Created new Golden Visa application:', newApp.id);
        }
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save application';
      setError(errorMessage);
      
      if (config.debugMode) {
        console.error('Error saving application:', err);
      }
      
      toast.error('Save Error', {
        description: 'Could not save application. Please try again.'
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Auto-save functionality
  useEffect(() => {
    if (!config.canAutoSaveGoldenVisa) {
      return; // Don't auto-save if disabled
    }
    
    const currentDataString = JSON.stringify(formData);
    
    // Only auto-save if data has changed
    if (currentDataString === lastSavedDataRef.current) {
      return;
    }
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      const success = await saveApplication();
      if (success) {
        lastSavedDataRef.current = currentDataString;
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, config.canAutoSaveGoldenVisa]);
  
  // Submit application for review
  const submitForReview = async (submission: {
    reviewer_id: number;
    urgency: 'low' | 'medium' | 'high';
    comments?: string;
  }): Promise<boolean> => {
    if (!config.canUseGoldenVisaReview || !application) {
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First ensure application is saved with latest form data
      const saveSuccess = await saveApplication();
      if (!saveSuccess) {
        throw new Error('Failed to save application before submission');
      }
      
      // Submit for review
      const response = await fetch(`/api/applications/${application.id}/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit for review: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update application status locally since API doesn't return updated app
      if (application) {
        setApplication({
          ...application,
          status: 'pending_review' as const,
          submitted_at: new Date().toISOString()
        });
      }
      
      if (config.debugMode) {
        console.log('Submitted Golden Visa application for review:', result);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit for review';
      setError(errorMessage);
      
      if (config.debugMode) {
        console.error('Error submitting for review:', err);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Computed values
  const applicationStatus: ApplicationStatus = application?.status || 'draft';
  
  const canDownloadPDF = !config.shouldRequireApproval || applicationStatus === 'approved';
  
  const needsApproval = config.shouldRequireApproval && applicationStatus !== 'approved';
  
  const getStatusMessage = (): string => {
    if (!config.canUseGoldenVisaReview) {
      return '';
    }
    
    switch (applicationStatus) {
      case 'draft':
        return 'Application is being prepared';
      case 'pending_review':
        return 'Waiting for reviewer assignment';
      case 'under_review':
        return 'Currently being reviewed';
      case 'approved':
        return 'Application approved - ready for download';
      case 'rejected':
        return 'Application requires changes';
      default:
        return '';
    }
  };
  
  return {
    // Application state
    application,
    applicationStatus,
    isLoading,
    error,
    
    // Actions
    saveApplication,
    submitForReview,
    
    // Status helpers
    canDownloadPDF,
    needsApproval,
    statusMessage: getStatusMessage(),
  };
};