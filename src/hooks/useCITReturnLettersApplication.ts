// CIT Return Letters Application State Management Hook
// Ultra-safe hook that handles application persistence and review system integration

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { CITReturnLettersData } from '@/types/cit-return-letters';
import { Application, ApplicationStatus, UrgencyLevel } from '@/types/review-system';
import { useReviewSystemConfig } from '@/lib/config/review-system';

interface UseCITReturnLettersApplicationProps {
  formData: CITReturnLettersData;
  clientName: string;
}

interface UseCITReturnLettersApplicationReturn {
  // Application state
  application: Application | null;
  applicationStatus: ApplicationStatus;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  saveApplication: () => Promise<boolean | Application>;
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

export const useCITReturnLettersApplication = ({
  formData,
  clientName
}: UseCITReturnLettersApplicationProps): UseCITReturnLettersApplicationReturn => {
  const config = useReviewSystemConfig();
  
  // State management
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-save management
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Generate application title
  const generateApplicationTitle = useCallback((): string => {
    if (!formData.selectedClient) return 'CIT Return Letters';
    
    // Check for selectedLetterTypes (new format) or fallback to letterType (legacy)
    const hasLetterTypes = formData.selectedLetterTypes && formData.selectedLetterTypes.length > 0;
    const hasLegacyLetterType = formData.letterType && formData.letterType !== '';
    
    if (!hasLetterTypes && !hasLegacyLetterType) {
      return 'CIT Return Letters';
    }
    
    const date = new Date(formData.letterDate || new Date());
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const formattedDate = `${yy}${mm}${dd}`;
    
    const companyShortName = formData.selectedClient?.company_name_short || 'Company';
    
    // Use selectedLetterTypes if available, otherwise fallback to letterType
    let letterTypes: string;
    if (hasLetterTypes) {
      letterTypes = formData.selectedLetterTypes.length === 1 
        ? formData.selectedLetterTypes[0] 
        : `${formData.selectedLetterTypes.length} Letters`;
    } else {
      letterTypes = formData.letterType || 'Letter';
    }
    
    return `${formattedDate} ${companyShortName} CIT ${letterTypes}`;
  }, [formData]);

  // Check if form data has changed
  const checkForChanges = useCallback(() => {
    const currentDataString = JSON.stringify(formData);
    const hasChanges = currentDataString !== lastSavedDataRef.current;
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  }, [formData]);

  // Auto-save application (disabled for CIT return letters)
  const autoSaveApplication = useCallback(async () => {
    // Disabled to prevent duplicate applications
    return;
  }, []);

  // Set up auto-save (disabled for CIT return letters to avoid duplicate applications)
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Note: Auto-save disabled for CIT return letters to prevent duplicate applications
    // Applications will be created only when explicitly submitted for review
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, config.canUseCITReturnLettersReview]);

  // Save application to database
  const saveApplication = async (): Promise<boolean | Application> => {
    if (!config.canUseCITReturnLettersReview) return false;
    
    // Validate minimum required data
    if (!formData.selectedClient) {
      setError('Client selection is required');
      return false;
    }
    
    // Check for selectedLetterTypes (new format) or fallback to letterType (legacy)
    const hasLetterTypes = formData.selectedLetterTypes && formData.selectedLetterTypes.length > 0;
    const hasLegacyLetterType = formData.letterType && formData.letterType !== '';
    
    if (!hasLetterTypes && !hasLegacyLetterType) {
      setError('At least one letter type is required');
      return false;
    }

    if (!formData.letterDate) {
      setError('Letter date is required');
      return false;
    }

    if (!formData.taxPeriodStart || !formData.taxPeriodEnd) {
      setError('Tax period dates are required');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Only create new applications (no update functionality needed for now)
      console.log('🔧 Creating new CIT return letters application');
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'cit-return-letters',
          title: generateApplicationTitle(),
          form_data: formData,
        }),
      });
      
      const result = await response.json();
      console.log('🔧 API Response structure:', result);
      
      if (!response.ok) {
        console.error('🔧 HTTP error:', response.status, response.statusText);
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // The API returns { success: true, application: {...} }
      if (!result.success) {
        console.error('🔧 API returned success=false:', result);
        throw new Error(result.error || 'Server returned failure status');
      }
      
      if (!result.application) {
        console.error('🔧 API returned null application:', result);
        throw new Error(result.error || 'No application data returned from server');
      }
      
      const savedApplication = result.application;
      
      if (!savedApplication.id) {
        console.error('🔧 Application missing ID:', savedApplication);
        throw new Error('Application ID not returned from server');
      }
      
      console.log('🔧 CIT return letters application saved successfully:', savedApplication.id);
      
      // Update local state
      setApplication(savedApplication);
      
      // Mark as saved
      lastSavedDataRef.current = JSON.stringify(formData);
      setHasUnsavedChanges(false);
      
      // Return the application object for immediate use
      return savedApplication;
      
    } catch (error) {
      console.error('🔧 Error saving CIT return letters application:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to save: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Submit application for review
  const submitForReview = async (submission: {
    reviewer_id: number;
    urgency: UrgencyLevel;
    comments?: string;
  }): Promise<boolean> => {
    console.log('🔧 submitForReview called:', { 
      enabled: config.canUseCITReturnLettersReview, 
      hasApplication: !!application,
      applicationId: application?.id 
    });
    
    if (!config.canUseCITReturnLettersReview) {
      console.error('🔧 CIT return letters review is disabled in config');
      return false;
    }
    
    let appToSubmit = application;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First ensure application is saved with latest form data
      const saveResult = await saveApplication();
      if (!saveResult) {
        throw new Error('Failed to save application before submission');
      }
      
      // If saveResult is an Application object (new or updated), use it
      if (typeof saveResult === 'object' && saveResult.id) {
        appToSubmit = saveResult;
        console.log('🔧 Using application:', appToSubmit.id);
      } else if (!appToSubmit) {
        console.error('🔧 No application available to submit');
        throw new Error('No application available to submit');
      }
      
      // Ensure we have a valid application ID
      if (!appToSubmit || !appToSubmit.id) {
        console.error('🔧 No valid application ID available for submission');
        throw new Error('No valid application ID available for submission');
      }
      
      // Submit for review
      const response = await fetch(`/api/applications/${appToSubmit.id}/submit-review`, {
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
      
      // Clear application state after successful submission
      // The form will be reset and we start fresh
      setApplication(null);
      lastSavedDataRef.current = ''; // Reset the last saved data reference
      
      console.log('🔧 CIT return letters application submitted for review successfully:', result);
      console.log('🔧 Cleared application state for fresh start');
      
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit for review';
      setError(errorMessage);
      
      console.error('🔧 Error submitting CIT return letters for review:', err);
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Derive application status
  const applicationStatus: ApplicationStatus = application?.status || 'draft';
  
  // Status helpers
  const canDownloadPDF = !config.canUseCITReturnLettersReview || applicationStatus === 'approved';
  const needsApproval = config.canUseCITReturnLettersReview && ['pending_review', 'under_review'].includes(applicationStatus);
  
  const statusMessage = (() => {
    switch (applicationStatus) {
      case 'draft':
        return hasUnsavedChanges ? 'Draft (unsaved changes)' : 'Draft (saved)';
      case 'pending_review':
        return 'Pending Review';
      case 'under_review':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Needs Revision';
      default:
        return 'Unknown Status';
    }
  })();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    application,
    applicationStatus,
    isLoading,
    error,
    saveApplication,
    submitForReview,
    canDownloadPDF,
    needsApproval,
    statusMessage,
  };
};