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

export interface CITReturnLettersData {
  // Client Details (from database)
  selectedClient: Client | null;
  clientSearchTerm: string;
  
  // Tax Period
  taxPeriodStart: string;
  taxPeriodEnd: string;
  
  // Letter Selection
  letterType: LetterType | '';
}

export const CIT_RETURN_LETTERS_DEFAULTS = {
  selectedClient: null,
  clientSearchTerm: '',
  taxPeriodStart: '',
  taxPeriodEnd: '',
  letterType: '' as LetterType | '',
};

export const LETTER_TYPE_OPTIONS: { value: LetterType; label: string }[] = [
  { value: 'CIT TP', label: 'CIT TP' },
  { value: 'Conf acc docs + FS', label: 'Conf acc docs + FS' },
  { value: 'CIT assess+concl, non deduct, elect', label: 'CIT assess+concl, non deduct, elect' },
];