// TME Management Consultants LLC Branding Configuration  
// Used for DET (Dubai Department of Economy and Tourism) documents

import type { BrandingConfig } from './TME_FZCO_CONFIG';

export const MANAGEMENT_CONSULTANTS_CONFIG: BrandingConfig = {
  id: 'management-consultants',
  companyName: 'TME Management Consultants LLC',
  legalName: 'TME Management Consultants LLC',
  logo: '/logo.png',
  header: {
    companyName: 'TME Management Consultants LLC',
    address: 'CIT TRN 10407 45547 00001 | VAT TRN 10407 45547 00003',
    poBox: 'PO Box 487770',
    location: 'Dubai | UAE',
    phone: '+971 55 400 94 09',
    email: 'setup@TME-Services.com',
    website: 'www.TME-Services.com',
    citTrn: 'CIT TRN 10407 45547 00001',
    vatTrn: 'VAT TRN 10407 45547 00003'
  },
  footer: {
    companyName: 'TME Management Consultants LLC',
    address: 'CIT TRN 10407 45547 00001 | VAT TRN 10407 45547 00003'
  },
  colors: {
    primary: '#243F7B', // TME Blue
    secondary: '#6b7280', // Gray
    accent: '#10b981' // Green for positive values
  },
  applicableAuthorities: [
    'DET (Dubai Department of Economy and Tourism)',
    'Property Investment Golden Visa',
    'Time Deposit Golden Visa',
    'Skilled Employee Golden Visa',
    'Golden Visa Application'
  ]
}; 