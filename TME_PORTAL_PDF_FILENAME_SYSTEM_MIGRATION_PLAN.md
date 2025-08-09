# TME Portal v5.2 - PDF Filename System Migration Plan

## Executive Summary

Successfully implemented Company Services filename format migration from hyphen-separated services (`CIT-VAT-ACC`) to space-separated services (`CIT VAT ACC PRO COMPL`). This plan documents the proven approach for implementing filename changes across all document types.

## ✅ Company Services Implementation - COMPLETED

**Successfully Changed Format:**
- **From**: `250809 FZCO Smith John ACME TME Services CIT-VAT-ACC.pdf`
- **To**: `250809 Smith John FZCO CIT VAT ACC PRO COMPL.pdf`

**Key Implementation Steps:**
1. Updated `CompanyServicesFilenameGenerator.buildServicesComponent()` to use spaces instead of hyphens
2. Enabled new format with `enableNewFormat: true` in config
3. **CRITICAL**: Updated ALL import references to use `FilenameIntegrations` instead of legacy functions

### 🚨 Critical Lesson: Import References Must Be Updated

**The Problem**: Changing filename generators is only half the solution. All components must import from the new integration system.

**Files Updated for Company Services:**
- `src/lib/pdf-generator/utils/companyServicesGenerator.ts`
- `src/components/portal/tabs/CompanyServicesTab.tsx`
- `src/components/review-system/modals/ReviewModal.tsx`
- `src/components/review-system/modals/FeedbackModal.tsx`
- `src/lib/services/review-system.ts`
- `src/hooks/useCompanyServicesApplication.ts`
- `src/app/api/applications/[id]/review/route.ts`
- `src/app/api/applications/[id]/submit-review/route.ts`

**Import Pattern Changes:**
```typescript
// CHANGE FROM:
import { generateCompanyServicesFilename } from './companyServicesDataTransformer';
// CHANGE TO:
import { generateCompanyServicesFilename } from '../integrations/FilenameIntegrations';
```

## 🎯 Remaining Document Types Implementation Plan

### Phase 1: Golden Visa (Low Risk)
**Target Format**: `250809 MGT Smith John Golden Property.pdf`

**Changes Needed:**
- Add MGT prefix detection
- Simplify visa type names (Property/Deposit/Skilled)
- Remove "Visa" word from template
- Update import references in Golden Visa components

### Phase 2: Cost Overview (Medium Risk)  
**Target Format**: `250809 FZCO Smith John ACME Setup IFZA 1 2 2 1 1 AED EUR.pdf`

**Changes Needed:**
- Add FZCO/MGT prefix logic
- Add CompanyShortName after FirstName
- Enhance name logic for "Address to company" scenarios
- Update import references in Cost Overview components

### Phase 3: Taxation (Already Complete)
**Current Format**: `250809 FZCO ACME CIT Disclaimer 31.12.2025.pdf`
✅ **No changes needed - already matches requirements**

## 📋 Implementation Checklist for Each Document Type

### Step 1: Update Filename Generator Logic
- [ ] Modify document-specific generator in `DocumentSpecificFilenames.ts`
- [ ] Enable new format in `filename-config.ts`

### Step 2: Find ALL Import References
```bash
# Search for legacy imports (example for Golden Visa)
grep -r "generateGoldenVisaFilename.*goldenVisaDataTransformer" src/
grep -r "generateGoldenVisaPDFWithFilename.*goldenVisaGenerator" src/
```

### Step 3: Update Import References
For each document type, update imports in:
- Generator utilities (`src/lib/pdf-generator/utils/`)
- Tab components (`src/components/portal/tabs/`)
- Review modals (`src/components/review-system/modals/`)
- Application hooks (`src/hooks/`)
- API routes (`src/app/api/applications/`)
- Review system service (`src/lib/services/review-system.ts`)

### Step 4: Test All Integration Points
- [ ] PDF generation shows new filename
- [ ] Review/Approval modals show new filename
- [ ] Notifications show new filename
- [ ] Todo lists show new filename
- [ ] Email subjects use new filename
- [ ] Activity logs use new filename

## 🛡️ Safety Mechanisms

### Built-in Protection
- **Hybrid Generation**: Automatic fallback to legacy format if new format fails
- **Feature Flags**: `enableNewFormat` flag allows instant rollback
- **Import Integration**: Once imports are updated, ALL integration points automatically use new format

### Testing Strategy
1. **Update generator logic first**
2. **Test PDF generation** (should show new format)
3. **If modals still show old format** → Check import references
4. **Update ALL imports** systematically
5. **Verify all integration points** show consistent new format

## 🔍 Verification Commands

```bash
# Find files still using legacy imports
grep -r "companyServicesDataTransformer" src/
grep -r "goldenVisaDataTransformer" src/
grep -r "taxationDataTransformer" src/

# Each result needs import updated to use FilenameIntegrations
```

## 📊 Implementation Priority

**Recommended Order:**
1. ✅ **Company Services** - COMPLETED
2. **Taxation** - No changes needed
3. **Golden Visa** - Low complexity, mostly mapping updates
4. **Cost Overview** - Highest complexity, requires new logic

## 🎯 Key Success Factors

1. **Update filename generators** in `DocumentSpecificFilenames.ts`
2. **Enable new format** in `filename-config.ts`
3. **CRITICALLY IMPORTANT**: Update ALL import references throughout codebase
4. **Test systematically** - if any integration point shows old format, find and update missing import
5. **Use grep commands** to ensure no legacy imports remain

## 📝 Lessons Learned from Company Services

- Changing generator logic alone is insufficient
- All integration points must import from `FilenameIntegrations`
- Review modals had hardcoded logic that needed to be replaced with actual generator calls
- Systematic search and replacement of import references is essential
- Once imports are updated correctly, all integration points automatically reflect new format

This streamlined approach ensures successful filename format migration based on proven implementation experience.