// Company Services Tab Types
// Following the established patterns from golden-visa.ts and offer.ts

export type CompanyType = 'tme-fzco' | 'management-consultants';

// Tax Consulting Services Interface
export interface TaxConsultingServices {
  enabled?: boolean; // Keep for backward compatibility with PDF rendering
  // Separate CIT and VAT service flags
  citEnabled?: boolean;
  vatEnabled?: boolean;
  // CIT-related fields
  citRegistrationEnabled?: boolean; // New checkbox field for CIT registration
  citRegistration?: number;
  citReturnFiling?: number;
  citType?: 'sbr-regular' | 'qfzp' | '' | undefined;
  // VAT-related fields
  vatType?: 'registration' | 'exception' | 'de-registration' | '' | undefined;
  vatRegistration?: number;
  vatReturnFiling?: number;
  vatReturnFilingType?: 'mini' | 'basic' | 'complex' | '' | undefined;
  clientManagedAccounting?: boolean;
}

// Accounting Services Interface
export interface AccountingServices {
  enabled?: boolean;
  serviceType?: 'monthly' | 'quarterly-yearly' | '';
  transactionTier?: number; // 100, 200, 300, etc.
  monthlyPrice?: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
  // Additional services
  vatBooking?: boolean;
  costCenterBooking?: boolean;
  monthlyGroupReporting?: boolean;
  // Annual services
  plStatementEnabled?: boolean;
  plStatementFee?: number;
  auditReportEnabled?: boolean;
  auditReportFee?: number;
  localAuditorFee?: boolean;
  // Commercial services
  commercialServices?: boolean;
  commercialServicesFee?: number;
  // Payroll services
  payrollServices?: boolean;
  payrollSetupFee?: number;
  payrollServicesEnabled?: boolean;
  payrollServicesPerPersonFee?: number;
  // Bank account opening
  bankAccountOpening?: boolean;
  personalUAEBank?: boolean;
  personalUAEBankFee?: number;
  digitalBankWIO?: boolean;
  digitalBankWIOFee?: number;
  traditionalUAEBank?: boolean;
  traditionalUAEBankFee?: number;
}

// Back-Office (PRO) Services Interface
export interface BackOfficeServices {
  enabled?: boolean;
  teamSize?: 'micro' | 'small' | 'medium' | 'large' | 'custom' | '';
  // Custom tier fields - for when teamSize is 'custom'
  customTier1From?: number; // e.g., 20
  customTier1To?: number;   // e.g., 25
  customTier1Fee?: number;
  customTier2From?: number; // e.g., 26
  customTier2To?: number;   // e.g., 30
  customTier2Fee?: number;
  customTier3From?: number; // e.g., 31
  customTier3To?: number;   // e.g., 50
  customTier3Fee?: number;
}

// Compliance Services Interface
export interface ComplianceServices {
  enabled?: boolean;
  periodicBankReviewType?: 'basic' | 'standard' | 'complex' | '';
  periodicBankReviewFee?: number;
  uboRegisterUpdatesType?: 'basic' | 'standard' | 'complex' | '';
  uboRegisterUpdatesFee?: number;
}

// Custom Page Content Types
export type ContentBlockType = 'heading' | 'paragraph' | 'numberedList' | 'table';

export interface TableCell {
  value: string;
  isHeader?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface TableData {
  rows: TableCell[][];
  columnWidths?: number[]; // Percentage widths for each column
}

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  order: number;
  content: {
    text?: string; // For heading, paragraph
    items?: string[]; // For bulletList, numberedList
    table?: TableData; // For table
  };
}

export interface CustomPage {
  id: string;
  enabled: boolean;
  order: number;
  blocks: ContentBlock[];
}

// Company Services Data Interface
export interface CompanyServicesData {
  // Client Details (shared across tabs)
  firstName?: string;
  lastName?: string;
  companyName?: string;
  shortCompanyName?: string;
  date: string;
  clientEmails: string[];
  
  // Secondary currency fields (consistent with other tabs)
  secondaryCurrency: 'EUR' | 'USD' | 'GBP';
  exchangeRate: number;
  
  // Company branding selection (determines PDF header)
  companyType: CompanyType;
  
  // Tax Consulting Services
  taxConsultingServices?: TaxConsultingServices;
  
  // Accounting Services
  accountingServices?: AccountingServices;
  
  // Back-Office (PRO) Services
  backOfficeServices?: BackOfficeServices;
  
  // Compliance Services
  complianceServices?: ComplianceServices;
  
  // Custom Pages
  customPages?: CustomPage[];
}

// Default values for Company Services
export const COMPANY_SERVICES_DEFAULTS = {
  clientDetails: {
    firstName: '',
    lastName: '',
    companyName: '',
    shortCompanyName: '',
    date: new Date().toISOString().split('T')[0],
    secondaryCurrency: 'EUR' as const,
    exchangeRate: 4.0,
  },
  form: {
    companyType: 'tme-fzco' as const,
    taxConsultingServices: {
      enabled: false, // Keep for backward compatibility
      citEnabled: false,
      vatEnabled: false,
      citRegistration: 0,
      citReturnFiling: 0,
      citType: '' as const,
      vatType: '' as const,
      vatRegistration: 0,
      vatReturnFiling: 0,
      vatReturnFilingType: '' as const,
      clientManagedAccounting: false,
    },
    accountingServices: {
      enabled: false,
      serviceType: '' as const,
      transactionTier: 0,
      monthlyPrice: 0,
      quarterlyPrice: 0,
      yearlyPrice: 0,
      // Additional services
      vatBooking: false,
      costCenterBooking: false,
      monthlyGroupReporting: false,
      // Annual services
      plStatementFee: 1328,
      auditReportFee: 2100,
      localAuditorFee: false,
      // Commercial services
      commercialServices: false,
      commercialServicesFee: 1000,
      // Payroll services
      payrollServices: false,
      payrollSetupFee: 562,
      payrollServicesEnabled: false,
      payrollServicesPerPersonFee: 120,
      // Bank account opening
      bankAccountOpening: false,
      personalUAEBank: false,
      personalUAEBankFee: 3000,
      digitalBankWIO: false,
      digitalBankWIOFee: 3000,
      traditionalUAEBank: false,
      traditionalUAEBankFee: 7000,
    },
    backOfficeServices: {
      enabled: false,
      teamSize: '' as const,
    },
    complianceServices: {
      enabled: false,
      periodicBankReviewType: '' as const,
      periodicBankReviewFee: 0,
      uboRegisterUpdatesType: '' as const,
      uboRegisterUpdatesFee: 0,
    },
  }
}; 