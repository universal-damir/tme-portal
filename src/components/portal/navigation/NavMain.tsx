'use client'

import { LucideIcon } from 'lucide-react'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { TabId } from '@/types/portal'

interface NavMainProps {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
  }[];
  activeTab: TabId;
  onItemClick: (url: string) => void;
}

export function NavMain({ items, activeTab, onItemClick }: NavMainProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Services</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const tabId = item.url.substring(1) as TabId;
            const isActive = activeTab === tabId;
            
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  onClick={() => onItemClick(item.url)}
                  className="w-full justify-start"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
} 