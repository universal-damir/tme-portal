export interface MofaTranslationCosts {
  ownersDeclaration?: number;
  certificateOfIncorporation?: number;
  memorandumOrArticles?: number;
  commercialRegister?: number;
  powerOfAttorney?: number;
}

export interface InitialSetupConfig {
  baseLicenseFee: number;
  visaQuotaCost?: number; // cost per visa in quota
  registrationFee?: number; // one-time registration fee when visas are included
  crossBorderLicense?: number;
  
  // DET-specific government fees
  detRegistrationFee?: number; // Registration fee Department of Economy and Tourism-Dubai (DET)
  mohreRegistrationFee?: number; // Registration fee MoHRE (Labour) for visa per company
  
  // DET-specific license type fees
  detLicenseFees?: {
    commercial: number;
    'commercial-real-estate': number;
    'commercial-investment': number;
    instant: number;
    industrial: number;
    professional: number;
  };
  
  // MoFA Translation costs (varies by authority)
  mofaTranslations: MofaTranslationCosts;
  
  // Default TME Services fee for this authority
  defaultTmeServicesFee: number;
  
  // IFZA-specific: Additional activity cost (beyond 3 activities)
  additionalActivityCost?: number;
  
  // DET-specific: Individual setup TME fee
  individualTmeServicesFee?: number;
  
  // DET-specific office rent configurations
  defaultOfficeRent?: number; // Suggested amount for any office selection
  dewaDepositOffice?: number; // DEWA deposit for office
  dewaDepositWarehouse?: number; // DEWA deposit for warehouse
}

export interface HealthInsuranceConfig {
  lowCost: number;
  silverPackage: number;
}

export interface VisaCostsConfig {
  standardVisaFee: number;
  reducedVisaFee: number; // actual reduced visa fee amount
  tmeVisaServiceFee: number; // TME fee per visa
  investorVisaFee?: number;
  employmentVisaEmployeeInsurance?: number; // Employee Insurance per visa
  statusChangeFee?: number;
  vipStampingFee?: number;
  
  // Spouse visa costs
  spouseVisaApplicationFee?: number; // Application Fee for Spouse Visa
  spouseVisaStandardFee?: number; // Standard Authority Fees for Spouse Visa and Emirates ID
  spouseVisaTmeServiceFee?: number; // TME Services Professional Fee for Spouse Visa
  
  // Child visa costs
  childVisaStandardFee?: number; // Standard Authority Fees for Child Visa and Emirates ID
  childVisaTmeServiceFee?: number; // TME Services Professional Fee for Child Visa
  
  healthInsurance: HealthInsuranceConfig;
}

export interface YearlyRunningConfig {
  baseLicenseRenewal: number;
  visaQuotaRenewalCost?: number; // cost per visa in quota for renewal
  crossBorderRenewal?: number;
  immigrationRenewalFee?: number; // flat fee for immigration renewal when visas exist
  tmeYearlyFee: number;
  officeRent?: number; // Office rent (varies by location and availability)
}

export interface AuthorityConfig {
  id: string;
  name: string;
  displayName: string;
  areaInUAE: string;
  legalEntity: string;
  
  // Configuration for different cost categories
  initialSetup: InitialSetupConfig;
  visaCosts: VisaCostsConfig;
  yearlyRunning: YearlyRunningConfig;
  
  // Authority-specific features
  features: {
    hasVisaQuota: boolean;
    hasCrossBorderLicense: boolean;
    hasInvestorVisas: boolean;
    hasThirdPartyApproval: boolean;
    hasOfficeRental: boolean;
    supportsVipStamping: boolean;
    supportsVisaStatusChange: boolean;
    // DET-specific features
    hasRentOptions?: boolean; // Business center, Office, Warehouse options
    hasDewaDeposit?: boolean; // DEWA deposit logic
  };
}

// Cost calculation result types
export interface InitialSetupCosts {
  baseLicense: number;
  visaQuotaCosts: number;
  registrationFee: number;
  crossBorderLicense: number;
  mofaTranslations: number;
  officeRent: number;
  thirdPartyApproval: number;
  depositAmount: number;
  tmeServicesFee: number;
  priceReduction: number;
  // DET-specific costs
  detRegistrationFee?: number;
  mohreRegistrationFee?: number;
  detLicenseFee?: number;
  dewaDeposit?: number;
  landlordDeposit?: number;
  // IFZA-specific costs
  additionalActivitiesCost?: number;
  total: number;
}

export interface VisaCostBreakdown {
  standardGovernmentFees: number;
  reducedGovernmentFees: number;
  governmentFees: number; // total of standard + reduced for backward compatibility
  tmeServicesFees: number;
  healthInsurance: number;
  investorVisaFees: number;
  employmentVisaFees: number;
  statusChangeFees: number;
  vipStampingFees: number;
  
  // Spouse visa breakdown
  spouseVisaApplicationFees: number;
  spouseVisaStandardFees: number;
  spouseVisaTmeServicesFees: number;
  spouseVisaStatusChangeFees: number;
  spouseVisaHealthInsurance: number;
  spouseVisaVipStampingFees: number;
  spouseVisaTotal: number;
  
  // Child visa breakdown
  childVisaStandardFees: number;
  childVisaTmeServicesFees: number;
  childVisaStatusChangeFees: number;
  childVisaHealthInsurance: number;
  childVisaVipStampingFees: number;
  childVisaTotal: number;
  
  // Combined family visa total
  familyVisaTotal: number;
  
  total: number;
}

export interface YearlyRunningCosts {
  baseLicenseRenewal: number;
  visaQuotaRenewal: number;
  crossBorderRenewal: number;
  immigrationRenewal: number;
  officeRent: number;
  thirdPartyApproval: number;
  tmeYearlyFee: number;
  total: number;
}

export interface CostSummary {
  initialSetup: InitialSetupCosts;
  visaCosts: VisaCostBreakdown;
  yearlyRunning: YearlyRunningCosts;
  deposits: number;
  grandTotal: number;
  grandTotalWithDeposits: number;
} 