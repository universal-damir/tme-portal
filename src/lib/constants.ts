export const COMPANY_SETUP_TYPES = [
  'Limited Liability Company (LLC)',
  'Corporation (Corp)',
  'Partnership',
  'Sole Proprietorship',
  'Cooperative',
  'Non-Profit Organization'
] as const;

export const CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'CNY'
] as const;

// Import authority names from the new registry
import { getAuthorityNames } from './authorities/registry';

// Legacy constant for backward compatibility - now dynamically generated
export const AUTHORITIES = getAuthorityNames();

export const LEGAL_ENTITIES = [
  'Public Limited Company',
  'Private Limited Company',
  'Limited Liability Partnership',
  'General Partnership',
  'Sole Trader',
  'Branch Office'
] as const;

export const AREAS = [
  'Financial Services',
  'Technology',
  'Healthcare',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Consulting',
  'Import/Export'
] as const; 