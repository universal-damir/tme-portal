/**
 * Invoicing System Type Definitions
 */

// ============= Client Types =============

export interface InvoiceClient {
  id?: number;
  clientCode: string;  // 5-digit permanent code
  clientName: string;
  clientAddress: string;
  managerName: string;
  managerEmail?: string;
  vatNumber?: string;
  annualCode?: string;  // 3-digit code reset annually
  annualCodeYear: number;
  issuingCompany: 'DET' | 'FZCO' | 'DMCC';
  isActive: boolean;
  isRecurring: boolean;
  defaultServices?: DefaultService[];
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
}

export interface DefaultService {
  serviceCatalogId: number;
  quantity: number;
  unitPrice: number;
  unit: string;
}

// ============= Service Catalog Types =============

export interface ServiceCatalogItem {
  id?: number;
  category: ServiceCategory;
  serviceName: string;
  description?: string;
  defaultUnit?: ServiceUnit;
  defaultUnitPrice?: number;
  isActive: boolean;
  sortOrder: number;
}

export type ServiceCategory = 
  | 'Consulting/PRO/Commercial services'
  | 'Accounting service'
  | 'Salary preparation'
  | 'Others';

export type ServiceUnit = 
  | 'month'
  | 'hours'
  | 'quarter'
  | 'salaries'
  | '%'
  | null;

// ============= Invoice Types =============

export interface Invoice {
  id?: number;
  invoiceNumber: string;  // YYMMXXX-YYYYY-NN PMS format
  clientId: number;
  client?: InvoiceClient;  // Populated when fetched with client
  invoiceDate: string;  // ISO date string
  dueDate?: string;
  status: InvoiceStatus;
  
  // Financial fields
  subtotal: number;
  vatRate: number;  // Always 5
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue?: number;  // Calculated field
  
  // Approval workflow
  submittedForApprovalAt?: Date;
  submittedBy?: number;
  approvedAt?: Date;
  approvedBy?: number;
  approvalNotes?: string;
  
  // Recurring fields
  isRecurring: boolean;
  templateId?: number;
  
  // Other fields
  notes?: string;
  internalNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
  sentAt?: Date;
  sentToEmails?: string[];
  
  // Relations
  sections?: InvoiceSection[];
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
}

export type InvoiceStatus = 
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

// ============= Invoice Section Types =============

export interface InvoiceSection {
  id?: number;
  invoiceId: number;
  sectionName: string;
  sortOrder: number;
  subtotal: number;
  items?: InvoiceItem[];
}

// ============= Invoice Item Types =============

export interface InvoiceItem {
  id?: number;
  invoiceId: number;
  sectionId?: number;
  serviceCatalogId?: number;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  netAmount: number;
  vatAmount?: number;  // Auto-calculated
  grossAmount?: number;  // Auto-calculated
  sortOrder: number;
}

// ============= Payment Types =============

export interface InvoicePayment {
  id?: number;
  invoiceId: number;
  paymentDate: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  recordedBy?: number;
  createdAt?: Date;
}

export type PaymentMethod = 
  | 'bank_transfer'
  | 'cash'
  | 'cheque'
  | 'credit_card'
  | 'other';

// ============= Reminder Types =============

export interface InvoiceReminder {
  id?: number;
  invoiceId: number;
  reminderDate: string;
  reminderType: ReminderType;
  sent: boolean;
  sentAt?: Date;
  sentToEmails?: string[];
  createdAt?: Date;
}

export type ReminderType = 
  | 'due_soon'
  | 'overdue'
  | 'follow_up'
  | 'custom';

// ============= Approval Types =============

export interface InvoiceApproval {
  id?: number;
  invoiceId: number;
  requestedBy: number;
  requestedAt: Date;
  assignedTo: number;
  status: ApprovalStatus;
  reviewedAt?: Date;
  comments?: string;
}

export type ApprovalStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revision_required';

// ============= Form Data Types =============

export interface InvoiceFormData {
  // Client selection
  clientId?: number;
  isNewClient: boolean;
  newClient?: Omit<InvoiceClient, 'id' | 'createdAt' | 'updatedAt'>;
  
  // Invoice details
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  internalNotes?: string;
  
  // Sections and items
  sections: {
    name: string;
    items: {
      description: string;
      quantity: number;
      unit: string;
      unitPrice: number;
    }[];
  }[];
}

// ============= API Response Types =============

export interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClientListResponse {
  clients: InvoiceClient[];
  total: number;
}

// ============= Utility Types =============

export interface InvoiceNumberComponents {
  year: string;  // YY
  month: string;  // MM
  annualCode: string;  // XXX
  clientCode: string;  // YYYYY
  companyCode: string;  // NN
}

export interface InvoiceFilter {
  status?: InvoiceStatus[];
  clientId?: number;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  byStatus: Record<InvoiceStatus, number>;
}