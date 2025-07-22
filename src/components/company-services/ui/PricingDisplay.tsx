'use client';

import React from 'react';
import { SECTION_COLORS } from '../utils/accountingServiceConfig';

interface PricingTier {
  tier: number;
  price?: number;
  pricing?: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
}

interface PricingDisplayProps {
  /**
   * Service type (monthly or quarterly-yearly)
   */
  serviceType: string;
  
  /**
   * Display tiers with pricing information
   */
  displayTiers: PricingTier[];
}

export const PricingDisplay: React.FC<PricingDisplayProps> = ({
  serviceType,
  displayTiers,
}) => {
  if (!serviceType || displayTiers.length === 0) {
    return null;
  }

  const isMonthly = serviceType === 'monthly';
  const colors = isMonthly ? SECTION_COLORS.monthlyPricing : SECTION_COLORS.quarterlyYearlyPricing;
  const title = isMonthly ? 'Monthly Service Pricing' : 'Quarterly/Yearly Service Pricing';

  return (
    <div className={`${colors.bg} rounded-xl p-6 border ${colors.border}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <div className={`w-2 h-2 ${colors.dotColor} rounded-full mr-2`}></div>
        {title}
      </h3>
      
      <div className="space-y-3">
        {displayTiers.map(({ tier, price, pricing }) => (
          <div key={tier} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              Up to {tier} transactions/month
            </span>
            {isMonthly ? (
              <span className="text-sm font-bold text-gray-900">
                AED {price?.toLocaleString()}
              </span>
            ) : (
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">
                  Quarterly: AED {pricing?.quarterly.toLocaleString()}
                </div>
                <div className="text-sm font-bold text-gray-900">
                  Yearly: AED {pricing?.yearly.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 