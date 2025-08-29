'use client'

import React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useAuth } from '@/contexts/AuthContext'
import { NotificationBadge } from '@/components/review-system/ui/NotificationBadge'
import { NotificationPanel } from '@/components/review-system/ui/NotificationPanel'
import { ReviewModal } from '@/components/review-system/modals/ReviewModal'
import { FeedbackModal } from '@/components/review-system/modals/FeedbackModal'
import { Notification, Application } from '@/types/review-system'
import { useSharedClient } from '@/contexts/SharedClientContext'

interface TMEPortalHeaderProps {
  title?: string;
  onGeneratePDF?: () => void;
  onPreview?: () => void;
}

export function TMEPortalHeader({ 
  title = "Cost Overview Generator",
  onGeneratePDF,
  onPreview
}: TMEPortalHeaderProps) {
  const { user } = useAuth()
  const { clearClientInfo } = useSharedClient()
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = React.useState(false)
  
  // Review modal state - centralized here
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false)
  const [selectedApplication, setSelectedApplication] = React.useState<Application | null>(null)
  const [loadingApplication, setLoadingApplication] = React.useState(false)
  
  // Feedback modal state - for submitters receiving feedback
  const [feedbackModalOpen, setFeedbackModalOpen] = React.useState(false)
  const [feedbackApplication, setFeedbackApplication] = React.useState<Application | null>(null)

  const handleNotificationClick = async (notification: Notification) => {
    console.log('🔔 Header: Notification clicked:', notification);
    
    if (!notification.application_id) {
      return;
    }
    
    // Close notification panel
    setIsNotificationPanelOpen(false);
    
    if (notification.type === 'review_requested') {
      // For reviewers: Open review modal
      if (reviewModalOpen) {
        setReviewModalOpen(false);
        setSelectedApplication(null);
      }
      
      setLoadingApplication(true);
      
      try {
        // Fetch application details
        const response = await fetch(`/api/applications/${notification.application_id}`);
        const data = await response.json();
        
        if (response.ok && data.application) {
          setSelectedApplication(data.application);
          setReviewModalOpen(true);
        } else {
          console.error('Failed to load application for review:', data.error);
        }
      } catch (error) {
        console.error('Error loading application for review:', error);
      } finally {
        setLoadingApplication(false);
      }
    } else if (notification.type === 'application_approved' || notification.type === 'application_rejected') {
      // For submitters: Open feedback modal
      if (feedbackModalOpen) {
        setFeedbackModalOpen(false);
        setFeedbackApplication(null);
      }
      
      setLoadingApplication(true);
      
      try {
        // Fetch application details
        const response = await fetch(`/api/applications/${notification.application_id}`);
        const data = await response.json();
        
        if (response.ok && data.application) {
          setFeedbackApplication(data.application);
          setFeedbackModalOpen(true);
        } else {
          console.error('Failed to load application for feedback:', data.error);
        }
      } catch (error) {
        console.error('Error loading application for feedback:', error);
      } finally {
        setLoadingApplication(false);
      }
    }
  };

  const handleEditForm = () => {
    if (!feedbackApplication) {
      console.error('No feedback application data available');
      return;
    }

    // Convert database underscore format to frontend hyphen format
    const dbToFrontendTypeMapping: Record<string, string> = {
      'cost_overview': 'cost-overview',
      'golden_visa': 'golden-visa', 
      'company_services': 'company-services',
      'taxation': 'taxation',
      'cit_return_letters': 'cit-return-letters'
    };
    
    // Get the frontend type (handles both formats for compatibility)
    const frontendType = dbToFrontendTypeMapping[feedbackApplication.type] || feedbackApplication.type;
    
    if (!frontendType) {
      console.error('Unknown application type:', feedbackApplication.type);
      return;
    }

    // Close the feedback modal first
    setFeedbackModalOpen(false);
    
    // Navigate using the portal's tab switching system
    const switchTabEvent = new CustomEvent('switch-tab', {
      detail: { tab: frontendType }
    });
    window.dispatchEvent(switchTabEvent);
    
    // Dispatch the edit event with the application data
    const eventName = `edit-${frontendType}-application`;
    const editEvent = new CustomEvent(eventName, {
      detail: {
        applicationId: feedbackApplication.id,
        formData: feedbackApplication.form_data
      }
    });
    
    // Wait for tab to confirm it's ready, then dispatch edit event
    const waitForTabReadiness = () => {
      let eventDispatched = false;
      
      // Set up listener for tab readiness confirmation
      const handleTabReady = (event: any) => {
        if (event.detail.tab === frontendType && event.detail.ready && !eventDispatched) {
          eventDispatched = true;
          window.removeEventListener('tab-readiness-response', handleTabReady);
          window.dispatchEvent(editEvent);
        }
      };
      
      window.addEventListener('tab-readiness-response', handleTabReady);
      
      // Ask the tab if it's ready
      const readinessCheckEvent = new CustomEvent('tab-readiness-check', {
        detail: { targetTab: frontendType }
      });
      
      window.dispatchEvent(readinessCheckEvent);
      
      // Fallback timeout in case tab doesn't respond
      setTimeout(() => {
        window.removeEventListener('tab-readiness-response', handleTabReady);
        if (!eventDispatched) {
          window.dispatchEvent(editEvent);
        }
      }, 1000);
    };
    
    // Small delay to let the tab mount first, then check readiness
    setTimeout(waitForTabReadiness, 200);
    
    // Toast notification is handled by the tab component
  };

  // Handle review actions (approve/reject)
  const handleReviewAction = async (action: 'approve' | 'reject', comments: string): Promise<boolean> => {
    if (!selectedApplication) return false;

    try {
      const response = await fetch(`/api/applications/${selectedApplication.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          comments
        }),
      });

      if (response.ok) {
        // If User 2 rejected the application, clear their form
        if (action === 'reject') {
          console.log('🔴 [TMEPortalHeader] User 2 rejected application - clearing their form');
          clearClientInfo({ 
            source: 'reviewer-rejected'
          });
        }
        
        // Close the review modal
        setReviewModalOpen(false);
        setSelectedApplication(null);
        return true;
      } else {
        console.error('Failed to submit review:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      return false;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 h-4"
          />
          <h1 className="text-base font-medium">{title}</h1>
          <div className="ml-auto flex items-center gap-2">
            {user && (
              <>
                <Separator orientation="vertical" className="mx-2 h-4" />
                
                <div className="flex items-center gap-3">
                  {/* Notification Badge */}
                  <div className="relative">
                    <NotificationBadge
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsNotificationPanelOpen(!isNotificationPanelOpen);
                      }}
                      size="xs"
                    />
                    
                    {/* Notification Panel */}
                    <NotificationPanel
                      isOpen={isNotificationPanelOpen}
                      onClose={() => setIsNotificationPanelOpen(false)}
                      onNotificationClick={handleNotificationClick}
                    />
                  </div>
                  
                  {/* Profile Photo - Clickable */}
                  <Button 
                    variant="ghost" 
                    className="relative h-8 w-8 rounded-full"
                    onClick={() => {
                      const switchTabEvent = new CustomEvent('switch-tab', {
                        detail: { tab: 'profile' }
                      });
                      window.dispatchEvent(switchTabEvent);
                    }}
                    title="Go to Profile"
                  >
                    <UserAvatar user={user} size="sm" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedApplication(null);
        }}
        application={selectedApplication}
        onReviewAction={handleReviewAction}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => {
          setFeedbackModalOpen(false);
          setFeedbackApplication(null);
        }}
        application={feedbackApplication}
        onEditForm={handleEditForm}
      />
    </>
  )
} 