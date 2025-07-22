// Company Services Tab Types
// Following the established patterns from golden-visa.ts and offer.ts

export type CompanyType = 'tme-fzco' | 'management-consultants';

// Tax Consulting Services Interface
export interface TaxConsultingServices {
  enabled?: boolean;
  citRegistration?: number;
  citReturnFiling?: number;
  citType?: 'sbr-regular' | 'qfzp' | '' | undefined;
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
  plStatementFee?: number;
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
  teamSize?: 'micro' | 'small' | 'medium' | 'large' | '';
}

// Compliance Services Interface
export interface ComplianceServices {
  enabled?: boolean;
  periodicBankReviewType?: 'basic' | 'standard' | 'complex' | '';
  periodicBankReviewFee?: number;
  uboRegisterUpdatesType?: 'basic' | 'standard' | 'complex' | '';
  uboRegisterUpdatesFee?: number;
}

// Company Services Data Interface
export interface CompanyServicesData {
  // Client Details (shared across tabs)
  firstName?: string;
  lastName?: string;
  companyName?: string;
  shortCompanyName?: string;
  date: string;
  
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
}

// Default values for Company Services
export const COMPANY_SERVICES_DEFAULTS = {
  clientDetails: {
    firstName: '',
    lastName: '',
    companyName: '',
    shortCompanyName: '',
    date: new Date().toISOString().split('T')[0],
    secondaryCurrency: 'USD' as const,
    exchangeRate: 3.67,
  },
  form: {
    companyType: 'tme-fzco' as const,
    taxConsultingServices: {
      enabled: false,
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
      personalUAEBankFee: 3150,
      digitalBankWIO: false,
      digitalBankWIOFee: 3150,
      traditionalUAEBank: false,
      traditionalUAEBankFee: 7350,
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