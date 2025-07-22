// Taxation PDF Components  
//
// This directory contains components specific to taxation documents.
// Follow the same structure pattern as cost-overview for consistency.

// Main document components
export { TaxationDocument } from './TaxationDocument';

// Page components
export { TaxationCoverPage, DisclaimerPage, CITShareholderDeclarationPage } from './pages';

// Section components (avoid conflicts with other modules)
export { ClientDetailsSection as TaxationClientDetailsSection } from './sections';

// UI components
export * from './ui'; 