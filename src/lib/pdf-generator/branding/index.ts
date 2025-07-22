// PDF Branding System - Central exports and utilities
export { TME_FZCO_CONFIG } from './TME_FZCO_CONFIG';
export { MANAGEMENT_CONSULTANTS_CONFIG } from './MANAGEMENT_CONSULTANTS_CONFIG';
export type { BrandingConfig } from './TME_FZCO_CONFIG';

import { TME_FZCO_CONFIG } from './TME_FZCO_CONFIG';
import { MANAGEMENT_CONSULTANTS_CONFIG } from './MANAGEMENT_CONSULTANTS_CONFIG';
import type { BrandingConfig } from './TME_FZCO_CONFIG';

// Registry of all available branding configurations
export const BRANDING_CONFIGS: BrandingConfig[] = [
  TME_FZCO_CONFIG,
  MANAGEMENT_CONSULTANTS_CONFIG
];

// Get branding configuration by authority
export const getBrandingByAuthority = (authority: string): BrandingConfig => {
  // Find the branding config that supports this authority
  const config = BRANDING_CONFIGS.find(brand => 
    brand.applicableAuthorities.includes(authority)
  );
  
  // Return the matching config or default to TME Services FZCO
  return config || TME_FZCO_CONFIG;
};

// Get branding configuration by ID
export const getBrandingById = (id: 'tme-fzco' | 'management-consultants'): BrandingConfig => {
  const config = BRANDING_CONFIGS.find(brand => brand.id === id);
  return config || TME_FZCO_CONFIG;
};

// Get all available branding options for company selection
export const getAllBrandingOptions = () => {
  return BRANDING_CONFIGS.map(config => ({
    id: config.id,
    name: config.companyName,
    legalName: config.legalName,
    authorities: config.applicableAuthorities
  }));
};

// Compatibility layer for existing getFooterInfo function
export const getFooterInfoFromBranding = (authority: string) => {
  const branding = getBrandingByAuthority(authority);
  return {
    companyName: branding.footer.companyName,
    address: branding.footer.address
  };
}; 