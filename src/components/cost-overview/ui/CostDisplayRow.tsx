import React from 'react';
import { CostDisplayGrid } from './CostDisplayGrid';
import { getCurrencyDisplay } from '../utils/currencyHelpers';

interface CostDisplayRowProps {
  description: string;
  aedAmount: number;
  exchangeRate: number;
  isReduction?: boolean;
  className?: string;
}

/**
 * Reusable component for displaying cost line items
 * Replaces the repeated renderCostLine functionality
 */
export const CostDisplayRow: React.FC<CostDisplayRowProps> = ({
  description,
  aedAmount,
  exchangeRate,
  isReduction = false,
  className = ''
}) => {
  // Return null for zero amounts (same behavior as renderCostLine)
  if (aedAmount === 0) return null;

  const { aed, secondary } = getCurrencyDisplay({
    aedAmount,
    exchangeRate,
    isReduction
  });

  return (
    <CostDisplayGrid className={`${isReduction ? 'text-red-600' : ''} ${className}`}>
      <span className={isReduction ? '' : 'text-gray-600'}>
        {description}
      </span>
      <span className={`font-semibold text-right ${isReduction ? 'text-red-600' : 'text-gray-900'}`}>
        {aed}
      </span>
      <span className={`font-medium text-right ${isReduction ? 'text-red-500' : 'text-gray-600'}`}>
        {secondary}
      </span>
    </CostDisplayGrid>
  );
}; 