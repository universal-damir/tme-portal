import { GoldenVisaData } from '@/types/golden-visa';
import { SharedClientInfo } from '@/types/portal';
import { OfferData } from '@/types/offer';
import { getBrandingById } from '../branding';
import { GOLDEN_VISA_TRANSLATIONS, Locale } from '../translations/golden-visa';

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
  clientInfo: SharedClientInfo,
  locale?: Locale
): OfferData & { goldenVisaData: GoldenVisaData; locale?: Locale } {
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
    // Add locale for translation support
    locale: locale,
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
export function generateGoldenVisaAuthorityFeesBreakdown(goldenVisaData: GoldenVisaData, locale: Locale = 'en'): GoldenVisaServiceItem[] {
  const services: GoldenVisaServiceItem[] = [];
  const t = GOLDEN_VISA_TRANSLATIONS[locale];
  
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
      description: locale === 'de' ? '1. DLD Genehmigungs-/Bewertungsgebühr' : '1. DLD (Dubai Land Department) approval cost',
      amount: fees.dldApprovalFee,
      explanation: locale === 'de' ? t.costsBreakdown.explanations.dldApprovalFee : 'Verification for property investment Golden Visa applications.'
    });

    services.push({
      id: 'standard-authority-costs',
      condition: true,
      description: locale === 'de' ? '2. Standard Behördenkosten' : '2. Standard authority costs',
      amount: fees.standardAuthorityCosts || (fees.mandatoryUaeMedicalTest + fees.emiratesIdFee + fees.immigrationResidencyFee) || 5010,
      explanation: locale === 'de' ? `${t.costsBreakdown.explanations.mandatoryUaeMedicalTest} ${t.costsBreakdown.explanations.emiratesIdFee} ${t.costsBreakdown.explanations.immigrationResidencyFee}` : 'For mandatory UAE medical test, Emirates ID, and immigration residency processing.'
    });

    if (fees.visaCancellation && fees.visaCancellationFee > 0) {
      services.push({
        id: 'visa-cancellation',
        condition: true,
        description: locale === 'de' ? '3. Visa-Stornierungskosten' : '3. Visa cancellation cost',
        amount: fees.visaCancellationFee,
        explanation: locale === 'de' ? t.costsBreakdown.explanations.visaCancellationFee : 'For cancelling existing visa status before applying for Golden Visa.'
      });
    }

    services.push({
      id: 'third-party-costs',
      condition: true,
      description: locale === 'de' ? (fees.visaCancellation ? '4. Drittanbieterkosten' : '3. Drittanbieterkosten') : (fees.visaCancellation ? '4. Third party costs' : '3. Third party costs'),
      amount: fees.thirdPartyCosts,
      explanation: locale === 'de' ? t.costsBreakdown.explanations.thirdPartyCosts : 'Administrative costs charged by various departments.'
    });

    // Add TME Services for explanations only (not shown in table)
    const baseTmeServicesFee = goldenVisaData.tmeServicesFee || 0;
    if (baseTmeServicesFee > 0) {
      services.push({
        id: 'tme-professional-fee',
        condition: false, // Not shown in table, only used for explanations
        description: locale === 'de' ? 'TME Services Beratungsgebühr' : 'TME Services professional fee',
        amount: baseTmeServicesFee,
        explanation: locale === 'de' ? t.costsBreakdown.explanations.tmeServicesFee : t.costsBreakdown.explanations.tmeServicesFee
      });
    }
  } else if ((visaType === 'time-deposit' || visaType === 'skilled-employee') && goldenVisaData.skilledEmployeeAuthorityFees) {
    // Time Deposit and Skilled Employee (without NOC) - no DLD fee
    const fees = goldenVisaData.skilledEmployeeAuthorityFees;
    
    services.push({
      id: 'standard-authority-costs',
      condition: true,
      description: locale === 'de' ? '1. Standard Behördenkosten' : '1. Standard authority costs',
      amount: fees.standardAuthorityCosts || (fees.mandatoryUaeMedicalTest + fees.emiratesIdFee + fees.immigrationResidencyFee) || 5010,
      explanation: locale === 'de' ? `${t.costsBreakdown.explanations.mandatoryUaeMedicalTest} ${t.costsBreakdown.explanations.emiratesIdFee} ${t.costsBreakdown.explanations.immigrationResidencyFee}` : 'For mandatory UAE medical test, Emirates ID, and immigration residency processing.'
    });

    if (fees.visaCancellation && fees.visaCancellationFee > 0) {
      services.push({
        id: 'visa-cancellation',
        condition: true,
        description: locale === 'de' ? '2. Visa-Stornierungskosten' : '2. Visa cancellation cost',
        amount: fees.visaCancellationFee,
        explanation: locale === 'de' ? t.costsBreakdown.explanations.visaCancellationFee : 'For cancelling existing visa status before applying for Golden Visa.'
      });
    }


    // Add TME Services for explanations only (not shown in table)
    const baseTmeServicesFee = goldenVisaData.tmeServicesFee || 0;
    if (baseTmeServicesFee > 0) {
      services.push({
        id: 'tme-professional-fee',
        condition: false, // Not shown in table, only used for explanations
        description: locale === 'de' ? 'TME Services Beratungsgebühr' : 'TME Services professional fee',
        amount: baseTmeServicesFee,
        explanation: locale === 'de' ? t.costsBreakdown.explanations.tmeServicesFee : t.costsBreakdown.explanations.tmeServicesFee
      });
    }
  } else {
    // Fallback to simple structure for backwards compatibility
    services.push({
      id: 'government-fees',
      condition: true,
      description: locale === 'de' ? '1. Behördenkosten (Medizintest + Emirates ID + Bearbeitung)' : '1. Government Costs (Medical Test + Emirates ID + Processing)',
      amount: goldenVisaData.governmentFee || 0,
      explanation: locale === 'de' ? 'Behördenkosten einschließlich medizinischer Untersuchung, Emirates ID Bearbeitung und Visa-Antragsgebühren.' : 'Government costs including medical examination, Emirates ID processing, and visa application charges.'
    });
  }

  return services.filter(service => service.condition);
}

// Generate Golden Visa Authority Fees breakdown for explanations (includes TME services)
export function generateGoldenVisaAuthorityFeesBreakdownForExplanations(goldenVisaData: GoldenVisaData, locale: Locale = 'en'): GoldenVisaServiceItem[] {
  const services: GoldenVisaServiceItem[] = [];
  const t = GOLDEN_VISA_TRANSLATIONS[locale];
  
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
      description: locale === 'de' ? 'DLD Genehmigungs-/Bewertungsgebühr' : 'DLD (Dubai Land Department) approval cost',
      amount: fees.dldApprovalFee,
      explanation: locale === 'de' ? t.costsBreakdown.explanations.dldApprovalFee : 'Verification for property investment Golden Visa applications.'
    });

    services.push({
      id: 'standard-authority-costs',
      condition: true,
      description: locale === 'de' ? 'Standard Behördenkosten' : 'Standard authority costs',
      amount: fees.standardAuthorityCosts || (fees.mandatoryUaeMedicalTest + fees.emiratesIdFee + fees.immigrationResidencyFee) || 5010,
      explanation: locale === 'de' ? `${t.costsBreakdown.explanations.mandatoryUaeMedicalTest} ${t.costsBreakdown.explanations.emiratesIdFee} ${t.costsBreakdown.explanations.immigrationResidencyFee}` : 'For mandatory UAE medical test, Emirates ID, and immigration residency processing.'
    });

    if (fees.visaCancellation && fees.visaCancellationFee > 0) {
      services.push({
        id: 'visa-cancellation',
        condition: true,
        description: locale === 'de' ? 'Visa-Stornierungskosten' : 'Visa cancellation cost',
        amount: fees.visaCancellationFee,
        explanation: locale === 'de' ? t.costsBreakdown.explanations.visaCancellationFee : 'For cancelling existing visa status before applying for Golden Visa.'
      });
    }

    services.push({
      id: 'third-party-costs',
      condition: true,
      description: locale === 'de' ? 'Drittanbieterkosten' : 'Third party costs',
      amount: fees.thirdPartyCosts,
      explanation: locale === 'de' ? t.costsBreakdown.explanations.thirdPartyCosts : 'Administrative costs charged by various departments.'
    });

    // Add TME Services for explanations (always include, not filtered out)
    const baseTmeServicesFee = goldenVisaData.tmeServicesFee || 0;
    if (baseTmeServicesFee > 0) {
      services.push({
        id: 'tme-professional-fee',
        condition: false, // Not shown in table, only used for explanations
        description: locale === 'de' ? 'TME Services Beratungsgebühr' : 'TME Services professional fee',
        amount: baseTmeServicesFee,
        explanation: locale === 'de' ? t.costsBreakdown.explanations.tmeServicesFee : t.costsBreakdown.explanations.tmeServicesFee
      });
    }
  } else if ((visaType === 'time-deposit' || visaType === 'skilled-employee') && goldenVisaData.skilledEmployeeAuthorityFees) {
    // Time Deposit and Skilled Employee (without NOC) - no DLD fee
    const fees = goldenVisaData.skilledEmployeeAuthorityFees;
    
    services.push({
      id: 'standard-authority-costs',
      condition: true,
      description: locale === 'de' ? 'Standard Behördenkosten' : 'Standard authority costs',
      amount: fees.standardAuthorityCosts || (fees.mandatoryUaeMedicalTest + fees.emiratesIdFee + fees.immigrationResidencyFee) || 5010,
      explanation: locale === 'de' ? `${t.costsBreakdown.explanations.mandatoryUaeMedicalTest} ${t.costsBreakdown.explanations.emiratesIdFee} ${t.costsBreakdown.explanations.immigrationResidencyFee}` : 'For mandatory UAE medical test, Emirates ID, and immigration residency processing.'
    });

    if (fees.visaCancellation && fees.visaCancellationFee > 0) {
      services.push({
        id: 'visa-cancellation',
        condition: true,
        description: locale === 'de' ? 'Visa-Stornierungskosten' : 'Visa cancellation cost',
        amount: fees.visaCancellationFee,
        explanation: locale === 'de' ? t.costsBreakdown.explanations.visaCancellationFee : 'For cancelling existing visa status before applying for Golden Visa.'
      });
    }

    // Add TME Services for explanations (always include, not filtered out)
    const baseTmeServicesFee = goldenVisaData.tmeServicesFee || 0;
    if (baseTmeServicesFee > 0) {
      services.push({
        id: 'tme-professional-fee',
        condition: false, // Not shown in table, only used for explanations
        description: locale === 'de' ? 'TME Services Beratungsgebühr' : 'TME Services professional fee',
        amount: baseTmeServicesFee,
        explanation: locale === 'de' ? t.costsBreakdown.explanations.tmeServicesFee : t.costsBreakdown.explanations.tmeServicesFee
      });
    }
  } else {
    // Fallback to simple structure for backwards compatibility
    services.push({
      id: 'government-fees',
      condition: true,
      description: locale === 'de' ? 'Behördenkosten (Medizintest + Emirates ID + Bearbeitung)' : 'Government Costs (Medical Test + Emirates ID + Processing)',
      amount: goldenVisaData.governmentFee || 0,
      explanation: locale === 'de' ? 'Behördenkosten einschließlich medizinischer Untersuchung, Emirates ID Bearbeitung und Visa-Antragsgebühren.' : 'Government costs including medical examination, Emirates ID processing, and visa application charges.'
    });
  }

  return services; // Return all services, not filtered
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
export function generateGoldenVisaExplanations(goldenVisaData: GoldenVisaData, locale: Locale = 'en'): Array<{ id: string; title: string; explanation: string }> {
  const authorityServices = generateGoldenVisaAuthorityFeesBreakdownForExplanations(goldenVisaData, locale);
  // Now uses the explanation function that includes TME Services with condition: false
  
  return authorityServices
    .filter(service => service.explanation)
    .map(service => ({
      id: service.id,
      title: service.description.replace(/^\d+\.\s/, ''), // Remove numbering from title
      explanation: service.explanation || ''
    }));
}

// Generate Spouse Visa breakdown with detailed numbered items
export function generateGoldenVisaSpouseVisaBreakdown(goldenVisaData: GoldenVisaData, locale: Locale = 'en'): GoldenVisaServiceItem[] {
  const services: GoldenVisaServiceItem[] = [];
  const spouse = goldenVisaData.dependents?.spouse;
  const t = GOLDEN_VISA_TRANSLATIONS[locale];
  
  if (!spouse?.required) return services;

  // Use detailed authority fees if available, otherwise fallback to legacy
  if (goldenVisaData.dependentAuthorityFees) {
    const fees = goldenVisaData.dependentAuthorityFees;
    
    // Only include file opening if specifically checked for spouse
    if (fees.dependentFileOpeningForSpouse) {
      services.push({
        id: 'spouse-file-opening',
        condition: true,
        description: `1. ${t.dependentCosts.serviceDescriptions.dependentFileOpening}`,
        amount: fees.dependentFileOpening,
        explanation: t.dependentCosts.explanations.dependentFileOpening
      });
    }

    // Dynamic numbering based on whether file opening is included
    const hasFileOpening = fees.dependentFileOpeningForSpouse;
    let itemNumber = hasFileOpening ? 2 : 1;

    services.push({
      id: 'spouse-standard-authority-costs',
      condition: true,
      description: `${itemNumber}. ${t.dependentCosts.serviceDescriptions.standardAuthorityCosts}`,
      amount: fees.standardAuthorityCostsSpouse || (fees.mandatoryUaeMedicalTest + fees.emiratesIdFee + fees.immigrationResidencyFeeSpouse) || 4710,
      explanation: t.dependentCosts.explanations.standardAuthorityCosts
    });

    // Check for visa cancellation - either from global setting or individual spouse setting
    const hasVisaCancellation = (fees.visaCancellation && fees.visaCancellationFee > 0) || 
                               (spouse.visaCancelation && spouse.visaCancelationFee && spouse.visaCancelationFee > 0);
    const cancellationFee = spouse.visaCancelation && spouse.visaCancelationFee 
                          ? spouse.visaCancelationFee 
                          : fees.visaCancellationFee;
    
    if (hasVisaCancellation) {
      itemNumber++;
      services.push({
        id: 'spouse-visa-cancellation',
        condition: true,
        description: `${itemNumber}. ${t.dependentCosts.serviceDescriptions.visaCancellation}`,
        amount: cancellationFee,
        explanation: t.dependentCosts.explanations.visaCancellation
      });
    }

    itemNumber++;
    services.push({
      id: 'spouse-third-party-costs',
      condition: true,
      description: `${itemNumber}. ${t.dependentCosts.serviceDescriptions.thirdPartyCosts}`,
      amount: fees.thirdPartyCostsSpouse || fees.thirdPartyCosts || 0,
      explanation: t.dependentCosts.explanations.thirdPartyCosts
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

  // Add TME Services for explanations only (not shown in table)
  const spouseTmeServicesFee = goldenVisaData.dependents?.spouse?.tmeServicesFee || 0;
  if (spouseTmeServicesFee > 0) {
    services.push({
      id: 'spouse-tme-services',
      condition: false, // Not shown in table, only used for explanations
      description: locale === 'de' ? 'TME Services Beratungsgebühr' : 'TME Services professional fee',
      amount: spouseTmeServicesFee,
      explanation: locale === 'de' ? t.dependentCosts.explanations.tmeServicesFee : t.costsBreakdown.explanations.tmeServicesFee
    });
  }

  return services.filter(service => service.condition);
}

// Generate Spouse Visa breakdown for explanations (includes TME services)
export function generateGoldenVisaSpouseVisaBreakdownForExplanations(goldenVisaData: GoldenVisaData, locale: Locale = 'en'): GoldenVisaServiceItem[] {
  const services: GoldenVisaServiceItem[] = [];
  const spouse = goldenVisaData.dependents?.spouse;
  const t = GOLDEN_VISA_TRANSLATIONS[locale];

  if (!spouse?.required) return services;

  // Use detailed authority fees if available, otherwise fallback to legacy
  if (goldenVisaData.dependentAuthorityFees) {
    const fees = goldenVisaData.dependentAuthorityFees;
    
    // File opening fee only applies if specifically checked for spouse
    if (fees.dependentFileOpeningForSpouse) {
      services.push({
        id: 'spouse-file-opening',
        condition: true,
        description: `1. ${t.dependentCosts.serviceDescriptions.dependentFileOpening}`,
        amount: fees.dependentFileOpening,
        explanation: locale === 'de' ? 
          'Einmalgebühr für die Eröffnung der Angehörigen-Visa-Datei (gilt nur für den ersten Angehörigen).' : 
          'One-time fee for opening dependent visa file (applies to first dependent only).'
      });
    }

    // Dynamic numbering based on whether file opening is included
    const hasFileOpening = fees.dependentFileOpeningForSpouse;
    let itemNumber = hasFileOpening ? 2 : 1;

    services.push({
      id: 'spouse-standard-authority-costs',
      condition: true,
      description: `${itemNumber}. ${t.dependentCosts.serviceDescriptions.standardAuthorityCosts}`,
      amount: fees.standardAuthorityCostsSpouse || (fees.mandatoryUaeMedicalTest + fees.emiratesIdFee + fees.immigrationResidencyFeeSpouse) || 4604,
      explanation: locale === 'de' ? 
        'Für Pflicht-VAE-Medizintest, Emirates ID und Einwanderungs-Aufenthaltsbearbeitung für Ehepartner.' : 
        'For mandatory UAE medical test, Emirates ID, and immigration residency processing for spouse.'
    });

    // Check for visa cancellation - either from global setting or individual spouse setting
    const hasSpouseVisaCancellation = (fees.visaCancellation && fees.visaCancellationFee > 0) || 
                                     (spouse.visaCancelation && spouse.visaCancelationFee && spouse.visaCancelationFee > 0);
    const spouseCancellationFee = spouse.visaCancelation && spouse.visaCancelationFee 
                                ? spouse.visaCancelationFee 
                                : fees.visaCancellationFee;
    
    if (hasSpouseVisaCancellation) {
      itemNumber++;
      services.push({
        id: 'spouse-visa-cancellation',
        condition: true,
        description: `${itemNumber}. ${t.dependentCosts.serviceDescriptions.visaCancellation}`,
        amount: spouseCancellationFee,
        explanation: locale === 'de' ? 
          'Für die Stornierung des bestehenden Visa-Status vor der Beantragung des Ehepartner-Angehörigen-Visa.' : 
          'For canceling existing visa status before applying for spouse dependent visa.'
      });
    }

    itemNumber++;
    services.push({
      id: 'spouse-third-party-costs',
      condition: true,
      description: `${itemNumber}. ${t.dependentCosts.serviceDescriptions.thirdPartyCosts}`,
      amount: fees.thirdPartyCostsSpouse || fees.thirdPartyCosts || 0,
      explanation: t.dependentCosts.explanations.thirdPartyCosts
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

  // Add TME Services for explanations (always include, not filtered out)
  const spouseTmeServicesFee = goldenVisaData.dependents?.spouse?.tmeServicesFee || 0;
  if (spouseTmeServicesFee > 0) {
    services.push({
      id: 'spouse-tme-services',
      condition: false, // Not shown in table, only used for explanations
      description: locale === 'de' ? 'TME Services Beratungsgebühr' : 'TME Services professional fee',
      amount: spouseTmeServicesFee,
      explanation: locale === 'de' ? t.dependentCosts.explanations.tmeServicesFee : t.costsBreakdown.explanations.tmeServicesFee
    });
  }

  return services; // Return all services, not filtered
}

// Generate Children Visa breakdown with detailed numbered items
export function generateGoldenVisaChildrenVisaBreakdown(goldenVisaData: GoldenVisaData, locale: Locale = 'en'): GoldenVisaServiceItem[] {
  const services: GoldenVisaServiceItem[] = [];
  const children = goldenVisaData.dependents?.children;
  const t = GOLDEN_VISA_TRANSLATIONS[locale];
  
  if (!children?.count || children.count <= 0) return services;

  const numberOfChildren = children.count;
  const childText = numberOfChildren === 1 ? 
    (locale === 'de' ? 'Kind' : 'child') : 
    (locale === 'de' ? 'Kinder' : 'children');

  // Use detailed authority fees if available, otherwise fallback to legacy
  if (goldenVisaData.dependentAuthorityFees) {
    const fees = goldenVisaData.dependentAuthorityFees;
    
    // File opening fee only applies if specifically checked for children (first child only)
    if (fees.dependentFileOpeningForChild) {
      services.push({
        id: 'children-file-opening',
        condition: true,
        description: `1. ${t.dependentCosts.serviceDescriptions.dependentFileOpening}`,
        amount: fees.dependentFileOpening,
        explanation: locale === 'de' ? 
          'Einmalgebühr für die Eröffnung der Angehörigen-Visa-Datei (gilt nur für den ersten Angehörigen).' : 
          'One-time fee for opening dependent visa file (applies to first dependent only).'
      });
    }

    // Dynamic numbering based on whether file opening is included
    const hasFileOpening = fees.dependentFileOpeningForChild;
    let itemNumber = hasFileOpening ? 2 : 1;

    services.push({
      id: 'children-standard-authority-costs',
      condition: true,
      description: `${itemNumber}. ${t.dependentCosts.serviceDescriptions.standardAuthorityCosts}`,
      amount: (fees.standardAuthorityCostsChild || (fees.mandatoryUaeMedicalTest + fees.emiratesIdFee + fees.immigrationResidencyFeeChild) || 4604) * numberOfChildren,
      explanation: locale === 'de' ? 
        `Für Pflicht-VAE-Medizintest, Emirates ID und Einwanderungs-Aufenthaltsbearbeitung für ${childText}.` : 
        `For mandatory UAE medical test, Emirates ID, and immigration residency processing for ${childText}.`
    });

    // Check for visa cancellation - either from global setting or individual children setting
    const hasChildrenVisaCancellation = (fees.visaCancellation && fees.visaCancellationFee > 0) || 
                                       (children.visaCancelation && children.visaCancelationFee && children.visaCancelationFee > 0);
    const childrenCancellationFee = children.visaCancelation && children.visaCancelationFee 
                                  ? children.visaCancelationFee 
                                  : fees.visaCancellationFee;
    
    if (hasChildrenVisaCancellation) {
      itemNumber++;
      services.push({
        id: 'children-visa-cancellation',
        condition: true,
        description: `${itemNumber}. ${t.dependentCosts.serviceDescriptions.visaCancellation}`,
        amount: childrenCancellationFee * numberOfChildren,
        explanation: locale === 'de' ? 
          `Für die Stornierung des bestehenden Visa-Status vor der Beantragung des ${childText}-Angehörigen-Visa.` : 
          `For canceling existing visa status before applying for ${childText} dependent visa.`
      });
    }

    itemNumber++;
    services.push({
      id: 'children-third-party-costs',
      condition: true,
      description: `${itemNumber}. ${t.dependentCosts.serviceDescriptions.thirdPartyCosts}`,
      amount: (fees.thirdPartyCostsChild || fees.thirdPartyCosts || 0) * numberOfChildren,
      explanation: locale === 'de' ? 
        `Von verschiedenen Abteilungen erhobene Verwaltungskosten für ${childText}.` : 
        `Administrative costs charged by various departments for ${childText}.`
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

  // Add TME Services for explanations only (not shown in table)
  const childrenTmeServicesFee = goldenVisaData.dependents?.children?.tmeServicesFee || 0;
  if (childrenTmeServicesFee > 0) {
    services.push({
      id: 'children-tme-services',
      condition: false, // Not shown in table, only used for explanations
      description: locale === 'de' ? 'TME Services Beratungsgebühr' : 'TME Services professional fee',
      amount: childrenTmeServicesFee * numberOfChildren,
      explanation: locale === 'de' ? t.dependentCosts.explanations.tmeServicesFee : t.costsBreakdown.explanations.tmeServicesFee
    });
  }

  return services.filter(service => service.condition);
}

// Generate Children Visa breakdown for explanations (includes TME services)
export function generateGoldenVisaChildrenVisaBreakdownForExplanations(goldenVisaData: GoldenVisaData, locale: Locale = 'en'): GoldenVisaServiceItem[] {
  const services: GoldenVisaServiceItem[] = [];
  const children = goldenVisaData.dependents?.children;
  const t = GOLDEN_VISA_TRANSLATIONS[locale];
  
  if (!children?.count || children.count <= 0) return services;

  const numberOfChildren = children.count;
  const childText = numberOfChildren === 1 ? 
    (locale === 'de' ? 'Kind' : 'child') : 
    (locale === 'de' ? 'Kinder' : 'children');

  // Use detailed authority fees if available, otherwise fallback to legacy
  if (goldenVisaData.dependentAuthorityFees) {
    const fees = goldenVisaData.dependentAuthorityFees;
    
    // File opening fee only applies if specifically checked for children (first child only)
    if (fees.dependentFileOpeningForChild) {
      services.push({
        id: 'children-file-opening',
        condition: true,
        description: `1. ${t.dependentCosts.serviceDescriptions.dependentFileOpening}`,
        amount: fees.dependentFileOpening,
        explanation: locale === 'de' ? 
          'Einmalgebühr für die Eröffnung der Angehörigen-Visa-Datei (gilt nur für den ersten Angehörigen).' : 
          'One-time fee for opening dependent visa file (applies to first dependent only).'
      });
    }

    // Dynamic numbering based on whether file opening is included
    const hasFileOpening = fees.dependentFileOpeningForChild;
    let itemNumber = hasFileOpening ? 2 : 1;

    services.push({
      id: 'children-standard-authority-costs',
      condition: true,
      description: `${itemNumber}. ${t.dependentCosts.serviceDescriptions.standardAuthorityCosts}`,
      amount: (fees.standardAuthorityCostsChild || (fees.mandatoryUaeMedicalTest + fees.emiratesIdFee + fees.immigrationResidencyFeeChild) || 4604) * numberOfChildren,
      explanation: locale === 'de' ? 
        `Für Pflicht-VAE-Medizintest, Emirates ID und Einwanderungs-Aufenthaltsbearbeitung für ${childText}.` : 
        `For mandatory UAE medical test, Emirates ID, and immigration residency processing for ${childText}.`
    });

    // Check for visa cancellation - either from global setting or individual children setting
    const hasChildrenVisaCancellation = (fees.visaCancellation && fees.visaCancellationFee > 0) || 
                                       (children.visaCancelation && children.visaCancelationFee && children.visaCancelationFee > 0);
    const childrenCancellationFee = children.visaCancelation && children.visaCancelationFee 
                                  ? children.visaCancelationFee 
                                  : fees.visaCancellationFee;
    
    if (hasChildrenVisaCancellation) {
      itemNumber++;
      services.push({
        id: 'children-visa-cancellation',
        condition: true,
        description: `${itemNumber}. ${t.dependentCosts.serviceDescriptions.visaCancellation}`,
        amount: childrenCancellationFee * numberOfChildren,
        explanation: locale === 'de' ? 
          `Für die Stornierung des bestehenden Visa-Status vor der Beantragung des ${childText}-Angehörigen-Visa.` : 
          `For canceling existing visa status before applying for ${childText} dependent visa.`
      });
    }

    itemNumber++;
    services.push({
      id: 'children-third-party-costs',
      condition: true,
      description: `${itemNumber}. ${t.dependentCosts.serviceDescriptions.thirdPartyCosts}`,
      amount: (fees.thirdPartyCostsChild || fees.thirdPartyCosts || 0) * numberOfChildren,
      explanation: locale === 'de' ? 
        `Von verschiedenen Abteilungen erhobene Verwaltungskosten für ${childText}.` : 
        `Administrative costs charged by various departments for ${childText}.`
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

  // Add TME Services for explanations (always include, not filtered out)
  const childrenTmeServicesFee = goldenVisaData.dependents?.children?.tmeServicesFee || 0;
  if (childrenTmeServicesFee > 0) {
    services.push({
      id: 'children-tme-services',
      condition: false, // Not shown in table, only used for explanations
      description: locale === 'de' ? 'TME Services Beratungsgebühr' : 'TME Services professional fee',
      amount: childrenTmeServicesFee * numberOfChildren,
      explanation: locale === 'de' ? t.dependentCosts.explanations.tmeServicesFee : t.costsBreakdown.explanations.tmeServicesFee
    });
  }

  return services; // Return all services, not filtered
}

// Generate individual child visa breakdowns for detailed view
export function generateGoldenVisaIndividualChildVisaBreakdowns(goldenVisaData: GoldenVisaData, locale: Locale = 'en'): GoldenVisaServiceItem[][] {
  const children = goldenVisaData.dependents?.children;
  const t = GOLDEN_VISA_TRANSLATIONS[locale];
  
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
        description: locale === 'de' ? '1. Standard Behördenkosten' : '1. Standard authority costs',
        amount: fees.standardAuthorityCostsChild || (fees.mandatoryUaeMedicalTest + fees.emiratesIdFee + fees.immigrationResidencyFeeChild) || 4604,
        explanation: locale === 'de' ? 'Für Pflicht-VAE-Medizintest, Emirates ID und Einwanderungs-Aufenthaltsbearbeitung.' : 'For mandatory UAE medical test, Emirates ID, and immigration residency processing.'
      });

      const cancellationFee = children.visaCancelation && children.visaCancelationFee 
                            ? children.visaCancelationFee 
                            : fees.visaCancellationFee;

      if (hasVisaCancellation) {
        services.push({
          id: `child-${childNumber}-visa-cancellation`,
          condition: true,
          description: locale === 'de' ? '2. Visa-Stornierungskosten' : '2. Visa cancellation cost',
          amount: cancellationFee,
          explanation: locale === 'de' ? 'Für die Stornierung des bestehenden Visa-Status vor der Beantragung des Angehörigen-Visa.' : 'For cancelling existing visa status before applying for child dependent visa.'
        });
      }

      services.push({
        id: `child-${childNumber}-third-party-costs`,
        condition: true,
        description: locale === 'de' ? 
          (hasVisaCancellation ? '3. Drittanbieterkosten' : '2. Drittanbieterkosten') :
          (hasVisaCancellation ? '3. Third party costs' : '2. Third party costs'),
        amount: fees.thirdPartyCostsChild || fees.thirdPartyCosts || 0,
        explanation: locale === 'de' ? 'Von verschiedenen Abteilungen erhobene Verwaltungskosten.' : 'Administrative costs charged by various departments.'
      });
    } else {
      // Fallback to legacy structure
      services.push({
        id: `child-${childNumber}-government-fees`,
        condition: true,
        description: locale === 'de' ? '1. Behördenkosten (Medizintest + Emirates ID + Bearbeitung)' : '1. Government Costs (Medical + Emirates ID + Processing)',
        amount: children.governmentFee || 0,
        explanation: locale === 'de' ? 'Für Kinder-Visa einschließlich medizinischer Untersuchung, Emirates ID-Bearbeitung und Visa-Antragsgebühren.' : 'For child visa including medical examination, Emirates ID processing, and visa application charges.'
      });
    }

    // Add TME Services for explanations only (not shown in table)
    const childTmeServicesFee = goldenVisaData.dependents?.children?.tmeServicesFee || 0;
    if (childTmeServicesFee > 0) {
      services.push({
        id: `child-${childNumber}-tme-services`,
        condition: false, // Not shown in table, only used for explanations
        description: locale === 'de' ? 'TME Services Beratungsgebühr' : 'TME Services professional fee',
        amount: childTmeServicesFee,
        explanation: locale === 'de' ? t.dependentCosts.explanations.tmeServicesFee : t.costsBreakdown.explanations.tmeServicesFee
      });
    }

    individualBreakdowns.push(services);
  }

  return individualBreakdowns;
}

// Generate Golden Visa filename (matching the goldenVisaGenerator pattern)
export function generateGoldenVisaFilename(
  goldenVisaData: GoldenVisaData,
  clientInfo: SharedClientInfo
): string {
  // Format date as YYMMDD
  const date = new Date(goldenVisaData.date || clientInfo.date);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const formattedDate = `${yy}${mm}${dd}`;
  
  // Determine name for filename based on available data
  let nameForFilename = '';
  if (goldenVisaData.companyName) {
    nameForFilename = goldenVisaData.companyName;
  } else if (goldenVisaData.lastName && goldenVisaData.firstName) {
    nameForFilename = `${goldenVisaData.lastName} ${goldenVisaData.firstName}`;
  } else if (goldenVisaData.firstName) {
    nameForFilename = goldenVisaData.firstName;
  } else if (goldenVisaData.lastName) {
    nameForFilename = goldenVisaData.lastName;
  } else {
    nameForFilename = 'Client';
  }
  
  // Determine if this is a dependent-only visa (no primary holder)
  const isDependentOnly = !goldenVisaData.primaryVisaRequired;
  
  let visaTypeFormatted: string;
  
  if (isDependentOnly) {
    // If only dependents are getting visas, use "dependent" suffix
    visaTypeFormatted = 'dependent';
  } else {
    // Format visa type for filename (shortened versions)
    const visaTypeMap: { [key: string]: string } = {
      'property-investment': 'property',
      'time-deposit': 'deposit',
      'skilled-employee': 'skilled'
    };
    
    visaTypeFormatted = visaTypeMap[goldenVisaData.visaType] || goldenVisaData.visaType;
  }
  
  // Build filename: yymmdd {name} offer golden visa {type}.pdf
  return `${formattedDate} ${nameForFilename} offer golden visa ${visaTypeFormatted}.pdf`;
} 