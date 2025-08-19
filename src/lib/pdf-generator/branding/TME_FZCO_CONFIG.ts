// TME Services FZCO Branding Configuration
// Used for IFZA (International Free Zone Authority) documents

export interface BrandingConfig {
  id: 'tme-fzco' | 'management-consultants' | 'dmcc';
  companyName: string;
  legalName: string;
  logo: string;
  header: {
    companyName: string;
    address: string;
    poBox: string;
    location: string;
    phone: string;
    email: string;
    website: string;
    citTrn: string;
    vatTrn: string;
  };
  footer: {
    companyName: string;
    address: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  applicableAuthorities: string[];
}

export const TME_FZCO_CONFIG: BrandingConfig = {
  id: 'tme-fzco',
  companyName: 'TME Services FZCO',
  legalName: 'TME Services FZCO',
  logo: '/logo.png',
  header: {
    companyName: 'TME Services FZCO',
    address: 'CIT TRN 10020 08363 00001 | VAT TRN 10020 08363 00003',
    poBox: 'PO Box 487770',
    location: 'Dubai | UAE',
    phone: '+971 55 400 94 09',
    email: 'setup@TME-Services.com',
    website: 'www.TME-Services.com',
    citTrn: 'CIT TRN 10020 08363 00001',
    vatTrn: 'VAT TRN 10020 08363 00003'
  },
  footer: {
    companyName: 'TME Services FZCO',
    address: 'CIT TRN 10020 08363 00001 | VAT TRN 10020 08363 00003'
  },
  colors: {
    primary: '#243F7B', // TME Blue
    secondary: '#6b7280', // Gray
    accent: '#10b981' // Green for positive values
  },
  applicableAuthorities: [
    'IFZA (International Free Zone Authority)'
  ]
}; 