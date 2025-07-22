import React from 'react';
import { CostDisplayHeader } from './CostDisplayGrid';

interface CostBreakdownSectionProps {
  title: string;
  children: React.ReactNode;
  currency: string;
  className?: string;
  headerClassName?: string;
}

/**
 * Wrapper component for cost breakdown sections with consistent header and styling
 */
export const CostBreakdownSection: React.FC<CostBreakdownSectionProps> = ({
  title,
  children,
  currency,
  className = '',
  headerClassName = ''
}) => (
  <div className={`bg-white rounded-xl p-6 shadow-md ${className}`}>
    <h4 className="text-lg font-semibold text-gray-900 mb-4">{title}</h4>
    
    <CostDisplayHeader 
      currency={currency} 
      className={headerClassName}
    />
    
    <div className="space-y-3">
      {children}
    </div>
  </div>
); 