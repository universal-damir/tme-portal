// Internal types for PDF generation components
// These complement the main OfferData type from @/types/offer

export interface PDFComponentProps {
  data: import('@/types/offer').OfferData;
}

export interface FooterInfo {
  companyName: string;
  address: string;
}

export interface CostItem {
  description: string;
  amount: number;
  secondaryAmount: number;
  isReduction?: boolean;
}

export interface CostTableProps extends PDFComponentProps {
  title: string;
  items: CostItem[];
  total?: number;
  secondaryTotal?: number;
  theme?: 'green' | 'blue' | 'orange' | 'purple' | 'yellow' | 'lightblue' | 'neutral';
  showDeposits?: boolean;
  depositsItems?: CostItem[];
  depositsTotal?: number;
  depositsSecondaryTotal?: number;
  showTotal?: boolean;
}

export interface TableTheme {
  headerBackground: string;
  totalBackground: string;
  sectionBackground: string;
} 