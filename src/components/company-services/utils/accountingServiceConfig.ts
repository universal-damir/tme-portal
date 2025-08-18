/**
 * Service configuration for accounting services
 */

import { FORMATTED_DEFAULT_FEES } from './accountingPricingConfig';

/**
 * Service type options for accounting services
 */
export const SERVICE_TYPE_OPTIONS = [
  { value: 'monthly', label: 'Monthly Accounting' },
  { value: 'quarterly-yearly', label: 'Quarterly/Yearly Accounting' }
] as const;

/**
 * Color schemes for different sections
 */
export const SECTION_COLORS = {
  serviceType: {
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    dotColor: 'bg-purple-500',
    ringColor: 'focus:ring-purple-500',
    textColor: 'text-purple-600',
  },
  transactionTier: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    dotColor: 'bg-blue-500',
    ringColor: 'focus:ring-blue-500',
    textColor: 'text-blue-600',
  },
  monthlyPricing: {
    bg: 'bg-green-50',
    border: 'border-green-100',
    dotColor: 'bg-green-500',
    ringColor: 'focus:ring-green-500',
    textColor: 'text-green-600',
  },
  quarterlyYearlyPricing: {
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    dotColor: 'bg-orange-500',
    ringColor: 'focus:ring-orange-500',
    textColor: 'text-orange-600',
  },
  additionalServices: {
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    dotColor: 'bg-teal-500',
    ringColor: 'focus:ring-teal-500',
    textColor: 'text-teal-600',
  },
  annualServices: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    dotColor: 'bg-indigo-500',
    ringColor: 'focus:ring-indigo-500',
    textColor: 'text-indigo-600',
  },
  commercialServices: {
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    dotColor: 'bg-rose-500',
    ringColor: 'focus:ring-rose-500',
    textColor: 'text-rose-600',
  },
} as const;

/**
 * Additional service configurations
 */
export const ADDITIONAL_SERVICES = [
  {
    key: 'vatBooking',
    label: 'VAT Booking',
    description: 'Fee is 20% of the monthly financial accounting fee',
  },
  {
    key: 'costCenterBooking',
    label: 'Cost-Center Booking and Reporting',
    description: 'Fee is 25% of the monthly financial accounting fee',
  },
  {
    key: 'monthlyGroupReporting',
    label: 'Monthly Group Reporting',
    description: `Fee is AED ${FORMATTED_DEFAULT_FEES.monthlyGroupReporting} per month`,
  },
] as const;

/**
 * Bank account service configurations
 */
export const BANK_ACCOUNT_SERVICES = [
  {
    key: 'personalUAEBank',
    label: 'Personal bank account with a UAE bank',
    feeKey: 'personalUAEBankFee',
    placeholder: FORMATTED_DEFAULT_FEES.personalUAEBank,
  },
  {
    key: 'digitalBankWIO',
    label: 'Company account with the digital bank WIO',
    feeKey: 'digitalBankWIOFee',
    placeholder: FORMATTED_DEFAULT_FEES.digitalBankWIO,
  },
  {
    key: 'traditionalUAEBank',
    label: 'Company account with a traditional UAE bank',
    feeKey: 'traditionalUAEBankFee',
    placeholder: FORMATTED_DEFAULT_FEES.traditionalUAEBank,
  },
] as const;

/**
 * Annual service configurations
 */
export const ANNUAL_SERVICES = [
  {
    key: 'plStatementFee',
    label: 'Financial Statement Fee (AED)',
    placeholder: FORMATTED_DEFAULT_FEES.plStatement,
    description: 'For the preparation of the balance sheet and P/L statement at the end of each year',
  },
  {
    key: 'auditReportFee',
    label: 'Audit Guiding Fee (AED)',
    placeholder: FORMATTED_DEFAULT_FEES.auditReport,
    description: 'If an audit report is requested by the authority or based on shareholder request.',
  },
] as const; 