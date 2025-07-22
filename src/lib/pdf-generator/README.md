# PDF Generator - Component Organization

## Overview

The PDF generator has been refactored from a flat structure to a feature-based organization that supports multiple document types. This makes it easier to maintain existing documents and add new ones.

## Current Structure

```
src/lib/pdf-generator/
├── components/
│   ├── shared/           # 9 components - Reusable across all document types
│   ├── cost-overview/    # 12 components - Cost breakdown documents
│   ├── golden-visa/      # 1 component - Golden visa applications  
│   └── index.ts         # Main barrel export (11 lines, optimized)
├── utils/               # Document generators and utilities
├── styles/              # PDF styling utilities
└── README.md           # This documentation
```

### Component Categories

#### Shared Components (9 components)
- **Layout**: HeaderComponent, FooterComponent, SignatureSection, IntroSection
- **Content**: BaseTemplate, SimpleFormTable, CompanySelector, CostTable, CompactCostTable
- **Usage**: Used by 2+ document types, no document-specific business logic

#### Cost Overview Components (12 components)
- **Main Documents**: OfferDocument, FamilyVisaDocument
- **Pages**: CoverPage, InitialSetupPage, VisaCostsPage, AdditionalServicesPage, YearlyRunningPage, SummaryPage
- **Sections**: Various specialized sections (ClientInfoSection, AuthorityInfoSection, etc.)
- **Breakdowns**: IndividualVisaBreakdownPage, IndividualChildVisaBreakdownPage

#### Golden Visa Components (1 component)
- **Main Document**: GoldenVisaDocument

## Adding New Document Types

### Step-by-Step Guide

Follow this process to add new document types like Company Services, Taxation, Corporate Changes, etc.

#### 1. Create Directory Structure

```bash
# Example: Adding Company Services tab
mkdir src/lib/pdf-generator/components/company-services
mkdir src/lib/pdf-generator/components/company-services/pages
mkdir src/lib/pdf-generator/components/company-services/sections
# Optional subdirectories as needed:
# mkdir src/lib/pdf-generator/components/company-services/breakdowns
# mkdir src/lib/pdf-generator/components/company-services/ui
```

#### 2. Create Main Document Component

Create the primary document component that will be exported to the generator:

```tsx
// src/lib/pdf-generator/components/company-services/CompanyServicesDocument.tsx
import React from 'react';
import { BaseTemplate, HeaderComponent, FooterComponent } from '../shared';
import { ServicesCoverPage, ServiceBreakdownPage } from './pages';

interface CompanyServicesDocumentProps {
  // Define your document props
  companyInfo: any;
  services: any[];
  // ... other props
}

export function CompanyServicesDocument({ 
  companyInfo, 
  services 
}: CompanyServicesDocumentProps) {
  return (
    <BaseTemplate>
      <HeaderComponent />
      <ServicesCoverPage companyInfo={companyInfo} />
      <ServiceBreakdownPage services={services} />
      <FooterComponent />
    </BaseTemplate>
  );
}
```

#### 3. Create Page Components

Organize complex documents into logical pages:

```tsx
// src/lib/pdf-generator/components/company-services/pages/ServicesCoverPage.tsx
import React from 'react';

export function ServicesCoverPage({ companyInfo }: any) {
  return (
    <div className="page">
      <h1>Company Services Proposal</h1>
      <p>Company: {companyInfo.name}</p>
      {/* Cover page content */}
    </div>
  );
}

// src/lib/pdf-generator/components/company-services/pages/index.ts
export { ServicesCoverPage } from './ServicesCoverPage';
export { ServiceBreakdownPage } from './ServiceBreakdownPage';
// ... other page exports
```

#### 4. Create Section Components

Create reusable sections that can be used across pages:

```tsx
// src/lib/pdf-generator/components/company-services/sections/ServiceDetailsSection.tsx
import React from 'react';

export function ServiceDetailsSection({ services }: any) {
  return (
    <section>
      <h2>Service Details</h2>
      {services.map((service: any) => (
        <div key={service.id}>
          <h3>{service.name}</h3>
          <p>{service.description}</p>
        </div>
      ))}
    </section>
  );
}

// src/lib/pdf-generator/components/company-services/sections/index.ts  
export { ServiceDetailsSection } from './ServiceDetailsSection';
export { PricingSection } from './PricingSection';
// ... other section exports
```

#### 5. Create Document-Type Barrel Export

```tsx
// src/lib/pdf-generator/components/company-services/index.ts

// Company Services PDF Components  
//
// This directory contains components specific to company services documents.
// Follow the same structure pattern as cost-overview for consistency.

// Main document components
export { CompanyServicesDocument } from './CompanyServicesDocument';

// Page components
export * from './pages';

// Section components
export * from './sections';

// Additional exports as needed
// export * from './breakdowns';
// export * from './ui';
```

#### 6. Update Main Components Export

Add your new document type to the main barrel export:

```tsx
// src/lib/pdf-generator/components/index.ts

// Add this line:
export * from './company-services';
```

#### 7. Create Generator Utility (if needed)

If your document needs special generation logic:

```tsx
// src/lib/pdf-generator/utils/companyServicesGenerator.ts
import { CompanyServicesDocument } from '../components';

export async function generateCompanyServicesDocument(data: any) {
  // Document generation logic
  return CompanyServicesDocument;
}
```

#### 8. Update Tab Component

Connect your new document to the UI:

```tsx
// src/components/portal/tabs/CompanyServicesTab.tsx  
import { generatePDF } from '@/lib/pdf-generator';
import { CompanyServicesDocument } from '@/lib/pdf-generator/components';

export function CompanyServicesTab() {
  const handleGeneratePDF = async () => {
    await generatePDF({
      filename: 'company-services-proposal.pdf',
      component: CompanyServicesDocument,
      props: { /* your props */ }
    });
  };

  return (
    <div>
      {/* Your tab UI */}
      <button onClick={handleGeneratePDF}>Generate PDF</button>
    </div>
  );
}
```

### Example Structures for Specific Tabs

#### Company Services Tab
```
company-services/
├── CompanyServicesDocument.tsx       # Main document
├── pages/
│   ├── ServicesCoverPage.tsx        # Cover page
│   ├── ServiceBreakdownPage.tsx     # Service details and pricing
│   ├── TermsAndConditionsPage.tsx   # Terms page
│   └── index.ts
├── sections/
│   ├── ServiceDetailsSection.tsx    # Individual service details
│   ├── PricingSection.tsx          # Pricing breakdown
│   ├── TimelineSection.tsx         # Project timeline
│   └── index.ts
└── index.ts
```

#### Taxation Tab
```
taxation/
├── TaxationDocument.tsx             # Main document
├── pages/
│   ├── TaxCoverPage.tsx            # Cover page
│   ├── TaxBreakdownPage.tsx        # Tax calculations
│   ├── ComplianceRequirementsPage.tsx
│   └── index.ts
├── sections/
│   ├── TaxCalculationSection.tsx    # Tax calculations
│   ├── ComplianceSection.tsx        # Compliance requirements
│   ├── DeadlinesSection.tsx         # Important dates
│   └── index.ts
└── index.ts
```

#### Corporate Changes Tab  
```
corporate-changes/
├── CorporateChangesDocument.tsx     # Main document
├── pages/
│   ├── ChangesCoverPage.tsx        # Cover page
│   ├── ChangesBreakdownPage.tsx    # Details of changes
│   ├── RequiredDocumentsPage.tsx   # Required documentation
│   └── index.ts
├── sections/
│   ├── ChangeDetailsSection.tsx     # Change specifications
│   ├── TimelineSection.tsx          # Process timeline
│   ├── CostBreakdownSection.tsx     # Associated costs
│   └── index.ts
└── index.ts
```

## Best Practices

### When to Use Shared Components
- **DO**: Components used by 2+ document types
- **DO**: Generic layout and formatting components
- **DON'T**: Document-specific business logic
- **DON'T**: One-off components (unless planned for reuse)

### Naming Conventions
- **Documents**: `[DocumentType]Document.tsx` (e.g., `CompanyServicesDocument.tsx`)
- **Pages**: `[Purpose]Page.tsx` (e.g., `ServicesCoverPage.tsx`)
- **Sections**: `[Purpose]Section.tsx` (e.g., `ServiceDetailsSection.tsx`)
- **Directories**: `kebab-case` (e.g., `company-services`, `corporate-changes`)

### Import/Export Patterns
- Always use barrel exports (`index.ts`) in each directory
- Use `export *` for clean re-exports when possible
- Import from the barrel: `import { Component } from '@/lib/pdf-generator/components'`
- Document-specific imports: `import { Component } from '@/lib/pdf-generator/components/document-type'`

### Code Organization Guidelines
1. **Start Simple**: Create main document first, then break into pages/sections
2. **Extract When Needed**: Don't over-engineer initially, refactor as complexity grows
3. **Follow Patterns**: Use cost-overview structure as a template
4. **Document Intent**: Add comments explaining document-specific business logic
5. **Test Integration**: Verify PDF generation works end-to-end


