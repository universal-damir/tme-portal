// Shared PDF Components - Used across all document types
//
// This directory contains reusable components that are used by multiple
// document types (cost-overview, golden-visa, company-services, etc.)
//
// Guidelines for adding components here:
// 1. Component must be used by 2+ document types
// 2. Component should have no document-specific business logic
// 3. Component should be generic enough for future document types
// 4. Follow existing naming conventions (Component suffix)
//
// Categories:
// - Layout: Header, Footer, Signature sections
// - Content: Tables, forms, selectors  
// - Utility: Base templates, formatting helpers
//
// When NOT to add here:
// - Document-specific components (belongs in document-type directory)
// - One-off components (consider if it will be reused)
// - Business logic components (should be in utils or specific directory)

// Reusable layout components
export { HeaderComponent } from './HeaderComponent';
export { FooterComponent } from './FooterComponent';
export { SignatureSection } from './SignatureSection';
export { IntroSection } from './IntroSection';

// Reusable content components
export { BaseTemplate } from './BaseTemplate';
export { SimpleFormTable } from './SimpleFormTable';
export { CompanySelector } from './CompanySelector';
export { CostTable } from './CostTable';
export { CompactCostTable } from './CompactCostTable';

// Export types
export type { BaseTemplateProps, BaseTemplateSection } from './BaseTemplate';
export type { SimpleFormItem, SimpleFormTableProps } from './SimpleFormTable';
export type { CompanySelectorProps } from './CompanySelector'; 