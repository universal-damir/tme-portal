// TME Services DMCC Dubai Branch Branding Configuration  
// Used for DMCC (Dubai Multi Commodities Centre) documents

import type { BrandingConfig } from './TME_FZCO_CONFIG';

export const DMCC_CONFIG: BrandingConfig = {
  id: 'dmcc',
  companyName: 'TME Services DMCC Dubai Branch',
  legalName: 'TME Services DMCC Dubai Branch',
  logo: '/logo.png',
  header: {
    companyName: 'TME Services DMCC Dubai Branch',
    address: 'DMCC Business Centre, Dubai, United Arab Emirates',
    poBox: 'PO Box 487770',
    location: 'Dubai | UAE',
    phone: '+971 55 400 94 09',
    email: 'info@TME-Services.com',
    website: 'www.TME-Services.com',
    citTrn: 'CIT TRN 10020 08363 00001',
    vatTrn: 'VAT TRN 10020 08363 00003'
  },
  footer: {
    companyName: 'TME Services DMCC Dubai Branch',
    address: 'CIT TRN 10020 08363 00001 | VAT TRN 10020 08363 00003'
  },
  colors: {
    primary: '#243F7B', // TME Blue
    secondary: '#6b7280', // Gray
    accent: '#10b981' // Green for positive values
  },
  applicableAuthorities: [
    'DMCC (Dubai Multi Commodities Centre)',
    'DMCC Business Centre'
  ]
};