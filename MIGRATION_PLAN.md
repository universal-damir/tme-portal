# TME Portal v5.1 - Multi-Tab Migration Plan

## Overview
Migrate from single Cost Overview page to multi-tab portal system with independent forms:
- **Cost Overview** (Current - Complex)
- **Golden Visa** (New - Simple)
- **Company Services** (New - Simple) 
- **Corporate Changes** (New - Simple)
- **Taxation** (New - Simple)

## Architecture Decisions ✅
- ✅ Independent forms per tab (no cross-dependencies)
- ✅ Shared basic client info (name, company, date)
- ✅ Individual PDF generation per tab
- ✅ Consistent branding with company variants (TME FZCO vs Management Consultants)
- ✅ All tabs available to all users (no permissions for now)
- ✅ Lazy loading for performance
- ✅ Auto-save per tab using localStorage

---

## Phase 1: Foundation & Portal Shell 🏗️

### 1.1 Create Portal Structure
vclear
- [x] Create `src/components/portal/` directory
- [x] Create `src/components/portal/index.tsx` - Main portal container
- [x] Create `src/components/portal/navigation/` directory
- [x] Create `src/components/portal/navigation/TabNavigation.tsx`
- [x] Create `src/components/portal/navigation/TabButton.tsx`
- [x] Create `src/components/portal/tabs/` directory

### 1.2 Shared Client Context
- [x] Create `src/contexts/SharedClientContext.tsx`
- [x] Define `SharedClientInfo` interface
- [x] Implement context provider with auto-save
- [x] Create `useSharedClient` hook

### 1.3 Tab Management System
- [x] Create `src/types/portal.ts` with tab definitions
- [x] Create `src/hooks/useTabNavigation.tsx`
- [x] Implement tab state management
- [x] Add URL routing for tabs
- [x] Create tab lazy loading setup

### 1.4 Update Main App Structure
- [x] Update `src/app/page.tsx` to use Portal component
- [x] Test navigation structure
- [x] Ensure responsive design works

---

## Phase 2: Migrate Cost Overview 📋

### 2.1 Move Current Implementation
- [x] Create `src/components/portal/tabs/CostOverviewTab.tsx`
- [x] Move current `cost-overview.tsx` logic into tab component
- [x] Update imports and paths
- [x] Integrate with shared client context

### 2.2 Adapt for Tab System
- [x] Remove standalone page wrapper
- [x] Update PDF generation to use tab context
- [x] Test all existing functionality
- [x] Ensure form validation works
- [x] Test PDF generation


---

## Phase 3: PDF System Enhancement 📄

### 3.1 Company Branding System
- [x] Create `src/lib/pdf-generator/branding/` directory
- [x] Create `TME_FZCO_CONFIG.ts` with header/footer
- [x] Create `MANAGEMENT_CONSULTANTS_CONFIG.ts` with header/footer
- [x] Update PDF templates to use branding configs
- [x] Create company selection interface

### 3.2 Template Consistency
- [x] Create shared PDF layout components
- [x] Update existing Cost Overview PDF to use new branding
- [x] Create base template for simple forms
- [x] Test PDF generation with both company brands

---

## Phase 4: Simple Tab Implementation 📝

### 4.1 Golden Visa Tab ✅
- [x] Create `src/components/portal/tabs/GoldenVisaTab.tsx`
- [x] Create `src/types/golden-visa.ts`
- [x] Create form with input fields
- [x] Implement form validation
- [x] Create PDF template for Golden Visa
- [x] Test complete flow

### 4.2 Company Services Tab
- [ ] Create `src/components/portal/tabs/CompanyServicesTab.tsx`
- [ ] Create `src/types/company-services.ts`
- [ ] Create simple form with few input fields
- [ ] Implement form validation
- [ ] Create PDF template for Company Services
- [ ] Test complete flow

### 4.3 Corporate Changes Tab
- [ ] Create `src/components/portal/tabs/CorporateChangesTab.tsx`
- [ ] Create `src/types/corporate-changes.ts`
- [ ] Create simple form with few input fields
- [ ] Implement form validation
- [ ] Create PDF template for Corporate Changes
- [ ] Test complete flow

### 4.4 Taxation Tab
- [ ] Create `src/components/portal/tabs/TaxationTab.tsx`
- [ ] Create `src/types/taxation.ts`
- [ ] Create simple form with few input fields
- [ ] Implement form validation
- [ ] Create PDF template for Taxation
- [ ] Test complete flow

---

## Phase 5: Integration & Polish ✨

### 5.1 Navigation Enhancement
- [ ] Add visual completion indicators per tab
- [ ] Implement active tab highlighting
- [ ] Add mobile-responsive tab navigation
- [ ] Create tab overflow handling for mobile
- [ ] Add keyboard navigation support

### 5.2 User Experience
- [ ] Add loading states for tab switching
- [ ] Implement error boundaries per tab
- [ ] Add success messages after PDF generation
- [ ] Create help tooltips for complex fields
- [ ] Add form dirty state indicators

### 5.3 Performance Optimization
- [ ] Implement proper lazy loading
- [ ] Add React.memo for expensive components
- [ ] Optimize auto-save debouncing
- [ ] Add service worker for offline functionality (optional)

### 5.4 Testing & Quality Assurance
- [ ] Unit tests for new components
- [ ] Integration tests for tab navigation
- [ ] PDF generation tests for all tabs
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Performance testing with large forms

---

## Phase 6: Deployment & Cleanup 🚀

### 6.1 Final Integration
- [ ] Remove old `cost-overview.tsx` file
- [ ] Update all imports throughout codebase
- [ ] Clean up unused components
- [ ] Update documentation

### 6.2 Deployment Preparation
- [ ] Update build scripts if needed
- [ ] Test production build
- [ ] Prepare rollback plan
- [ ] Create deployment checklist

### 6.3 Post-Deployment
- [ ] Monitor for errors
- [ ] Gather user feedback
- [ ] Performance monitoring
- [ ] Plan future enhancements

---

## Technical Implementation Notes

### Folder Structure After Migration
```
src/
  components/
    portal/
      index.tsx                 # Main portal component
      navigation/
        TabNavigation.tsx       # Tab navigation bar
        TabButton.tsx          # Individual tab button
      tabs/
        CostOverviewTab.tsx    # Migrated current functionality
        GoldenVisaTab.tsx      # New simple form
        CompanyServicesTab.tsx # New simple form
        CorporateChangesTab.tsx# New simple form
        TaxationTab.tsx        # New simple form
    shared/                    # Shared components across tabs
      ClientInfoSection.tsx    # Reusable client info form
  contexts/
    SharedClientContext.tsx    # Shared client information
  hooks/
    useTabNavigation.tsx       # Tab state management
    useTabAutoSave.tsx        # Auto-save functionality
  types/
    portal.ts                 # Portal-specific types
    golden-visa.ts           # Golden visa form types
    company-services.ts      # Company services form types
    corporate-changes.ts     # Corporate changes form types
    taxation.ts             # Taxation form types
  lib/
    pdf-generator/
      branding/
        TME_FZCO_CONFIG.ts
        MANAGEMENT_CONSULTANTS_CONFIG.ts
```

### Key Implementation Strategies
1. **Progressive Enhancement**: Each phase builds on the previous
2. **Backwards Compatibility**: Keep current functionality working until migration complete
3. **Independent Development**: Simple tabs can be developed in parallel
4. **Consistent Patterns**: Reuse patterns from Cost Overview for new tabs
5. **Performance First**: Lazy loading and memoization from the start

---

## Estimated Timeline
- **Phase 1-2**: 2-3 days (Foundation + Cost Overview migration)
- **Phase 3**: 1 day (PDF branding system)
- **Phase 4**: 2-3 days (4 simple tabs, can be parallel)
- **Phase 5**: 2-3 days (Polish and optimization)
- **Phase 6**: 1 day (Deployment and cleanup)

**Total Estimated Time**: 8-11 days

---

## Risk Mitigation
- [ ] Create feature flag for portal vs old system
- [ ] Maintain old system alongside new during development
- [ ] Test PDF generation extensively before deployment
- [ ] Have rollback plan ready
- [ ] Monitor performance metrics post-deployment

---

## Success Criteria
- [ ] All existing Cost Overview functionality works in new tab
- [ ] All 4 new tabs generate PDFs successfully
- [ ] Navigation works smoothly across all devices
- [ ] Performance is equal or better than current system
- [ ] Auto-save prevents data loss
- [ ] Consistent branding across all PDFs
- [ ] Mobile experience is excellent 