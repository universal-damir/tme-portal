// Cost Overview PDF Components
//
// This directory demonstrates the recommended structure for document-type
// specific components. Use this as a template when creating new document types.
//
// Recommended structure for any document type:
// - [DocumentType]Document.tsx: Main document component(s)
// - pages/: Full-page components that make up the document
// - sections/: Reusable sections within pages
// - breakdowns/: Specialized breakdown/detail components (if needed)
// - ui/: Small UI components specific to this document type (if needed)
// - utils/: Document-specific utilities (if needed)
// - index.ts: Barrel export for the entire document type
//
// Example for Company Services:
// company-services/
// ├── CompanyServicesDocument.tsx
// ├── pages/
// │   ├── ServicesCoverPage.tsx
// │   ├── ServiceBreakdownPage.tsx
// │   └── index.ts
// ├── sections/
// │   ├── ServiceDetailsSection.tsx
// │   ├── PricingSection.tsx
// │   └── index.ts
// └── index.ts

// Main document components
export { OfferDocument } from './OfferDocument';
export { FamilyVisaDocument } from './FamilyVisaDocument';

// Page components
export * from './pages';

// Section components  
export * from './sections';

// Breakdown components
export * from './breakdowns'; 