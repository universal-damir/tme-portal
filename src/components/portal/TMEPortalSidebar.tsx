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
    title: 'Company Services',
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

  const handleNavClick = (url: string, external?: boolean) => {
    if (external) {
      window.location.href = url;
      return;
    }
    const tabId = url.replace('#', '') as TabId;
    onTabChange(tabId);
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
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => handleNavClick('#profile')}
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
  )
} 