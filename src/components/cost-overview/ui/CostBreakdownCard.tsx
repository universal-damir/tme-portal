import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface CostBreakdownCardProps {
  title: string;
  children: React.ReactNode;
  currency: string;
  className?: string;
  cardClassName?: string;
  variant?: 'default' | 'blue' | 'purple' | 'pink' | 'green' | 'yellow' | 'sky';
  showTableHeader?: boolean;
}

/**
 * Shadcn Card component replacing CostBreakdownSection
 * Provides consistent styling with improved accessibility and design
 */
export const CostBreakdownCard: React.FC<CostBreakdownCardProps> = ({
  title,
  children,
  currency,
  className = '',
  cardClassName = '',
  variant = 'default',
  showTableHeader = true
}) => {
  // Define variant-based styling
  const getVariantStyles = () => {
    switch (variant) {
      case 'blue':
        return 'bg-blue-50 border-blue-200';
      case 'purple':
        return 'bg-purple-50 border-purple-200';
      case 'pink':
        return 'bg-pink-50 border-pink-200';
      case 'green':
        return 'bg-green-50 border-green-200';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200';
      case 'sky':
        return 'bg-sky-50 border-sky-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Card className={`${variantStyles} shadow-md ${cardClassName}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={className}>
        <div className="space-y-3">
          {/* Table with proper structure */}
          <div className="w-full overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              {showTableHeader && (
                <thead className="[&_tr]:border-b">
                  <tr className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                    <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap font-semibold text-sm text-gray-700">
                      Description
                    </th>
                    <th className="text-foreground h-10 px-2 text-right align-middle font-medium whitespace-nowrap font-semibold text-sm text-gray-700 w-[120px]">
                      AED
                    </th>
                    <th className="text-foreground h-10 px-2 text-right align-middle font-medium whitespace-nowrap font-semibold text-sm text-gray-700 w-[120px]">
                      {currency}
                    </th>
                  </tr>
                </thead>
              )}
              <tbody className="[&_tr:last-child]:border-0">
                {children}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface CostSummaryCardProps {
  title: string;
  children: React.ReactNode;
  currency: string;
  gradient?: string;
  textColor?: string;
  className?: string;
  exchangeRate?: number;
  showExchangeRate?: boolean;
}

/**
 * Enhanced Card component for cost summaries with gradient backgrounds
 * Replaces the custom gradient sections in cost summaries
 */
export const CostSummaryCard: React.FC<CostSummaryCardProps> = ({
  title,
  children,
  currency,
  gradient = 'from-blue-600 to-indigo-600',
  textColor = 'text-white',
  className = '',
  exchangeRate,
  showExchangeRate = true
}) => {
  return (
    <Card className={`bg-gradient-to-r ${gradient} shadow-md ${textColor} ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold opacity-90">
          {title.toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Table with proper structure */}
        <div className="w-full overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <tbody className="[&_tr:last-child]:border-0">
              {children}
            </tbody>
          </table>
        </div>
        {/* Exchange rate outside of table */}
        {showExchangeRate && exchangeRate && (
          <p className={`text-xs mt-4 ${textColor.includes('gray') ? 'opacity-70' : 'opacity-75'}`}>
            Exchange Rate: 1 {currency} = {exchangeRate} AED
          </p>
        )}
      </CardContent>
    </Card>
  );
}; 