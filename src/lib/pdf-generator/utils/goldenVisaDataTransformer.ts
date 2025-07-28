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
      id: 'passport-picture',
      condition: true,
      description: '1. Professional Passport Picture Cost',
      amount: fees.professionalPassportPicture,
      explanation: 'For professional passport-style photograph.'
    });

    services.push({
      id: 'dld-approval',
      condition: true,
      description: '2. DLD (Dubai Land Department) Approval Cost',
      amount: fees.dldApprovalFee,
      explanation: 'Approval cost required for property investment Golden Visa applications.'
    });

    services.push({
      id: 'medical-test',
      condition: true,
      description: '3. Mandatory UAE Medical Test Cost',
      amount: fees.mandatoryUaeMedicalTest,
      explanation: 'Required by UAE authorities for residency visa processing.'
    });

    services.push({
      id: 'emirates-id',
      condition: true,
      description: '4. Emirates ID Cost',
      amount: fees.emiratesIdFee,
      explanation: 'For processing and issuing the Emirates ID card.'
    });

    services.push({
      id: 'immigration-residency',
      condition: true,
      description: '5. Immigration Residency Cost',
      amount: fees.immigrationResidencyFee,
      explanation: 'For residency visa processing and issuance.'
    });

    if (fees.visaCancelation && fees.visaCancelationFee > 0) {
      services.push({
        id: 'visa-cancelation',
        condition: true,
        description: '6. Visa Cancelation Cost',
        amount: fees.visaCancelationFee,
        explanation: 'For canceling existing visa status before applying for Golden Visa.'
      });
    }

    services.push({
      id: 'third-party-costs',
      condition: true,
      description: fees.visaCancelation ? '7. Third Party Costs' : '6. Third Party Costs',
      amount: fees.thirdPartyCosts,
      explanation: 'Administrative costs charged by various departments.'
    });
  } else if ((visaType === 'time-deposit' || visaType === 'skilled-employee') && goldenVisaData.skilledEmployeeAuthorityFees) {
    // Time Deposit and Skilled Employee (without NOC) - no DLD fee
    const fees = goldenVisaData.skilledEmployeeAuthorityFees;
    
    services.push({
      id: 'passport-picture',
      condition: true,
      description: '1. Professional Passport Picture Cost',
      amount: fees.professionalPassportPicture,
      explanation: 'For professional passport-style photograph.'
    });

    services.push({
      id: 'medical-test',
      condition: true,
      description: '2. Mandatory UAE Medical Test Cost',
      amount: fees.mandatoryUaeMedicalTest,
      explanation: 'Required by UAE authorities for residency visa processing.'
    });

    services.push({
      id: 'emirates-id',
      condition: true,
      description: '3. Emirates ID Cost',
      amount: fees.emiratesIdFee,
      explanation: 'For processing and issuing the Emirates ID card.'
    });

    services.push({
      id: 'immigration-residency',
      condition: true,
      description: '4. Immigration Residency Cost',
      amount: fees.immigrationResidencyFee,
      explanation: 'For residency visa processing and issuance.'
    });

    if (fees.visaCancelation && fees.visaCancelationFee > 0) {
      services.push({
        id: 'visa-cancelation',
        condition: true,
          description: '5. Visa Cancelation Cost',
        amount: fees.visaCancelationFee,
        explanation: 'For canceling existing visa status before applying for Golden Visa.'
      });
    }

    services.push({
      id: 'third-party-costs',
      condition: true,
      description: fees.visaCancelation ? '6. Third Party Costs' : '5. Third Party Costs',
      amount: fees.thirdPartyCosts,
      explanation: 'Administrative costs charged by various departments.'
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
  const tmeServices = generateGoldenVisaTMEServicesBreakdown(goldenVisaData);
  
  const allServices = [...authorityServices, ...tmeServices];
  
  return allServices
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
      id: 'spouse-passport-picture',
      condition: true,
      description: '1. Professional Passport Picture Cost',
      amount: fees.professionalPassportPicture,
      explanation: 'For professional passport-style photograph.'
    });

    services.push({
      id: 'spouse-file-opening',
      condition: true,
      description: '2. Dependent File Opening Cost',
      amount: fees.dependentFileOpening,
      explanation: 'For opening dependent visa file (applies to first dependent only).'
    });

    services.push({
      id: 'spouse-medical-test',
      condition: true,
      description: '3. Mandatory UAE Medical Test Cost',
      amount: fees.mandatoryUaeMedicalTest,
      explanation: 'Required by UAE authorities for spouse visa processing.'
    });

    services.push({
      id: 'spouse-emirates-id',
      condition: true,
      description: '4. Emirates ID Cost',
      amount: fees.emiratesIdFee,
      explanation: 'For processing and issuing the Emirates ID card.'
    });

    services.push({
      id: 'spouse-immigration-residency',
      condition: true,
      description: '5. Immigration Residency Cost',
      amount: fees.immigrationResidencyFeeSpouse,
      explanation: 'For spouse residency visa processing and issuance.'
    });

    // Check for visa cancelation - either from global setting or individual spouse setting
    const hasVisaCancelation = (fees.visaCancelation && fees.visaCancelationFee > 0) || 
                               (spouse.visaCancelation && spouse.visaCancelationFee && spouse.visaCancelationFee > 0);
    const cancelationFee = spouse.visaCancelation && spouse.visaCancelationFee 
                          ? spouse.visaCancelationFee 
                          : fees.visaCancelationFee;
    
    if (hasVisaCancelation) {
      services.push({
        id: 'spouse-visa-cancelation',
        condition: true,
        description: '6. Visa Cancelation Cost',
        amount: cancelationFee,
        explanation: 'For canceling existing visa status before applying for spouse dependent visa (if applicable).'
      });
    }

    services.push({
      id: 'spouse-third-party-costs',
      condition: true,
      description: hasVisaCancelation ? '7. Third Party Costs' : '6. Third Party Costs',
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
    
    // Check for individual spouse visa cancelation in legacy structure
    if (spouse.visaCancelation && spouse.visaCancelationFee && spouse.visaCancelationFee > 0) {
      services.push({
        id: 'spouse-visa-cancelation',
        condition: true,
        description: '2. Visa Cancelation Cost',
        amount: spouse.visaCancelationFee,
        explanation: 'For canceling existing visa status before applying for spouse dependent visa (if applicable).'
      });
    }
  }

  // TME Services for spouse visa
  const spouseHasVisaCancelation = goldenVisaData.dependentAuthorityFees ? 
    ((goldenVisaData.dependentAuthorityFees.visaCancelation && goldenVisaData.dependentAuthorityFees.visaCancelationFee > 0) || 
     (spouse.visaCancelation && spouse.visaCancelationFee && spouse.visaCancelationFee > 0)) : 
    (spouse.visaCancelation && spouse.visaCancelationFee && spouse.visaCancelationFee > 0);
  
  services.push({
    id: 'spouse-tme-services',
    condition: true,
    description: goldenVisaData.dependentAuthorityFees ? 
      (spouseHasVisaCancelation ? '8. TME Services Professional Fee' : '7. TME Services Professional Fee') :
      (spouseHasVisaCancelation ? '3. TME Services Professional Fee' : '2. TME Services Professional Fee'),
    amount: spouse.tmeServicesFee || 0,
    explanation: 'Professional service fee for managing the spouse visa application process, including document preparation and government liaison.'
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
    
    services.push({
      id: 'children-passport-picture',
      condition: true,
      description: '1. Professional Passport Picture Cost',
      amount: fees.professionalPassportPicture * numberOfChildren,
      explanation: `Professional passport-style picture fee required for ${childText} visa documentation.`
    });

    // File opening fee only applies once if no spouse visa, or is already covered by spouse
    const hasSpouse = goldenVisaData.dependents?.spouse?.required;
    if (!hasSpouse) {
      services.push({
        id: 'children-file-opening',
        condition: true,
        description: '2. Dependent File Opening Cost',
        amount: fees.dependentFileOpening,
        explanation: 'One-time fee for opening dependent visa file (applies to first dependent only).'
      });
    }

    const medicalTestNumber = !hasSpouse ? '3' : '2';
    services.push({
      id: 'children-medical-test',
      condition: true,
        description: `${medicalTestNumber}. Mandatory UAE Medical Test Cost`,
      amount: fees.mandatoryUaeMedicalTest * numberOfChildren,
      explanation: `Medical examination cost required by UAE authorities for ${childText} visa processing.`
    });

    const emiratesIdNumber = !hasSpouse ? '4' : '3';
    services.push({
      id: 'children-emirates-id',
      condition: true,
      description: `${emiratesIdNumber}. Emirates ID Cost`,
      amount: fees.emiratesIdFee * numberOfChildren,
      explanation: `For processing and issuing the Emirates ID card for ${childText}.`
    });

    const immigrationNumber = !hasSpouse ? '5' : '4';
    services.push({
      id: 'children-immigration-residency',
      condition: true,
      description: `${immigrationNumber}. Immigration Residency Cost`,
      amount: fees.immigrationResidencyFeeChild * numberOfChildren,
      explanation: `For ${childText} residency visa processing and issuance.`
    });

    // Check for visa cancelation - either from global setting or individual children setting
    const hasChildrenVisaCancelation = (fees.visaCancelation && fees.visaCancelationFee > 0) || 
                                       (children.visaCancelation && children.visaCancelationFee && children.visaCancelationFee > 0);
    const childrenCancelationFee = children.visaCancelation && children.visaCancelationFee 
                                  ? children.visaCancelationFee 
                                  : fees.visaCancelationFee;
    
    if (hasChildrenVisaCancelation) {
      const cancelationNumber = !hasSpouse ? '6' : '5';
      services.push({
        id: 'children-visa-cancelation',
        condition: true,
        description: `${cancelationNumber}. Visa Cancelation Cost`,
        amount: childrenCancelationFee * numberOfChildren,
        explanation: `For canceling existing visa status before applying for ${childText} dependent visa.`
      });
    }

    const thirdPartyNumber = !hasSpouse ? 
      (hasChildrenVisaCancelation ? '7' : '6') : 
      (hasChildrenVisaCancelation ? '6' : '5');
    services.push({
      id: 'children-third-party-costs',
      condition: true,
      description: `${thirdPartyNumber}. Third Party Costs`,
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
    
    // Check for individual children visa cancelation in legacy structure
    if (children.visaCancelation && children.visaCancelationFee && children.visaCancelationFee > 0) {
      services.push({
        id: 'children-visa-cancelation',
        condition: true,
        description: '2. Visa Cancelation Cost',
        amount: children.visaCancelationFee * numberOfChildren,
        explanation: `For canceling existing visa status before applying for ${childText} dependent visa (if applicable).`
      });
    }
  }

  // TME Services for children visa
  const childrenHasVisaCancelationForTME = goldenVisaData.dependentAuthorityFees ? 
    ((goldenVisaData.dependentAuthorityFees.visaCancelation && goldenVisaData.dependentAuthorityFees.visaCancelationFee > 0) || 
     (children.visaCancelation && children.visaCancelationFee && children.visaCancelationFee > 0)) : 
    (children.visaCancelation && children.visaCancelationFee && children.visaCancelationFee > 0);
  
  const tmeNumber = !goldenVisaData.dependentAuthorityFees ? 
    (childrenHasVisaCancelationForTME ? '3' : '2') : 
    (!goldenVisaData.dependents?.spouse?.required ? 
      (childrenHasVisaCancelationForTME ? '8' : '7') : 
      (childrenHasVisaCancelationForTME ? '7' : '6'));
  
  services.push({
    id: 'children-tme-services',
    condition: true,
    description: `${tmeNumber}. TME Services Professional Fee`,
    amount: (children.tmeServicesFee || 0) * numberOfChildren,
    explanation: `Professional service fee for managing the ${childText} visa application process, including document preparation and government liaison.`
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

    // Use detailed authority fees if available, otherwise fallback to legacy
    if (goldenVisaData.dependentAuthorityFees) {
      const fees = goldenVisaData.dependentAuthorityFees;
      
      services.push({
        id: `child-${childNumber}-passport-picture`,
        condition: true,
        description: '1. Professional Passport Picture Cost',
        amount: fees.professionalPassportPicture,
        explanation: 'Professional passport-style picture cost required for child visa documentation.'
      });

      services.push({
        id: `child-${childNumber}-medical-test`,
        condition: true,
        description: '2. Mandatory UAE Medical Test Cost',
        amount: fees.mandatoryUaeMedicalTest,
        explanation: 'Medical examination cost required by UAE authorities for child visa processing.'
      });

      services.push({
        id: `child-${childNumber}-emirates-id`,
        condition: true,
        description: '3. Emirates ID Cost',
        amount: fees.emiratesIdFee,
        explanation: 'For processing and issuing the Emirates ID card.'
      });

      services.push({
        id: `child-${childNumber}-immigration-residency`,
        condition: true,
        description: '4. Immigration Residency Cost',
        amount: fees.immigrationResidencyFeeChild,
        explanation: 'For child residency visa processing and issuance.'
      });

      if (fees.visaCancelation && fees.visaCancelationFee > 0) {
        services.push({
          id: `child-${childNumber}-visa-cancelation`,
          condition: true,
          description: '5. Visa Cancelation Cost',
          amount: fees.visaCancelationFee,
          explanation: 'For canceling existing visa status before applying for child dependent visa.'
        });
      }

      services.push({
        id: `child-${childNumber}-third-party-costs`,
        condition: true,
        description: fees.visaCancelation ? '6. Third Party Costs' : '5. Third Party Costs',
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
        (goldenVisaData.dependentAuthorityFees.visaCancelation ? '7. TME Services Professional Fee' : '6. TME Services Professional Fee') :
        '2. TME Services Professional Fee',
      amount: children.tmeServicesFee || 0,
      explanation: 'Professional service fee for managing the child visa application process, including document preparation and government liaison.'
    });

    individualBreakdowns.push(services);
  }

  return individualBreakdowns;
} 