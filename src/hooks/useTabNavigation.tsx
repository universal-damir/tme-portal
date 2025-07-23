'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { TabId } from '@/types/portal';

const DEFAULT_TAB: TabId = 'profile';

export const useTabNavigation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Get initial tab from URL or default
  const getInitialTab = (): TabId => {
    const tabFromUrl = searchParams?.get('tab') as TabId;
    const validTabs: TabId[] = [
      'profile',
      'cost-overview',
      'golden-visa', 
      'company-services',
      'corporate-changes',
      'taxation'
    ];
    
    return validTabs.includes(tabFromUrl) ? tabFromUrl : DEFAULT_TAB;
  };

  const [activeTab, setActiveTabState] = useState<TabId>(getInitialTab);
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set([getInitialTab()]));

  // Update URL when tab changes
  const updateUrlWithTab = useCallback((tabId: TabId) => {
    const current = new URLSearchParams(Array.from(searchParams?.entries() || []));
    current.set('tab', tabId);
    
    const newUrl = `${pathname}?${current.toString()}`;
    router.push(newUrl, { scroll: false });
  }, [router, pathname, searchParams]);

  // Set active tab with URL update
  const setActiveTab = useCallback((tabId: TabId) => {
    setActiveTabState(tabId);
    setVisitedTabs(prev => new Set([...prev, tabId]));
    updateUrlWithTab(tabId);
  }, [updateUrlWithTab]);

  // Listen for URL changes (browser back/forward)
  useEffect(() => {
    const tabFromUrl = searchParams?.get('tab') as TabId;
    const validTabs: TabId[] = [
      'profile',
      'cost-overview',
      'golden-visa',
      'company-services', 
      'corporate-changes',
      'taxation'
    ];
    
    if (validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl);
      setVisitedTabs(prev => new Set([...prev, tabFromUrl]));
    }
  }, [searchParams, activeTab]);

  // Navigation helpers
  const goToNextTab = useCallback(() => {
    const tabs: TabId[] = [
      'profile',
      'cost-overview',
      'golden-visa',
      'company-services',
      'corporate-changes',
      'taxation'
    ];
    
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < tabs.length) {
      setActiveTab(tabs[nextIndex]);
    }
  }, [activeTab, setActiveTab]);

  const goToPreviousTab = useCallback(() => {
    const tabs: TabId[] = [
      'profile',
      'cost-overview',
      'golden-visa',
      'company-services',
      'corporate-changes',
      'taxation'
    ];
    
    const currentIndex = tabs.indexOf(activeTab);
    const previousIndex = currentIndex - 1;
    
    if (previousIndex >= 0) {
      setActiveTab(tabs[previousIndex]);
    }
  }, [activeTab, setActiveTab]);

  const isTabVisited = useCallback((tabId: TabId) => {
    return visitedTabs.has(tabId);
  }, [visitedTabs]);

  return {
    activeTab,
    setActiveTab,
    visitedTabs,
    goToNextTab,
    goToPreviousTab,
    isTabVisited,
  };
}; 