'use client'

import React from 'react'
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

    // Map application types to tab names and event names
    const tabMapping: Record<string, string> = {
      'golden-visa': 'golden-visa',
      'cost-overview': 'cost-overview', 
      'company-services': 'company-services',
      'taxation': 'taxation',
      'corporate-changes': 'corporate-changes'
    };
    
    const targetTab = tabMapping[feedbackApplication.type];
    
    if (!targetTab) {
      console.error('Unknown application type:', feedbackApplication.type);
      return;
    }

    // Navigate to the correct tab first
    window.location.hash = `#${targetTab}`;
    
    // Close the feedback modal
    setFeedbackModalOpen(false);
    
    // Dispatch the edit event with the application data
    const eventName = `edit-${feedbackApplication.type}-application`;
    const editEvent = new CustomEvent(eventName, {
      detail: {
        applicationId: feedbackApplication.id,
        formData: feedbackApplication.form_data
      }
    });
    
    // Wait for the tab to be ready before dispatching the event (same as FeedbackModal)
    const waitForTabAndDispatch = () => {
      let attempts = 0;
      const maxAttempts = 40; // Max 20 seconds (500ms * 40) to account for lazy loading
      
      const checkAndDispatch = () => {
        attempts++;
        console.log(`🔧 HEADER: Checking if tab is ready for edit event (attempt ${attempts}/${maxAttempts})`);
        
        // Test if we can dispatch and receive a response by sending a test event
        const testEvent = new CustomEvent('tab-readiness-check', {
          detail: { targetTab: feedbackApplication.type }
        });
        
        let tabReady = false;
        const testHandler = (event: any) => {
          console.log('🔧 HEADER: Received tab readiness confirmation:', event.detail);
          if (event.detail.tab === feedbackApplication.type) {
            tabReady = true;
            window.removeEventListener('tab-readiness-confirmed', testHandler);
          }
        };
        
        window.addEventListener('tab-readiness-confirmed', testHandler);
        console.log(`🔧 HEADER: Dispatching readiness check for ${feedbackApplication.type}`);
        window.dispatchEvent(testEvent);
        
        // Give a small delay to see if tab responds
        setTimeout(() => {
          window.removeEventListener('tab-readiness-confirmed', testHandler);
          
          if (tabReady) {
            console.log('🔧 HEADER: Tab is ready! Dispatching edit application event');
            console.log('🔧 HEADER: Current window hash:', window.location.hash);
            console.log('🔧 HEADER: Event detail:', editEvent.detail);
            
            // Dispatch the actual event
            window.dispatchEvent(editEvent);
            console.log(`🔧 Header: Dispatched ${eventName} event with form data successfully`);
            
          } else if (attempts < maxAttempts) {
            console.log(`🔧 HEADER: Tab not ready yet, retrying in 300ms...`);
            setTimeout(checkAndDispatch, 300);
          } else {
            console.error('🔧 HEADER: Tab failed to become ready after maximum attempts');
            console.error('🔧 HEADER: This might be due to lazy loading delay or tab not mounting');
            // Dispatch anyway as last resort
            window.dispatchEvent(editEvent);
            console.log(`🔧 Header: Dispatched ${eventName} event as last resort`);
          }
        }, 100);
      };
      
      // Start checking after initial delay
      setTimeout(checkAndDispatch, 500);
    };
    
    waitForTabAndDispatch();
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
                
                {/* Notification Badge */}
                <div className="relative">
                  <NotificationBadge
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsNotificationPanelOpen(!isNotificationPanelOpen);
                    }}
                    size="sm"
                  />
                  
                  {/* Notification Panel */}
                  <NotificationPanel
                    isOpen={isNotificationPanelOpen}
                    onClose={() => setIsNotificationPanelOpen(false)}
                    onNotificationClick={handleNotificationClick}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
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