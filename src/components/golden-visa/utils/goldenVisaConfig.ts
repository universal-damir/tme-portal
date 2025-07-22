import { GoldenVisaType } from '@/types/golden-visa';

/**
 * Color schemes for different visa types
 */
export const VISA_TYPE_COLORS = {
  'property-investment': {
    primary: 'purple',
    ring: 'focus:ring-purple-500',
    text: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  'time-deposit': {
    primary: 'orange', 
    ring: 'focus:ring-orange-500',
    text: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  'skilled-employee': {
    primary: 'green',
    ring: 'focus:ring-green-500', 
    text: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
} as const;

/**
 * Visa cancelation color scheme (consistent across all visa types)
 */
export const VISA_CANCELATION_COLORS = {
  primary: 'yellow',
  ring: 'focus:ring-yellow-500',
  text: 'text-yellow-600',
  bg: 'bg-yellow-50',
  border: 'border-yellow-200',
} as const;

/**
 * Dependent visa color schemes
 */
export const DEPENDENT_COLORS = {
  spouse: {
    primary: 'pink',
    ring: 'focus:ring-pink-500',
    text: 'text-pink-600', 
    bg: 'bg-pink-50',
    border: 'border-pink-200',
  },
  children: {
    primary: 'purple',
    ring: 'focus:ring-purple-500',
    text: 'text-purple-600',
    bg: 'bg-purple-50', 
    border: 'border-purple-200',
  },
} as const;

/**
 * Default placeholder values for authority fee fields
 */
export const AUTHORITY_FEE_PLACEHOLDERS = {
  professionalPassportPicture: '25.00',
  dldApprovalFee: '4,020.00',
  mandatoryUaeMedicalTest: '700.00',
  emiratesIdFee: '1,155.00',
  immigrationResidencyFee: '3,160.00',
  immigrationResidencyFeeSpouse: '2,860.00',
  immigrationResidencyFeeChild: '2,750.00',
  thirdPartyCosts: '1,460.00',
  dependentFileOpening: '320.00',
  visaCancelationFee: '185',
} as const;

/**
 * Authority fee field configurations by visa type
 */
export const AUTHORITY_FEE_FIELDS = {
  'property-investment': [
    { key: 'professionalPassportPicture', label: 'Professional Passport Picture Fee' },
    { key: 'dldApprovalFee', label: 'DLD (Dubai Land Department) Approval Fee' },
    { key: 'mandatoryUaeMedicalTest', label: 'Mandatory UAE Medical Test Fee' },
    { key: 'emiratesIdFee', label: 'Emirates ID Fee' },
    { key: 'immigrationResidencyFee', label: 'Immigration - Residency Fee' },
    { key: 'thirdPartyCosts', label: 'Third Party Costs' },
  ],
  'time-deposit': [
    { key: 'professionalPassportPicture', label: 'Professional Passport Picture Fee' },
    { key: 'mandatoryUaeMedicalTest', label: 'Mandatory UAE Medical Test Fee' },
    { key: 'emiratesIdFee', label: 'Emirates ID Fee' },
    { key: 'immigrationResidencyFee', label: 'Immigration - Residency Fee' },
    { key: 'thirdPartyCosts', label: 'Third Party Costs' },
  ],
  'skilled-employee': [
    { key: 'professionalPassportPicture', label: 'Professional Passport Picture Fee' },
    { key: 'mandatoryUaeMedicalTest', label: 'Mandatory UAE Medical Test Fee' },
    { key: 'emiratesIdFee', label: 'Emirates ID Fee' },
    { key: 'immigrationResidencyFee', label: 'Immigration - Residency Fee' },
    { key: 'thirdPartyCosts', label: 'Third Party Costs' },
  ],
} as const;

/**
 * Dependent authority fee fields (shared between spouse and children)
 */
export const DEPENDENT_FEE_FIELDS = [
  { key: 'professionalPassportPicture', label: 'Professional Passport Picture Fee' },
  { key: 'dependentFileOpening', label: 'Dependent File Opening' },
  { key: 'mandatoryUaeMedicalTest', label: 'Mandatory UAE Medical Test Fee' },
  { key: 'emiratesIdFee', label: 'Emirates ID Fee' },
  { key: 'thirdPartyCosts', label: 'Third Party Costs' },
] as const;

/**
 * Freezone options for NOC selection
 */
export const FREEZONE_OPTIONS = [
  { value: 'dmcc', label: 'DMCC (Dubai Multi Commodities Centre)' },
  { value: 'adgm', label: 'ADGM (Abu Dhabi Global Market)' },
  { value: 'difc', label: 'DIFC (Dubai International Financial Centre)' },
  { value: 'ifza', label: 'IFZA (International Free Zone Authority)' },
  { value: 'abu-dhabi', label: 'Abu Dhabi Free Zone' },
  { value: 'dafza', label: 'DAFZA (Dubai Airport Free Zone)' },
  { value: 'jafza', label: 'JAFZA (Jebel Ali Free Zone)' },
  { value: 'dubai-internet-city', label: 'Dubai Internet City' },
  { value: 'meydan', label: 'Meydan Freezone' },
] as const;

/**
 * Visa type display information
 */
export const VISA_TYPE_INFO = {
  'property-investment': {
    title: 'Authority Fees Breakdown',
    description: 'Detailed breakdown of authority fees for Property Investment Golden Visa',
    icon: 'Building2',
  },
  'time-deposit': {
    title: 'Authority Fees Breakdown', 
    description: 'Detailed breakdown of authority fees for Time Deposit Golden Visa',
    icon: 'Building2',
  },
  'skilled-employee': {
    title: 'Authority Fees Breakdown',
    description: 'Detailed breakdown of authority fees for Skilled Employee Golden Visa', 
    icon: 'Building2',
  },
} as const;

/**
 * Get color scheme for a visa type
 */
export const getVisaTypeColors = (visaType: GoldenVisaType) => {
  return VISA_TYPE_COLORS[visaType];
};

/**
 * Get authority fee fields for a visa type
 */
export const getAuthorityFeeFields = (visaType: GoldenVisaType) => {
  return AUTHORITY_FEE_FIELDS[visaType];
};

/**
 * Get placeholder for an authority fee field
 */
export const getFieldPlaceholder = (fieldKey: keyof typeof AUTHORITY_FEE_PLACEHOLDERS) => {
  return AUTHORITY_FEE_PLACEHOLDERS[fieldKey];
}; 