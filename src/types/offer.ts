export interface ClientDetails {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  addressToCompany?: boolean;
  date: string;
  companySetupType: string;
  secondaryCurrency: string;
  exchangeRate: number;
}

export interface AuthorityInformation {
  responsibleAuthority: string;
  areaInUAE: string;
  legalEntity: string;
  shareCapitalAED: number;
  valuePerShareAED: number;
  numberOfShares: number;
  activitiesToBeConfirmed?: boolean;
}

export interface ActivityCode {
  code?: string;
  description?: string;
}

export interface IFZALicense {
  visaQuota?: number;
  licenseYears?: number;
  crossBorderLicense?: boolean;
  mofaOwnersDeclaration?: boolean;
  mofaCertificateOfIncorporation?: boolean;
  mofaActualMemorandumOrArticles?: boolean;
  mofaCommercialRegister?: boolean;
  mofaPowerOfAttorney?: boolean;
  rentOfficeRequired?: boolean;
  officeRentAmount?: number;
  depositWithLandlord?: boolean;
  depositAmount?: number;
  thirdPartyApproval?: boolean;
  thirdPartyApprovalAmount?: number;
  tmeServicesFee?: number;
  applyPriceReduction?: boolean;
  reductionAmount?: number;
  activitiesToBeConfirmed?: boolean;
}

export interface DETLicense {
  // MoFA translations (same as IFZA)
  mofaOwnersDeclaration?: boolean;
  mofaCertificateOfIncorporation?: boolean;
  mofaActualMemorandumOrArticles?: boolean;
  mofaCommercialRegister?: boolean;
  mofaPowerOfAttorney?: boolean;
  
  // DET License type selection (mandatory)
  licenseType?: 'commercial' | 'commercial-real-estate' | 'commercial-investment' | 'instant' | 'industrial' | 'professional';
  
  // Office rent selection (mandatory)
  rentType?: 'business-center' | 'office' | 'warehouse';
  officeRentAmount?: number;
  
  // Third party approval
  thirdPartyApproval?: boolean;
  thirdPartyApprovalAmount?: number;
  
  // TME service fee (based on setup type)
  tmeServicesFee?: number;
  
  // Price reduction
  applyPriceReduction?: boolean;
  reductionAmount?: number;
  
  // Activities to be confirmed - TBC (same as IFZA)
  activitiesToBeConfirmed?: boolean;
}

export interface VisaDetail {
  healthInsurance: string;
  statusChange?: boolean;  // Per-visa status change selection
  vipStamping?: boolean;   // Per-visa VIP stamping selection
  investorVisa?: boolean | string;  // Per-visa investor visa selection (boolean for IFZA, string for DET)
  employmentVisa?: boolean; // Per-visa employment visa selection (DET only)
}

export interface VisaCosts {
  numberOfVisas?: number;
  numberOfInvestorVisas?: number;
  visaDetails?: VisaDetail[];
  enableVisaStatusChange?: boolean;
  visaStatusChange?: number;
  reducedVisaCost?: number;
  vipStamping?: boolean;
  vipStampingVisas?: number;
  
  // Spouse visa fields
  spouseVisa?: boolean;
  spouseVisaInsurance?: string;
  spouseVisaStatusChange?: boolean;
  spouseVisaVipStamping?: boolean;
  
  // Child visa fields
  childVisa?: boolean;
  numberOfChildVisas?: number;
  childVisaDetails?: VisaDetail[];
  childVisaStatusChange?: number;
  childVisaVipStamping?: number;
}

export interface AdditionalServices {
  companyStamp?: number;
  emiratesPost?: number;
  citRegistration?: number;
  citReturnFiling?: number;
  vatRegistration?: number;
  personalBank?: number;
  digitalBank?: number;
  traditionalBank?: number;
  accountingFee?: number;

}

export interface OfferData {
  clientDetails: ClientDetails;
  authorityInformation: AuthorityInformation;
  activityCodes?: ActivityCode[];
  ifzaLicense?: IFZALicense;
  detLicense?: DETLicense;
  visaCosts?: VisaCosts;
  additionalServices?: AdditionalServices;
} 