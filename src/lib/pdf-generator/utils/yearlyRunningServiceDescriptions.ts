import type { OfferData } from '@/types/offer';
import type { AuthorityConfig } from '@/lib/authorities/types';

export interface YearlyRunningServiceItem {
  id: string;
  condition: boolean;
  description: string;
  amount: number;
  explanation?: string;
}

// Generate yearly running service descriptions
export const generateYearlyRunningServiceDescriptions = (
  data: OfferData, 
  yearlyRunningData: any, 
  authorityConfig: AuthorityConfig | null | undefined
): YearlyRunningServiceItem[] => {
  const services: YearlyRunningServiceItem[] = [];
  
  if (!yearlyRunningData) return services;

  // IFZA Yearly Running Services
  if (data.authorityInformation.responsibleAuthority === 'IFZA (International Free Zone Authority)') {
    // 1. IFZA License Renewal Fee (combined base + visa quota)
    if ((yearlyRunningData.baseLicenseRenewal > 0 || yearlyRunningData.visaQuotaRenewal > 0)) {
      services.push({
        id: 'ifza-license-renewal',
        condition: true,
        description: 'IFZA License Renewal Fee',
        amount: yearlyRunningData.baseLicenseRenewal + yearlyRunningData.visaQuotaRenewal,
        explanation: `Annual renewal cost for your business license issued by ${data.authorityInformation.responsibleAuthority}. This includes the base license fee and visa quota renewal costs.`
      });
    }

    // 2. GDRFA Immigration Renewal
    if (yearlyRunningData.immigrationRenewal > 0) {
      services.push({
        id: 'immigration-renewal',
        condition: true,
        description: 'GDRFA (Immigration Establishment Card) Renewal Fee',
        amount: yearlyRunningData.immigrationRenewal,
        explanation: 'Mandatory Renewal Fee.'
      });
    }

    // 3. Cross Border Renewal
    if (yearlyRunningData.crossBorderRenewal > 0) {
      services.push({
        id: 'cross-border-renewal',
        condition: true,
        description: 'IFZA Cross Border Renewal Fee',
        amount: yearlyRunningData.crossBorderRenewal,
        explanation: 'Annual renewal fee required for conducting both professional and commercial activities across UAE borders.'
      });
    }

    // 4. Third-party Approval (NOC)
    if (yearlyRunningData.thirdPartyApproval > 0) {
      services.push({
        id: 'third-party-approval',
        condition: true,
        description: 'Third-party Approval (NOC) Renewal Fee',
        amount: yearlyRunningData.thirdPartyApproval,
        explanation: 'Annual renewal fee for third-party approvals or No Objection Certificates (NOC) required for specific business activities.'
      });
    }

    // 5. Office Rent
    if (yearlyRunningData.officeRent > 0) {
      services.push({
        id: 'office-rent',
        condition: true,
        description: 'IFZA Office Rent',
        amount: yearlyRunningData.officeRent,
        explanation: 'Annual office rental cost. The amount varies depending on location, size, and availability of suitable office spaces.'
      });
    }

    // 6. TME Services Professional Yearly Fee
    if (yearlyRunningData.tmeYearlyFee > 0) {
      services.push({
        id: 'tme-yearly-fee',
        condition: true,
        description: 'TME Services Professional Yearly Renewal Fee',
        amount: yearlyRunningData.tmeYearlyFee,
        explanation: 'Our professional service fee for managing annual license renewals, government liaison, and ongoing compliance support.'
      });
    }
  }

  // DET Yearly Running Services
  if (data.authorityInformation.responsibleAuthority === 'DET (Dubai Department of Economy and Tourism)') {
    // 1. DET License Renewal
    services.push({
      id: 'det-license-renewal',
      condition: true,
      description: 'DET License Fee (Annual Renewal)',
      amount: 13000,
      explanation: 'Annual renewal fee for your business license with the Department of Economy and Tourism-Dubai (DET).'
    });

    // 2. DET Immigration Renewal
    services.push({
      id: 'det-immigration-renewal',
      condition: true,
      description: 'GDRFA (Immigration) renewal fee Establishment Card for visa',
      amount: 2000,
      explanation: 'Annual renewal fee for the immigration establishment card required for visa processing and employee sponsorship with DET.'
    });

    // 3. DET Office Rent
    if (data.detLicense?.rentType && data.detLicense?.officeRentAmount) {
      const rentDescription = data.detLicense.rentType === 'office' 
        ? 'Office rent (differs on location & availability)'
        : data.detLicense.rentType === 'warehouse'
        ? 'Warehouse rent (differs on location & availability)'
        : data.detLicense.rentType === 'business-center'
        ? 'Business Center arrangement cost'
        : 'Office Rent';
        
      services.push({
        id: 'det-office-rent',
        condition: true,
        description: rentDescription,
        amount: data.detLicense.officeRentAmount,
        explanation: `Annual ${data.detLicense.rentType === 'business-center' ? 'business center service' : 'rental'} cost for your ${data.detLicense.rentType === 'business-center' ? 'business center arrangement' : data.detLicense.rentType}.`
      });
    }

    // 4. DET Third-party Approval (Yearly)
    if (data.detLicense?.thirdPartyApproval && data.detLicense?.thirdPartyApprovalAmount) {
      services.push({
        id: 'det-third-party-approval',
        condition: true,
        description: 'Activities Required Third-party Approval',
        amount: data.detLicense.thirdPartyApprovalAmount,
        explanation: 'Annual renewal fee for third-party approvals required for specific business activities under DET jurisdiction.'
      });
    }

    // 5. DET TME Yearly Fee
    services.push({
      id: 'det-tme-yearly-fee',
      condition: true,
      description: 'TME Yearly Service Fee',
      amount: 3360,
      explanation: 'Our professional service fee for managing annual license renewals, government liaison, and ongoing compliance support with DET.'
    });
  }

  return services.filter(service => service.condition);
};

// Generate numbered yearly running services
export const generateNumberedYearlyRunningServices = (services: YearlyRunningServiceItem[]): Array<YearlyRunningServiceItem & { number: number }> => {
  return services.map((service, index) => ({
    ...service,
    number: index + 1
  }));
};

// Format yearly running service description with number
export const formatYearlyRunningServiceDescription = (service: YearlyRunningServiceItem & { number: number }): string => {
  return `${service.number}. ${service.description}`;
}; 