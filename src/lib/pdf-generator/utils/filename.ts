// Filename generation utilities extracted from the original PDF generator
import type { OfferData } from '@/types/offer';
import { createCostCalculator } from '@/lib/business';
import { getAuthorityConfigByName } from '@/lib/authorities/registry';
import { formatDateForFilename, cleanAuthorityName } from './formatting';

// generateDynamicFilename function - updated with new naming convention
export const generateDynamicFilename = (data: OfferData): string => {
  // Format date as YYMMDD
  const date = new Date(data.clientDetails.date);
  const formattedDate = formatDateForFilename(date);

  // Authority-specific format determines company type prefix
  const authority = data.authorityInformation.responsibleAuthority;
  const isDET = authority === 'DET (Dubai Department of Economy and Tourism)';
  
  // Company type: MGT for DET, FZCO for IFZA
  const companyPrefix = isDET ? 'MGT' : 'FZCO';
  
  // Get the names and company details
  const firstName = data.clientDetails.firstName || '';
  const shortCompanyName = data.clientDetails.shortCompanyName || '';
  
  // Build filename components based on new format:
  // YYMMDD {TME Company} {Company Short name} {First name}
  const nameComponents = [];
  
  // Add short company name if available
  if (shortCompanyName) {
    nameComponents.push(shortCompanyName);
  }
  
  // Add first name
  if (firstName) {
    nameComponents.push(firstName);
  }
  
  if (isDET) {
    // DET format for individual: YYMMDD MGT {ShortCompanyName} {FirstName} DET
    // DET format for corporate: YYMMDD MGT {ShortCompanyName} {FirstName} DET CORP
    const components = [formattedDate, companyPrefix, ...nameComponents, 'DET'];
    
    // Add CORP only for corporate setup
    if (data.clientDetails.companySetupType === 'Corporate Setup') {
      components.push('CORP');
    }
    
    return components.join(' ') + '.pdf';
  } else {
    // IFZA format: YYMMDD FZCO {ShortCompanyName} {FirstName} IFZA
    const components = [formattedDate, companyPrefix, ...nameComponents, 'IFZA'];
    return components.join(' ') + '.pdf';
  }
};

// Generate filename for family visa document - updated with new naming convention
export const generateFamilyVisaFilename = (data: OfferData): string => {
  // Format date as YYMMDD
  const date = new Date(data.clientDetails.date);
  const formattedDate = formatDateForFilename(date);

  // Authority-specific format determines company type prefix
  const authority = data.authorityInformation.responsibleAuthority;
  const isDET = authority === 'DET (Dubai Department of Economy and Tourism)';
  
  // Company type: MGT for DET, FZCO for IFZA
  const companyPrefix = isDET ? 'MGT' : 'FZCO';
  
  // Get the names and company details
  const firstName = data.clientDetails.firstName || '';
  const shortCompanyName = data.clientDetails.shortCompanyName || '';
  
  // Build filename components based on new format (same as main document but with "Dependent Visa" suffix)
  const nameComponents = [];
  
  // Add short company name if available
  if (shortCompanyName) {
    nameComponents.push(shortCompanyName);
  }
  
  // Add first name
  if (firstName) {
    nameComponents.push(firstName);
  }
  
  if (isDET) {
    // DET format for individual: YYMMDD MGT {ShortCompanyName} {FirstName} DET Dependent Visa
    // DET format for corporate: YYMMDD MGT {ShortCompanyName} {FirstName} DET CORP Dependent Visa
    const components = [formattedDate, companyPrefix, ...nameComponents, 'DET'];
    
    // Add CORP only for corporate setup
    if (data.clientDetails.companySetupType === 'Corporate Setup') {
      components.push('CORP');
    }
    
    components.push('Dependent', 'Visa');
    return components.join(' ') + '.pdf';
  } else {
    // IFZA format: YYMMDD FZCO {ShortCompanyName} {FirstName} IFZA Dependent Visa
    const components = [formattedDate, companyPrefix, ...nameComponents, 'IFZA', 'Dependent', 'Visa'];
    return components.join(' ') + '.pdf';
  }
}; 