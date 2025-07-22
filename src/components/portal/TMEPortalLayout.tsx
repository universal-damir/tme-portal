'use client'

import * as React from 'react'
import { TabId } from '@/types/portal'
import { SharedClientProvider } from '@/contexts/SharedClientContext'
import { TMEPortalSidebar } from './TMEPortalSidebar'
import { TMEPortalHeader } from './TMEPortalHeader'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

interface TMEPortalLayoutProps {
  children: React.ReactNode
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  title?: string
  onGeneratePDF?: () => void
  onPreview?: () => void
  onOpenAIAssistant?: () => void
  isAIAssistantOpen?: boolean
}

const tabTitles: Record<TabId, string> = {
  'cost-overview': 'Cost Overview Generator',
  'golden-visa': 'Golden Visa Applications',
  'company-services': 'Company Services',
  'corporate-changes': 'Corporate Changes',
  'taxation': 'Tax Consultation & Filing',
}

export function TMEPortalLayout({ 
  children, 
  activeTab, 
  onTabChange,
  title,
  onGeneratePDF,
  onPreview,
  onOpenAIAssistant,
  isAIAssistantOpen
}: TMEPortalLayoutProps) {
  const currentTitle = title || tabTitles[activeTab] || 'TME Portal'

  return (
    <TooltipProvider delayDuration={300}>
      <SharedClientProvider>
        <SidebarProvider
          style={{
            '--sidebar-width': '280px',
            '--header-height': '56px',
          } as React.CSSProperties}
        >
          <TMEPortalSidebar 
            activeTab={activeTab} 
            onTabChange={onTabChange}
          />
          <SidebarInset>
            <TMEPortalHeader 
              title={currentTitle}
              onGeneratePDF={onGeneratePDF}
              onPreview={onPreview}
              onOpenAIAssistant={onOpenAIAssistant}
              isAIAssistantOpen={isAIAssistantOpen}
            />
            <div className={`flex flex-1 flex-col transition-all duration-300 ${
              isAIAssistantOpen 
                ? 'lg:pr-2 xl:pr-4' 
                : ''
            }`}>
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {children}
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SharedClientProvider>
    </TooltipProvider>
  )
} 