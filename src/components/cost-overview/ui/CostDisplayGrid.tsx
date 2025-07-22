import React from 'react';

interface CostDisplayGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Consistent grid layout for cost displays
 * Uses the standardized 3-column layout: Description | AED | Secondary Currency
 */
export const CostDisplayGrid: React.FC<CostDisplayGridProps> = ({
  children,
  className = ''
}) => (
  <div 
    className={`grid gap-4 items-center ${className}`} 
    style={{ gridTemplateColumns: '1fr 120px 120px' }}
  >
    {children}
  </div>
);

interface CostDisplayHeaderProps {
  currency: string;
  className?: string;
}

/**
 * Standardized header for cost display grids
 */
export const CostDisplayHeader: React.FC<CostDisplayHeaderProps> = ({
  currency,
  className = ''
}) => (
  <CostDisplayGrid className={`pb-3 mb-4 border-b border-gray-200 font-semibold text-sm text-gray-700 ${className}`}>
    <div>Description</div>
    <div className="text-right">AED</div>
    <div className="text-right">{currency}</div>
  </CostDisplayGrid>
); 