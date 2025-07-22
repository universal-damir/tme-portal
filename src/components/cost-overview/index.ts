// Main component exports - now using the refactored version as the primary component

// Section component exports
export { ClientDetailsSection } from './sections/ClientDetailsSection';
export { AuthorityInfoSection } from './sections/AuthorityInfoSection';
export { ActivityCodesSection } from './sections/ActivityCodesSection';
export { LicenseFeesSection } from './sections/LicenseFeesSection';
export { VisaCostsSection } from './sections/VisaCostsSection';
export { CostSummarySection } from './sections/CostSummarySection';
export { AdditionalServicesSection } from './sections/AdditionalServicesSection';

// UI component exports
export { FormSection } from './ui/FormSection';
export { CostInputField } from './ui/CostInputField';
export { SectionWithStickySummary } from './ui/SectionWithStickySummary';

// Hook exports
export { useFormattedInputs } from './hooks/useFormattedInputs';
export { useAuthorityConfig } from './hooks/useAuthorityConfig';
export { useCostCalculation } from './hooks/useCostCalculation';

// Type exports
export type { FormattedInputState, FormattedInputHandlers } from './hooks/useFormattedInputs'; 