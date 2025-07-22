import { AuthorityConfig } from './types';

export const IFZA_CONFIG: AuthorityConfig = {
  id: 'ifza',
  name: 'IFZA (International Free Zone Authority)',
  displayName: 'IFZA',
  areaInUAE: 'Dubai Digital Park (DDP) Building A2',
  legalEntity: 'FZCO (LLC Structure)',
  
  initialSetup: {
    baseLicenseFee: 12900,
    visaQuotaCost: 2000,
    registrationFee: 2000, // Registration Fee GDRFA (Immigration) when visas are included
    crossBorderLicense: 2000,
    
    mofaTranslations: {
      ownersDeclaration: 2000,
      certificateOfIncorporation: 2000,
      memorandumOrArticles: 2000,
      commercialRegister: 2000,
      powerOfAttorney: 2000,
    },
    
    defaultTmeServicesFee: 33600, // Corporate setup default
    individualTmeServicesFee: 9450, // Individual setup
    additionalActivityCost: 1000, // Cost per additional activity beyond 3
  },
  
  visaCosts: {
    standardVisaFee: 5125, // Standard Government Fee for Visa and Emirates ID Application
    reducedVisaFee: 1375,  // Discount amount (standard 5125 - discount 1375 = 3750 actual reduced fee)
    tmeVisaServiceFee: 3150, // TME Services Professional Fee per visa
    investorVisaFee: 1000,
    statusChangeFee: 1600,
    vipStampingFee: 1500,
    
    // Spouse visa costs
    spouseVisaApplicationFee: 2737, // Application Fee for Spouse Visa (mandatory if selected)
    spouseVisaStandardFee: 4020, // Standard Authority Fees for Spouse Visa and Emirates ID Application (mandatory if selected)
    spouseVisaTmeServiceFee: 2737, // TME Services Professional Fee for Spouse Visa and Emirates ID Application
    
    // Child visa costs
    childVisaStandardFee: 3170, // Standard Authority Fees for Visa and Emirates ID Application
    childVisaTmeServiceFee: 1569, // TME services service fee
    
    healthInsurance: {
      lowCost: 1000,
      silverPackage: 6000,
    },
  },
  
  yearlyRunning: {
    baseLicenseRenewal: 12900,
    visaQuotaRenewalCost: 2000, // cost per visa in quota for renewal
    crossBorderRenewal: 2000,
    immigrationRenewalFee: 2200, // GDRFA (Immigration) renewal fee Establishment Card for visa
    tmeYearlyFee: 3150, // TME Services Professional Yearly Fee (License and Lease Renewal)
  },
  
  features: {
    hasVisaQuota: true,
    hasCrossBorderLicense: true,
    hasInvestorVisas: true,
    hasThirdPartyApproval: true,
    hasOfficeRental: true,
    supportsVipStamping: true,
    supportsVisaStatusChange: true,
  },
}; 