import { TaxationData } from '@/types/taxation';
import { SharedClientInfo } from '@/types/portal';
import { PDFComponentProps } from '../types';

/**
 * Transform taxation data to standard PDF component format
 * Following the pattern established in companyServicesDataTransformer.ts
 */
export function transformTaxationData(
  taxationData: TaxationData,
  clientInfo: SharedClientInfo
): PDFComponentProps['data'] {
  // Map company type to authority for proper header branding
  const getAuthorityFromCompanyType = (companyType: string): string => {
    switch (companyType) {
      case 'tme-fzco':
        return 'IFZA (International Free Zone Authority)';
      case 'management-consultants':
        return 'DET (Dubai Department of Economy and Tourism)';
      default:
        return 'IFZA (International Free Zone Authority)'; // Default fallback
    }
  };

  // Merge client info with taxation data
  const mergedClientDetails = {
    firstName: taxationData.firstName || clientInfo.firstName || '',
    lastName: taxationData.lastName || clientInfo.lastName || '',
    companyName: taxationData.companyName || clientInfo.companyName || '',
    shortCompanyName: taxationData.shortCompanyName || clientInfo.shortCompanyName || '',
    date: taxationData.date || clientInfo.date,
    
    // Taxation doesn't need secondary currency, but PDF components expect these fields
    secondaryCurrency: 'EUR' as const,
    exchangeRate: 3.67,
    companySetupType: 'Tax Advisory Services',
    
    // Determine if addressing to company (if company name is provided)
    addressToCompany: Boolean(taxationData.companyName || clientInfo.companyName),
  };

  // Transform to standard PDF data format
  return {
    clientDetails: mergedClientDetails,
    
    // Map company type to authority for proper branding
    authorityInformation: {
      responsibleAuthority: getAuthorityFromCompanyType(taxationData.companyType),
      areaInUAE: 'Dubai',
      legalEntity: 'Tax Advisory Services',
      shareCapitalAED: 0,
      valuePerShareAED: 0,
      numberOfShares: 0,
    },
    
    // Add empty required fields for PDF component compatibility
    activityCodes: [],
    ifzaLicense: undefined,
    detLicense: undefined,
    visaCosts: undefined,
    additionalServices: undefined,
    
    // Add taxation data as a nested object for easy access in PDF components
    taxationData: taxationData,
  } as any;
} 