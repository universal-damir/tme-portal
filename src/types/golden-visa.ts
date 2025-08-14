export type CompanyType = 'tme-fzco' | 'management-consultants';
export type GoldenVisaType = 'property-investment' | 'time-deposit' | 'skilled-employee';
export type FreezoneType = 'dmcc' | 'adgm' | 'difc' | 'ifza' | 'abu-dhabi' | 'dafza' | 'jafza' | 'dubai-internet-city' | 'meydan';

// Authority cost breakdown fields for different visa types
export interface PropertyAuthorityFeesData {
  professionalPassportPicture: number;
  dldApprovalFee: number;
  standardAuthorityCosts: number;
  mandatoryUaeMedicalTest: number;
  emiratesIdFee: number;
  immigrationResidencyFee: number;
  visaCancelation: boolean;
  visaCancelationFee: number;
  thirdPartyCosts: number;
}

export interface SkilledEmployeeAuthorityFeesData {
  professionalPassportPicture: number;
  // No DLD fee for skilled/employee
  standardAuthorityCosts: number;
  mandatoryUaeMedicalTest: number;
  emiratesIdFee: number;
  immigrationResidencyFee: number;
  visaCancelation: boolean;
  visaCancelationFee: number;
  thirdPartyCosts: number;
}

export interface DependentAuthorityFeesData {
  professionalPassportPicture: number;
  dependentFileOpening: number; // Replaces DLD for dependents - only applies once
  standardAuthorityCostsSpouse: number;
  standardAuthorityCostsChild: number;
  mandatoryUaeMedicalTest: number;
  emiratesIdFee: number;
  immigrationResidencyFeeSpouse: number;
  immigrationResidencyFeeChild: number;
  visaCancelation: boolean;
  visaCancelationFee: number;
  thirdPartyCostsSpouse: number;
  thirdPartyCostsChild: number;
}

export interface GoldenVisaData {
  // Client Details (for independent form)
  firstName?: string;
  lastName?: string;
  companyName?: string;
  date: string;
  clientEmails: string[];
  
  // Secondary currency fields (same as cost overview)
  secondaryCurrency: 'EUR' | 'USD' | 'GBP';
  exchangeRate: number;
  
  // Company branding selection
  companyType: CompanyType;
  
  // Visa type selection
  visaType: GoldenVisaType;
  
  // Primary visa selection (optional)
  primaryVisaRequired: boolean;
  
  // Authority cost breakdowns for different visa types
  propertyAuthorityFees?: PropertyAuthorityFeesData;
  skilledEmployeeAuthorityFees?: SkilledEmployeeAuthorityFeesData;
  dependentAuthorityFees?: DependentAuthorityFeesData;
  
  // Skilled Employee specific fields
  requiresNOC?: boolean;
  selectedFreezone?: FreezoneType;
  nocCost?: number;
  
  // Salary Certificate specific fields
  requiresSalaryCertificate?: boolean;
  selectedSalaryCertificateFreezone?: FreezoneType;
  salaryCertificateFee?: number;
  
  // Legacy government and service fees (editable with defaults from docs)
  governmentFee: number;
  tmeServicesFee: number;
  freezoneNocFee?: number; // Dynamic freezone NOC fee
  governmentCostsSkilledEmployee?: number; // Renamed from medicalEidFee
  
  // Dependent visas (simplified - no age distinction)
  dependents: {
    spouse?: {
      required: boolean;
      governmentFee: number;
      tmeServicesFee: number;
      visaCancelation?: boolean;
      visaCancelationFee?: number;
    };
    children?: {
      count: number;
      governmentFee: number;
      tmeServicesFee: number;
      visaCancelation?: boolean;
      visaCancelationFee?: number;
    };
  };
}

// Default values from the PDF documents - Updated with new TME service fees
export const GOLDEN_VISA_DEFAULTS = {
  // Client details defaults
  clientDetails: {
    firstName: '',
    lastName: '',
    companyName: '',
    date: new Date().toISOString().split('T')[0],
    secondaryCurrency: 'EUR' as const,
    exchangeRate: 4.0,
  },
  // Primary visa defaults
  primaryVisaRequired: true,
  propertyInvestment: {
    governmentFee: 10000,
    tmeServicesFee: 4820 // Updated from 4585 to 4820
  },
  timeDeposit: {
    governmentFee: 10000,
    tmeServicesFee: 4820 // Updated from 4585 to 4820
  },
  skilledEmployee: {
    freezoneNocFee: 2020,
    governmentCostsSkilledEmployee: 5000,
    tmeServicesFee: 4820 // Updated from 4587 to 4820
  },
  dependents: {
    spouse: {
      governmentFee: 6730,
      tmeServicesFee: 2240 // Updated from 3490 to 2240
    },
    child: {
      governmentFee: 5500,
      tmeServicesFee: 1690 // Updated from 2930 to 1690
    }
  },
  // New authority fee defaults for Property Investment Golden Visa
  propertyAuthorityFees: {
    professionalPassportPicture: 25.00,
    dldApprovalFee: 4020.00,
    standardAuthorityCosts: 5010.00,
    mandatoryUaeMedicalTest: 700.00,
    emiratesIdFee: 1155.00,
    immigrationResidencyFee: 3160.00,
    visaCancelation: false,
    visaCancelationFee: 185.00,
    thirdPartyCosts: 1460.00,
  },
  // New authority fee defaults for Skilled/Employee Golden Visa (no DLD)
  skilledEmployeeAuthorityFees: {
    professionalPassportPicture: 25.00,
    standardAuthorityCosts: 5010.00,
    mandatoryUaeMedicalTest: 700.00,
    emiratesIdFee: 1155.00,
    immigrationResidencyFee: 3160.00,
    visaCancelation: false,
    visaCancelationFee: 185.00,
    thirdPartyCosts: 1460.00,
  },
  // New authority fee defaults for Time Deposit Golden Visa (same as skilled employee - no DLD)
  timeDepositAuthorityFees: {
    professionalPassportPicture: 25.00,
    standardAuthorityCosts: 5010.00,
    mandatoryUaeMedicalTest: 700.00,
    emiratesIdFee: 1155.00,
    immigrationResidencyFee: 3160.00,
    visaCancelation: false,
    visaCancelationFee: 185.00,
    thirdPartyCosts: 1460.00,
  },
  // New authority fee defaults for Dependent visas
  dependentAuthorityFees: {
    professionalPassportPicture: 25.00,
    dependentFileOpening: 320.00, // Applies only once - either spouse or child
    standardAuthorityCostsSpouse: 4710.00,
    standardAuthorityCostsChild: 4604.00,
    mandatoryUaeMedicalTest: 700.00,
    emiratesIdFee: 1155.00,
    immigrationResidencyFeeSpouse: 2860.00,
    immigrationResidencyFeeChild: 2750.00,
    visaCancelation: false,
    visaCancelationFee: 185.00,
    thirdPartyCostsSpouse: 1460.00,
    thirdPartyCostsChild: 1460.00,
  }
}; 