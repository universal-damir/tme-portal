// PDF Utilities exports
// These have been populated during Phase 3

// Formatting utilities
export { 
  formatNumber, 
  formatSecondaryCurrency,
  formatDate, 
  formatDateDDMMYYYY, 
  getVisaText, 
  getActivityText, 
  cleanAuthorityName, 
  formatDateForFilename,
  formatCurrency
} from './formatting';

// Calculation utilities
export { 
  calculateTotals, 
  getFooterInfo, 
  calculateAllCosts, 
  shouldShowInitialSetup, 
  shouldShowVisaCosts,
  calculateIndividualVisaCosts,
  calculateIndividualChildVisaCosts
} from './calculations';

// Service Description utilities
export {
  generateServiceDescriptions,
  generateNumberedServices,
  formatServiceDescription,
  generateDepositExplanations,
  type ServiceItem
} from './serviceDescriptions';

// Visa Service Description utilities
export {
  generateVisaServiceDescriptions,
  generateCompanyVisaServiceDescriptions,
  generateSpouseVisaServiceDescriptions,
  generateChildVisaServiceDescriptions,
  generateNumberedVisaServices,
  formatVisaServiceDescription,
  generateVisaExplanations,
  generateCompanyVisaExplanations,
  type VisaServiceItem
} from './visaServiceDescriptions';

// Yearly Running Service Description utilities
export {
  generateYearlyRunningServiceDescriptions,
  generateNumberedYearlyRunningServices,
  formatYearlyRunningServiceDescription,
  type YearlyRunningServiceItem
} from './yearlyRunningServiceDescriptions';

// Additional Service Description utilities
export {
  generateAdditionalServiceDescriptions,
  generateNumberedAdditionalServices,
  formatAdditionalServiceDescription,
  type AdditionalServiceItem
} from './additionalServiceDescriptions';

// Filename generation utilities
export { generateDynamicFilename, generateFamilyVisaFilename } from './filename';

// Golden Visa utilities
export {
  transformGoldenVisaData,
  getVisaTypeDisplayName,
  getVisaTypeTitle,
  hasDependentVisas,
  generateGoldenVisaAuthorityFeesBreakdown,
  generateGoldenVisaTMEServicesBreakdown,
  generateGoldenVisaExplanations,
  generateGoldenVisaSpouseVisaBreakdown,
  generateGoldenVisaChildrenVisaBreakdown,
  generateGoldenVisaIndividualChildVisaBreakdowns,
  type GoldenVisaServiceItem
} from './goldenVisaDataTransformer';

// Golden Visa generator utilities
export { 
  generateGoldenVisaPDF, 
  generateGoldenVisaPDFWithFilename 
} from './goldenVisaGenerator';

// Company Services utilities
export {
  transformCompanyServicesData,
  hasCompanyServicesData,
  generateCompanyServicesFilename
} from './companyServicesDataTransformer';

// Company Services generator utilities
export { 
  generateCompanyServicesPDF, 
  generateCompanyServicesPDFWithFilename 
} from './companyServicesGenerator';

// Taxation generator utilities
export { 
  generateTaxationPDF, 
  generateTaxationPDFWithFilename,
  generateCITShareholderDeclarationPDF,
  generateCITShareholderDeclarationPDFWithFilename
} from './taxationGenerator';

// Taxation data transformer utilities
export { 
  transformTaxationData
} from './taxationDataTransformer';

// CIT Return Letters generator utilities
export { 
  generateCITReturnLettersPDF, 
  generateCITReturnLettersPDFWithFilename,
  generateCITTransferPricingPDF,
  generateCITTransferPricingPDFWithFilename
} from './citReturnLettersGenerator';

// CIT Return Letters data transformer utilities
export { 
  transformCITReturnLettersData,
  generateCITReturnLettersFilename
} from './citReturnLettersDataTransformer';

// CIT Return Letters authority mapping utilities
export { 
  getCompanyDetailsByAuthority,
  getCompanyTypeByAuthority,
  AUTHORITY_TO_COMPANY_TYPE,
  COMPANY_DETAILS
} from './citAuthorityMapping'; 