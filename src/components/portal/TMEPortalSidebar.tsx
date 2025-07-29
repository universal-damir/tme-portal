'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  FileBarChart,
  Building2,
  Crown,
  Briefcase,
  Receipt,
  Users,
  Shield,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { TabId } from '@/types/portal'
import { NavMain } from './navigation/NavMain'
import { NavUser } from './navigation/NavUser'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { NotificationBadge } from '@/components/review-system/ui/NotificationBadge'
import { NotificationPanel } from '@/components/review-system/ui/NotificationPanel'
import { ReviewModal } from '@/components/review-system/modals/ReviewModal'
import { FeedbackModal } from '@/components/review-system/modals/FeedbackModal'
import { Notification, Application } from '@/types/review-system'

// Base navigation items available to all authenticated users
const baseNavItems = [
  {
    title: 'Cost Overview',
    url: '#cost-overview',
    icon: FileBarChart,
    feature: 'cost_overview',
  },
  {
    title: 'Golden Visa',
    url: '#golden-visa',
    icon: Crown,
    feature: 'golden_visa',
  },
  {
    title: 'Summary of Services',
    url: '#company-services',
    icon: Building2,
    feature: 'company_services',
  },
  {
    title: 'Corporate Changes',
    url: '#corporate-changes',
    icon: Briefcase,
    feature: 'corporate_changes',
  },
  {
    title: 'Taxation',
    url: '#taxation',
    icon: Receipt,
    feature: 'taxation',
  },
];

// Admin-only navigation items
const adminNavItems = [
  {
    title: 'User Management',
    url: '/admin/users',
    icon: Users,
    feature: 'user_management',
    external: true,
  },
  {
    title: 'System Admin',
    url: '/admin/system',
    icon: Shield,
    feature: 'system_admin',
    external: true,
  },
];

const secondaryNavItems: Array<{title: string, url: string, icon: any, external?: boolean}> = [];

interface TMEPortalSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TMEPortalSidebar({ activeTab, onTabChange }: TMEPortalSidebarProps) {
  const { user } = useAuth()
  const { canAccessFeature } = usePermissions()
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = React.useState(false)
  
  // Review modal state - centralized here
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false)
  const [selectedApplication, setSelectedApplication] = React.useState<Application | null>(null)
  const [loadingApplication, setLoadingApplication] = React.useState(false)
  
  // Feedback modal state - for submitters receiving feedback
  const [feedbackModalOpen, setFeedbackModalOpen] = React.useState(false)
  const [feedbackApplication, setFeedbackApplication] = React.useState<Application | null>(null)

  const handleNavClick = (url: string, external?: boolean) => {
    if (external) {
      window.location.href = url;
      return;
    }
    const tabId = url.replace('#', '') as TabId;
    onTabChange(tabId);
  };

  // Handle notification clicks - different behavior for reviewers vs submitters
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.application_id) {
      return;
    }

    // Close notification panel
    setIsNotificationPanelOpen(false);

    if (notification.type === 'review_requested') {
      // For reviewers: Open review modal
      // Close any existing modal first
      if (reviewModalOpen) {
        setReviewModalOpen(false);
        setSelectedApplication(null);
      }

      setLoadingApplication(true);
      try {
        // Fetch the application details
        const response = await fetch(`/api/applications/${notification.application_id}`);
        if (response.ok) {
          const data = await response.json();
          setSelectedApplication(data.application);
          setReviewModalOpen(true);
        } else {
          console.error('Failed to fetch application:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching application:', error);
      } finally {
        setLoadingApplication(false);
      }
    } else if (notification.type === 'application_approved' || notification.type === 'application_rejected' || notification.type === 'review_completed') {
      // For submitters: Show feedback modal first
      setLoadingApplication(true);
      try {
        // Fetch the application details
        const response = await fetch(`/api/applications/${notification.application_id}`);
        if (response.ok) {
          const data = await response.json();
          const application = data.application;
          
          // Show feedback modal to the submitter
          setFeedbackApplication(application);
          setFeedbackModalOpen(true);
        } else {
          console.error('Failed to fetch application:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching application:', error);
      } finally {
        setLoadingApplication(false);
      }
    }
  };

  // Handle edit form action from feedback modal
  const handleEditFormFromFeedback = () => {
    if (!feedbackApplication) return;
    
    // Close feedback modal
    setFeedbackModalOpen(false);
    
    // Trigger edit event to pre-fill the Golden Visa form
    const editEvent = new CustomEvent('edit-golden-visa-application', {
      detail: {
        applicationId: feedbackApplication.id,
        formData: feedbackApplication.form_data
      }
    });
    window.dispatchEvent(editEvent);
    
    // Switch to Golden Visa tab
    onTabChange('golden-visa');
    
    // Clear feedback application
    setFeedbackApplication(null);
  };

  // Handle review actions
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

  const visibleNavItems = baseNavItems.filter(item => canAccessFeature(item.feature));
  const visibleAdminItems = adminNavItems.filter(item => canAccessFeature(item.feature));

  const navData = {
    navMain: visibleNavItems.map(item => ({
      ...item,
      isActive: activeTab === item.url.replace('#', ''),
    })),
  };

  return (
    <>
      <Sidebar 
        collapsible="offcanvas" 
        variant="inset"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <div className="flex items-center justify-between w-full">
                  <div 
                    className="flex items-center cursor-pointer flex-1"
                    onClick={() => {
                      // Don't navigate to profile if notification panel is open
                      if (!isNotificationPanelOpen) {
                        handleNavClick('#profile');
                      }
                    }}
                  >
                    <div className="flex items-center justify-center w-8 h-8 mr-2">
                      <Image 
                        src="/logo.png" 
                        alt="TME Logo" 
                        width={32} 
                        height={32} 
                        className="rounded-lg"
                      />
                    </div>
                    <span className="text-base font-semibold">TME Portal</span>
                  </div>
                  
                  {/* Notification Badge */}
                  <div className="relative">
                    <NotificationBadge
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsNotificationPanelOpen(!isNotificationPanelOpen);
                      }}
                      size="md"
                    />
                    
                    {/* Notification Panel */}
                    <NotificationPanel
                      isOpen={isNotificationPanelOpen}
                      onClose={() => setIsNotificationPanelOpen(false)}
                      onNotificationClick={handleNotificationClick}
                    />
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Portal Services</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMain 
                items={navData.navMain} 
                activeTab={activeTab}
                onItemClick={handleNavClick}
              />
            </SidebarGroupContent>
          </SidebarGroup>

          {visibleAdminItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleAdminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        size="sm"
                        onClick={() => handleNavClick(item.url, item.external)}
                      >
                        <a href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

        </SidebarContent>
        
        <SidebarFooter>
          {user && <NavUser user={user} />}
        </SidebarFooter>
      </Sidebar>
      
      {/* Review Modal - centrally managed */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedApplication(null);
        }}
        application={selectedApplication}
        onReviewAction={handleReviewAction}
      />
      
      {/* Feedback Modal - for submitters receiving feedback */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => {
          setFeedbackModalOpen(false);
          setFeedbackApplication(null);
        }}
        application={feedbackApplication}
        onEditForm={handleEditFormFromFeedback}
      />
    </>
  )
} 