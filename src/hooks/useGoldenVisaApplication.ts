// Golden Visa Application State Management Hook
// Ultra-safe hook that handles application persistence and review system integration

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { GoldenVisaData } from '@/types/golden-visa';
import { Application, ApplicationStatus, UrgencyLevel } from '@/types/review-system';
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
  saveApplication: () => Promise<boolean | Application>;
  submitForReview: (submission: {
    reviewer_id: number;
    urgency: UrgencyLevel;
    comments?: string;
  }) => Promise<boolean>;
  restoreApplication: (applicationId: string, formData: any) => void;
  
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
  
  // Generate application title from form data using PDF filename standards
  const generateApplicationTitle = useCallback((data: GoldenVisaData): string => {
    // First check if we have minimum data for title generation
    if (!data.firstName && !data.lastName && !data.companyName) {
      // Return a default title if no client info
      const date = new Date(data.date || new Date());
      const yy = date.getFullYear().toString().slice(-2);
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      return `${yy}${mm}${dd} Draft Golden Visa Application`;
    }
    
    try {
      // Use the same filename generation as PDF export for consistency
      const { generateGoldenVisaFilename } = require('@/lib/pdf-generator/integrations/FilenameIntegrations');
      const clientInfo = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        companyName: data.companyName || '',
        date: data.date || new Date().toISOString().split('T')[0],
      };
      const filename = generateGoldenVisaFilename(data, clientInfo);
      // Remove the .pdf extension for database storage
      return filename.replace('.pdf', '');
    } catch (error) {
      console.log('🔧 GOLDEN-VISA-HOOK: Using fallback title generation');
      
      // Enhanced fallback that matches PDF format (keep current working logic)
      const date = new Date(data.date || new Date());
      const yy = date.getFullYear().toString().slice(-2);
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      const formattedDate = `${yy}${mm}${dd}`;
      
      // Get client names
      let nameForTitle = '';
      if (data.companyName) {
        nameForTitle = data.companyName;
      } else if (data.lastName && data.firstName) {
        nameForTitle = `${data.lastName} ${data.firstName}`;
      } else if (data.firstName) {
        nameForTitle = data.firstName;
      } else if (data.lastName) {
        nameForTitle = data.lastName;
      } else {
        nameForTitle = 'Client';
      }
      
      // Determine if this is a dependent-only visa (no primary holder)
      const isDependentOnly = !data.primaryVisaRequired;
      
      let visaTypeFormatted: string;
      
      if (isDependentOnly) {
        // If only dependents are getting visas, use "dependent" suffix
        visaTypeFormatted = 'dependent';
      } else {
        // Format visa type for title (shortened versions)
        const visaTypeMap: { [key: string]: string } = {
          'property-investment': 'property',
          'time-deposit': 'deposit',
          'skilled-employee': 'skilled'
        };
        
        visaTypeFormatted = visaTypeMap[data.visaType] || data.visaType;
      }
      
      return `${formattedDate} ${nameForTitle} offer golden visa ${visaTypeFormatted}`;
    }
  }, []);
  
  // Load existing application on mount
  useEffect(() => {
    if (!config.canUseGoldenVisaReview) {
      return; // Don't load anything if review system is disabled
    }
    
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
          return; // No existing draft - normal state
        }
        throw new Error(`Failed to load application: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.applications && data.applications.length > 0) {
        const app = data.applications[0];
        
        // Verify this is actually a Golden Visa application
        if (app.type !== 'golden-visa') {
          console.error('Wrong application type loaded:', app.type);
          return; // Don't load wrong type of application
        }
        
        setApplication(app);
        
        if (config.debugMode) {
          console.log('Loaded existing Golden Visa application:', app.id);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load application';
      setError(errorMessage);
      
      
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
    if (!config.canUseGoldenVisaReview) {
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
            type: 'golden-visa', // CRITICAL: Always include type in updates
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
        
        return updatedApp;
      } else {
        // Create new application
        
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'golden-visa',  // CRITICAL: Must be golden-visa
            title,
            form_data: formData,
            status: 'draft',
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create application: ${response.statusText}`);
        }
        
        const result = await response.json();
        const newApp = result.application || result; // Handle both response formats
        setApplication(newApp);
        
        if (config.debugMode) {
          console.log('Created new Golden Visa application:', newApp.id);
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
    if (!config.canAutoSaveGoldenVisa) {
      return; // Don't auto-save if disabled
    }
    
    // Don't auto-save if essential fields are missing
    if (!formData.firstName && !formData.lastName && !formData.companyName) {
      return; // No client data yet
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
      try {
        const success = await saveApplication();
        if (success) {
          lastSavedDataRef.current = currentDataString;
        }
      } catch (error) {
        console.error('🔧 Auto-save error:', error);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, config.canAutoSaveGoldenVisa, saveApplication]);
  
  // Submit application for review
  const submitForReview = async (submission: {
    reviewer_id: number;
    urgency: UrgencyLevel;
    comments?: string;
  }): Promise<boolean> => {
    console.log('🔧 submitForReview called:', { 
      enabled: config.canUseGoldenVisaReview, 
      hasApplication: !!application,
      applicationId: application?.id 
    });
    
    if (!config.canUseGoldenVisaReview) {
      console.error('🔧 Golden Visa review is disabled in config');
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
      
      // Don't clear application state - keep it for potential resubmission after rejection
      // The application ID is needed to continue the conversation history
      if (config.debugMode) {
        console.log('Submitted Golden Visa application for review:', result);
        console.log('Keeping application state for potential resubmission. Application ID:', appToSubmit.id);
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
  
  // Restore application for editing after rejection
  const restoreApplication = (applicationId: string, formData: any) => {
    // Create a minimal application object to maintain the ID and continue conversation history
    const restoredApp: Application = {
      id: applicationId,
      type: 'golden-visa',
      title: generateApplicationTitle(formData),
      form_data: formData,
      status: 'rejected', // We know it was rejected since we're editing
      submitted_by_id: 0, // Will be set by backend
      urgency: 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setApplication(restoredApp);
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
    restoreApplication,
    
    // Status helpers
    canDownloadPDF,
    needsApproval,
    statusMessage: getStatusMessage(),
  };
};