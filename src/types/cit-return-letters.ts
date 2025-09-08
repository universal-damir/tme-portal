// CIT Return Letters Types
export interface Client {
  id: number;
  company_code: string;
  company_name: string;
  company_name_short: string;
  registered_authority: string;
  management_name: string;
  management_email: string;
  city: string;
  country: string;
  po_box?: string;
  vat_trn?: string;
  status: 'active' | 'inactive' | 'archived';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type LetterType = 'CIT TP' | 'Conf acc docs + FS' | 'CIT assess+concl, non deduct, elect';

export interface ConfAccDocsSelections {
  revenuesAndExpenses: boolean;
  nonDeductibleExpenses: boolean;
  waiverSalaryGratuity: boolean;
  assetsAndLiabilities: boolean;
  ifrs9FinancialInstruments: boolean;
  ifrs16Leases: boolean;
  otherPointSelected: boolean;
  otherPointName: string;
  otherPointText: string;
}

export interface QFZPBenefitSelections {
  adequateSubstance: boolean;
  derivesQualifyingIncome: boolean;
  withinDeMinimis: boolean;
  preparesTPDocumentation: boolean;
  performsAuditFinancialStatements: boolean;
  doesNotElectStandardRules: boolean;
}

export interface NonDeductibleExpense {
  particulars: string;
  nonDeductiblePercentage: number;
}

export interface ElectionsSelections {
  electionsSelected: boolean;
  realizationBasisOfAccounting: boolean;
  transitionalRules: boolean;
  carryForwardOfLosses: boolean;
}

export interface CITAssessmentConclusionData {
  citImpactAssessmentPerformed: boolean;
  citImpactAssessmentDate: string;
  qfzpBenefitSelections: QFZPBenefitSelections;
  smallBusinessReliefAmount: number;
  nonDeductibleExpenses: NonDeductibleExpense[];
  elections: ElectionsSelections;
}

export interface CITReturnLettersData {
  // Client Details (from database)
  selectedClient: Client | null;
  clientSearchTerm: string;
  
  // Custom Receiver Details (optional override)
  useCustomReceiverDetails: boolean;
  customReceiverFirstName: string;
  customReceiverLastName: string;
  customReceiverEmail: string;
  
  // Letter Date
  letterDate: string;
  
  // Tax Period
  taxPeriodStart: string;
  taxPeriodEnd: string;
  
  // Letter Selection - Support multiple selections
  selectedLetterTypes: LetterType[];
  
  // Backward compatibility - deprecated, use selectedLetterTypes
  letterType?: LetterType | '';
  
  // Conf acc docs + FS specific selections
  confAccDocsSelections: ConfAccDocsSelections;
  
  // CIT assess+concl, non deduct, elect specific selections
  citAssessmentConclusion: CITAssessmentConclusionData;
}

export const CIT_RETURN_LETTERS_DEFAULTS = {
  selectedClient: null,
  clientSearchTerm: '',
  useCustomReceiverDetails: false,
  customReceiverFirstName: '',
  customReceiverLastName: '',
  customReceiverEmail: '',
  letterDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  taxPeriodStart: '',
  taxPeriodEnd: '',
  selectedLetterTypes: [] as LetterType[],
  letterType: '' as LetterType | '', // Backward compatibility
  confAccDocsSelections: {
    revenuesAndExpenses: true,
    nonDeductibleExpenses: true,
    waiverSalaryGratuity: true,
    assetsAndLiabilities: true,
    ifrs9FinancialInstruments: true,
    ifrs16Leases: true,
    otherPointSelected: false,
    otherPointName: '',
    otherPointText: '',
  },
  citAssessmentConclusion: {
    citImpactAssessmentPerformed: false,
    citImpactAssessmentDate: '',
    qfzpBenefitSelections: {
      adequateSubstance: false,
      derivesQualifyingIncome: false,
      withinDeMinimis: false,
      preparesTPDocumentation: false,
      performsAuditFinancialStatements: false,
      doesNotElectStandardRules: false,
    },
    smallBusinessReliefAmount: 0,
    nonDeductibleExpenses: [{
      particulars: '',
      nonDeductiblePercentage: 0,
    }],
    elections: {
      electionsSelected: false,
      realizationBasisOfAccounting: true,
      transitionalRules: true,
      carryForwardOfLosses: true,
    },
  },
};

export const LETTER_TYPE_OPTIONS: { value: LetterType; label: string }[] = [
  { value: 'CIT TP', label: '01 CIT TP' },
  { value: 'Conf acc docs + FS', label: '02 Conf acc docs + FS' },
  { value: 'CIT assess+concl, non deduct, elect', label: '03 CIT assess+concl, non deduct, elect' },
];