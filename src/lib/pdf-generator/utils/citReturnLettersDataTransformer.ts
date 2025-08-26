import { CITReturnLettersData } from '@/types/cit-return-letters';
import { SharedClientInfo } from '@/types/portal';
import { PDFComponentProps } from '../types';

/**
 * Transform CIT return letters data to standard PDF component format
 * Following the pattern established in other data transformers
 */
export function transformCITReturnLettersData(
  citReturnLettersData: CITReturnLettersData,
  clientInfo?: SharedClientInfo
): PDFComponentProps['data'] {
  const selectedClient = citReturnLettersData.selectedClient;
  
  // Map company authority based on selected client or fallback
  const getAuthorityFromClient = (): string => {
    if (selectedClient?.registered_authority) {
      return selectedClient.registered_authority;
    }
    return 'IFZA (International Free Zone Authority)'; // Default fallback
  };

  // Create client details from selected client or fallback to shared client info
  const clientDetails = {
    firstName: selectedClient?.management_name?.split(' ')[0] || clientInfo?.firstName || 'Manager',
    lastName: selectedClient?.management_name?.split(' ').slice(1).join(' ') || clientInfo?.lastName || '',
    companyName: selectedClient?.company_name || clientInfo?.companyName || 'Company',
    shortCompanyName: selectedClient?.company_name_short || clientInfo?.shortCompanyName || 'Company',
    date: new Date().toISOString().split('T')[0], // Current date as default
    
    // These fields are not used for CIT letters but required for PDF component compatibility
    secondaryCurrency: 'EUR' as const,
    exchangeRate: 3.67,
    companySetupType: 'CIT Return Letters',
    
    // Address to company if company name is available
    addressToCompany: Boolean(selectedClient?.company_name || clientInfo?.companyName),
  };

  // Transform to standard PDF data format
  return {
    clientDetails,
    
    // Map authority information
    authorityInformation: {
      responsibleAuthority: getAuthorityFromClient(),
      areaInUAE: selectedClient?.city || 'Dubai',
      legalEntity: 'CIT Return Letters',
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
    
    // Add CIT return letters data for easy access in PDF components
    citReturnLettersData,
  } as any;
}

/**
 * Generate CIT return letters PDF filename following TME naming conventions
 * Format: {YYMMDD} {company short name} {letter type} {tax period end year}
 */
export function generateCITReturnLettersFilename(
  citReturnLettersData: CITReturnLettersData,
  clientInfo?: SharedClientInfo
): string {
  // Format document date as YYMMDD  
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const formattedDate = `${yy}${mm}${dd}`;
  
  // Get company short name
  const companyShortName = citReturnLettersData.selectedClient?.company_name_short || 
                          clientInfo?.shortCompanyName || 'Company';
  
  // Use letter type as-is without underscores (original form)
  const letterTypeForFilename = citReturnLettersData.letterType;
  
  // Get tax period end year as 4-digit number
  const getTaxEndYear = () => {
    if (citReturnLettersData.taxPeriodEnd) {
      const endDate = new Date(citReturnLettersData.taxPeriodEnd);
      return endDate.getFullYear().toString();
    }
    return '2024'; // Default fallback
  };
  
  // Build filename: {YYMMDD} {company short name} {letter type} {tax end year}
  return `${formattedDate} ${companyShortName} ${letterTypeForFilename} ${getTaxEndYear()}.pdf`;
}