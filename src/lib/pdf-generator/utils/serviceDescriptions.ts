import { OfferData } from '@/types/offer';

export interface ServiceItem {
  id: string;
  condition: boolean;
  description: string;
  amount: number;
  isReduction?: boolean;
  explanation?: string;
}

export const generateServiceDescriptions = (data: OfferData): ServiceItem[] => {
  const services: ServiceItem[] = [];
  const isIfza = data.authorityInformation.responsibleAuthority === 'IFZA (International Free Zone Authority)';
  const isDet = data.authorityInformation.responsibleAuthority === 'DET (Dubai Department of Economy and Tourism)';
  const setupType = data.clientDetails?.companySetupType;
  const licenseYears = data.ifzaLicense?.licenseYears || 1;
  const isMultiYearIFZA = isIfza && licenseYears > 1;

  if (isDet) {
    // DET specific order as requested by user:
    // 1. Registration fee Dubai Department of Economy and Tourism (DET)
    // 2. GDRFA Cost (Immigration Establishment Card)
    // 3. Registration fee MoHRE (Labour)
    // 4. DET License Cost - Commercial
    // 5. Business Center arrangement cost
    // 6. Third-party Approval (NOC)
    // 7. Power Of Attorney
    // 8. TME Services Professional Fee (Including VAT)
    // 9. Price Reduction

    // 1. Registration fee Dubai Department of Economy and Tourism (DET)
    services.push({
      id: 'det-registration',
      condition: true,
      description: 'Registration fee Dubai Department of Economy and Tourism (DET)',
      amount: 2000,
      explanation: 'Cost for obtaining the business license issued by DET (Department of Economy and Tourism).'
    });

    // 2. GDRFA Cost (Immigration Establishment Card)
    services.push({
      id: 'gdrfa-registration',
      condition: true,
      description: 'GDRFA Cost (Immigration Establishment Card)',
      amount: 2000,
      explanation: 'Mandatory registration for the Establishment Card.'
    });

    // 3. Registration fee MoHRE (Labour)
    services.push({
      id: 'mohre-registration',
      condition: true,
      description: 'Registration fee MoHRE (Labour)',
      amount: 1000,
      explanation: 'Mandatory registration fee with the MoHRE (Ministry of Human Resources and Emiratisation).'
    });

    // 4. DET License Cost - Commercial (or other type)
    if (data.detLicense?.licenseType) {
      const detLicenseCosts = {
        commercial: 13000,
        'commercial-real-estate': 24000,
        'commercial-investment': 30000,
        instant: 13000,
        industrial: 20000,
        professional: 10000,
      };
      
      const licenseTypeNames = {
        commercial: 'Commercial',
        'commercial-real-estate': 'Commercial Real Estate',
        'commercial-investment': 'Commercial Investment (Holding)',
        instant: 'Instant',
        industrial: 'Industrial',
        professional: 'Professional',
      };
      
      const licenseCost = detLicenseCosts[data.detLicense.licenseType];
      const licenseTypeName = licenseTypeNames[data.detLicense.licenseType];
      
      services.push({
        id: 'det-license-fee',
        condition: true,
        description: `DET License Cost - ${licenseTypeName}`,
        amount: licenseCost,
        explanation: `License cost for ${licenseTypeName} license with the Department of Economy and Tourism-Dubai (DET).`
      });
    }

    // 5. Business Center arrangement cost (or Office/Warehouse rent)
    if (data.detLicense?.rentType && data.detLicense?.officeRentAmount) {
      const officeRentDescription = data.detLicense.rentType === 'business-center' 
        ? 'Business Center arrangement cost'
        : data.detLicense.rentType === 'office' 
        ? 'Office rent (differs on location & availability)'
        : 'Warehouse rent (differs on location & availability)';
        
      const officeRentExplanation = data.detLicense.rentType === 'business-center' 
        ? 'Annual business center service cost for your business center arrangement.'
        : `Annual rental cost for your ${data.detLicense.rentType}.`;
      
      services.push({
        id: 'office-rent',
        condition: true,
        description: officeRentDescription,
        amount: data.detLicense.officeRentAmount,
        explanation: officeRentExplanation
      });
    }

    // 6. Third-party Approval (NOC)
    if (data.detLicense?.thirdPartyApproval && data.detLicense?.thirdPartyApprovalAmount) {
      services.push({
        id: 'third-party-approval',
        condition: true,
        description: 'Third-party Approval (NOC)',
        amount: data.detLicense.thirdPartyApprovalAmount,
        explanation: 'Includes mandatory approvals or NOCs (No Objection Certificates) from relevant external authorities like Dubai Sport Council, Dubai Civil Aviation Authority, Dubai Municipality etc.'
      });
    }

    // 7. Power Of Attorney (and other MoFA translations)
    let mofaTotal = 0;
    if (data.detLicense?.mofaOwnersDeclaration) mofaTotal += 2000;
    if (data.detLicense?.mofaCertificateOfIncorporation) mofaTotal += 2000;
    if (data.detLicense?.mofaActualMemorandumOrArticles) mofaTotal += 2000;
    if (data.detLicense?.mofaCommercialRegister) mofaTotal += 2000;
    if (data.detLicense?.mofaPowerOfAttorney) mofaTotal += 2000;

    if (mofaTotal > 0) {
      let description = 'Power of Attorney';
      const explanation = 'Includes obtaining official document that authorizes TME Services to act on your behalf for all matters related to your company setup';
      
      if (setupType === 'Corporate Setup') {
        description = 'Government Document & Translation Cost';
      }

      services.push({
        id: 'mofa-translations',
        condition: true,
        description,
        amount: mofaTotal,
        explanation
      });
    }

    // 8. TME Services Professional Fee (Including VAT)
    if (data.detLicense?.tmeServicesFee) {
      services.push({
        id: 'tme-services-fee',
        condition: true,
        description: 'TME Services Professional Fee (Including VAT)',
        amount: data.detLicense.tmeServicesFee,
        explanation: 'Our service fee for managing the initial setup process, including VAT.'
      });
    }

    // 9. Price Reduction
    if (data.detLicense?.applyPriceReduction && data.detLicense?.reductionAmount) {
      services.push({
        id: 'price-reduction',
        condition: true,
        description: 'TME Services Professional Fee Reduction (Including VAT)',
        amount: data.detLicense.reductionAmount,
        isReduction: true,
        explanation: 'A reduction applied to our professional fee as discussed, including VAT.'
      });
    }

  } else if (isIfza) {
    // IFZA specific logic (unchanged)

    // 1. IFZA License Cost
    const baseLicense = 12900;
    const visaQuotaCosts = (data.ifzaLicense?.visaQuota || 0) * 2000;
    const annualAmount = baseLicense + visaQuotaCosts;
    
    if (annualAmount > 0) {
      // For multi-year licenses, show the total amount for all years
      const totalLicenseAmount = annualAmount * licenseYears;
      
      services.push({
        id: 'ifza-license-fee',
        condition: true,
        description: isMultiYearIFZA 
          ? `IFZA License Cost (for ${licenseYears} years)`
          : 'IFZA License Cost',
        amount: totalLicenseAmount,
        explanation: `IFZA license cost including visa quota for ${data.ifzaLicense?.visaQuota || 0} visas.`
      });

      // Multi-year discount (appears right after license fee)
      if (isMultiYearIFZA) {
        const getDiscountPercentage = (years: number) => {
          switch (years) {
            case 2: return 15;
            case 3: return 20; 
            case 5: return 30;
            default: return 0;
          }
        };
        
        const discountPercentage = getDiscountPercentage(licenseYears);
        // Calculate discount on the total multi-year amount
        const discountAmount = (totalLicenseAmount * discountPercentage) / 100;
        
        services.push({
          id: 'ifza-license-discount',
          condition: true,
          description: `IFZA License Cost Reduction (${discountPercentage}%)`,
          amount: discountAmount,
          isReduction: true,
          explanation: `Multi-year license discount of ${discountPercentage}% for ${licenseYears}-year license term.`
        });
      }
    }

    // 2. GDRFA Immigration Establishment Card
    if (data.ifzaLicense?.visaQuota && data.ifzaLicense.visaQuota > 0) {
      // Calculate GDRFA fee based on years
      let gdrfaAmount = 2000; // Default for single year
      
      if (licenseYears > 1) {
        // Multi-year IFZA: 2,000 (first year) + (years-1) × 2,200 (subsequent years)
        const firstYear = 2000; // First year
        const subsequentYears = (licenseYears - 1) * 2200; // Subsequent years at 2,200 each
        gdrfaAmount = firstYear + subsequentYears;
      }
      
      services.push({
        id: 'gdrfa-registration',
        condition: true,
        description: isMultiYearIFZA 
          ? `GDRFA Cost (Immigration Establishment Card) (for ${licenseYears} years)`
          : 'GDRFA Cost (Immigration Establishment Card)',
        amount: gdrfaAmount,
        explanation: `Mandatory registration for the Establishment Card.`
      });
    }

    // 3. Cross Border Cost (IFZA only)
    if (data.ifzaLicense?.crossBorderLicense) {
      const crossBorderAmount = 2000 * licenseYears; // Multiply by years for multi-year licenses
      
      services.push({
        id: 'cross-border-license',
        condition: true,
        description: isMultiYearIFZA 
          ? `IFZA Cross Border Cost (for ${licenseYears} years)`
          : 'IFZA Cross Border Cost',
        amount: crossBorderAmount,
        explanation: `Additional cost required for conducting both professional and commercial activities.`
      });
    }

    // 4. Office Rent
    if (data.ifzaLicense?.rentOfficeRequired && data.ifzaLicense?.officeRentAmount) {
      const totalOfficeRentAmount = data.ifzaLicense.officeRentAmount * licenseYears;
      
      services.push({
        id: 'office-rent',
        condition: true,
        description: isMultiYearIFZA ? `IFZA Office Rent (for ${licenseYears} years)` : 'IFZA Office Rent',
        amount: totalOfficeRentAmount,
        explanation: `${isMultiYearIFZA ? 'Total' : 'Annual'} cost for renting a physical office space as per authority requirements.`
      });
    }

    // 5. Third-party Approval (NOC)
    if (data.ifzaLicense?.thirdPartyApproval && data.ifzaLicense?.thirdPartyApprovalAmount) {
      const totalThirdPartyAmount = data.ifzaLicense.thirdPartyApprovalAmount * licenseYears;
      
      services.push({
        id: 'third-party-approval',
        condition: true,
        description: isMultiYearIFZA 
          ? `Third-party Approval (NOC) (for ${licenseYears} years)`
          : 'Third-party Approval (NOC)',
        amount: totalThirdPartyAmount,
        explanation: `Includes mandatory approvals or NOCs (No Objection Certificates) from relevant external authorities like Dubai Sport Council, Dubai Civil Aviation Authority, Dubai Municipality etc.`
      });
    }

    // 6. Power of Attorney / MoFA Document Translations
    let mofaTotal = 0;
    if (data.ifzaLicense?.mofaOwnersDeclaration) mofaTotal += 2000;
    if (data.ifzaLicense?.mofaCertificateOfIncorporation) mofaTotal += 2000;
    if (data.ifzaLicense?.mofaActualMemorandumOrArticles) mofaTotal += 2000;
    if (data.ifzaLicense?.mofaCommercialRegister) mofaTotal += 2000;
    if (data.ifzaLicense?.mofaPowerOfAttorney) mofaTotal += 2000;

    if (mofaTotal > 0) {
      let description = 'MoFA Document Translations';
      const explanation = 'Includes official translation and attestation of documents by the MoFA (Ministry of Foreign Affairs).';
      
      if (setupType === 'Individual Setup') {
        description = 'Power of Attorney';
      } else if (setupType === 'Corporate Setup') {
        description = 'Government Document & Translation Cost';
      }

      services.push({
        id: 'mofa-translations',
        condition: true,
        description,
        amount: mofaTotal,
        explanation
      });
    }

    // IFZA Additional Business Activities Cost (only if TBC not enabled and >3 activities)
    const activitiesCount = data.activityCodes?.length || 0;
    const isTbcEnabled = data.authorityInformation?.activitiesToBeConfirmed || 
                         data.ifzaLicense?.activitiesToBeConfirmed || false;
    
    if (!isTbcEnabled && activitiesCount > 3) {
      const additionalActivities = activitiesCount - 3;
      const additionalCost = additionalActivities * 1000;
      services.push({
        id: 'additional-activities',
        condition: true,
        description: `IFZA Additional Business Activities Cost (${additionalActivities} additional ${additionalActivities === 1 ? 'activity' : 'activities'})`,
        amount: additionalCost,
        explanation: 'IFZA charges AED 1,000 for each additional business activity beyond the first 3 activities included in the base license fee.'
      });
    }

    // 7. TME Services Professional Fee
    if (data.ifzaLicense?.tmeServicesFee) {
      services.push({
        id: 'tme-services-fee',
        condition: true,
        description: 'TME Services Professional Fee (Including VAT)',
        amount: data.ifzaLicense.tmeServicesFee,
        explanation: 'Our service fee for managing the initial setup process, including VAT.'
      });
    }

    // 8. Price Reduction
    if (data.ifzaLicense?.applyPriceReduction && data.ifzaLicense?.reductionAmount) {
      services.push({
        id: 'price-reduction',
        condition: true,
        description: 'TME Services Professional Fee Reduction (Including VAT)',
        amount: data.ifzaLicense.reductionAmount,
        isReduction: true,
        explanation: 'A reduction applied to our professional fee as discussed, including VAT.'
      });
    }
  }

  return services.filter(service => service.condition);
};

// Generate deposit explanations separately since they're not numbered
export const generateDepositExplanations = (data: OfferData): Array<{ id: string; title: string; explanation: string }> => {
  const deposits = [];
  
  // IFZA deposits
  if (data.ifzaLicense?.depositWithLandlord && (data.ifzaLicense?.depositAmount || 0) > 0) {
    deposits.push({
      id: 'ifza-deposit',
      title: 'Deposit with Landlord',
      explanation: 'A refundable security deposit required by the landlord for the office rent.'
    });
  }

  // DET deposits
  if (data.authorityInformation.responsibleAuthority === 'DET (Dubai Department of Economy and Tourism)' && 
      data.detLicense?.rentType && data.detLicense.rentType !== 'business-center') {
    
    if (data.detLicense?.officeRentAmount) {
      deposits.push({
        id: 'det-landlord-deposit',
        title: 'Landlord Deposit (5% of rent)',
        explanation: 'A refundable security deposit equivalent to 5% of the annual rent amount.'
      });
    }
    
    if (data.detLicense?.rentType === 'office' || data.detLicense?.rentType === 'warehouse') {
      deposits.push({
        id: 'det-dewa-deposit',
        title: 'DEWA Deposit',
        explanation: 'Refundable utility connection deposit required by Dubai Electricity and Water Authority.'
      });
    }
  }

  return deposits;
};

export const generateNumberedServices = (services: ServiceItem[]): Array<ServiceItem & { number: number }> => {
  return services.map((service, index) => ({
    ...service,
    number: index + 1
  }));
};

export const formatServiceDescription = (service: ServiceItem & { number: number }): string => {
  return `${service.number}. ${service.description}`;
}; 