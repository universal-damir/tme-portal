// Cost Overview Application State Management Hook
// Based on Golden Visa pattern for consistent review system integration

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { OfferData } from '@/types/offer';
import { Application, ApplicationStatus, UrgencyLevel } from '@/types/review-system';
import { useReviewSystemConfig } from '@/lib/config/review-system';

interface UseCostOverviewApplicationProps {
  formData: OfferData;
  clientName: string;
}

interface UseCostOverviewApplicationReturn {
  // Application state
  application: Application | null;
  applicationStatus: ApplicationStatus;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  saveApplication: () => Promise<boolean>;
  submitForReview: (submission: {
    reviewer_id: number;
    urgency: UrgencyLevel;
    comments?: string;
  }) => Promise<boolean>;
  
  // Status helpers
  canDownloadPDF: boolean;
  needsApproval: boolean;
  statusMessage: string;
}

export const useCostOverviewApplication = ({
  formData,
  clientName
}: UseCostOverviewApplicationProps): UseCostOverviewApplicationReturn => {
  const config = useReviewSystemConfig();
  
  // State management
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-save management
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  
  // Generate application title from form data
  const generateApplicationTitle = useCallback((data: OfferData): string => {
    const clientPart = clientName || 
      (data.clientDetails?.companyName) || 
      `${data.clientDetails?.firstName || ''} ${data.clientDetails?.lastName || ''}`.trim() || 
      'Unnamed Client';
    
    const authority = data.authorityInformation?.responsibleAuthority || 'Authority Setup';
    return `${clientPart} - ${authority} Cost Overview`;
  }, [clientName]);
  
  // Load existing application on mount
  useEffect(() => {
    console.log('🔧 useCostOverviewApplication - Config Check:', {
      canUseCostOverviewReview: config.canUseCostOverviewReview,
      enabled: config.enabled,
      enableCostOverviewReview: config.enableCostOverviewReview
    });
    
    if (!config.canUseCostOverviewReview) {
      console.log('🔧 Review system disabled for Cost Overview');
      return; // Don't load anything if review system is disabled
    }
    
    console.log('🔧 Loading existing Cost Overview application...');
    loadExistingApplication();
  }, [config.canUseCostOverviewReview]);
  
  const loadExistingApplication = async () => {
    if (!config.canUseCostOverviewReview) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/applications?type=cost-overview&status=draft&limit=1');
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
          console.log('Loaded existing Cost Overview application:', app.id);
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
    if (!config.canUseCostOverviewReview) {
      return true; // Return success if review system is disabled
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const title = generateApplicationTitle(formData);
      
      if (application) {
        // Update existing application
        console.log('🔧 Updating existing Cost Overview application:', { 
          id: application.id, 
          title, 
          formDataType: typeof formData,
          formDataKeys: formData ? Object.keys(formData) : []
        });
        
        const response = await fetch(`/api/applications/${application.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'cost-overview', // CRITICAL FIX: Ensure type is correct
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
          console.log('Updated Cost Overview application:', updatedApp.id);
        }
      } else {
        // Create new application
        console.log('🔧 Creating new Cost Overview application:', { 
          type: 'cost-overview',
          title, 
          formDataType: typeof formData,
          formDataKeys: formData ? Object.keys(formData) : []
        });
        
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'cost-overview',
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
          console.log('Created new Cost Overview application:', newApp.id);
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
    if (!config.canAutoSaveCostOverview) {
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
  }, [formData, config.canAutoSaveCostOverview]);
  
  // Submit application for review
  const submitForReview = async (submission: {
    reviewer_id: number;
    urgency: UrgencyLevel;
    comments?: string;
  }): Promise<boolean> => {
    if (!config.canUseCostOverviewReview || !application) {
      console.log('🔧 submitForReview blocked:', { canUse: config.canUseCostOverviewReview, hasApplication: !!application });
      return false;
    }
    
    console.log('🔧 Cost Overview submitForReview starting:', { applicationId: application.id, submission });
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First ensure application is saved with latest form data
      console.log('🔧 Saving application before review submission...');
      const saveSuccess = await saveApplication();
      if (!saveSuccess) {
        throw new Error('Failed to save application before submission');
      }
      
      console.log('🔧 Making API call to submit for review:', `/api/applications/${application.id}/submit-review`);
      
      // Submit for review
      const response = await fetch(`/api/applications/${application.id}/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      });
      
      console.log('🔧 API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔧 API error response:', errorText);
        throw new Error(`Failed to submit for review: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('🔧 API success response:', result);
      
      // Update application status locally since API doesn't return updated app
      if (application) {
        setApplication({
          ...application,
          status: 'pending_review' as const,
          submitted_at: new Date().toISOString()
        });
      }
      
      if (config.debugMode) {
        console.log('Submitted Cost Overview application for review:', result);
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
    if (!config.canUseCostOverviewReview) {
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