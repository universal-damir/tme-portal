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

export interface CITReturnLettersData {
  // Client Details (from database)
  selectedClient: Client | null;
  clientSearchTerm: string;
  
  // Letter Date
  letterDate: string;
  
  // Tax Period
  taxPeriodStart: string;
  taxPeriodEnd: string;
  
  // Letter Selection
  letterType: LetterType | '';
  
  // Conf acc docs + FS specific selections
  confAccDocsSelections: ConfAccDocsSelections;
}

export const CIT_RETURN_LETTERS_DEFAULTS = {
  selectedClient: null,
  clientSearchTerm: '',
  letterDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  taxPeriodStart: '',
  taxPeriodEnd: '',
  letterType: '' as LetterType | '',
  confAccDocsSelections: {
    revenuesAndExpenses: false,
    nonDeductibleExpenses: false,
    waiverSalaryGratuity: false,
    assetsAndLiabilities: false,
    ifrs9FinancialInstruments: false,
    ifrs16Leases: false,
    otherPointSelected: false,
    otherPointName: '',
    otherPointText: '',
  },
};

export const LETTER_TYPE_OPTIONS: { value: LetterType; label: string }[] = [
  { value: 'CIT TP', label: 'CIT TP' },
  { value: 'Conf acc docs + FS', label: 'Conf acc docs + FS' },
  { value: 'CIT assess+concl, non deduct, elect', label: 'CIT assess+concl, non deduct, elect' },
];