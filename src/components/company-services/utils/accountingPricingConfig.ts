/**
 * Pricing configuration for accounting services
 */

/**
 * Pricing structure for monthly accounting (100-2750 transactions)
 */
export const MONTHLY_PRICING = {
  100: 2079,
  200: 3124,
  300: 4057,
  400: 4866,
  500: 5686,
  750: 7180,
  1000: 8911,
  1250: 10764,
  1500: 12494,
  1750: 14348,
  2000: 16078,
  2250: 17943,
  2500: 19673,
  2750: 21415,
} as const;

/**
 * Pricing structure for quarterly/yearly accounting (10-300 transactions)
 */
export const QUARTERLY_YEARLY_PRICING = {
  10: { monthly: 354, quarterly: 850, yearly: 2549 },
  15: { monthly: 499, quarterly: 1198, yearly: 3593 },
  20: { monthly: 623, quarterly: 1497, yearly: 4491 },
  30: { monthly: 874, quarterly: 2098, yearly: 6293 },
  60: { monthly: 1497, quarterly: 3593, yearly: 10779 },
  100: { monthly: 2079, quarterly: 4990, yearly: 14969 },
  200: { monthly: 3124, quarterly: 7498, yearly: 22493 },
  300: { monthly: 4057, quarterly: 9737, yearly: 29211 },
} as const;

/**
 * Utility function to format numbers with thousand separators
 */
export const formatNumberWithCommas = (num: number): string => {
  return num.toLocaleString('en-US');
};

/**
 * Default fees for various services
 */
export const DEFAULT_FEES = {
  plStatement: 1328,
  auditReport: 2100,
  commercialServices: 1000,
  personalUAEBank: 3150,
  digitalBankWIO: 3150,
  traditionalUAEBank: 7350,
  payrollSetup: 562,
  payrollPerPerson: 120,
  monthlyGroupReporting: 1236,
  // Tax Consulting Services
  citRegistration: 2921,
  citReturnFiling: 5198,
  vatRegistration: 3625,
  vatReturnFiling: 664,
} as const;

/**
 * Formatted default fees for placeholders and display
 */
export const FORMATTED_DEFAULT_FEES = {
  plStatement: formatNumberWithCommas(DEFAULT_FEES.plStatement),
  auditReport: formatNumberWithCommas(DEFAULT_FEES.auditReport),
  commercialServices: formatNumberWithCommas(DEFAULT_FEES.commercialServices),
  personalUAEBank: formatNumberWithCommas(DEFAULT_FEES.personalUAEBank),
  digitalBankWIO: formatNumberWithCommas(DEFAULT_FEES.digitalBankWIO),
  traditionalUAEBank: formatNumberWithCommas(DEFAULT_FEES.traditionalUAEBank),
  payrollSetup: formatNumberWithCommas(DEFAULT_FEES.payrollSetup),
  payrollPerPerson: formatNumberWithCommas(DEFAULT_FEES.payrollPerPerson),
  monthlyGroupReporting: formatNumberWithCommas(DEFAULT_FEES.monthlyGroupReporting),
  // Tax Consulting Services
  citRegistration: formatNumberWithCommas(DEFAULT_FEES.citRegistration),
  citReturnFiling: formatNumberWithCommas(DEFAULT_FEES.citReturnFiling),
  vatRegistration: formatNumberWithCommas(DEFAULT_FEES.vatRegistration),
  vatReturnFiling: formatNumberWithCommas(DEFAULT_FEES.vatReturnFiling),
} as const;

/**
 * Percentage-based fees
 */
export const PERCENTAGE_FEES = {
  vatBooking: 0.20, // 20% of monthly accounting fee
  costCenterBooking: 0.25, // 25% of monthly accounting fee
} as const;

/**
 * Get available transaction tiers for a service type
 */
export const getTransactionTiers = (serviceType: string): number[] => {
  if (serviceType === 'monthly') {
    return Object.keys(MONTHLY_PRICING).map(Number).sort((a, b) => a - b);
  } else if (serviceType === 'quarterly-yearly') {
    return Object.keys(QUARTERLY_YEARLY_PRICING).map(Number).sort((a, b) => a - b);
  }
  return [];
};

/**
 * Get pricing for a specific tier and service type
 */
export const getPricingForTier = (serviceType: string, tier: number) => {
  if (serviceType === 'monthly') {
    return MONTHLY_PRICING[tier as keyof typeof MONTHLY_PRICING];
  } else if (serviceType === 'quarterly-yearly') {
    return QUARTERLY_YEARLY_PRICING[tier as keyof typeof QUARTERLY_YEARLY_PRICING];
  }
  return null;
}; 