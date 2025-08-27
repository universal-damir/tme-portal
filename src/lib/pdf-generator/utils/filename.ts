// Filename generation utilities extracted from the original PDF generator
import type { OfferData } from '@/types/offer';
import { createCostCalculator } from '@/lib/business';
import { getAuthorityConfigByName } from '@/lib/authorities/registry';
import { formatDateForFilename, cleanAuthorityName } from './formatting';

// generateDynamicFilename function - updated with new IFZA/DET format
export const generateDynamicFilename = (data: OfferData): string => {
  // Format date as YYMMDD
  const date = new Date(data.clientDetails.date);
  const formattedDate = formatDateForFilename(date);

  // Authority-specific format determines company type prefix
  const authority = data.authorityInformation.responsibleAuthority;
  const isDET = authority === 'DET (Dubai Department of Economy and Tourism)';
  
  // Company type: MGT for DET, FZCO for IFZA
  const companyPrefix = isDET ? 'MGT' : 'FZCO';
  
  // Name components based on addressToCompany setting and requirements
  const firstName = data.clientDetails.firstName || '';
  const lastName = data.clientDetails.lastName || '';
  const companyName = data.clientDetails.companyName || '';
  const addressToCompany = data.clientDetails.addressToCompany || false;
  
  let nameComponents = [];
  
  if (addressToCompany && companyName) {
    // Use only CompanyShortName when "Address to company" is selected
    nameComponents.push(companyName);
  } else {
    // Use name logic: LastName FirstName as default, or only FirstName if no LastName
    if (lastName && firstName) {
      nameComponents.push(lastName, firstName);
    } else if (firstName) {
      nameComponents.push(firstName);
    } else {
      nameComponents.push('Client');
    }
    
    // Add CompanyShortName after the name (if available and not using "Address to company")
    if (companyName) {
      nameComponents.push(companyName);
    }
  }
  
  if (isDET) {
    // DET format: YYMMDD MGT {LastName} {FirstName} {CompanyShortName} Setup DET {INDI/CORP} AED {CURRENCY}
    const setupType = data.clientDetails.companySetupType === 'Corporate Setup' ? 'CORP' : 'INDI';
    const secondaryCurrency = data.clientDetails.secondaryCurrency || 'EUR';
    
    const components = [formattedDate, companyPrefix, ...nameComponents, 'Setup', 'DET', setupType, 'AED', secondaryCurrency];
    return components.join(' ') + '.pdf';
  } else {
    // IFZA format: YYMMDD FZCO {LastName} {FirstName} {CompanyShortName} Setup IFZA {years} {visaQuota} {companyVisas} {spouseVisas} {childrenVisas} AED {currency}
    const years = data.ifzaLicense?.licenseYears || 1;
    const visaQuota = data.ifzaLicense?.visaQuota || 0;
    const companyVisas = data.visaCosts?.numberOfVisas || 0;
    const spouseVisas = data.visaCosts?.spouseVisa ? 1 : 0;
    const childrenVisas = data.visaCosts?.numberOfChildVisas || 0;
    const secondaryCurrency = data.clientDetails.secondaryCurrency || 'EUR';
    
    const components = [formattedDate, companyPrefix, ...nameComponents, 'Setup', 'IFZA', 
                       years.toString(), visaQuota.toString(), companyVisas.toString(), 
                       spouseVisas.toString(), childrenVisas.toString(), 'AED', secondaryCurrency];
    return components.join(' ') + '.pdf';
  }
};

// Generate filename for family visa document
export const generateFamilyVisaFilename = (data: OfferData): string => {
  // Format date as YYMMDD
  const date = new Date(data.clientDetails.date);
  const formattedDate = formatDateForFilename(date);

  // Get basic info
  const firstName = data.clientDetails.firstName || '';
  const lastName = data.clientDetails.lastName || '';
  const companyName = data.clientDetails.companyName || '';
  const addressToCompany = data.clientDetails.addressToCompany || false;
  const authority = data.authorityInformation.responsibleAuthority;
  
  // Determine name for filename based on addressToCompany checkbox
  const nameForFilename = addressToCompany && companyName ? 
    companyName : 
    (firstName ? 
      (lastName ? `${lastName} ${firstName}` : firstName) : 
      (companyName || 'CLIENT'));
  
  // Check if this is DET authority
  const isDET = authority === 'DET (Dubai Department of Economy and Tourism)';
  
  if (isDET) {
    // For DET: YYMMDD <n> DET CORP/INDI Dependent Visa AED <SECONDARY_CURRENCY>
    const setupType = data.clientDetails.companySetupType === 'Corporate Setup' ? 'CORP' : 'INDI';
    const secondaryCurrency = data.clientDetails.secondaryCurrency;
    
    return `${formattedDate} ${nameForFilename} DET ${setupType} Dependent Visa AED ${secondaryCurrency}.pdf`;
  } else {
    // For IFZA: Similar format as main document but with "Dependent Visa" instead of "setup"
    // Get authority display name
    const authorityConfig = getAuthorityConfigByName(authority);
    const authorityDisplayName = authorityConfig?.displayName || authority;
    
    // Get actual license years selected
    const numberOfYears = authority === 'IFZA (International Free Zone Authority)' 
      ? (data.ifzaLicense?.licenseYears || 1).toString()
      : '1'; // Default to 1 year for other authorities
    
    // Get visa quota
    const visaQuota = authority === 'IFZA (International Free Zone Authority)' 
      ? (data.ifzaLicense?.visaQuota || 0)
      : 0; // DET doesn't have visa quota concept
    
    // Get visa used out of quota
    const visaUsed = data.visaCosts?.numberOfVisas || 0;
    
    // Get number of spouse visas (0 if not selected/checked)
    const spouseVisas = data.visaCosts?.spouseVisa ? 1 : 0;
    
    // Get number of children visas (0 if not selected)
    const childrenVisas = data.visaCosts?.numberOfChildVisas || 0;
    
    const secondaryCurrency = data.clientDetails.secondaryCurrency;
    
    // Clean authority name for filename (remove special characters)
    const cleanedAuthorityName = cleanAuthorityName(authorityDisplayName);
    
    // Build filename with "Dependent Visa" instead of "setup"
    const filename = `${formattedDate} ${nameForFilename} ${cleanedAuthorityName} ${numberOfYears} ${visaQuota} ${visaUsed} ${spouseVisas} ${childrenVisas} Dependent Visa AED ${secondaryCurrency}.pdf`;
    
    return filename;
  }
}; 