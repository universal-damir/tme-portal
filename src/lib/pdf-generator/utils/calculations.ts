// Calculation utilities extracted from the original PDF generator
import type { OfferData } from '@/types/offer';
import { createCostCalculator } from '@/lib/business';
import { getAuthorityConfigByName } from '@/lib/authorities/registry';
import type { AuthorityConfig } from '@/lib/authorities/types';
import type { FooterInfo } from '../types';

// getFooterInfo function - Enhanced with branding system compatibility
// Now uses the centralized branding configurations
export const getFooterInfo = (authority: string): FooterInfo => {
  // Use dynamic import to avoid circular dependency
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getFooterInfoFromBranding } = require('../branding');
    return getFooterInfoFromBranding(authority);
  } catch (error) {
    // Fallback to original implementation if branding system is not available
    if (authority === 'IFZA (International Free Zone Authority)') {
      return {
        companyName: 'TME Services FZCO',
        address: 'CIT TRN 10020 08363 00001 | VAT TRN 10020 08363 00003'
      };
    } else if (authority === 'DET (Dubai Department of Economy and Tourism)') {
      return {
        companyName: 'TME Management Consultants LLC',
        address: 'CIT TRN 10407 45547 00001 | VAT TRN 10407 45547 00003'
      };
    }
    
    // Default fallback
    return {
      companyName: 'TME Services',
      address: 'DIP 2 | Silver Building | Offices 11-17 | P.O Box 487770 | Dubai | UAE'
    };
  }
};

// Cost calculation helper - sets up calculator and calculates all costs
export const calculateAllCosts = (data: OfferData) => {
  const authorityConfig = getAuthorityConfigByName(data.authorityInformation.responsibleAuthority);
  const calculator = createCostCalculator(authorityConfig || null);

  const costs = calculator ? {
    initialSetup: calculator.calculateInitialSetupCosts(data),
    visaCosts: calculator.calculateVisaCosts(data),
    yearlyRunning: calculator.calculateYearlyRunningCosts(data)
  } : null;

  return { costs, authorityConfig, calculator };
};

// calculateTotals function extracted from lines 502-530
export const calculateTotals = (data: OfferData, costs: any) => {
  if (!costs) {
    return { setupTotal: 0, yearlyTotal: 0, depositTotal: 0 };
  }

  let setupTotal = costs.initialSetup.total;
  let yearlyTotal = costs.yearlyRunning.total;
  let depositTotal = 0;

  // Calculate deposits based on authority
  if (data.authorityInformation.responsibleAuthority === 'IFZA (International Free Zone Authority)') {
    if (data.ifzaLicense?.depositWithLandlord && data.ifzaLicense?.depositAmount) {
      depositTotal += data.ifzaLicense.depositAmount;
    }
  } else if (data.authorityInformation.responsibleAuthority === 'DET (Dubai Department of Economy and Tourism)') {
    // DET deposits
    if (data.detLicense?.rentType && data.detLicense.rentType !== 'business-center') {
      const rentAmount = data.detLicense?.officeRentAmount || 0;
      depositTotal += rentAmount * 0.05; // 5% landlord deposit
      
      // DEWA deposit
      if (data.detLicense.rentType === 'office') {
        depositTotal += 2000;
      } else if (data.detLicense.rentType === 'warehouse') {
        depositTotal += 4000;
      }
    }
  }

  return { setupTotal, yearlyTotal, depositTotal };
};

// Helper to determine if setup page should be shown
export const shouldShowInitialSetup = (authority: string): boolean => {
  return authority === 'IFZA (International Free Zone Authority)' || 
         authority === 'DET (Dubai Department of Economy and Tourism)';
};

// Helper to determine if visa costs page should be shown
export const shouldShowVisaCosts = (data: OfferData): boolean => {
  return shouldShowInitialSetup(data.authorityInformation.responsibleAuthority) && 
         Boolean(data.visaCosts?.numberOfVisas) && 
         (data.visaCosts?.numberOfVisas || 0) > 0;
};

// Helper to calculate individual visa costs for detailed breakdown
export const calculateIndividualVisaCosts = (data: OfferData, authorityConfig: AuthorityConfig | null) => {
  if (!authorityConfig || !data.visaCosts) return [];
  
  const numberOfVisas = data.visaCosts.numberOfVisas || 0;
  
  // Show individual breakdowns for any number of visas (including 1)
  if (numberOfVisas < 1) return [];
  
  const individualVisas = [];
  const reducedVisas = data.visaCosts.reducedVisaCost || 0;
  
  for (let i = 0; i < numberOfVisas; i++) {
    const isReduced = i < reducedVisas; // First N visas get reduced rate
    const visaDetail = data.visaCosts.visaDetails?.[i];
    
    const visaCosts = {
      visaNumber: i + 1,
      isReduced,
      governmentFee: isReduced ? 
        (authorityConfig.visaCosts.standardVisaFee - authorityConfig.visaCosts.reducedVisaFee) :
        authorityConfig.visaCosts.standardVisaFee,
      tmeServiceFee: authorityConfig.visaCosts.tmeVisaServiceFee,
      healthInsurance: 0,
      statusChangeFee: 0,
      vipStampingFee: 0,
      investorVisaFee: 0,
      employmentVisaFee: 0,
      total: 0
    };
    
    // Health insurance (if selected for this visa)
    if (visaDetail?.healthInsurance && visaDetail.healthInsurance !== 'No Insurance') {
      const insuranceCost = visaDetail.healthInsurance === 'Low Cost' 
        ? (authorityConfig.visaCosts.healthInsurance.lowCost || 1000)
        : (authorityConfig.visaCosts.healthInsurance.silverPackage || 6000);
      visaCosts.healthInsurance = insuranceCost;
    }
    
    // Status change (check if this visa needs status change)
    // Try new per-visa structure first, fallback to legacy (handle both string "true" and boolean true)
    const hasStatusChange = visaDetail?.statusChange === true || (visaDetail?.statusChange as any) === "true" ||
                           (data.visaCosts.visaStatusChange && i < data.visaCosts.visaStatusChange);
    if (hasStatusChange && authorityConfig.visaCosts.statusChangeFee) {
      visaCosts.statusChangeFee = authorityConfig.visaCosts.statusChangeFee;
    }
    
    // VIP stamping (check if this visa needs VIP stamping)  
    // Try new per-visa structure first, fallback to legacy (handle both string "true" and boolean true)
    const hasVipStamping = visaDetail?.vipStamping === true || (visaDetail?.vipStamping as any) === "true" ||
                          (data.visaCosts.vipStamping && data.visaCosts.vipStampingVisas && i < data.visaCosts.vipStampingVisas);
    if (hasVipStamping && authorityConfig.visaCosts.vipStampingFee) {
      visaCosts.vipStampingFee = authorityConfig.visaCosts.vipStampingFee;
    }
    
    // Investor visa fee (check if this is an investor visa)
    // Try new per-visa structure first, fallback to legacy counting (handle both string "true" and boolean true)
    const isInvestorVisa = visaDetail?.investorVisa === true || (visaDetail?.investorVisa as any) === "true" ||
                          (data.visaCosts.numberOfInvestorVisas && i < data.visaCosts.numberOfInvestorVisas);
    if (authorityConfig.features.hasInvestorVisas && isInvestorVisa && authorityConfig.visaCosts.investorVisaFee) {
      visaCosts.investorVisaFee = authorityConfig.visaCosts.investorVisaFee;
    }
    
    // Employment visa fees (DET specific - check if this is an employment visa)
    if (authorityConfig.id === 'det') {
      const isEmploymentVisa = visaDetail?.investorVisa === "employment";
      if (isEmploymentVisa) {
        const employeeInsurance = authorityConfig.visaCosts.employmentVisaEmployeeInsurance || 0;
        visaCosts.employmentVisaFee = employeeInsurance;
      }
    }
    
    // Calculate total
    visaCosts.total = visaCosts.governmentFee + 
                     visaCosts.tmeServiceFee + 
                     visaCosts.healthInsurance + 
                     visaCosts.statusChangeFee + 
                     visaCosts.vipStampingFee + 
                     visaCosts.investorVisaFee + 
                     visaCosts.employmentVisaFee;
    
    individualVisas.push(visaCosts);
  }
  
  return individualVisas;
};

// Helper to calculate individual child visa costs for detailed breakdown
export const calculateIndividualChildVisaCosts = (data: OfferData, authorityConfig: AuthorityConfig | null) => {
  if (!authorityConfig || !data.visaCosts || authorityConfig.id !== 'ifza') return [];
  
  const numberOfChildVisas = data.visaCosts.numberOfChildVisas || 0;
  if (numberOfChildVisas <= 1) return [];
  
  const individualChildVisas = [];
  
  for (let i = 0; i < numberOfChildVisas; i++) {
    const childVisaDetail = data.visaCosts.childVisaDetails?.[i];
    
    const childVisaCosts = {
      childNumber: i + 1,
      standardFee: authorityConfig.visaCosts.childVisaStandardFee || 3170,
      tmeServiceFee: authorityConfig.visaCosts.childVisaTmeServiceFee || 1569,
      healthInsurance: 0,
      statusChangeFee: 0,
      vipStampingFee: 0,
      total: 0
    };
    
    // Health insurance (if selected for this child)
    if (childVisaDetail?.healthInsurance && childVisaDetail.healthInsurance !== 'No Insurance') {
      const insuranceCost = childVisaDetail.healthInsurance === 'Low Cost' 
        ? (authorityConfig.visaCosts.healthInsurance.lowCost || 1000)
        : (authorityConfig.visaCosts.healthInsurance.silverPackage || 6000);
      childVisaCosts.healthInsurance = insuranceCost;
    }
    
    // Status change (check if this child needs status change)
    const childVisaStatusChange = data.visaCosts.childVisaStatusChange || 0;
    if (i < childVisaStatusChange && authorityConfig.visaCosts.statusChangeFee) {
      childVisaCosts.statusChangeFee = authorityConfig.visaCosts.statusChangeFee;
    }
    
    // VIP stamping (check if this child needs VIP stamping)
    const childVisaVipStamping = data.visaCosts.childVisaVipStamping || 0;
    if (i < childVisaVipStamping && authorityConfig.visaCosts.vipStampingFee) {
      childVisaCosts.vipStampingFee = authorityConfig.visaCosts.vipStampingFee;
    }
    
    // Calculate total
    childVisaCosts.total = childVisaCosts.standardFee + 
                          childVisaCosts.tmeServiceFee + 
                          childVisaCosts.healthInsurance + 
                          childVisaCosts.statusChangeFee + 
                          childVisaCosts.vipStampingFee;
    
    individualChildVisas.push(childVisaCosts);
  }
  
  return individualChildVisas;
}; 