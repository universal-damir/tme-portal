// Filename generation utilities extracted from the original PDF generator
import type { OfferData } from '@/types/offer';
import { createCostCalculator } from '@/lib/business';
import { getAuthorityConfigByName } from '@/lib/authorities/registry';
import { formatDateForFilename, cleanAuthorityName } from './formatting';

// generateDynamicFilename function extracted from lines 2760-2828
export const generateDynamicFilename = (data: OfferData): string => {
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
    // For DET: YYMMDD <NAME> DET CORP/INDIV AED <SECONDARY_CURRENCY>
    const setupType = data.clientDetails.companySetupType === 'Corporate Setup' ? 'CORP' : 'INDIV';
    const secondaryCurrency = data.clientDetails.secondaryCurrency;
    
    return `${formattedDate} ${nameForFilename} DET ${setupType} setup AED ${secondaryCurrency}.pdf`;
  } else {
    // For IFZA: Keep existing format
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
    
    // Calculate costs using the same logic as the UI
    const calculator = createCostCalculator(authorityConfig || null);
    const costs = calculator ? {
      initialSetup: calculator.calculateInitialSetupCosts(data),
      yearlyRunning: calculator.calculateYearlyRunningCosts(data)
    } : null;
    
    const setupTotal = costs?.initialSetup.total || 0;
    const yearlyTotal = costs?.yearlyRunning.total || 0;
    
    // Add deposits to setup total if applicable
    let totalSetupCost = setupTotal;
    if (data.ifzaLicense?.depositWithLandlord && data.ifzaLicense.depositAmount) {
      totalSetupCost += data.ifzaLicense.depositAmount;
    }
    if (authority === 'DET (Dubai Department of Economy and Tourism)' && 
        data.detLicense?.rentType && data.detLicense.rentType !== 'business-center') {
      const detRentAmount = data.detLicense.officeRentAmount || 0;
      const detLandlordDeposit = detRentAmount * 0.05;
      const detDewaDeposit = data.detLicense.rentType === 'office' ? 2000 : (data.detLicense.rentType === 'warehouse' ? 4000 : 0);
      totalSetupCost += detLandlordDeposit + detDewaDeposit;
    }
    
    const secondaryCurrency = data.clientDetails.secondaryCurrency;
    
    // Clean authority name for filename (remove special characters)
    const cleanedAuthorityName = cleanAuthorityName(authorityDisplayName);
    
    // Build filename
    const filename = `${formattedDate} ${nameForFilename} ${cleanedAuthorityName} ${numberOfYears} ${visaQuota} ${visaUsed} ${spouseVisas} ${childrenVisas} setup AED ${secondaryCurrency}.pdf`;
    
    return filename;
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
    // For DET: YYMMDD <n> DET CORP/INDIV Dependent Visa AED <SECONDARY_CURRENCY>
    const setupType = data.clientDetails.companySetupType === 'Corporate Setup' ? 'CORP' : 'INDIV';
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