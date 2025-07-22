// PDF Component exports
// Organized by feature/document type for maintainability and scalability
//
// This barrel export provides a clean API for accessing all PDF components
// while maintaining the internal organization by document type.
//
// Structure:
// - shared/: Reusable components used across all document types
// - cost-overview/: Components specific to cost overview documents  
// - golden-visa/: Components specific to golden visa documents
// - [future]: company-services/, taxation/, corporate-changes/ etc.
//
// To add a new document type:
// 1. Create new directory: mkdir src/lib/pdf-generator/components/new-tab/
// 2. Add components and barrel export: new-tab/index.ts
// 3. Add export here: export * from './new-tab';
// 4. Update main generator and utils as needed
//
// Example for Company Services tab:
// export * from './company-services';

// Shared components ✅
// Reusable across all document types (headers, footers, tables, etc.)
export * from './shared';

// Cost Overview components ✅  
// Complete document family for cost breakdown and offers
export * from './cost-overview';

// Golden Visa components ✅
// Specialized documents for golden visa applications
export * from './golden-visa';

// Company Services components ✅
// Complete document family for company services
export * from './company-services';

// Taxation components ✅
// Tax disclaimers and related documents
export * from './taxation'; 