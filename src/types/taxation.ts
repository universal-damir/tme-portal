// Taxation Tab Types
// Following the established patterns from company-services.ts and golden-visa.ts

export type CompanyType = 'tme-fzco' | 'management-consultants';

export type Designation = 'Director' | 'General Manager' | 'Manager' | 'Managing partner' | 'Shareholder';

// Tax Period Date Range Interface
export interface TaxPeriodDateRange {
  fromDate?: string;
  toDate?: string;
}

// CIT Disclaimer Interface - Now includes revenue fields
export interface CITDisclaimer {
  enabled?: boolean;
  taxPeriodRange?: TaxPeriodDateRange;
  generatedRevenue?: number;
  noRevenueGenerated?: boolean;
}

// CIT Shareholder Declaration Interface - Simplified, removed tax period and additional declarations
export interface CITShareholderDeclaration {
  smallBusinessRelief?: boolean;
  companyLiquidation?: boolean;
  booksAccountsDeductibleExpenses?: 'contain' | 'do-not-contain';
  clientContactNumber?: string;
  designation?: Designation;
  licenceNumber?: string;
  hasOwnHeaderFooter?: boolean;
}



// Main Taxation Data Interface
export interface TaxationData {
  // Client Details (without secondary currency and exchange rate)
  firstName: string;
  lastName: string; 
  companyName: string;
  shortCompanyName: string;
  date: string;
  
  // Company selection
  companyType: CompanyType;
  
  // Main sections
  citDisclaimer: CITDisclaimer;
  citShareholderDeclaration: CITShareholderDeclaration;
}

// Default values for taxation form
export const TAXATION_DEFAULTS = {
  clientDetails: {
    firstName: '',
    lastName: '',
    companyName: '',
    shortCompanyName: '',
    date: new Date().toISOString().split('T')[0],
  },
  form: {
    companyType: 'tme-fzco' as const,
    citDisclaimer: {
      enabled: false,
      taxPeriodRange: {
        fromDate: '2025-01-01',
        toDate: '2025-12-31',
      },
      generatedRevenue: 0,
      noRevenueGenerated: false,
    },
    citShareholderDeclaration: {
      smallBusinessRelief: false,
      companyLiquidation: false,
      booksAccountsDeductibleExpenses: undefined,
      clientContactNumber: '',
      designation: undefined,
      licenceNumber: '',
      hasOwnHeaderFooter: false,
    },
  },
};

// Designation options for dropdown
export const DESIGNATION_OPTIONS = [
  { value: 'Director', label: 'Director' },
  { value: 'General Manager', label: 'General Manager' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Managing partner', label: 'Managing partner' },
  { value: 'Shareholder', label: 'Shareholder' },
] as const; 