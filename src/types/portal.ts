// Tab system types
export type TabId = 
  | 'profile'
  | 'cost-overview'
  | 'golden-visa'
  | 'company-services'
  | 'corporate-changes'
  | 'taxation'
  | 'cit-return-letters'
  | 'invoicing';

export interface TabInfo {
  id: TabId;
  label: string;
  description: string;
  completed?: boolean;
  hasErrors?: boolean;
}

export interface NavigationState {
  activeTab: TabId;
  visitedTabs: Set<TabId>;
  completedTabs: Set<TabId>;
}

// Shared client information across tabs
export interface SharedClientInfo {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  shortCompanyName?: string;
  date: string;
}

export interface SharedClientContextType {
  clientInfo: SharedClientInfo;
  updateClientInfo: (info: Partial<SharedClientInfo>) => void;
  clearClientInfo: (options?: any) => void;
  setWorkflowState: (state: string) => void;
  workflowState: string;
  loadFromApplication: (applicationData: any) => void;
  getPreservedFormData: () => any;
  fetchRejectedApplications: () => Promise<any[]>;
  loadRejectedApplication: (applicationId: string) => Promise<any>;
}

// Simplified workflow state for backward compatibility
export type WorkflowState = 'fresh' | 'review-pending' | 'review-approved' | 'review-rejected' | 'loading-from-review';

// Simplified clear options
export interface ClearClientInfoOptions {
  preserveForReview?: boolean;
  formData?: any; // Include form data when preserving
  completeReset?: boolean; // Complete reset including sessionStorage
  source?: 'email-sent' | 'review-submit' | 'manual' | 'form-reset';
}

// Auto-save system
export interface AutoSaveConfig {
  key: string;
  debounceMs?: number;
  enabled?: boolean;
}

export interface AutoSaveState<T> {
  data: T | null;
  lastSaved: Date | null;
  isDirty: boolean;
  isLoading: boolean;
} 