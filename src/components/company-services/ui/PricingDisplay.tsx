'use client';

import React from 'react';
import { motion } from 'framer-motion';

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
  const title = isMonthly ? 'Monthly Service Pricing' : 'Quarterly/Yearly Service Pricing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg p-4 border border-gray-200"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <h3 className="text-base font-semibold mb-3" style={{ color: '#243F7B' }}>
        {title}
      </h3>
      
      <div className="space-y-3">
        {displayTiers.map(({ tier, price, pricing }, index) => (
          <motion.div 
            key={tier}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
          >
            <span className="text-sm font-medium text-gray-700">
              Up to {tier} transactions/month
            </span>
            {isMonthly ? (
              <span className="text-sm font-bold" style={{ color: '#243F7B' }}>
                AED {price?.toLocaleString()}
              </span>
            ) : (
              <div className="text-right">
                <div className="text-sm font-bold" style={{ color: '#243F7B' }}>
                  Quarterly: AED {pricing?.quarterly.toLocaleString()}
                </div>
                <div className="text-sm font-bold" style={{ color: '#243F7B' }}>
                  Yearly: AED {pricing?.yearly.toLocaleString()}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}; 