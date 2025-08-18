# Deployment Changes - August 18, 2025

## Summary of Changes

### 1. Accounting Services Description Update
- **File**: `src/lib/pdf-generator/utils/additionalServiceDescriptions.ts`
- **Change**: Updated accounting transaction limits to show "per year" format:
  - Yearly: 360 transactions per year
  - Quarterly: 360 transactions per year  
  - Monthly: 1200 transactions per year

### 2. Yearly Running Costs Intro Text Fix
- **File**: `src/lib/pdf-generator/components/cost-overview/pages/YearlyRunningPage.tsx`
- **Change**: Fixed spelling from "licence" to "license"

### 3. Secondary Currency Formatting Fixes
- **Files Modified**:
  - `src/lib/pdf-generator/components/cost-overview/pages/CompleteCostOverviewPage.tsx`
  - `src/lib/pdf-generator/components/cost-overview/FamilyVisaDocument.tsx`
  - `src/lib/pdf-generator/components/cost-overview/breakdowns/IndividualVisaBreakdownPage.tsx`
  - `src/lib/pdf-generator/components/cost-overview/breakdowns/IndividualChildVisaBreakdownPage.tsx`
  - `src/lib/pdf-generator/components/shared/SimpleFormTable.tsx`
- **Change**: Fixed secondary currency (EUR/USD/GBP) to display without decimals using `formatSecondaryCurrency()`

### 4. Dynamic Secondary Currency Support
- **File**: `src/lib/pdf-generator/components/shared/SimpleFormTable.tsx`
- **Change**: Replaced hardcoded "USD" with dynamic currency from `data.clientDetails.secondaryCurrency`

### 5. Payroll Services UI Reorganization
- **Files Modified**:
  - `src/components/company-services/ui/CommercialServiceCard.tsx` - Removed payroll services
  - `src/components/company-services/sections/AccountingServicesSection.tsx` - Added payroll services section
- **Change**: Moved payroll services from CommercialServiceCard to AccountingServicesSection (above commercial services)

### 6. Audit Guiding Fee Description
- **File**: `src/components/company-services/utils/accountingServiceConfig.ts`
- **Change**: Simplified description to only first sentence, removed pricing details

### 7. PDF Payroll Services Reorganization
- **Files Modified**:
  - `src/lib/pdf-generator/components/company-services/pages/CommercialServicesPage.tsx` - Removed payroll
  - `src/lib/pdf-generator/components/company-services/sections/AccountingServicesSection.tsx` - Added for monthly
  - `src/lib/pdf-generator/components/company-services/sections/AnnualAccountingServicesSection.tsx` - Added for quarterly/yearly
- **Change**: 
  - For monthly accounting: Payroll appears after Annual Accounting on same page
  - For quarterly/yearly: Payroll appears on second page with Annual Accounting

### 8. Quarterly/Yearly Accounting Table Compactness
- **File**: `src/lib/pdf-generator/components/company-services/ui/AccountingPricingTable.tsx`
- **Change**: Reduced row heights by 30% (padding from 4→3, vertical padding from 4→3)

### 9. Section Heading Consistency
- **File**: `src/lib/pdf-generator/components/company-services/sections/AccountingServicesSection.tsx`
- **Change**: Annual Accounting Services and Payroll Services now use consistent `styles.sectionTitle` (bold blue)

## Files Changed
Total files modified: 15

## Deployment Method
Using Fast Deploy method (22MB tar file) as these are only code changes, no package.json modifications.

## Testing Recommendations
1. Test monthly accounting PDF generation
2. Test quarterly/yearly accounting PDF generation  
3. Verify payroll services appears in correct location for both
4. Check secondary currency formatting across all PDFs
5. Verify UI changes in company services section