'use client'

import * as React from 'react'
import {
  FileBarChart,
  Building2,
  Crown,
  Briefcase,
  Receipt,
  Settings,
  HelpCircle,
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

// TME Portal navigation data with enhanced structure
const portalData = {
  user: {
    name: 'TME User',
    email: 'user@TME-Services.com',
    avatar: '/logo.png',
  },
  navMain: [
    {
      title: 'Cost Overview',
      url: '#cost-overview',
      icon: FileBarChart,
      isActive: true,
    },
    {
      title: 'Golden Visa',
      url: '#golden-visa',
      icon: Crown,
    },
    {
      title: 'Company Services',
      url: '#company-services',
      icon: Building2,
    },
    {
      title: 'Corporate Changes',
      url: '#corporate-changes',
      icon: Briefcase,
    },
    {
      title: 'Taxation',
      url: '#taxation',
      icon: Receipt,
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '#settings',
      icon: Settings,
    },
    {
      title: 'Help & Support',
      url: '#help',
      icon: HelpCircle,
    },
  ],
}

interface TMEPortalSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TMEPortalSidebar({ activeTab, onTabChange }: TMEPortalSidebarProps) {
  const handleNavClick = (url: string) => {
    const tabId = url.replace('#', '') as TabId;
    onTabChange(tabId);
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
              <div className="flex items-center cursor-pointer">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg mr-2">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-base font-semibold">TME Portal</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <NavMain 
          items={portalData.navMain} 
          activeTab={activeTab}
          onItemClick={handleNavClick}
        />
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {portalData.navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="sm">
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
      </SidebarContent>
      
      <SidebarFooter>
        <NavUser user={portalData.user} />
      </SidebarFooter>
    </Sidebar>
  )
} 