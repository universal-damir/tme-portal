# CostOverviewTab Refactoring Plan

## Current State Analysis

### Component Size Comparison
- **CostOverviewTab**: 823 lines - **OUTLIER** ❌
- **GoldenVisaTab**: 521 lines - Well organized ✅
- **CompanyServicesTab**: 292 lines - Very clean ✅  
- **TaxationTab**: 412 lines - Focused ✅

### Main Issues Identified

#### 1. Duplicate Code Across Tabs
- **PDF Progress Dialog**: Identical 40+ lines in CostOverviewTab and GoldenVisaTab
- **Client Context Sync**: Nearly identical debounced logic in all tabs
- **PDF Generation Pattern**: Similar logic but not abstracted

#### 2. CostOverviewTab Specific Complexity
- **AI Assistant Integration**: Unique and complex (only tab that has it)
- **Multiple PDF handlers**: `handleGeneratePDF` and `handlePreviewPDF`
- **Authority-dependent calculations**: Complex business logic mixed in
- **Sticky summary sections**: Complex UI logic mixed with form logic

#### 3. Missing Abstractions
- No dedicated PDF generation hook
- No shared progress dialog component  
- No shared client sync utility

## Refactoring Strategy

### Phase 1: Extract Shared Logic (High Impact, Low Risk)
*Priority: Immediate - Quick wins with reusable components*

#### 1.1 Create `<PDFProgressDialog />` Component
**Target**: `src/components/ui/PDFProgressDialog.tsx`

```typescript
interface PDFProgressDialogProps {
  isVisible: boolean;
  step: string;
  progress: number;
  title?: string;
  color?: 'blue' | 'yellow' | 'green';
}
```

**Benefits**:
- Remove 40+ duplicate lines from CostOverviewTab and GoldenVisaTab
- Consistent progress UI across all tabs
- Reusable for future tabs

**Files to Update**:
- [ ] Create `src/components/ui/PDFProgressDialog.tsx`
- [ ] Update `src/components/ui/index.ts` (add export)
- [ ] Refactor `src/components/portal/tabs/CostOverviewTab.tsx`
- [ ] Refactor `src/components/portal/tabs/GoldenVisaTab.tsx`

#### 1.2 Create `useClientSync()` Hook
**Target**: `src/hooks/useClientSync.tsx`

```typescript
interface UseClientSyncProps {
  watchedData: { firstName?: string; lastName?: string; companyName?: string; date?: string };
  setValue: UseFormSetValue<any>;
  initializedRef: React.MutableRefObject<boolean>;
}
```

**Benefits**:
- Remove 20+ duplicate lines from each tab
- Consistent client context synchronization
- Centralized debouncing logic

**Files to Update**:
- [ ] Create `src/hooks/useClientSync.tsx`
- [ ] Update `src/hooks/index.ts` (if exists, or create)
- [ ] Refactor `src/components/portal/tabs/CostOverviewTab.tsx`
- [ ] Refactor `src/components/portal/tabs/GoldenVisaTab.tsx`
- [ ] Refactor `src/components/portal/tabs/CompanyServicesTab.tsx`
- [ ] Refactor `src/components/portal/tabs/TaxationTab.tsx`

#### 1.3 Create `usePDFGeneration()` Hook
**Target**: `src/hooks/usePDFGeneration.tsx`

```typescript
interface UsePDFGenerationProps<T> {
  generatePDF: (data: T) => Promise<Blob>;
  generatePDFWithFilename?: (data: T) => Promise<{ blob: Blob; filename: string }>;
  generateFamilyPDF?: (data: T) => Promise<Blob>;
  validateData: (data: T) => { isValid: boolean; errors: string[] };
}
```

**Benefits**:
- Remove ~100 lines from CostOverviewTab
- Consistent PDF generation pattern
- Centralized progress tracking and error handling

**Files to Update**:
- [ ] Create `src/hooks/usePDFGeneration.tsx`
- [ ] Refactor `src/components/portal/tabs/CostOverviewTab.tsx`
- [ ] Refactor `src/components/portal/tabs/GoldenVisaTab.tsx`
- [ ] Consider refactoring other tabs as they implement PDF generation

#### 1.4 Create Standardized Input Components (New Finding)
**Target**: `src/components/ui/inputs/`

**Pattern Found**: Complex className repeated 50+ times across tabs:
```typescript
className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
```

**Components to Create**:
- `<StandardInput />` - Text input with consistent styling
- `<StandardSelect />` - Select dropdown with consistent styling  
- `<CurrencyRadioGroup />` - Reusable AED/USD selection
- `<CompanyTypeSelector />` - TME FZCO vs Management Consultants selection

**Benefits**:
- Remove 50+ duplicate className strings
- Consistent input styling across all tabs
- Centralized input behavior and accessibility

**Files to Create**:
- [ ] `src/components/ui/inputs/StandardInput.tsx`
- [ ] `src/components/ui/inputs/StandardSelect.tsx`
- [ ] `src/components/ui/inputs/CurrencyRadioGroup.tsx`
- [ ] `src/components/ui/inputs/CompanyTypeSelector.tsx`
- [ ] `src/components/ui/inputs/index.ts`

#### 1.5 Create `<PDFActionButtons />` Component (New Finding)
**Target**: `src/components/ui/PDFActionButtons.tsx`

**Pattern Found**: Preview/Download button pairs duplicated across tabs with identical styling

**Benefits**:
- Remove duplicate PDF button code
- Consistent PDF action UI
- Centralized button state management

**Files to Update**:
- [ ] Create `src/components/ui/PDFActionButtons.tsx`
- [ ] Update `src/components/ui/index.ts`
- [ ] Refactor all tabs using PDF buttons

### Phase 2: Split CostOverviewTab (Medium Impact, Medium Risk)
*Priority: After Phase 1 - Requires careful separation of concerns*

#### 2.1 Extract `<CostCalculationSections />` Component
**Target**: `src/components/cost-overview/CostCalculationSections.tsx`

**Responsibility**: All authority-dependent sections with sticky summaries
- License Fees Section with sticky summary
- Visa Costs Section with sticky summary  
- Spouse Visa Section with sticky summary
- Child Visa Section with sticky summary
- Additional Services Section with sticky summary
- Full Cost Summaries

**Props**:
```typescript
interface CostCalculationSectionsProps {
  watchedData: OfferData;
  register: UseFormRegister<OfferData>;
  errors: FieldErrors<OfferData>;
  setValue: UseFormSetValue<OfferData>;
  authorityConfig: AuthorityConfig;
  costs: CalculatedCosts;
  // ... other calculation-specific props
}
```

**Files to Update**:
- [ ] Create `src/components/cost-overview/CostCalculationSections.tsx`
- [ ] Update `src/components/cost-overview/index.ts`
- [ ] Refactor `src/components/portal/tabs/CostOverviewTab.tsx`

#### 2.2 Extract `<CostOverviewForm />` Component  
**Target**: `src/components/cost-overview/CostOverviewForm.tsx`

**Responsibility**: Pure form sections without calculations
- Client Details Section
- Authority Information Section  
- Activity Codes Section

**Props**:
```typescript
interface CostOverviewFormProps {
  watchedData: OfferData;
  register: UseFormRegister<OfferData>;
  errors: FieldErrors<OfferData>;
  setValue: UseFormSetValue<OfferData>;
  // ... form-specific props
}
```

**Files to Update**:
- [ ] Create `src/components/cost-overview/CostOverviewForm.tsx`
- [ ] Update `src/components/cost-overview/index.ts`
- [ ] Refactor `src/components/portal/tabs/CostOverviewTab.tsx`

#### 2.3 Simplify Main CostOverviewTab Component
**Target**: Reduce to ~200-300 lines (similar to other tabs)

**Remaining Responsibilities**:
- Form state management (useForm hook)
- AI Assistant integration
- Component composition
- PDF generation buttons and validation
- Event listeners for header buttons

**Target Structure**:
```typescript
const CostOverviewTab: React.FC<CostOverviewTabProps> = ({ 
  onOpenAIAssistant, 
  isAIAssistantOpen 
}) => {
  // Form setup
  // AI Assistant integration  
  // PDF generation handlers
  // Client sync
  
  return (
    <div className={`transition-all duration-300 space-y-8 ${aiAssistant.isOpen ? 'mb-[33vh] lg:mb-[400px]' : ''}`}>
      <CostOverviewForm {...formProps} />
      
      {isAuthoritySelected && (
        <CostCalculationSections {...calculationProps} />
      )}
      
      {/* PDF Buttons */}
      {/* AI Assistant */}
    </div>
  );
};
```

### Phase 3: AI Assistant Integration Cleanup (Low Impact, Polish)
*Priority: Optional - Clean up but don't over-engineer*

#### 3.1 Simplify AI Integration
- Consolidate multiple useEffect hooks where possible
- Keep the complex logic since it's unique to this tab
- The `useAIAssistant` hook is already well-abstracted

**Files to Update**:
- [ ] Minor cleanup in `src/components/portal/tabs/CostOverviewTab.tsx`

## Implementation Checklist

### Phase 1 Checklist

#### PDFProgressDialog Component
- [ ] Create component with TypeScript interface
- [ ] Add color variants (blue, yellow, green) for different tabs
- [ ] Add backdrop overlay and modal positioning
- [ ] Export from `src/components/ui/index.ts`
- [ ] Replace usage in CostOverviewTab
- [ ] Replace usage in GoldenVisaTab
- [ ] Test PDF generation progress in both tabs

#### useClientSync Hook  
- [ ] Create hook with proper TypeScript types
- [ ] Implement debounced client context updates
- [ ] Handle initialization logic
- [ ] Add proper cleanup for timeouts
- [ ] Export from hooks barrel file
- [ ] Replace in CostOverviewTab
- [ ] Replace in GoldenVisaTab  
- [ ] Replace in CompanyServicesTab
- [ ] Replace in TaxationTab
- [ ] Test client info synchronization across tabs

#### usePDFGeneration Hook
- [ ] Create hook with generic type support
- [ ] Implement progress tracking state
- [ ] Add validation logic
- [ ] Handle success/error toasts
- [ ] Support both single and multiple PDF generation
- [ ] Export from hooks barrel file
- [ ] Replace PDF logic in CostOverviewTab
- [ ] Replace PDF logic in GoldenVisaTab
- [ ] Test PDF generation and error handling

### Phase 2 Checklist

#### CostCalculationSections Component
- [ ] Extract all authority-dependent sections
- [ ] Maintain existing sticky summary functionality
- [ ] Preserve all calculation logic and hooks
- [ ] Add proper TypeScript interfaces
- [ ] Export from cost-overview barrel file
- [ ] Update CostOverviewTab to use component
- [ ] Test all calculation scenarios
- [ ] Verify sticky summaries work correctly

#### CostOverviewForm Component
- [ ] Extract basic form sections
- [ ] Maintain form validation and error handling
- [ ] Preserve existing form field functionality
- [ ] Add proper TypeScript interfaces
- [ ] Export from cost-overview barrel file
- [ ] Update CostOverviewTab to use component
- [ ] Test form validation and field interactions

#### Main Component Simplification
- [ ] Verify component is ~200-300 lines
- [ ] Ensure all functionality is preserved
- [ ] Test AI Assistant integration still works
- [ ] Test PDF generation from simplified component
- [ ] Verify all existing features work correctly

## Success Metrics

### Phase 1 Success
- [ ] CostOverviewTab reduced by ~150+ lines
- [ ] No duplicate PDF progress dialogs
- [ ] All tabs use consistent client sync
- [ ] PDF generation pattern is reusable

### Phase 2 Success  
- [ ] CostOverviewTab is ~200-300 lines (similar to other tabs)
- [ ] Business logic is separated and testable
- [ ] Component responsibilities are clear
- [ ] No functionality is lost

### Overall Success
- [ ] All existing functionality preserved
- [ ] Code is more maintainable
- [ ] New developers can understand any tab quickly
- [ ] Future tabs can reuse established patterns

## Risk Mitigation

### Low Risk (Phase 1)
- Start with simple extractions
- Test each extraction thoroughly
- Keep existing functionality intact

### Medium Risk (Phase 2)  
- Extract components one at a time
- Maintain comprehensive testing
- Keep git history clean for easy rollback

### Testing Strategy
- [ ] Test each phase in isolation
- [ ] Verify all PDF generation scenarios
- [ ] Test AI Assistant integration
- [ ] Test form validation and calculations
- [ ] Test client context synchronization
- [ ] Verify responsive design is maintained

## Notes

- Follow existing project patterns (PDF generator refactor was done well)
- Don't over-engineer - just extract duplicated code and separate concerns
- The AI Assistant complexity is justified since only CostOverviewTab uses it
- Focus on reusability and maintainability over performance optimization
- Consider this refactor as establishing patterns for future development 