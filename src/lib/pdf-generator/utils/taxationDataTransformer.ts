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

/**
 * Generate taxation PDF filename following TME naming conventions
 * Format: {YYMMDD} {abbreviation} {shortname} CIT Disclaimer {tax end period dd.mm.yyyy}
 */
export function generateTaxationFilename(
  taxationData: TaxationData,
  clientInfo: SharedClientInfo
): string {
  // Format document date as YYMMDD  
  const date = new Date(taxationData.date || clientInfo.date);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const formattedDate = `${yy}${mm}${dd}`;
  
  // Get company abbreviation from company type
  const companyAbbreviation = taxationData.companyType === 'management-consultants' ? 'MGT' : 'FZCO';
  
  // Get company short name
  const companyShortName = taxationData.shortCompanyName || clientInfo.shortCompanyName || 'Company';
  
  // Format tax end period as dd.mm.yyyy
  const formatTaxEndPeriod = () => {
    const toDate = taxationData.citDisclaimer?.taxPeriodRange?.toDate;
    if (toDate) {
      const endDate = new Date(toDate);
      const day = endDate.getDate().toString().padStart(2, '0');
      const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
      const year = endDate.getFullYear();
      return `${day}.${month}.${year}`;
    }
    return '31.12.2025'; // Default fallback
  };
  
  // Build filename: {YYMMDD} {abbreviation} {shortname} CIT Disclaimer {tax end period}
  return `${formattedDate} ${companyAbbreviation} ${companyShortName} CIT Disclaimer ${formatTaxEndPeriod()}.pdf`;
} 