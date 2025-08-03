import { OfferData } from '@/types/offer';
import { AuthorityConfig } from '@/lib/business';

export interface VisaServiceItem {
  id: string;
  condition: boolean;
  description: string;
  amount: number;
  isReduction?: boolean;
  explanation?: string;
}

// Generate main company visa services (excludes family visas)
export const generateCompanyVisaServiceDescriptions = (
  data: OfferData, 
  visaCostData: any, 
  authorityConfig: AuthorityConfig | null | undefined
): VisaServiceItem[] => {
  const services: VisaServiceItem[] = [];
  
  if (!visaCostData) return services;

  const numberOfVisas = data.visaCosts?.numberOfVisas || 0;
  
  // Count investor visas - try new per-visa structure first, fallback to legacy (handle both string "true" and boolean true)
  const perVisaInvestorVisas = data.visaCosts?.visaDetails?.filter(visa => 
    visa.investorVisa === true || (visa.investorVisa as any) === "true"
  ).length || 0;
  const numberOfInvestorVisas = perVisaInvestorVisas > 0 ? perVisaInvestorVisas : (data.visaCosts?.numberOfInvestorVisas || 0);
  
  // Count status changes - try new per-visa structure first, fallback to legacy (handle both string "true" and boolean true)
  const perVisaStatusChanges = data.visaCosts?.visaDetails?.filter(visa => 
    visa.statusChange === true || (visa.statusChange as any) === "true"
  ).length || 0;
  const visaStatusChangeCount = perVisaStatusChanges > 0 ? perVisaStatusChanges : (data.visaCosts?.visaStatusChange || 0);
  
  // Count VIP stamping - try new per-visa structure first, fallback to legacy (handle both string "true" and boolean true)
  const perVisaVipStamping = data.visaCosts?.visaDetails?.filter(visa => 
    visa.vipStamping === true || (visa.vipStamping as any) === "true"
  ).length || 0;
  const vipStampingCount = perVisaVipStamping > 0 ? perVisaVipStamping : (data.visaCosts?.vipStampingVisas || 0);
  
  const reducedVisas = data.visaCosts?.reducedVisaCost || 0;
  
  const visaText = (count: number) => count === 1 ? 'visa' : 'visas';

  // 1. Standard Authority Costs for Visa and Emirates ID Application
  if (visaCostData.standardGovernmentFees > 0) {
    services.push({
      id: 'standard-government-fees',
      condition: true,
      description: `Standard authority costs (${numberOfVisas} ${visaText(numberOfVisas)})`,
      amount: visaCostData.standardGovernmentFees,
      explanation: 'For mandatory UAE medical test, Emirates ID, and immigration residency processing.'
    });
  }

  // 2. Reduced Authority Costs (shown as discount from standard rate)
  if (visaCostData.reducedGovernmentFees > 0) {
    services.push({
      id: 'reduced-government-fees',
      condition: true,
      description: `Reduced authority costs (${reducedVisas} ${visaText(reducedVisas)})`,
      amount: visaCostData.reducedGovernmentFees,
      isReduction: true,
      explanation: 'Reduced rate available under the IFZA promotion. This offer is limited to one visa only and may change depending on timing. A prompt decision increases your chances of securing this rate.'
    });
  }

  // 3. IFZA Investor Visa Cost
  if (visaCostData.investorVisaFees > 0) {
    services.push({
      id: 'investor-visa-fees',
      condition: true,
      description: `${authorityConfig?.displayName || 'IFZA'} investor visa cost (${numberOfInvestorVisas} ${visaText(numberOfInvestorVisas)})`,
      amount: visaCostData.investorVisaFees,
      explanation: 'Charged by IFZA for issuing an investor visa.'
    });
  }

  // 4. Health Insurance breakdown by type
  if (visaCostData.healthInsurance > 0) {
    const insuranceBreakdown: { [key: string]: { count: number; cost: number } } = {};
    
    data.visaCosts?.visaDetails?.forEach((visaDetail) => {
      if (visaDetail?.healthInsurance && visaDetail.healthInsurance !== 'No Insurance' && visaDetail.healthInsurance !== '') {
        const type = visaDetail.healthInsurance;
        const costPerVisa = type === 'Low Cost' 
          ? (authorityConfig?.visaCosts.healthInsurance.lowCost || 1000) 
          : (authorityConfig?.visaCosts.healthInsurance.silverPackage || 6000);
        
        if (!insuranceBreakdown[type]) {
          insuranceBreakdown[type] = { count: 0, cost: costPerVisa };
        }
        insuranceBreakdown[type].count++;
      }
    });

    Object.entries(insuranceBreakdown).forEach(([type, insuranceData]) => {
      services.push({
        id: `health-insurance-${type.toLowerCase().replace(/\s+/g, '-')}`,
        condition: true,
        description: `Health insurance (${type.toLowerCase()}) (${insuranceData.count} ${visaText(insuranceData.count)})`,
        amount: insuranceData.count * insuranceData.cost,
        explanation: `Mandatory health insurance coverage providing ${type.toLowerCase()} level medical benefits for visa holders.`
      });
    });
  }

  // 5. Employment Visa Fees (DET specific)
  if (visaCostData.employmentVisaFees > 0) {
    // Check per-visa employment selections for DET (only DET uses employment visas)
    const numberOfEmploymentVisas = authorityConfig?.id === 'det' 
      ? (data.visaCosts?.visaDetails?.filter(visa => visa.investorVisa === "employment").length || 0)
      : 0;
    const employeeInsuranceCost = numberOfEmploymentVisas * (authorityConfig?.visaCosts.employmentVisaEmployeeInsurance || 190);
    
    services.push({
      id: 'employee-insurance',
      condition: true,
      description: `Employee insurance per employee per visa (${numberOfEmploymentVisas} ${visaText(numberOfEmploymentVisas)})`,
      amount: employeeInsuranceCost,
      explanation: 'Mandatory insurance coverage for employees as per UAE labor law requirements.'
    });
  }

  // 6. Visa Status Change
  if (visaCostData.statusChangeFees > 0) {
    services.push({
      id: 'visa-status-change',
      condition: true,
      description: `Authority cost for visa status change (${visaStatusChangeCount} ${visaText(visaStatusChangeCount)})`,
      amount: visaCostData.statusChangeFees,
      explanation: 'For changing visa status from tourist/visit visa to employment residence visa.'
    });
  }

  // 7. VIP Stamping Service
  if (visaCostData.vipStampingFees > 0) {
    services.push({
      id: 'vip-stamping-service',
      condition: true,
      description: `VIP authority stamping cost - express visa stamp (${vipStampingCount} ${visaText(vipStampingCount)})`,
      amount: visaCostData.vipStampingFees,
      explanation: 'For faster visa stamping and processing with priority handling at immigration counters.'
    });
  }

  // 8. TME Services Professional Fee for Visa and Emirates ID Application (ALWAYS LAST)
  if (visaCostData.tmeServicesFees > 0) {
    services.push({
      id: 'tme-services-professional-fee',
      condition: true,
      description: `TME Services professional fee (${numberOfVisas} ${visaText(numberOfVisas)})`,
      amount: visaCostData.tmeServicesFees,
      explanation: 'Covers the complete management of the visa and Emirates ID application process, including document preparation, liaison with the relevant authorities, and personal accompaniment by an experienced TME Services team member to all required appointments.'
    });
  }

  return services.filter(service => service.condition);
};

// Generate spouse visa services
export const generateSpouseVisaServiceDescriptions = (
  data: OfferData, 
  visaCostData: any
): VisaServiceItem[] => {
  const services: VisaServiceItem[] = [];
  
  if (!visaCostData) return services;
  
  // Check if spouse visa is enabled in the form data
  const hasSpouseVisa = data.visaCosts?.spouseVisa === true;
  if (!hasSpouseVisa) return services;

  // 1. Standard Authority Costs for Spouse Visa and Emirates ID Application (always show if spouse visa selected)
  services.push({
    id: 'spouse-visa-standard-fees',
    condition: true,
    description: 'Standard authority costs',
    amount: visaCostData.spouseVisaStandardFees || 0,
    explanation: 'For mandatory UAE medical test, Emirates ID, and immigration residency processing.'
  });

  // 2. Authority Cost for Spouse Visa Status Change
  if (visaCostData.spouseVisaStatusChangeFees > 0) {
    services.push({
      id: 'spouse-visa-status-change',
      condition: true,
      description: 'Visa status change authority costs',
      amount: visaCostData.spouseVisaStatusChangeFees,
      explanation: 'For changing spouse visa status from tourist/visit visa to residence visa.'
    });
  }

  // 3. Spouse Visa Health Insurance
  if (visaCostData.spouseVisaHealthInsurance > 0) {
    const insuranceType = data.visaCosts?.spouseVisaInsurance || 'Insurance';
    services.push({
      id: 'spouse-visa-health-insurance',
      condition: true,
      description: `Health insurance (${insuranceType.toLowerCase()})`,
      amount: visaCostData.spouseVisaHealthInsurance,
      explanation: 'Mandatory health insurance coverage for spouse visa holder.'
    });
  }

  // 4. Spouse Visa VIP Stamping Service
  if (visaCostData.spouseVisaVipStampingFees > 0) {
    services.push({
      id: 'spouse-visa-vip-stamping',
      condition: true,
      description: 'VIP visa stamping service',
      amount: visaCostData.spouseVisaVipStampingFees,
      explanation: 'Express service for faster spouse visa stamping and processing.'
    });
  }

  // 5. TME Services Professional Fee for Spouse Visa and Emirates ID (ALWAYS LAST - always show if spouse visa selected)
  services.push({
    id: 'spouse-visa-tme-services',
    condition: true,
    description: 'TME Services professional fee',
    amount: visaCostData.spouseVisaTmeServicesFees || 0,
    explanation: 'Covers the complete management of the visa and Emirates ID application process, including document preparation, liaison with the relevant authorities, and personal accompaniment by an experienced TME Services team member to all required appointments.'
  });

  return services.filter(service => service.condition);
};

// Generate child visa services
export const generateChildVisaServiceDescriptions = (
  data: OfferData, 
  visaCostData: any,
  authorityConfig: AuthorityConfig | null | undefined
): VisaServiceItem[] => {
  const services: VisaServiceItem[] = [];
  
  if (!visaCostData) return services;
  
  // Check if child visa is enabled in the form data
  const hasChildVisa = data.visaCosts?.childVisa === true;
  if (!hasChildVisa) return services;

  // 1. Standard Authority Costs for Child Visa and Emirates ID Application (always show if child visa selected)
  services.push({
    id: 'child-visa-standard-fees',
    condition: true,
    description: 'Standard authority costs',
    amount: visaCostData.childVisaStandardFees || 0,
    explanation: 'For mandatory UAE medical test, Emirates ID, and immigration residency processing.'
  });

  // 2. Authority Cost for Child Visa Status Change
  if (visaCostData.childVisaStatusChangeFees > 0) {
    services.push({
      id: 'child-visa-status-change',
      condition: true,
      description: 'Visa status change authority costs',
      amount: visaCostData.childVisaStatusChangeFees,
      explanation: 'For changing child visa status from tourist/visit visa to residence visa.'
    });
  }

  // 3. Child Visa Health Insurance breakdown by type
  if (visaCostData.childVisaHealthInsurance > 0) {
    const childInsuranceBreakdown: { [key: string]: { count: number; cost: number } } = {};
    
    data.visaCosts?.childVisaDetails?.forEach((visaDetail) => {
      if (visaDetail?.healthInsurance && visaDetail.healthInsurance !== 'No Insurance' && visaDetail.healthInsurance !== '') {
        const type = visaDetail.healthInsurance;
        const costPerVisa = type === 'Low Cost' 
          ? (authorityConfig?.visaCosts.healthInsurance.lowCost || 1000) 
          : (authorityConfig?.visaCosts.healthInsurance.silverPackage || 6000);
        
        if (!childInsuranceBreakdown[type]) {
          childInsuranceBreakdown[type] = { count: 0, cost: costPerVisa };
        }
        childInsuranceBreakdown[type].count++;
      }
    });

    Object.entries(childInsuranceBreakdown).forEach(([type, insuranceData]) => {
      services.push({
        id: `child-visa-health-insurance-${type.toLowerCase().replace(/\s+/g, '-')}`,
        condition: true,
        description: `Health insurance (${type.toLowerCase()})`,
        amount: insuranceData.count * insuranceData.cost,
        explanation: `Mandatory health insurance coverage providing ${type.toLowerCase()} level medical benefits for child visa holders.`
      });
    });
  }

  // 4. Child Visa VIP Stamping Service
  if (visaCostData.childVisaVipStampingFees > 0) {
    services.push({
      id: 'child-visa-vip-stamping',
      condition: true,
      description: 'VIP visa stamping service',
      amount: visaCostData.childVisaVipStampingFees,
      explanation: 'For faster child visa stamping and processing.'
    });
  }

  // 5. TME Services Professional Fee for Child Visa and Emirates ID (ALWAYS LAST - always show if child visa selected)
  services.push({
    id: 'child-visa-tme-services',
    condition: true,
    description: 'TME Services professional fee',
    amount: visaCostData.childVisaTmeServicesFees || 0,
    explanation: 'Covers the complete management of the visa and Emirates ID application process, including document preparation, liaison with the relevant authorities, and personal accompaniment by an experienced TME Services team member to all required appointments.'
  });

  return services.filter(service => service.condition);
};

// Legacy function for backward compatibility - now calls company visa services
export const generateVisaServiceDescriptions = (
  data: OfferData, 
  visaCostData: any, 
  authorityConfig: AuthorityConfig | null | undefined
): VisaServiceItem[] => {
  return generateCompanyVisaServiceDescriptions(data, visaCostData, authorityConfig);
};

// Generate numbered visa services
export const generateNumberedVisaServices = (services: VisaServiceItem[]): Array<VisaServiceItem & { number: number }> => {
  return services.map((service, index) => ({
    ...service,
    number: index + 1
  }));
};

// Format visa service description with number
export const formatVisaServiceDescription = (service: VisaServiceItem & { number: number }): string => {
  return `${service.number}. ${service.description}`;
};

// Generate visa explanations for the explanation section
export const generateVisaExplanations = (
  data: OfferData, 
  visaCostData: any, 
  authorityConfig: AuthorityConfig | null | undefined
): Array<{ id: string; title: string; explanation: string }> => {
  const companyServices = generateCompanyVisaServiceDescriptions(data, visaCostData, authorityConfig);
  const spouseServices = generateSpouseVisaServiceDescriptions(data, visaCostData);
  const childServices = generateChildVisaServiceDescriptions(data, visaCostData, authorityConfig);
  
  const allServices = [...companyServices, ...spouseServices, ...childServices];
  
  return allServices
    .filter(service => service.explanation)
    .map(service => ({
      id: service.id,
      title: service.description
        .replace(/^\d+\.\s/, '') // Remove any leading number
        .replace(/\s*\([^)]*\s*visas?\s*[^)]*\)/gi, ''), // Remove bracketed visa counts like "(2 visas)" or "(1 visa)"
      explanation: service.explanation || ''
    }));
};

// Generate company-only visa explanations for individual visa breakdown
// Excludes spouse and child visa explanations since they are handled in the separate dependent visa document
export const generateCompanyVisaExplanations = (
  data: OfferData, 
  visaCostData: any, 
  authorityConfig: AuthorityConfig | null | undefined
): Array<{ id: string; title: string; explanation: string }> => {
  const companyServices = generateCompanyVisaServiceDescriptions(data, visaCostData, authorityConfig);
  
  return companyServices
    .filter(service => service.explanation)
    .map(service => ({
      id: service.id,
      title: service.description
        .replace(/^\d+\.\s/, '') // Remove any leading number
        .replace(/\s*\([^)]*\s*visas?\s*[^)]*\)/gi, ''), // Remove bracketed visa counts like "(2 visas)" or "(1 visa)"
      explanation: service.explanation || ''
    }));
}; 