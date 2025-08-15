import { AuthorityConfig } from './types';

export const DET_CONFIG: AuthorityConfig = {
  id: 'det',
  name: 'DET (Dubai Department of Economy and Tourism)',
  displayName: 'DET',
  areaInUAE: 'UAE local territory',
  legalEntity: 'Mainland LLC',
  
  initialSetup: {
    baseLicenseFee: 0, // DET doesn't have a base license fee like IFZA
    // No visa quota for DET
    registrationFee: 2000, // Registration fee GDRFA (Immigration) Establishment Card for visa per company
    // No cross border license for DET
    
    // Fixed government fees for DET
    detRegistrationFee: 2000, // Registration fee Department of Economy and Tourism-Dubai (DET)
    mohreRegistrationFee: 1000, // Registration fee MoHRE (Labour) for visa per company
    
    // DET License type fees
    detLicenseFees: {
      commercial: 13000,
      'commercial-real-estate': 24000,
      'commercial-investment': 30000,
      instant: 13000,
      industrial: 20000,
      professional: 10000,
    },
    
    mofaTranslations: {
      ownersDeclaration: 2000,
      certificateOfIncorporation: 2000,
      memorandumOrArticles: 2000,
      commercialRegister: 2000,
      powerOfAttorney: 2000, // Individual setup: Power of Attorney (same as IFZA)
    },
    
    defaultTmeServicesFee: 32000, // Corporate setup default
    individualTmeServicesFee: 11000, // Individual setup
    
    // Office rent configurations
    defaultOfficeRent: 12000, // Suggested amount for any office selection
    dewaDepositOffice: 2000, // DEWA deposit for office
    dewaDepositWarehouse: 4000, // DEWA deposit for warehouse
  },
  
  visaCosts: {
    standardVisaFee: 6000, // Standard Government Fee for Visa and Emirates ID Application
    reducedVisaFee: 1375,  // Discount amount (standard 6000 - discount 1375 = 4625 actual reduced fee)
    tmeVisaServiceFee: 3000, // TME Services Professional Fee per visa
    investorVisaFee: 0, // No additional cost for investor visas
    employmentVisaEmployeeInsurance: 190, // Employee Insurance per employee per visa
    statusChangeFee: 1600,
    vipStampingFee: 1500,
    
    // Spouse visa costs (same as IFZA)
    spouseVisaStandardFee: 4020, // Standard Authority Fees for Spouse Visa and Emirates ID Application
    spouseVisaTmeServiceFee: 2238, // TME Services Professional Fee for Spouse Visa and Emirates ID Application
    
    // Child visa costs (same as IFZA)
    childVisaStandardFee: 3170, // Standard Authority Fees for Child Visa and Emirates ID Application
    childVisaTmeServiceFee: 1681, // TME Services Professional Fee for Child Visa and Emirates ID Application
    
    healthInsurance: {
      lowCost: 1000,
      silverPackage: 6000,
    },
  },
  
  yearlyRunning: {
    baseLicenseRenewal: 13000, // Default - will be overridden by dynamic license type selection
    visaQuotaRenewalCost: 0, // DET doesn't have visa quota renewal
    crossBorderRenewal: 0, // DET doesn't have cross border renewal
    immigrationRenewalFee: 2000, // GDRFA (Immigration) renewal fee Establishment Card for visa
    tmeYearlyFee: 3000, // TME Services Professional Yearly Fee for license and lease renewal (including VAT)
    // officeRent: Dynamic based on user selection in initial setup
  },
  
  features: {
    hasVisaQuota: false, // DET doesn't have visa quota
    hasCrossBorderLicense: false, // DET doesn't have cross border license
    hasInvestorVisas: true,
    hasThirdPartyApproval: true,
    hasOfficeRental: true, // DET has mandatory office rental with specific logic
    supportsVipStamping: true,
    supportsVisaStatusChange: true,
    hasRentOptions: true, // DET-specific: Business center, Office, Warehouse options
    hasDewaDeposit: true, // DET-specific: DEWA deposit logic
  },
}; 