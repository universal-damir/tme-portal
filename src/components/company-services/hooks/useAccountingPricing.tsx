'use client';

import { useMemo } from 'react';
import { CompanyServicesData } from '@/types/company-services';
import { 
  getTransactionTiers, 
  MONTHLY_PRICING, 
  QUARTERLY_YEARLY_PRICING 
} from '../utils/accountingPricingConfig';

export const useAccountingPricing = (watchedData: CompanyServicesData) => {
  // Get available transaction tiers based on service type
  const transactionTiers = useMemo(() => {
    const serviceType = watchedData.accountingServices?.serviceType;
    return getTransactionTiers(serviceType || '');
  }, [watchedData.accountingServices?.serviceType]);

  // Get display tiers for monthly service - always show 3 tiers
  const displayTiers = useMemo(() => {
    const currentTier = watchedData.accountingServices?.transactionTier;
    if (!currentTier || watchedData.accountingServices?.serviceType !== 'monthly') return [];
    
    const currentIndex = transactionTiers.findIndex(tier => tier === currentTier);
    if (currentIndex === -1) return [];
    
    // Always show 3 tiers, adjusting range if needed
    let startIndex = currentIndex;
    if (currentIndex + 3 > transactionTiers.length) {
      startIndex = Math.max(0, transactionTiers.length - 3);
    }
    
    return transactionTiers.slice(startIndex, startIndex + 3).map(tier => ({
      tier,
      price: MONTHLY_PRICING[tier as keyof typeof MONTHLY_PRICING],
    }));
  }, [watchedData.accountingServices?.transactionTier, watchedData.accountingServices?.serviceType, transactionTiers]);

  // Get quarterly/yearly pricing display - always show 3 tiers
  const quarterlyYearlyDisplayTiers = useMemo(() => {
    const currentTier = watchedData.accountingServices?.transactionTier;
    if (!currentTier || watchedData.accountingServices?.serviceType !== 'quarterly-yearly') return [];
    
    const currentIndex = transactionTiers.findIndex(tier => tier === currentTier);
    if (currentIndex === -1) return [];
    
    // Always show 3 tiers, adjusting range if needed
    let startIndex = currentIndex;
    if (currentIndex + 3 > transactionTiers.length) {
      startIndex = Math.max(0, transactionTiers.length - 3);
    }
    
    return transactionTiers.slice(startIndex, startIndex + 3).map(tier => ({
      tier,
      pricing: QUARTERLY_YEARLY_PRICING[tier as keyof typeof QUARTERLY_YEARLY_PRICING],
    }));
  }, [watchedData.accountingServices?.transactionTier, watchedData.accountingServices?.serviceType, transactionTiers]);

  // Combine display tiers for the PricingDisplay component
  const combinedDisplayTiers = useMemo(() => {
    const serviceType = watchedData.accountingServices?.serviceType;
    if (serviceType === 'monthly') {
      return displayTiers;
    } else if (serviceType === 'quarterly-yearly') {
      return quarterlyYearlyDisplayTiers;
    }
    return [];
  }, [displayTiers, quarterlyYearlyDisplayTiers, watchedData.accountingServices?.serviceType]);

  return {
    transactionTiers,
    displayTiers,
    quarterlyYearlyDisplayTiers,
    combinedDisplayTiers,
  };
}; 