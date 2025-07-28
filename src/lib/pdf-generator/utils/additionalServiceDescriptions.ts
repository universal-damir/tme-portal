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
      description: 'One-time TME Services Professional Fee and cost for Company stamp preparation and production (Two stamps)',
      amount: data.additionalServices.companyStamp,
      explanation: 'Professional service fee covering the design, preparation, and production of two company stamps required for official business documentation and transactions.'
    });
  }

  // Emirates Post Registration
  if (data.additionalServices.emiratesPost && data.additionalServices.emiratesPost > 0) {
    services.push({
      id: 'emirates-post',
      condition: true,
      description: 'One-time TME Services Professional Fee for registration with Emirates Post P.O. Box',
      amount: data.additionalServices.emiratesPost,
      explanation: 'One-time P.O.Box registration fee for establishing a business postal address with Emirates Post for official correspondence and deliveries.'
    });
  }

  // Corporate Income Tax (CIT) Registration
  if (data.additionalServices.citRegistration && data.additionalServices.citRegistration > 0) {
    services.push({
      id: 'cit-registration',
      condition: true,
      description: 'One-time TME Services Professional Fee for CIT (Corporate Income Tax) Registration',
      amount: data.additionalServices.citRegistration,
      explanation: 'Professional service fee for registering your company with the Federal Tax Authority for Corporate Income Tax compliance, including documentation preparation and submission.'
    });
  }

  // Value Added Tax (VAT) Registration or Exception
  if (data.additionalServices.vatRegistration && data.additionalServices.vatRegistration > 0) {
    services.push({
      id: 'vat-registration',
      condition: true,
      description: 'One-time TME Professional Service Fee for VAT (Value Added Tax) Registration or Exception',
      amount: data.additionalServices.vatRegistration,
      explanation: 'Professional service fee for VAT registration with the Federal Tax Authority or applying for VAT exemption, including preparation of required documentation and compliance setup.'
    });
  }

  // Personal Bank Account Opening
  if (data.additionalServices.personalBank && data.additionalServices.personalBank > 0) {
    services.push({
      id: 'personal-bank-account',
      condition: true,
      description: 'One-time TME Services Professional Fee for 1 personal bank account application with a UAE bank',
      amount: data.additionalServices.personalBank,
      explanation: 'Professional assistance for opening a personal bank account, including documentation preparation, bank liaison, and application support.'
    });
  }

  // Digital Bank Account Opening (WIO)
  if (data.additionalServices.digitalBank && data.additionalServices.digitalBank > 0) {
    services.push({
      id: 'digital-bank-account',
      condition: true,
      description: 'One-time TME Services Professional Fee for 1 company bank account application with the digital bank WIO',
      amount: data.additionalServices.digitalBank,
      explanation: 'Professional service for opening a digital banking account with WIO Bank, including application preparation and process facilitation.'
    });
  }

  // Traditional Bank Account Opening
  if (data.additionalServices.traditionalBank && data.additionalServices.traditionalBank > 0) {
    services.push({
      id: 'traditional-bank-account',
      condition: true,
      description: 'One-time TME Services Professional Fee for 1 company account application with a traditional UAE bank',
      amount: data.additionalServices.traditionalBank,
      explanation: 'Professional assistance for opening a corporate bank account with traditional banks, including documentation preparation and bank introduction services.'
    });
  }

  // Yearly Accounting Fee
  if (data.additionalServices.accountingFee && data.additionalServices.accountingFee > 0) {
    services.push({
      id: 'yearly-accounting-fee',
      condition: true,
      description: 'Yearly Accounting Fee based on 360 Transactions per Year',
      amount: data.additionalServices.accountingFee,
      explanation: 'Annual accounting and bookkeeping services based on 360 transactions per year, including financial record maintenance and basic reporting.'
    });
  }

  // Corporate Income Tax (CIT) Return Filing - MOVED TO BOTTOM (after yearly accounting)
  if (data.additionalServices.citReturnFiling && data.additionalServices.citReturnFiling > 0) {
    services.push({
      id: 'cit-return-filing',
      condition: true,
      description: 'Yearly TME Services Professional Fee for CIT (Corporate Income Tax) Return Filing',
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