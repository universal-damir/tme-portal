import { CompanyServicesData } from '@/types/company-services';
import { SharedClientInfo } from '@/types/portal';
import { PDFComponentProps } from '../types';

/**
 * Transform company services data to standard PDF component format
 * Following the pattern established in goldenVisaDataTransformer.ts
 */
export function transformCompanyServicesData(
  companyServicesData: CompanyServicesData,
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

  // Merge client info with company services data
  const mergedClientDetails = {
    firstName: companyServicesData.firstName || clientInfo.firstName || '',
    lastName: companyServicesData.lastName || clientInfo.lastName || '',
    companyName: companyServicesData.companyName || clientInfo.companyName || '',
    shortCompanyName: companyServicesData.shortCompanyName || clientInfo.shortCompanyName || '',
    date: companyServicesData.date || clientInfo.date,
    
    // Company services specific fields
    secondaryCurrency: companyServicesData.secondaryCurrency,
    exchangeRate: companyServicesData.exchangeRate,
    companySetupType: 'Company Services', // Default setup type for company services
    
    // Determine if addressing to company (if company name is provided)
    addressToCompany: Boolean(companyServicesData.companyName || clientInfo.companyName),
  };

  // Transform to standard PDF data format
  return {
    clientDetails: mergedClientDetails,
    
    // Add company services data as a nested object for easy access in PDF components
    companyServicesData: {
      date: companyServicesData.date || new Date().toISOString().split('T')[0],
      secondaryCurrency: companyServicesData.secondaryCurrency || 'USD',
      exchangeRate: companyServicesData.exchangeRate || 3.67,
      companyType: companyServicesData.companyType,
      taxConsultingServices: companyServicesData.taxConsultingServices,
      accountingServices: companyServicesData.accountingServices,
      backOfficeServices: companyServicesData.backOfficeServices,
      complianceServices: companyServicesData.complianceServices,
    },
    
    // Map company type to authority for proper branding
    authorityInformation: {
      responsibleAuthority: getAuthorityFromCompanyType(companyServicesData.companyType),
      areaInUAE: 'Dubai',
      legalEntity: 'Company Services',
      shareCapitalAED: 0,
      valuePerShareAED: 0,
      numberOfShares: 0,
    },
  } as PDFComponentProps['data'] & { companyServicesData: CompanyServicesData };
}

/**
 * Check if company services data has sufficient information for PDF generation
 */
export function hasCompanyServicesData(data: CompanyServicesData): boolean {
  return Boolean(
    (data.firstName || data.lastName || data.companyName) &&
    data.date &&
    data.companyType
  );
}

/**
 * Generate company services filename based on data
 * Format: YYMMDD TME Services {CompanyShortName} {LastName} or YYMMDD TME Services {LastName}
 */
export function generateCompanyServicesFilename(
  companyServicesData: CompanyServicesData,
  clientInfo: SharedClientInfo
): string {
  // Format date as YYMMDD
  const date = new Date(companyServicesData.date || clientInfo.date);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const formattedDate = `${yy}${mm}${dd}`;
  
  // Get client names
  const lastName = companyServicesData.lastName || clientInfo.lastName || '';
  const shortCompanyName = companyServicesData.shortCompanyName || clientInfo.shortCompanyName || '';
  
  // Build filename based on available data
  let filename = '';
  if (shortCompanyName && lastName) {
    // YYMMDD TME Services {CompanyShortName} {LastName}
    filename = `${formattedDate} TME Services ${shortCompanyName} ${lastName}.pdf`;
  } else if (lastName) {
    // YYMMDD TME Services {LastName}
    filename = `${formattedDate} TME Services ${lastName}.pdf`;
  } else {
    // Fallback if no last name
    filename = `${formattedDate} TME Services Client.pdf`;
  }
  
  return filename;
} 