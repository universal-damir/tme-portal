# Authority Configuration System

This directory contains the new authority configuration system that allows easy addition of new authorities without modifying the core business logic.

## Architecture Overview

```
authorities/
├── types.ts              # TypeScript interfaces for authority configuration
├── registry.ts           # Central registry for all authorities
├── cost-calculator.ts    # Core cost calculation engine
├── ifza.ts              # IFZA authority configuration
├── det.ts               # DET authority configuration (placeholder)
└── README.md            # This documentation
```

## Key Features

- **Configuration-Driven**: Each authority is defined by a configuration object
- **Standardized Calculations**: Same calculation logic across all authorities
- **Easy Extension**: Add new authorities by creating configuration files
- **Type Safety**: Full TypeScript support with strict typing
- **Separation of Concerns**: Business logic separated from UI logic

## Usage Example

```typescript
import { getAuthorityConfigByName, CostCalculator } from '@/lib/authorities';

// Get authority configuration
const config = getAuthorityConfigByName('International Free Zone Authority (IFZA)');

if (config) {
  // Create calculator for this authority
  const calculator = new CostCalculator(config);
  
  // Calculate costs based on form data
  const costSummary = calculator.calculateCostSummary(offerData);
  
  console.log('Initial Setup Total:', costSummary.initialSetup.total);
  console.log('Visa Costs Total:', costSummary.visaCosts.total);
  console.log('Yearly Running Total:', costSummary.yearlyRunning.total);
}
```

## Adding a New Authority

1. Create a new configuration file (e.g., `new-authority.ts`)
2. Define the authority configuration following the `AuthorityConfig` interface
3. Add the configuration to the registry in `registry.ts`
4. Test the configuration with the cost calculator

### Example Configuration

```typescript
import { AuthorityConfig } from './types';

export const NEW_AUTHORITY_CONFIG: AuthorityConfig = {
  id: 'new-authority',
  name: 'New Authority Name',
  displayName: 'NAF',
  areaInUAE: 'Specific Area',
  legalEntity: 'LLC Structure',
  
  initialSetup: {
    baseLicenseFee: 15000,
    visaQuotaCost: 2500,
    registrationFee: 2500,
    crossBorderLicense: 3000,
    mofaTranslations: {
      ownersDeclaration: 2500,
      certificateOfIncorporation: 2500,
      // ... other translations
    },
    defaultTmeServicesFee: 10000,
  },
  
  visaCosts: {
    standardVisaFee: 5500,
    reducedVisaFee: 1500,
    tmeVisaServiceFee: 3500,
    healthInsurance: {
      lowCost: 1000,
      silverPackage: 6000,
    },
  },
  
  yearlyRunning: {
    baseLicenseRenewal: 15000,
    visaQuotaRenewalCost: 2500,
    tmeYearlyFee: 3500,
  },
  
  features: {
    hasVisaQuota: true,
    hasCrossBorderLicense: true,
    hasInvestorVisas: false,
    hasThirdPartyApproval: true,
    hasOfficeRental: false,
    supportsVipStamping: true,
    supportsVisaStatusChange: true,
  },
};
```

## Configuration Fields Explained

### `initialSetup`
- `baseLicenseFee`: Base cost for the authority license
- `visaQuotaCost`: Cost per visa in the quota (optional)
- `registrationFee`: One-time registration fee when visas are included
- `crossBorderLicense`: Cost for cross-border license feature
- `mofaTranslations`: Costs for various MoFA document translations
- `defaultTmeServicesFee`: Default TME services fee for this authority

### `visaCosts`
- `standardVisaFee`: Standard government fee per visa
- `reducedVisaFee`: Reduced government fee for special programs
- `tmeVisaServiceFee`: TME service fee per visa
- `investorVisaFee`: Additional fee for investor visas
- `statusChangeFee`: Fee for visa status changes
- `vipStampingFee`: Fee for VIP stamping service
- `healthInsurance`: Health insurance cost options

### `yearlyRunning`
- `baseLicenseRenewal`: Annual license renewal cost
- `visaQuotaRenewalCost`: Annual cost per visa in quota
- `crossBorderRenewal`: Annual cross-border license renewal
- `immigrationRenewalFee`: Annual immigration establishment card renewal
- `tmeYearlyFee`: Annual TME services fee

### `features`
Boolean flags that control which features are available for this authority:
- `hasVisaQuota`: Authority supports visa quota system
- `hasCrossBorderLicense`: Authority offers cross-border licenses
- `hasInvestorVisas`: Authority supports investor visa programs
- `hasThirdPartyApproval`: Authority requires third-party approvals
- `hasOfficeRental`: Authority offers office rental services
- `supportsVipStamping`: Authority supports VIP stamping
- `supportsVisaStatusChange`: Authority supports visa status changes

## Cost Calculation Logic

The `CostCalculator` class provides three main calculation methods:

1. **`calculateInitialSetupCosts()`**: One-time setup costs
2. **`calculateVisaCosts()`**: Visa-related costs for 2-year visas
3. **`calculateYearlyRunningCosts()`**: Annual recurring costs

Each method returns a detailed breakdown of costs that can be used for display and reporting.

## Benefits

- **Maintainability**: Easy to modify costs without touching business logic
- **Scalability**: Add new authorities without modifying existing code
- **Consistency**: Same calculation logic ensures consistent behavior
- **Testability**: Configuration can be easily tested in isolation
- **Flexibility**: Features can be enabled/disabled per authority 