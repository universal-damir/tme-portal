// Tab system types
export type TabId = 
  | 'profile'
  | 'cost-overview'
  | 'golden-visa'
  | 'company-services'
  | 'corporate-changes'
  | 'taxation';

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
  clearClientInfo: () => void;
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