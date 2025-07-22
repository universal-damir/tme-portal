import React from 'react';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';

interface CostDisplayTableRowProps {
  description: string;
  aedAmount: number;
  exchangeRate: number;
  isReduction?: boolean;
  className?: string;
}

/**
 * Shadcn TableRow component replacing CostDisplayRow
 * Handles currency formatting and reduction styling
 */
export const CostDisplayTableRow: React.FC<CostDisplayTableRowProps> = ({
  description,
  aedAmount,
  exchangeRate,
  isReduction = false,
  className = ''
}) => {
  // Return null for zero amounts (same behavior as original CostDisplayRow)
  if (aedAmount === 0) return null;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const secondaryAmount = aedAmount / exchangeRate;

  return (
    <TableRow className={`${isReduction ? 'text-red-600' : ''} ${className}`}>
      <TableCell className={isReduction ? '' : 'text-gray-600'}>
        {description}
      </TableCell>
      <TableCell className={`font-semibold text-right ${isReduction ? 'text-red-600' : 'text-gray-900'} w-[120px]`}>
        {isReduction ? '-' : ''}{formatCurrency(aedAmount)}
      </TableCell>
      <TableCell className={`font-medium text-right ${isReduction ? 'text-red-500' : 'text-gray-600'} w-[120px]`}>
        {isReduction ? '-' : ''}{formatCurrency(secondaryAmount)}
      </TableCell>
    </TableRow>
  );
}; 