// Main exports for PDF generator
// This maintains backward compatibility with the existing API
export { 
  generatePDF, 
  generatePDFWithFilename,
  generateFamilyVisaPDF,
  generateFamilyVisaPDFWithFilename,
  hasFamilyVisas
} from './generator';

// PDF component exports (for advanced usage)
export * from './components';

// Utility functions
export * from './utils';

// Type definitions
export * from './types';

// NEW: Phase 3 Branding System ✅
export * from './branding';

// Re-export types for convenience
export type { OfferData } from '@/types/offer'; 