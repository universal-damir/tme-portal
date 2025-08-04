import { GoldenVisaData } from '@/types/golden-visa';
import { SharedClientInfo } from '@/types/portal';
import { OfferData } from '@/types/offer';
import { getBrandingById } from '../branding';

// Golden Visa Service Item interface (similar to VisaServiceItem)
export interface GoldenVisaServiceItem {
  id: string;
  condition: boolean;
  description: string;
  amount: number;
  explanation?: string;
}

// Transform Golden Visa data into the standard PDF component data format
// This allows golden visa components to use the same shared components as cost overview
export function transformGoldenVisaData(
  goldenVisaData: GoldenVisaData,
  clientInfo: SharedClientInfo
): OfferData & { goldenVisaData: GoldenVisaData } {
  const branding = getBrandingById(goldenVisaData.companyType);
  
  return {
    clientDetails: {
      firstName: clientInfo.firstName || '',
      lastName: clientInfo.lastName || '',
      companyName: goldenVisaData.companyName || '',
      addressToCompany: Boolean(goldenVisaData.companyName),
      date: clientInfo.date,
      companySetupType: 'Golden Visa Application',
      secondaryCurrency: goldenVisaData.secondaryCurrency,
      exchangeRate: goldenVisaData.exchangeRate,
    },
    authorityInformation: {
      responsibleAuthority: getAuthorityDisplayName(goldenVisaData.visaType),
      areaInUAE: 'Dubai',
      legalEntity: `${getVisaTypeDisplayName(goldenVisaData.visaType)} Golden Visa`,
      shareCapitalAED: 0,
      valuePerShareAED: 0,
      numberOfShares: 0,
    },
    activityCodes: [],
    ifzaLicense: undefined,
    detLicense: undefined,
    visaCosts: undefined,
    additionalServices: undefined,
    // Add the original golden visa data for access by components
    goldenVisaData: goldenVisaData,
  };
}

// Get authority display name based on visa type
function getAuthorityDisplayName(visaType: string): string {
  switch (visaType) {
    case 'property-investment':
      return 'Property Investment Golden Visa';
    case 'time-deposit':
      return 'Time Deposit Golden Visa';
    case 'skilled-employee':
      return 'Skilled Employee Golden Visa';
    default:
      return 'Golden Visa Application';
  }
}

// Get visa type display name for headlines
export function getVisaTypeDisplayName(visaType: string): string {
  switch (visaType) {
    case 'property-investment':
      return 'Property Investment';
    case 'time-deposit':
      return 'Time Deposit';
    case 'skilled-employee':
      return 'Skilled Employee';
    default:
      return 'Golden Visa';
  }
}

// Get visa type title for document headlines
export function getVisaTypeTitle(visaType: string): string {
  switch (visaType) {
    case 'property-investment':
      return 'Offer for 10 year property investment visa (golden)';
    case 'time-deposit':
      return 'Offer for 10 year time deposit visa (golden)';
    case 'skilled-employee':
      return 'Offer for 10 year skilled employee visa (golden)';
    default:
      return 'Golden Visa Application';
  }
}

// Check if dependents are selected
export function hasDependentVisas(goldenVisaData: GoldenVisaData): boolean {
  return Boolean(
    goldenVisaData.dependents?.spouse?.required || 
    (goldenVisaData.dependents?.children?.count || 0) > 0
  );
}

// Generate Authority Fees breakdown with detailed numbered items
export function generateGoldenVisaAuthorityFeesBreakdown(goldenVisaData: GoldenVisaData): GoldenVisaServiceItem[] {
  const services: GoldenVisaServiceItem[] = [];
  
  // Only generate authority fees if primary visa is required
  if (!goldenVisaData.primaryVisaRequired) {
    return services;
  }
  
  const visaType = goldenVisaData.visaType;

  if (visaType === 'property-investment' && goldenVisaData.propertyAuthorityFees) {
    // Property Investment - includes DLD fee
    const fees = goldenVisaData.propertyAuthorityFees;
    
    services.push({
      id: 'dld-approval',
      condition: true,
      description: '1. DLD (Dubai Land Department) approval cost',
      amount: fees.dldApprovalFee,
      explanation: 'Approval cost required for property investment Golden Visa applications.'
    });

    services.push({
      id: 'standard-authority-costs',
      condition: true,
      description: '2. Standard authority costs',
      amount: fees.standardAuthorityCosts || (fees.mandatoryUaeMedicalTest + fees.emiratesIdFee + fees.immigrationResidencyFee) || 5010,
      explanation: 'For mandatory UAE medical test, Emirates ID, and immigration residency processing.'
    });

    if (fees.visaCancellation && fees.visaCancellationFee > 0) {
      services.push({
        id: 'visa-cancellation',
        condition: true,
        description: '3. Visa cancellation cost',
        amount: fees.visaCancellationFee,
        explanation: 'For canceling existing visa status before applying for Golden Visa.'
      });
    }

    services.push({
      id: 'third-party-costs',
      condition: true,
      description: fees.visaCancellation ? '4. Third party costs' : '3. Third party costs',
      amount: fees.thirdPartyCosts,
      explanation: 'Administrative costs charged by various departments.'
    });

    // Add TME Services Professional Fee as final point
    const baseTmeServicesFee = goldenVisaData.tmeServicesFee || 0;
    services.push({
      id: 'tme-professional-fee',
      condition: true,
      description: fees.visaCancellation ? '5. TME Services professional fee' : '4. TME Services professional fee',
      amount: baseTmeServicesFee,
      explanation: 'TME Services Professional Fee: Covers the complete management of the visa and Emirates ID application process, including document preparation, liaison with the relevant authorities, and personal accompaniment by an experienced TME Services team member to all required appointments.'
    });
  } else if ((visaType === 'time-deposit' || visaType === 'skilled-employee') && goldenVisaData.skilledEmployeeAuthorityFees) {
    // Time Deposit and Skilled Employee (without NOC) - no DLD fee
    const fees = goldenVisaData.skilledEmployeeAuthorityFees;
    
    services.push({
      id: 'standard-authority-costs',
      condition: true,
      description: '1. Standard authority costs',
      amount: fees.standardAuthorityCosts || (fees.mandatoryUaeMedicalTest + fees.emiratesIdFee + fees.immigrationResidencyFee) || 5010,
      explanation: 'For mandatory UAE medical test, Emirates ID, and immigration residency processing.'
    });

    if (fees.visaCancellation && fees.visaCancellationFee > 0) {
      services.push({
        id: 'visa-cancellation',
        condition: true,
        description: '2. Visa cancellation cost',
        amount: fees.visaCancellationFee,
        explanation: 'For canceling existing visa status before applying for Golden Visa.'
      });
    }

    services.push({
      id: 'third-party-costs',
      condition: true,
      description: fees.visaCancellation ? '3. Third party costs' : '2. Third party costs',
      amount: fees.thirdPartyCosts,
      explanation: 'Administrative costs charged by various departments.'
    });

    // Add TME Services Professional Fee as final point
    const baseTmeServicesFee = goldenVisaData.tmeServicesFee || 0;
    services.push({
      id: 'tme-professional-fee',
      condition: true,
      description: fees.visaCancellation ? '4. TME Services professional fee' : '3. TME Services professional fee',
      amount: baseTmeServicesFee,
      explanation: 'TME Services Professional Fee: Covers the complete management of the visa and Emirates ID application process, including document preparation, liaison with the relevant authorities, and personal accompaniment by an experienced TME Services team member to all required appointments.'
    });
  } else {
    // Fallback to simple structure for backwards compatibility
    services.push({
      id: 'government-fees',
      condition: true,
      description: '1. Government Costs (Medical Test + Emirates ID + Processing)',
      amount: goldenVisaData.governmentFee || 0,
      explanation: 'Government costs including medical examination, Emirates ID processing, and visa application charges.'
    });
  }

  return services.filter(service => service.condition);
}

// Generate TME Services breakdown with detailed numbered items
export function generateGoldenVisaTMEServicesBreakdown(goldenVisaData: GoldenVisaData): GoldenVisaServiceItem[] {
  const services: GoldenVisaServiceItem[] = [];
  
  // Only generate TME services if primary visa is required
  if (!goldenVisaData.primaryVisaRequired) {
    return services;
  }
  
  const baseTmeServicesFee = goldenVisaData.tmeServicesFee || 0;

  services.push({
    id: 'tme-professional-fee',
    condition: true,
    description: '1. TME Services Professional Fee',
    amount: baseTmeServicesFee,
    explanation: 'For managing the Golden Visa application process, including document preparation, government liaison, processing coordination, and our administrative costs.'
  });

  return services.filter(service => service.condition);
}

// Generate explanations for authority fees and TME services
export function generateGoldenVisaExplanations(goldenVisaData: GoldenVisaData): Array<{ id: string; title: string; explanation: string }> {
  const authorityServices = generateGoldenVisaAuthorityFeesBreakdown(goldenVisaData);
  // TME Services is now included in authority breakdown, so no need to add separately
  
  return authorityServices
    .filter(service => service.explanation)
    .map(service => ({
      id: service.id,
      title: service.description.replace(/^\d+\.\s/, ''), // Remove numbering from title
      explanation: service.explanation || ''
    }));
}

// Generate Spouse Visa breakdown with detailed numbered items
export function generateGoldenVisaSpouseVisaBreakdown(goldenVisaData: GoldenVisaData): GoldenVisaServiceItem[] {
  const services: GoldenVisaServiceItem[] = [];
  const spouse = goldenVisaData.dependents?.spouse;
  
  if (!spouse?.required) return services;

  // Use detailed authority fees if available, otherwise fallback to legacy
  if (goldenVisaData.dependentAuthorityFees) {
    const fees = goldenVisaData.dependentAuthorityFees;
    
    services.push({
      id: 'spouse-file-opening',
      condition: true,
      description: '1. Dependent file opening cost',
      amount: fees.dependentFileOpening,
      explanation: 'For opening dependent visa file (applies to first dependent only).'
    });

    services.push({
      id: 'spouse-standard-authority-costs',
      condition: true,
      description: '2. Standard authority costs',
      amount: fees.standardAuthorityCostsSpouse || (fees.mandatoryUaeMedicalTest + fees.emiratesIdFee + fees.immigrationResidencyFeeSpouse) || 4710,
      explanation: 'For mandatory UAE medical test, Emirates ID, and immigration residency processing.'
    });

    // Check for visa cancellation - either from global setting or individual spouse setting
    const hasVisaCancellation = (fees.visaCancellation && fees.visaCancellationFee > 0) || 
                               (spouse.visaCancelation && spouse.visaCancelationFee && spouse.visaCancelationFee > 0);
    const cancellationFee = spouse.visaCancelation && spouse.visaCancelationFee 
                          ? spouse.visaCancelationFee 
                          : fees.visaCancellationFee;
    
    if (hasVisaCancellation) {
      services.push({
        id: 'spouse-visa-cancellation',
        condition: true,
        description: '3. Visa cancellation cost',
        amount: cancellationFee,
        explanation: 'For canceling existing visa status before applying for spouse dependent visa (if applicable).'
      });
    }

    services.push({
      id: 'spouse-third-party-costs',
      condition: true,
      description: hasVisaCancellation ? '4. Third party costs' : '3. Third party costs',
      amount: fees.thirdPartyCosts,
      explanation: 'Administrative costs charged by various departments.'
    });
  } else {
    // Fallback to legacy structure
    services.push({
      id: 'spouse-government-fees',
      condition: true,
      description: '1. Government Costs (Medical + Emirates ID + Processing)',
      amount: spouse.governmentFee || 0,
      explanation: 'Government costs for spouse visa including medical examination, Emirates ID processing, and visa application charges.'
    });
    
    // Check for individual spouse visa cancellation in legacy structure
    if (spouse.visaCancelation && spouse.visaCancelationFee && spouse.visaCancelationFee > 0) {
      services.push({
        id: 'spouse-visa-cancellation',
        condition: true,
        description: '2. Visa cancellation cost',
        amount: spouse.visaCancelationFee,
        explanation: 'For canceling existing visa status before applying for spouse dependent visa (if applicable).'
      });
    }
  }

  // TME Services for spouse visa
  const spouseHasVisaCancellation = goldenVisaData.dependentAuthorityFees ? 
    ((goldenVisaData.dependentAuthorityFees.visaCancellation && goldenVisaData.dependentAuthorityFees.visaCancellationFee > 0) || 
     (spouse.visaCancelation && spouse.visaCancelationFee && spouse.visaCancelationFee > 0)) : 
    (spouse.visaCancelation && spouse.visaCancelationFee && spouse.visaCancelationFee > 0);
  
  services.push({
    id: 'spouse-tme-services',
    condition: true,
    description: goldenVisaData.dependentAuthorityFees ? 
      (spouseHasVisaCancellation ? '5. TME Services professional fee' : '4. TME Services professional fee') :
      (spouseHasVisaCancellation ? '3. TME Services professional fee' : '2. TME Services professional fee'),
    amount: spouse.tmeServicesFee || 2240,
    explanation: 'TME Services Professional Fee: Covers the complete management of the spouse visa and Emirates ID application process, including document preparation, liaison with the relevant authorities, and personal accompaniment by an experienced TME Services team member to all required appointments.'
  });

  return services.filter(service => service.condition);
}

// Generate Children Visa breakdown with detailed numbered items
export function generateGoldenVisaChildrenVisaBreakdown(goldenVisaData: GoldenVisaData): GoldenVisaServiceItem[] {
  const services: GoldenVisaServiceItem[] = [];
  const children = goldenVisaData.dependents?.children;
  
  if (!children?.count || children.count <= 0) return services;

  const numberOfChildren = children.count;
  const childText = numberOfChildren === 1 ? 'child' : 'children';

  // Use detailed authority fees if available, otherwise fallback to legacy
  if (goldenVisaData.dependentAuthorityFees) {
    const fees = goldenVisaData.dependentAuthorityFees;
    
    // File opening fee only applies once if no spouse visa, or is already covered by spouse
    const hasSpouse = goldenVisaData.dependents?.spouse?.required;
    if (!hasSpouse) {
      services.push({
        id: 'children-file-opening',
        condition: true,
        description: '1. Dependent file opening cost',
        amount: fees.dependentFileOpening,
        explanation: 'One-time fee for opening dependent visa file (applies to first dependent only).'
      });
    }

    const standardCostsNumber = !hasSpouse ? '2' : '1';
    services.push({
      id: 'children-standard-authority-costs',
      condition: true,
      description: `${standardCostsNumber}. Standard authority costs`,
      amount: (fees.standardAuthorityCostsChild || (fees.mandatoryUaeMedicalTest + fees.emiratesIdFee + fees.immigrationResidencyFeeChild) || 4604) * numberOfChildren,
      explanation: `For mandatory UAE medical test, Emirates ID, and immigration residency processing for ${childText}.`
    });

    // Check for visa cancellation - either from global setting or individual children setting
    const hasChildrenVisaCancellation = (fees.visaCancellation && fees.visaCancellationFee > 0) || 
                                       (children.visaCancelation && children.visaCancelationFee && children.visaCancelationFee > 0);
    const childrenCancellationFee = children.visaCancelation && children.visaCancelationFee 
                                  ? children.visaCancelationFee 
                                  : fees.visaCancellationFee;
    
    if (hasChildrenVisaCancellation) {
      const cancellationNumber = !hasSpouse ? '3' : '2';
      services.push({
        id: 'children-visa-cancellation',
        condition: true,
        description: `${cancellationNumber}. Visa cancellation cost`,
        amount: childrenCancellationFee * numberOfChildren,
        explanation: `For canceling existing visa status before applying for ${childText} dependent visa.`
      });
    }

    const thirdPartyNumber = !hasSpouse ? 
      (hasChildrenVisaCancellation ? '4' : '3') : 
      (hasChildrenVisaCancellation ? '3' : '2');
    services.push({
      id: 'children-third-party-costs',
      condition: true,
      description: `${thirdPartyNumber}. Third party costs`,
      amount: fees.thirdPartyCosts * numberOfChildren,
      explanation: `Administrative costs charged by various departments for ${childText}.`
    });
  } else {
    // Fallback to legacy structure
    services.push({
      id: 'children-government-fees',
      condition: true,
      description: '1. Government Costs (Medical + Emirates ID + Processing)',
      amount: (children.governmentFee || 0) * numberOfChildren,
      explanation: `Government costs for ${childText} visa including medical examination, Emirates ID processing, and visa application charges.`
    });
    
    // Check for individual children visa cancellation in legacy structure
    if (children.visaCancelation && children.visaCancelationFee && children.visaCancelationFee > 0) {
      services.push({
        id: 'children-visa-cancellation',
        condition: true,
        description: '2. Visa cancellation cost',
        amount: children.visaCancelationFee * numberOfChildren,
        explanation: `For canceling existing visa status before applying for ${childText} dependent visa (if applicable).`
      });
    }
  }

  // TME Services for children visa
  const childrenHasVisaCancellationForTME = goldenVisaData.dependentAuthorityFees ? 
    ((goldenVisaData.dependentAuthorityFees.visaCancellation && goldenVisaData.dependentAuthorityFees.visaCancellationFee > 0) || 
     (children.visaCancelation && children.visaCancelationFee && children.visaCancelationFee > 0)) : 
    (children.visaCancelation && children.visaCancelationFee && children.visaCancelationFee > 0);
  
  const tmeNumber = !goldenVisaData.dependentAuthorityFees ? 
    (childrenHasVisaCancellationForTME ? '3' : '2') : 
    (!goldenVisaData.dependents?.spouse?.required ? 
      (childrenHasVisaCancellationForTME ? '5' : '4') : 
      (childrenHasVisaCancellationForTME ? '4' : '3'));
  
  services.push({
    id: 'children-tme-services',
    condition: true,
    description: `${tmeNumber}. TME Services professional fee`,
    amount: (children.tmeServicesFee || 1690) * numberOfChildren,
    explanation: `TME Services Professional Fee: Covers the complete management of the ${childText} visa and Emirates ID application process, including document preparation, liaison with the relevant authorities, and personal accompaniment by an experienced TME Services team member to all required appointments.`
  });

  return services.filter(service => service.condition);
}

// Generate individual child visa breakdowns for detailed view
export function generateGoldenVisaIndividualChildVisaBreakdowns(goldenVisaData: GoldenVisaData): GoldenVisaServiceItem[][] {
  const children = goldenVisaData.dependents?.children;
  
  if (!children?.count || children.count <= 0) return [];

  const individualBreakdowns: GoldenVisaServiceItem[][] = [];
  
  for (let i = 0; i < children.count; i++) {
    const childNumber = i + 1;
    const services: GoldenVisaServiceItem[] = [];

    // Check both global and individual children visa cancellation settings (define at function scope)
    const hasVisaCancellation = goldenVisaData.dependentAuthorityFees ? 
      ((goldenVisaData.dependentAuthorityFees.visaCancellation && goldenVisaData.dependentAuthorityFees.visaCancellationFee > 0) || 
       (children.visaCancelation && children.visaCancelationFee && children.visaCancelationFee > 0)) : 
      (children.visaCancelation && children.visaCancelationFee && children.visaCancelationFee > 0);

    // Use detailed authority fees if available, otherwise fallback to legacy
    if (goldenVisaData.dependentAuthorityFees) {
      const fees = goldenVisaData.dependentAuthorityFees;
      
      services.push({
        id: `child-${childNumber}-standard-authority-costs`,
        condition: true,
        description: '1. Standard authority costs',
        amount: fees.standardAuthorityCostsChild || (fees.mandatoryUaeMedicalTest + fees.emiratesIdFee + fees.immigrationResidencyFeeChild) || 4604,
        explanation: 'For mandatory UAE medical test, Emirates ID, and immigration residency processing.'
      });

      const cancellationFee = children.visaCancelation && children.visaCancelationFee 
                            ? children.visaCancelationFee 
                            : fees.visaCancellationFee;

      if (hasVisaCancellation) {
        services.push({
          id: `child-${childNumber}-visa-cancellation`,
          condition: true,
          description: '2. Visa cancellation cost',
          amount: cancellationFee,
          explanation: 'For canceling existing visa status before applying for child dependent visa.'
        });
      }

      services.push({
        id: `child-${childNumber}-third-party-costs`,
        condition: true,
        description: hasVisaCancellation ? '3. Third party costs' : '2. Third party costs',
        amount: fees.thirdPartyCosts,
        explanation: 'Administrative costs charged by various departments.'
      });
    } else {
      // Fallback to legacy structure
      services.push({
        id: `child-${childNumber}-government-fees`,
        condition: true,
        description: '1. Government Costs (Medical + Emirates ID + Processing)',
        amount: children.governmentFee || 0,
        explanation: 'For child visa including medical examination, Emirates ID processing, and visa application charges.'
      });
    }

    // TME Services for this child visa
    services.push({
      id: `child-${childNumber}-tme-services`,
      condition: true,
      description: goldenVisaData.dependentAuthorityFees ? 
        (hasVisaCancellation ? '4. TME Services professional fee' : '3. TME Services professional fee') :
        '2. TME Services professional fee',
      amount: children.tmeServicesFee || 1690,
      explanation: 'TME Services Professional Fee: Covers the complete management of the child visa and Emirates ID application process, including document preparation, liaison with the relevant authorities, and personal accompaniment by an experienced TME Services team member to all required appointments.'
    });

    individualBreakdowns.push(services);
  }

  return individualBreakdowns;
} 