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
  
  // Generate application title from form data using PDF filename standards
  const generateApplicationTitle = useCallback((data: OfferData): string => {
    try {
      // Use the same filename generation as PDF export for consistency
      const { generateDynamicFilename } = require('@/lib/pdf-generator/utils/filename');
      const filename = generateDynamicFilename(data);
      // Remove the .pdf extension for database storage
      return filename.replace('.pdf', '');
    } catch (error) {
      console.error('🔧 COST-OVERVIEW-HOOK: Failed to generate filename, using fallback:', error);
      
      // Enhanced fallback that matches PDF format better than the old broken format
      const date = new Date(data.clientDetails?.date || new Date());
      const yy = date.getFullYear().toString().slice(-2);
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      const formattedDate = `${yy}${mm}${dd}`;
      
      // Use same naming logic as PDF generator
      const firstName = data.clientDetails?.firstName || '';
      const lastName = data.clientDetails?.lastName || '';
      const companyName = data.clientDetails?.companyName || '';
      const addressToCompany = data.clientDetails?.addressToCompany || false;
      
      const nameForTitle = addressToCompany && companyName ? 
        companyName : 
        (firstName ? 
          (lastName ? `${lastName} ${firstName}` : firstName) : 
          (companyName || 'CLIENT'));
      
      const authority = data.authorityInformation?.responsibleAuthority || 'Unknown Authority';
      const isDET = authority === 'DET (Dubai Department of Economy and Tourism)';
      
      if (isDET) {
        const setupType = data.clientDetails?.companySetupType === 'Corporate Setup' ? 'CORP' : 'INDIV';
        const secondaryCurrency = data.clientDetails?.secondaryCurrency || 'USD';
        return `${formattedDate} ${nameForTitle} DET ${setupType} setup AED ${secondaryCurrency}`;
      } else {
        const numberOfYears = data.ifzaLicense?.licenseYears || 1;
        const visaQuota = data.ifzaLicense?.visaQuota || 0;
        const visaUsed = data.visaCosts?.numberOfVisas || 0;
        const spouseVisas = data.visaCosts?.spouseVisa ? 1 : 0;
        const childrenVisas = data.visaCosts?.numberOfChildVisas || 0;
        const secondaryCurrency = data.clientDetails?.secondaryCurrency || 'USD';
        
        const cleanedAuthority = authority.includes('IFZA') ? 'IFZA' : 
                                authority.includes('DET') ? 'DET' : 
                                authority.replace(/[()]/g, '').split(' ')[0];
        
        return `${formattedDate} ${nameForTitle} ${cleanedAuthority} ${numberOfYears} ${visaQuota} ${visaUsed} ${spouseVisas} ${childrenVisas} setup AED ${secondaryCurrency}`;
      }
    }
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
        
        return true;
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
        
        return true;
      }
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
    if (!config.canUseCostOverviewReview) {
      console.log('🔧 submitForReview blocked: review system disabled');
      return false;
    }
    
    if (!application) {
      console.log('🔧 submitForReview blocked: no application found, trying to create one first...');
      const saveSuccess = await saveApplication();
      if (!saveSuccess) {
        console.log('🔧 submitForReview: failed to create application');
        return false;
      }
      
      // Check if application was created
      if (!application) {
        console.log('🔧 submitForReview: still no application after save attempt');
        return false;
      }
    }
    
    console.log('🔧 submitForReview: proceeding with application:', { 
      id: application.id, 
      title: application.title 
    });
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First ensure application is saved with latest form data
      console.log('🔧 submitForReview: saving application before submission...');
      const saveSuccess = await saveApplication();
      if (!saveSuccess) {
        throw new Error('Failed to save application before submission');
      }
      
      console.log('🔧 submitForReview: making API call to:', `/api/applications/${application.id}/submit-review`);
      console.log('🔧 submitForReview: request body:', submission);
      
      // Submit for review with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`/api/applications/${application.id}/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('🔧 API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔧 API error response:', errorText);
        throw new Error(`Failed to submit for review: ${response.statusText} - ${errorText}`);
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
      let errorMessage = 'Failed to submit for review';
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error('🔧 submitForReview error:', err);
      
      // Show user-friendly error toast
      if (errorMessage.includes('timed out')) {
        toast.error('Request Timeout', {
          description: 'The submission is taking too long. Please try again.'
        });
      } else {
        toast.error('Submission Error', {
          description: errorMessage
        });
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