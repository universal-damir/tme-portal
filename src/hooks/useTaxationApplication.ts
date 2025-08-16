// Taxation Application State Management Hook
// Ultra-safe hook that handles application persistence and review system integration

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { TaxationFormData } from '@/types/taxation';
import { Application, ApplicationStatus, UrgencyLevel } from '@/types/review-system';
import { useReviewSystemConfig } from '@/lib/config/review-system';

interface UseTaxationApplicationProps {
  formData: TaxationFormData;
  clientName: string;
}

interface UseTaxationApplicationReturn {
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

export const useTaxationApplication = ({
  formData,
  clientName
}: UseTaxationApplicationProps): UseTaxationApplicationReturn => {
  const config = useReviewSystemConfig();
  
  // State management
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-save management
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  
  // Generate application title from form data using PDF filename standards
  const generateApplicationTitle = useCallback((data: TaxationFormData): string => {
    try {
      // Use the same filename generation as PDF export for consistency
      const { generateTaxationFilename } = require('@/lib/pdf-generator/utils/taxationDataTransformer');
      const clientInfo = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        companyName: data.companyName || '',
        shortCompanyName: data.shortCompanyName || '',
        date: data.date || new Date().toISOString().split('T')[0],
      };
      const filename = generateTaxationFilename(data, clientInfo);
      // Remove the .pdf extension for database storage
      return filename.replace('.pdf', '');
    } catch (error) {
      console.error('🔧 TAXATION-HOOK: Failed to generate filename, using fallback:', error);
      
      // Enhanced fallback that matches PDF format
      const date = new Date(data.date || new Date());
      const yy = date.getFullYear().toString().slice(-2);
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      const formattedDate = `${yy}${mm}${dd}`;
      
      // Get company abbreviation from company type
      const companyAbbreviation = data.companyType === 'management-consultants' ? 'MGT' : 'FZCO';
      
      // Get company short name
      const companyShortName = data.shortCompanyName || 'Company';
      
      // Format tax end period as dd.mm.yyyy
      const formatTaxEndPeriod = () => {
        const toDate = data.citDisclaimer?.taxPeriodRange?.toDate;
        if (toDate) {
          const endDate = new Date(toDate);
          const day = endDate.getDate().toString().padStart(2, '0');
          const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
          const year = endDate.getFullYear();
          return `${day}.${month}.${year}`;
        }
        return '31.12.2025'; // Default fallback
      };
      
      return `${formattedDate} ${companyAbbreviation} ${companyShortName} CIT Disclaimer ${formatTaxEndPeriod()}`;
    }
  }, [clientName]);
  
  // Load existing application on mount
  useEffect(() => {
    console.log('🔧 useTaxationApplication - Config Check:', {
      canUseTaxationReview: config.canUseTaxationReview,
      enabled: config.enabled,
      enableTaxationReview: config.enableTaxationReview
    });
    
    if (!config.canUseTaxationReview) {
      console.log('🔧 Review system disabled for Taxation');
      return; // Don't load anything if review system is disabled
    }
    
    console.log('🔧 Loading existing application...');
    loadExistingApplication();
  }, [config.canUseTaxationReview, config.enabled, config.enableTaxationReview]);
  
  const loadExistingApplication = async () => {
    if (!config.canUseTaxationReview) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/applications?type=taxation&status=draft&limit=1');
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
          console.log('Loaded existing Taxation application:', app.id);
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
  
  // Save application to database - returns boolean or Application object
  const saveApplication = async (): Promise<boolean | Application> => {
    if (!config.canUseTaxationReview) {
      return true; // Return success if review system is disabled
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const title = generateApplicationTitle(formData);
      
      if (application && application.id) {
        // Update existing application only if it has a valid ID
        const response = await fetch(`/api/applications/${application.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'taxation', // CRITICAL: Always include type in updates
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
          console.log('Updated Taxation application:', updatedApp.id);
        }
        
        return updatedApp;
      } else {
        // Create new application
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'taxation',
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
          console.log('Created new Taxation application:', newApp.id);
        }
        
        // Return the new application for immediate use
        return newApp;
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
    if (!config.canAutoSaveTaxation) {
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
  }, [formData, config.canAutoSaveTaxation, saveApplication]);
  
  // Submit application for review
  const submitForReview = async (submission: {
    reviewer_id: number;
    urgency: UrgencyLevel;
    comments?: string;
  }): Promise<boolean> => {
    console.log('🔧 submitForReview called:', { 
      enabled: config.canUseTaxationReview, 
      hasApplication: !!application,
      applicationId: application?.id 
    });
    
    if (!config.canUseTaxationReview) {
      console.error('🔧 Taxation review is disabled in config');
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
      
      if (config.debugMode) {
        console.log('Submitted Taxation application for review:', result);
        console.log('Cleared application state for fresh start');
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
    if (!config.canUseTaxationReview) {
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