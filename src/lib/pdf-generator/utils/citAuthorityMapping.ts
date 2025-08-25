/**
 * Authority to Company Mapping for CIT Return Letters
 * Maps registered authorities to company types and their details
 */

export interface CompanyDetails {
  type: 'FZCO' | 'MGT' | 'TME';
  name: string;
  citTrn: string;
  vatTrn: string;
  poBox: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  stampPath: string;
}

// Authority to Company Type Mapping
export const AUTHORITY_TO_COMPANY_TYPE: Record<string, CompanyDetails['type']> = {
  // FZCO Companies
  'AJM Ajman FZ': 'FZCO',
  'AUH Masdar FZ': 'FZCO',
  'DXB DACC': 'FZCO',
  'DXB DAFZ FZ': 'FZCO',
  'DXB DDA FZ': 'FZCO',
  'DXB DHCC FZ': 'FZCO',
  'DXB DIFC FZ': 'FZCO',
  'DXB DMCC FZ': 'FZCO',
  'DXB DSO FZ': 'FZCO',
  'DXB DWC FZ': 'FZCO',
  'DXB DWTC FZ': 'FZCO',
  'DXB ECDA FZ': 'FZCO',
  'DXB IFZA FZ': 'FZCO',
  'DXB JAFZA FZ': 'FZCO',
  'DXB Meydan FZ': 'FZCO',
  'FUJ FM FZ': 'FZCO',
  'FUJ Fujairah FZ': 'FZCO',
  'RAK RAKEZ FZ': 'FZCO',
  'RAK RAKMC FZ': 'FZCO',
  'SHJ Hamriyah FZ': 'FZCO',
  'SHJ SAIF FZ': 'FZCO',
  'SHJ Shams FZ': 'FZCO',
  'SHJ SPC FZ': 'FZCO',
  'UMM Umm Al Quwain FZ': 'FZCO',
  
  // MGT Companies
  'AUH DED': 'MGT',
  'DXB DAC': 'MGT',
  'DXB DET': 'MGT',
  'X Not registered': 'MGT',
  'X Outside UAE': 'MGT',
  
  // TME Companies
  'DXB JAFZA Offshore': 'TME',
  'RAK RAKICC Offshore': 'TME',
};

// Company Details Configuration
export const COMPANY_DETAILS: Record<CompanyDetails['type'], CompanyDetails> = {
  FZCO: {
    type: 'FZCO',
    name: 'TME Services FZCO',
    citTrn: '10020 08363 00001',
    vatTrn: '10020 08363 00003',
    poBox: '487770',
    city: 'Dubai',
    country: 'UAE',
    phone: '+971 55 551 10 18',
    email: 'info@TME-Services.com',
    website: 'www.TME-Services.com',
    stampPath: '/stamps/cit-letters/FZCO.jpeg'
  },
  MGT: {
    type: 'MGT',
    name: 'TME Management Consultants LLC',
    citTrn: '10407 45547 00001',
    vatTrn: '10407 45547 00003',
    poBox: '487770',
    city: 'Dubai',
    country: 'UAE',
    phone: '+971 55 551 10 18',
    email: 'info@TME-Services.com',
    website: 'www.TME-Services.com',
    stampPath: '/stamps/cit-letters/MGT.jpeg'
  },
  TME: {
    type: 'TME',
    name: 'Trust ME Accounting & Book keeping LLC',
    citTrn: '10032 37532 00001',
    vatTrn: '10032 37532 00003',
    poBox: '487770',
    city: 'Dubai',
    country: 'UAE',
    phone: '+971 55 551 10 18',
    email: 'info@TME-Services.com',
    website: 'www.TME-Services.com',
    stampPath: '/stamps/cit-letters/TME.jpeg'
  }
};

/**
 * Get company details based on registered authority
 */
export function getCompanyDetailsByAuthority(authority: string): CompanyDetails {
  const companyType = AUTHORITY_TO_COMPANY_TYPE[authority];
  
  if (companyType) {
    return COMPANY_DETAILS[companyType];
  }
  
  // Default fallback to FZCO
  return COMPANY_DETAILS.FZCO;
}

/**
 * Get company type based on registered authority
 */
export function getCompanyTypeByAuthority(authority: string): CompanyDetails['type'] {
  return AUTHORITY_TO_COMPANY_TYPE[authority] || 'FZCO';
}