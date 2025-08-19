import { getBrandingById } from '../../../branding';
import type { BrandingConfig } from '../../../branding';

/**
 * Maps invoice issuing company codes to branding configurations
 * FZCO → tme-fzco, MGT/DET → management-consultants, DMCC → dmcc
 */
export const getBrandingForInvoice = (issuingCompany: string): BrandingConfig => {
  // Map issuing company codes to branding configurations
  switch (issuingCompany?.toUpperCase()) {
    case 'FZCO':
    case 'IFZA':
      return getBrandingById('tme-fzco');
    case 'DET':
    case 'MGT':
    case 'MANAGEMENT':
      return getBrandingById('management-consultants');
    case 'DMCC':
      return getBrandingById('dmcc');
    default:
      // Default to FZCO if not specified
      return getBrandingById('tme-fzco');
  }
};