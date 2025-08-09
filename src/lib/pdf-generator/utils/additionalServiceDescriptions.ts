import type { OfferData } from '@/types/offer';

export interface AdditionalServiceItem {
  id: string;
  condition: boolean;
  description: string;
  amount: number;
  explanation?: string;
}

// Generate additional service descriptions
export const generateAdditionalServiceDescriptions = (
  data: OfferData
): AdditionalServiceItem[] => {
  const services: AdditionalServiceItem[] = [];
  
  if (!data.additionalServices) return services;

  // Company Stamp Preparation
  if (data.additionalServices.companyStamp && data.additionalServices.companyStamp > 0) {
    services.push({
      id: 'company-stamp',
      condition: true,
      description: 'One-time cost for company stamp preparation and production (two stamps)',
      amount: data.additionalServices.companyStamp,
      explanation: 'Professional service fee covering the design, preparation, and cost for production of two company stamps required for official business documentation and transactions.'
    });
  }

  // Emirates Post Registration
  if (data.additionalServices.emiratesPost && data.additionalServices.emiratesPost > 0) {
    services.push({
      id: 'emirates-post',
      condition: true,
      description: 'One-time cost for registration with Emirates Post P.O.Box',
      amount: data.additionalServices.emiratesPost,
      explanation: 'One-time P.O.Box registration cost for establishing a business postal address with Emirates Post for official correspondence and deliveries.'
    });
  }

  // Corporate Income Tax (CIT) Registration
  if (data.additionalServices.citRegistration && data.additionalServices.citRegistration > 0) {
    services.push({
      id: 'cit-registration',
      condition: true,
      description: 'One-time fee for CIT (Corporate Income Tax) registration',
      amount: data.additionalServices.citRegistration,
      explanation: 'Professional service fee for registering your company with the Federal Tax Authority for Corporate Income Tax compliance, including documentation preparation and submission.'
    });
  }

  // Value Added Tax (VAT) Registration or Exception
  if (data.additionalServices.vatRegistration && data.additionalServices.vatRegistration > 0) {
    services.push({
      id: 'vat-registration',
      condition: true,
      description: 'One-time fee for VAT (Value Added Tax) registration or exception',
      amount: data.additionalServices.vatRegistration,
      explanation: 'Professional service fee for VAT registration with the Federal Tax Authority or applying for VAT exemption, including preparation of required documentation and compliance setup.'
    });
  }

  // Personal Bank Account Opening
  if (data.additionalServices.personalBank && data.additionalServices.personalBank > 0) {
    services.push({
      id: 'personal-bank-account',
      condition: true,
      description: 'One-time fee for one personal bank account application with a UAE bank',
      amount: data.additionalServices.personalBank,
      explanation: 'Professional assistance for opening a personal bank account, including documentation preparation, bank liaison, and application support.'
    });
  }

  // Digital Bank Account Opening (WIO)
  if (data.additionalServices.digitalBank && data.additionalServices.digitalBank > 0) {
    services.push({
      id: 'digital-bank-account',
      condition: true,
      description: 'One-time fee for one company bank account application with the UAE digital bank WIO or similar',
      amount: data.additionalServices.digitalBank,
      explanation: 'Professional service for opening a digital banking account with WIO Bank, including application preparation and process facilitation.'
    });
  }

  // Traditional Bank Account Opening
  if (data.additionalServices.traditionalBank && data.additionalServices.traditionalBank > 0) {
    services.push({
      id: 'traditional-bank-account',
      condition: true,
      description: 'One-time fee for one company bank account application with a traditional UAE bank',
      amount: data.additionalServices.traditionalBank,
      explanation: 'Professional assistance for opening a corporate bank account with traditional banks, including documentation preparation and bank introduction services.'
    });
  }

  // Accounting Fee (based on frequency)
  if (data.additionalServices.accountingFee && data.additionalServices.accountingFee > 0) {
    const frequency = data.additionalServices.accountingFrequency || 'yearly';
    const frequencyLabels = {
      yearly: 'Yearly',
      quarterly: 'Quarterly', 
      monthly: 'Monthly'
    };
    
    services.push({
      id: 'accounting-fee',
      condition: true,
      description: `${frequencyLabels[frequency]} fee for accounting`,
      amount: data.additionalServices.accountingFee,
      explanation: `${frequencyLabels[frequency]} accounting and bookkeeping services based on 360 transactions per year, including financial record maintenance and basic reporting.`
    });
  }

  // Corporate Income Tax (CIT) Return Filing - MOVED TO BOTTOM (after yearly accounting)
  if (data.additionalServices.citReturnFiling && data.additionalServices.citReturnFiling > 0) {
    services.push({
      id: 'cit-return-filing',
      condition: true,
      description: 'Yearly fee for CIT (Corporate Income Tax) return filing',
      amount: data.additionalServices.citReturnFiling,
      explanation: 'Professional service fee for preparing and filing annual Corporate Income Tax returns with the Federal Tax Authority, including tax calculation and submission support.'
    });
  }

  return services.filter(service => service.condition);
};

// Generate numbered additional services
export const generateNumberedAdditionalServices = (services: AdditionalServiceItem[]): Array<AdditionalServiceItem & { number: number }> => {
  return services.map((service, index) => ({
    ...service,
    number: index + 1
  }));
};

// Format additional service description with number
export const formatAdditionalServiceDescription = (service: AdditionalServiceItem & { number: number }): string => {
  return `${service.number}. ${service.description}`;
}; 