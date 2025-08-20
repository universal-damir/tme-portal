import { z } from 'zod';

export const clientDetailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().max(50, 'Last name must be less than 50 characters').optional(),
  companyName: z.string().max(100, 'Company name must be less than 100 characters').optional(),
  addressToCompany: z.boolean().optional(),
  date: z.string().min(1, 'Date is required'),
  companySetupType: z.string({
    required_error: 'Please select either Individual or Corporate shareholder type',
    invalid_type_error: 'Please select either Individual or Corporate shareholder type'
  }).min(1, 'Please select either Individual or Corporate shareholder type'),
  secondaryCurrency: z.string().min(1, 'Secondary currency is required'),
  exchangeRate: z.number().min(0.01, 'Exchange rate must be greater than 0').max(1000, 'Exchange rate seems unrealistic'),
  clientEmails: z.array(z.string().email('Please enter a valid email address')).min(1, 'At least one email address is required'),
});

export const authorityInformationSchema = z.object({
  responsibleAuthority: z.string().min(1, 'Responsible authority is required'),
  areaInUAE: z.string().optional(),
  legalEntity: z.string().optional(),
  shareCapitalAED: z.number().min(1, 'Share capital is required'),
  valuePerShareAED: z.number().min(1, 'Value per share is required').min(10, 'Minimum value per share is AED 10'),
  numberOfShares: z.number().min(1, 'Number of shares must be greater than 0'),
});

export const activityCodeSchema = z.object({
  code: z.string().optional(),
  description: z.string().optional(),
});

export const ifzaLicenseSchema = z.object({
  visaQuota: z.number().min(0, 'Visa quota must be 0 or greater').optional(),
  licenseYears: z.number().int().min(1, 'License years must be at least 1').max(5, 'License years cannot exceed 5').refine(val => [1, 2, 3, 5].includes(val), 'License years must be 1, 2, 3, or 5').optional(),
  crossBorderLicense: z.boolean().optional(),
  mofaOwnersDeclaration: z.boolean().optional(),
  mofaCertificateOfIncorporation: z.boolean().optional(),
  mofaActualMemorandumOrArticles: z.boolean().optional(),
  mofaCommercialRegister: z.boolean().optional(),
  mofaPowerOfAttorney: z.boolean().optional(),
  unitLeaseAgreement: z.boolean().optional(),
  rentOfficeRequired: z.boolean().optional(),
  officeRentAmount: z.number().min(0, 'Office rent amount must be 0 or greater').optional(),
  depositWithLandlord: z.boolean().optional(),
  depositAmount: z.number().min(0, 'Deposit amount must be 0 or greater').optional(),
  thirdPartyApproval: z.boolean().optional(),
  thirdPartyApprovalAmount: z.number().min(0, 'Third party approval amount must be 0 or greater').optional(),
  tmeServicesFee: z.number().min(0, 'TME services fee must be 0 or greater').optional(),
  applyPriceReduction: z.boolean().optional(),
  reductionAmount: z.number().min(0, 'Reduction amount must be 0 or greater').optional(),
  activitiesToBeConfirmed: z.boolean().optional(),
}).optional();

export const detLicenseSchema = z.object({
  // MoFA translations (same as IFZA)
  mofaOwnersDeclaration: z.boolean().optional(),
  mofaCertificateOfIncorporation: z.boolean().optional(),
  mofaActualMemorandumOrArticles: z.boolean().optional(),
  mofaCommercialRegister: z.boolean().optional(),
  mofaPowerOfAttorney: z.boolean().optional(),
  
  // DET License type selection (mandatory)
  licenseType: z.enum(['commercial', 'commercial-real-estate', 'commercial-investment', 'instant', 'industrial', 'professional'], {
    required_error: 'License type selection is required for DET',
    invalid_type_error: 'Please select a valid license type',
  }).optional(),
  
  // Office rent selection (mandatory)
  rentType: z.enum(['business-center', 'office', 'warehouse', 'showroom'], {
    required_error: 'Office type selection is required for DET',
    invalid_type_error: 'Please select a valid office type',
  }).optional(),
  officeRentAmount: z.number().min(0, 'Office rent amount must be 0 or greater').optional(),
  
  // Third party approval
  thirdPartyApproval: z.boolean().optional(),
  thirdPartyApprovalAmount: z.number().min(0, 'Third party approval amount must be 0 or greater').optional(),
  
  // TME service fee (based on setup type)
  tmeServicesFee: z.number().min(0, 'TME services fee must be 0 or greater').optional(),
  
  // Price reduction
  applyPriceReduction: z.boolean().optional(),
  reductionAmount: z.number().min(0, 'Reduction amount must be 0 or greater').optional(),
  
  // Activities to be confirmed - TBC (same as IFZA)
  activitiesToBeConfirmed: z.boolean().optional(),
}).optional();

export const visaDetailSchema = z.object({
  healthInsurance: z.string().min(1, 'Health insurance selection is required'),
  statusChange: z.boolean().optional(),
  vipStamping: z.boolean().optional(),
  investorVisa: z.union([z.boolean(), z.string()]).optional(),
});

export const visaCostsSchema = z.object({
  numberOfVisas: z.number().min(0, 'Number of visas must be 0 or greater').optional().or(z.nan().transform(() => undefined)),
  numberOfInvestorVisas: z.number().min(0, 'Number of investor visas must be 0 or greater').optional().or(z.nan().transform(() => undefined)),
  visaDetails: z.array(visaDetailSchema).optional(),
  visaStatusChange: z.number().min(0, 'Visa status change must be 0 or greater').optional().or(z.nan().transform(() => undefined)),
  reducedVisaCost: z.number().min(0, 'Reduced visa cost must be 0 or greater').max(1, 'Only 1 visa can have reduced cost').optional().or(z.nan().transform(() => undefined)),
  vipStamping: z.boolean().optional(),
  vipStampingVisas: z.number().min(0, 'VIP stamping visas must be 0 or greater').optional().or(z.nan().transform(() => undefined)),
  
  // Spouse visa fields
  spouseVisa: z.boolean().optional(),
  spouseVisaInsurance: z.string().optional(),
  spouseVisaStatusChange: z.boolean().optional(),
  spouseVisaVipStamping: z.boolean().optional(),
  
  // Child visa fields
  childVisa: z.boolean().optional(),
  numberOfChildVisas: z.number().min(0, 'Number of child visas must be 0 or greater').optional().or(z.nan().transform(() => undefined)),
  childVisaDetails: z.array(visaDetailSchema).optional(),
  childVisaStatusChange: z.number().min(0, 'Child visa status change must be 0 or greater').optional().or(z.nan().transform(() => undefined)),
  childVisaVipStamping: z.number().min(0, 'Child visa VIP stamping must be 0 or greater').optional().or(z.nan().transform(() => undefined)),
}).optional();

export const additionalServicesSchema = z.object({
  companyStamp: z.number().min(0, 'Company stamp fee must be 0 or greater').optional(),
  emiratesPost: z.number().min(0, 'Emirates Post fee must be 0 or greater').optional(),
  citRegistration: z.number().min(0, 'CIT registration fee must be 0 or greater').optional(),
  citReturnFiling: z.number().min(0, 'CIT return filing fee must be 0 or greater').optional(),
  vatRegistration: z.number().min(0, 'VAT registration fee must be 0 or greater').optional(),
  personalBank: z.number().min(0, 'Personal bank fee must be 0 or greater').optional(),
  digitalBank: z.number().min(0, 'Digital bank fee must be 0 or greater').optional(),
  traditionalBank: z.number().min(0, 'Traditional bank fee must be 0 or greater').optional(),
  accountingFrequency: z.enum(['yearly', 'quarterly', 'monthly']).optional(),
  accountingFee: z.number().min(0, 'Accounting fee must be 0 or greater').optional(),

}).optional();

// Golden Visa validation schema
export const goldenVisaSchema = z.object({
  // Client Details
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'), 
  companyName: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  clientEmails: z.array(z.string().email('Please enter a valid email address')).min(1, 'At least one email address is required'),
  
  // Secondary currency fields (same as cost overview)
  secondaryCurrency: z.enum(['EUR', 'USD', 'GBP'], {
    required_error: 'Please select a secondary currency',
  }),
  exchangeRate: z.number().min(0.01, 'Exchange rate must be positive'),
  
  // Company and visa selection
  companyType: z.enum(['tme-fzco', 'management-consultants'], {
    required_error: 'Please select a company type',
  }),
  visaType: z.enum(['property-investment', 'time-deposit', 'skilled-employee'], {
    required_error: 'Please select a Golden Visa type',
  }),
  primaryVisaRequired: z.boolean(),

  // Authority fee breakdowns (optional based on visa type)
  propertyAuthorityFees: z.object({
    professionalPassportPicture: z.number().min(0),
    dldApprovalFee: z.number().min(0),
    mandatoryUaeMedicalTest: z.number().min(0),
    emiratesIdFee: z.number().min(0),
    immigrationResidencyFee: z.number().min(0),
    visaCancelation: z.boolean(),
    visaCancelationFee: z.number().min(0),
    thirdPartyCosts: z.number().min(0),
  }).optional(),
  
  skilledEmployeeAuthorityFees: z.object({
    professionalPassportPicture: z.number().min(0),
    mandatoryUaeMedicalTest: z.number().min(0),
    emiratesIdFee: z.number().min(0),
    immigrationResidencyFee: z.number().min(0),
    visaCancelation: z.boolean(),
    visaCancelationFee: z.number().min(0),
    thirdPartyCosts: z.number().min(0).optional(),
  }).optional(),
  
  dependentAuthorityFees: z.object({
    professionalPassportPicture: z.number().min(0),
    dependentFileOpening: z.number().min(0),
    dependentFileOpeningForSpouse: z.boolean().optional(),
    dependentFileOpeningForChild: z.boolean().optional(),
    mandatoryUaeMedicalTest: z.number().min(0),
    emiratesIdFee: z.number().min(0),
    immigrationResidencyFeeSpouse: z.number().min(0),
    immigrationResidencyFeeChild: z.number().min(0),
    visaCancelation: z.boolean(),
    visaCancelationFee: z.number().min(0),
    thirdPartyCosts: z.number().min(0).optional(),
    thirdPartyCostsSpouse: z.number().min(0).optional(),
    thirdPartyCostsChild: z.number().min(0).optional(),
  }).optional(),

  // Legacy fields
  requiresNOC: z.boolean().optional(),
  selectedFreezone: z.enum(['dmcc', 'adgm', 'difc', 'ifza', 'abu-dhabi', 'dafza', 'jafza', 'dubai-internet-city', 'meydan'], {
    required_error: 'Please select a freezone',
  }).optional(),
  governmentFee: z.number().min(0, 'Government fee must be positive').optional(),
  tmeServicesFee: z.number().min(0, 'TME services fee must be positive').optional(),
  freezoneNocFee: z.number().min(0, 'Freezone NOC fee must be positive').optional(),
  governmentCostsSkilledEmployee: z.number().min(0, 'Government costs must be positive').optional(),
  dependents: z.object({
    spouse: z.object({
      required: z.boolean(),
      governmentFee: z.number().min(0),
      tmeServicesFee: z.number().min(0),
      visaCancelation: z.boolean().optional(),
      visaCancelationFee: z.number().min(0).optional(),
    }).optional(),
    children: z.object({
      count: z.number().min(0).max(10, 'Maximum 10 children allowed'),
      governmentFee: z.number().min(0),
      tmeServicesFee: z.number().min(0),
      visaCancelation: z.boolean().optional(),
      visaCancelationFee: z.number().min(0).optional(),
    }).optional(),
  }),
});

// Tax Consulting Services validation schema
export const taxConsultingServicesSchema = z.object({
  enabled: z.boolean().optional(), // Keep for backward compatibility with PDF rendering
  // Separate CIT and VAT service flags
  citEnabled: z.boolean().optional(),
  vatEnabled: z.boolean().optional(),
  // CIT-related fields
  citRegistration: z.number().min(0, 'CIT registration fee must be 0 or greater').optional(),
  citReturnFiling: z.number().min(0, 'CIT return filing fee must be 0 or greater').optional(),
  citType: z.enum(['sbr-regular', 'qfzp', ''], {
    required_error: 'Please select a CIT return filing type',
  }).optional(),
  // VAT-related fields
  vatType: z.enum(['registration', 'exception', 'de-registration', ''], {
    required_error: 'Please select a VAT service type',
  }).optional(),
  vatRegistration: z.number().min(0, 'VAT registration fee must be 0 or greater').optional(),
  vatReturnFiling: z.number().min(0, 'VAT return filing fee must be 0 or greater').optional(),
  vatReturnFilingType: z.enum(['mini', 'basic', 'complex', ''], {
    required_error: 'Please select a VAT return filing type',
  }).optional(),
  clientManagedAccounting: z.boolean().optional(),
}).optional();

// Accounting Services validation schema
export const accountingServicesSchema = z.object({
  enabled: z.boolean().optional(),
  serviceType: z.enum(['monthly', 'quarterly-yearly', ''], {
    required_error: 'Please select an accounting service type',
  }).optional(),
  transactionTier: z.number().min(0, 'Transaction tier must be 0 or greater').optional(),
  monthlyPrice: z.number().min(0, 'Monthly price must be 0 or greater').optional(),
  quarterlyPrice: z.number().min(0, 'Quarterly price must be 0 or greater').optional(),
  yearlyPrice: z.number().min(0, 'Yearly price must be 0 or greater').optional(),
}).optional();

// Back-Office Services validation schema
export const backOfficeServicesSchema = z.object({
  enabled: z.boolean().optional(),
  teamSize: z.enum(['micro', 'small', 'medium', 'large', 'custom', ''], {
    required_error: 'Please select a team size',
  }).optional(),
}).optional();

// Company Services validation schema
export const companyServicesSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  companyName: z.string().max(100, 'Company name must be less than 100 characters').optional(),
  date: z.string().min(1, 'Date is required'),
  clientEmails: z.array(z.string().email('Please enter a valid email address')).min(1, 'At least one email address is required'),
  secondaryCurrency: z.enum(['EUR', 'USD', 'GBP'], {
    required_error: 'Please select a secondary currency',
  }),
  exchangeRate: z.number().min(0.01, 'Exchange rate must be greater than 0').max(1000, 'Exchange rate seems unrealistic'),
  companyType: z.enum(['tme-fzco', 'management-consultants'], {
    required_error: 'Please select a company type',
  }),
  taxConsultingServices: taxConsultingServicesSchema,
  accountingServices: accountingServicesSchema,
  backOfficeServices: backOfficeServicesSchema,
});

// Taxation schemas
export const taxPeriodDateRangeSchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export const citDisclaimerSchema = z.object({
  enabled: z.boolean().optional(),
  taxPeriodRange: taxPeriodDateRangeSchema.optional(),
  generatedRevenue: z.number().min(0, 'Generated revenue must be 0 or greater').optional(),
  noRevenueGenerated: z.boolean().optional(),
});

export const citShareholderDeclarationSchema = z.object({
  smallBusinessRelief: z.boolean().optional(),
  companyLiquidation: z.boolean().optional(),
  booksAccountsDeductibleExpenses: z.enum(['contain', 'do-not-contain']).optional(),
  clientContactNumber: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true; // Allow empty for optional field
      // Remove any spaces and check if it's exactly 9 digits
      const digitsOnly = val.replace(/\D/g, '');
      return digitsOnly.length === 9;
    }, {
      message: "Phone number must be exactly 9 digits"
    })
    .refine((val) => {
      if (!val || val === '') return true; // Allow empty for optional field
      const digitsOnly = val.replace(/\D/g, '');
      if (digitsOnly.length !== 9) return true; // Let the first validation handle length
      // Check valid UAE mobile prefixes
      const validPrefixes = ['50', '51', '52', '54', '55', '56', '58'];
      const prefix = digitsOnly.slice(0, 2);
      return validPrefixes.includes(prefix);
    }, {
      message: "Invalid UAE mobile number. Must start with 50, 51, 52, 54, 55, 56, or 58"
    }),
  designation: z.enum(['Director', 'General Manager', 'Manager', 'Managing partner', 'Shareholder']).optional(),
  licenceNumber: z.string().optional(),
  hasOwnHeaderFooter: z.boolean().optional(),
});



export const taxationSchema = z.object({
  firstName: z.string().max(50, 'First name must be less than 50 characters'),
  lastName: z.string().max(50, 'Last name must be less than 50 characters'),
  companyName: z.string().max(100, 'Company name must be less than 100 characters'),
  shortCompanyName: z.string().max(100, 'Short company name must be less than 100 characters'),
  date: z.string().min(1, 'Date is required'),
  clientEmails: z.array(z.string().email('Please enter a valid email address')).min(1, 'At least one email address is required'),
  companyType: z.enum(['tme-fzco', 'management-consultants'], {
    required_error: 'Please select a company type',
  }),
  citDisclaimer: citDisclaimerSchema,
  citShareholderDeclaration: citShareholderDeclarationSchema,
});

export const offerDataSchema = z.object({
  clientDetails: clientDetailsSchema,
  authorityInformation: authorityInformationSchema,
  activityCodes: z.array(activityCodeSchema).optional().default([]),
  ifzaLicense: ifzaLicenseSchema,
  detLicense: detLicenseSchema,
  visaCosts: visaCostsSchema,
  additionalServices: additionalServicesSchema,
}).refine((data) => {
  // Conditional validation for activity codes
  const isIfzaSelected = data.authorityInformation.responsibleAuthority === 'IFZA (International Free Zone Authority)';
  const isDetSelected = data.authorityInformation.responsibleAuthority === 'DET (Dubai Department of Economy and Tourism)';
  
  // Check TBC from the correct source
  let isTbcEnabled = false;
  if (isIfzaSelected) {
    isTbcEnabled = data.ifzaLicense?.activitiesToBeConfirmed ?? true; // Default to true
  } else if (isDetSelected) {
    isTbcEnabled = data.detLicense?.activitiesToBeConfirmed ?? true; // Default to true
  } else {
    // For other authorities, use the general field, defaulting to true
    isTbcEnabled = data.authorityInformation?.activitiesToBeConfirmed ?? true;
  }
  
  // If TBC is enabled (which should be the default), activity codes are completely optional
  if (isTbcEnabled) {
    return true;
  }
  
  // Only validate activity codes if TBC is explicitly disabled
  const hasValidActivities = data.activityCodes && data.activityCodes.length > 0 && 
    data.activityCodes.some(activity => 
      activity.code && activity.code.trim() !== '' && 
      activity.description && activity.description.trim() !== ''
    );
  
  if (!hasValidActivities) {
    return false;
  }
  
  return true;
}, {
  message: "At least one complete activity code (both code and description) is required when TBC is disabled",
  path: ["activityCodes"]
}).refine((data) => {
  // IFZA reduced visa validation
  const isIfzaSelected = data.authorityInformation.responsibleAuthority === 'IFZA (International Free Zone Authority)';
  
  if (isIfzaSelected && data.visaCosts?.reducedVisaCost && data.visaCosts.reducedVisaCost > 0) {
    // Check if there's at least 1 visa quota in license fee section
    const visaQuota = data.ifzaLicense?.visaQuota || 0;
    
    if (visaQuota < 1) {
      return false;
    }
    
    // Ensure reduced visa is maximum 1
    if (data.visaCosts.reducedVisaCost > 1) {
      return false;
    }
  }
  
  return true;
}, {
  message: "IFZA reduced visa requires at least 1 visa quota in license fee section and maximum 1 reduced visa allowed",
  path: ["visaCosts", "reducedVisaCost"]
}); 