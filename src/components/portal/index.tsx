'use client'

import React, { Suspense } from 'react'
import { TMEPortalLayout } from './TMEPortalLayout'
import { useTabNavigation } from '@/hooks/useTabNavigation'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load tab components for performance
const CostOverviewTab = React.lazy(() => import('./tabs/CostOverviewTab'))
const GoldenVisaTab = React.lazy(() => import('./tabs/GoldenVisaTab'))
const CompanyServicesTab = React.lazy(() => import('./tabs/CompanyServicesTab'))
const CorporateChangesTab = React.lazy(() => import('./tabs/CorporateChangesTab'))
const TaxationTab = React.lazy(() => import('./tabs/TaxationTab'))

// Enhanced skeleton loading component for better UX
const TabContentSkeleton = () => (
  <div className="space-y-8 p-6">
    {/* Header Section Skeleton */}
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-[300px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </div>

    {/* Form Sections Skeleton */}
    {[1, 2, 3].map((section) => (
      <div key={section} className="space-y-4 bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-5 w-[200px]" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
    ))}

    {/* Action Buttons Skeleton */}
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <Skeleton className="h-12 w-[160px] rounded-2xl" />
      <Skeleton className="h-12 w-[160px] rounded-2xl" />
    </div>
  </div>
)

export default function TMEPortal() {
  const { activeTab, setActiveTab } = useTabNavigation()
  const [isAIAssistantOpen, setIsAIAssistantOpen] = React.useState(false)

  const handleOpenAIAssistant = () => {
    setIsAIAssistantOpen(!isAIAssistantOpen)
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'cost-overview':
        return (
          <CostOverviewTab 
            onOpenAIAssistant={handleOpenAIAssistant}
            isAIAssistantOpen={isAIAssistantOpen}
          />
        )
      case 'golden-visa':
        return <GoldenVisaTab />
      case 'company-services':
        return <CompanyServicesTab />
      case 'corporate-changes':
        return <CorporateChangesTab />
      case 'taxation':
        return <TaxationTab />
      default:
        return (
          <CostOverviewTab 
            onOpenAIAssistant={handleOpenAIAssistant}
            isAIAssistantOpen={isAIAssistantOpen}
          />
        )
    }
  }

  const handleGeneratePDF = () => {
    // PDF generation logic handled by individual tabs
    const event = new CustomEvent('generate-pdf', { detail: { activeTab } })
    window.dispatchEvent(event)
  }

  const handlePreview = () => {
    // Preview logic handled by individual tabs  
    const event = new CustomEvent('preview-document', { detail: { activeTab } })
    window.dispatchEvent(event)
  }

  return (
    <TMEPortalLayout 
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onGeneratePDF={handleGeneratePDF}
      onPreview={handlePreview}
      onOpenAIAssistant={activeTab === 'cost-overview' ? handleOpenAIAssistant : undefined}
      isAIAssistantOpen={activeTab === 'cost-overview' ? isAIAssistantOpen : false}
    >
      {/* Enhanced Tab Content with Skeleton Loading */}
      <Suspense fallback={<TabContentSkeleton />}>
        {renderActiveTab()}
      </Suspense>
    </TMEPortalLayout>
  )
} 