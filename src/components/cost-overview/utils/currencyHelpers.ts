/**
 * Shared currency formatting utilities for cost overview components
 */

/**
 * Formats a number as currency with locale-specific formatting
 */
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

/**
 * Formats an amount in secondary currency (converted from AED)
 */
export const formatSecondaryCurrency = (aedAmount: number, exchangeRate: number): string => {
  return formatCurrency(aedAmount / exchangeRate);
};

/**
 * Currency display configuration for consistent styling
 */
export interface CurrencyDisplayConfig {
  aedAmount: number;
  exchangeRate: number;
  isReduction?: boolean;
  showPrefix?: boolean;
}

/**
 * Gets formatted currency values for display
 */
export const getCurrencyDisplay = ({ 
  aedAmount, 
  exchangeRate, 
  isReduction = false, 
  showPrefix = true 
}: CurrencyDisplayConfig) => {
  const prefix = isReduction && showPrefix ? '-' : '';
  
  return {
    aed: prefix + formatCurrency(aedAmount),
    secondary: prefix + formatSecondaryCurrency(aedAmount, exchangeRate),
    prefix
  };
}; 