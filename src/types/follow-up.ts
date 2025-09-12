/**
 * Email Follow-up System TypeScript Definitions
 * Type definitions for the email follow-up tracking system
 */

// Export follow-up types from service (re-export for convenience)
export type {
  EmailFollowUp,
  CreateFollowUpInput,
  FollowUpFilters,
  FollowUpStats
} from '@/lib/services/follow-up-service';

// Frontend-specific types
export type FollowUpStatus = 'pending' | 'completed' | 'no_response' | 'snoozed';
export type FollowUpNumber = 1 | 2 | 3;
export type CompletionReason = 'client_responded' | 'signed' | 'paid' | 'cancelled' | 'other';

export interface FollowUpAction {
  id: string;
  label: string;
  action: 'complete' | 'snooze' | 'resend' | 'no_response';
  variant?: 'primary' | 'secondary' | 'danger';
  requiresConfirmation?: boolean;
}

// API Response Types
export interface FollowUpApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}

export interface GetFollowUpsResponse extends FollowUpApiResponse {
  follow_ups: EmailFollowUp[];
  stats: FollowUpStats;
  total: number;
  pagination: {
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface CreateFollowUpResponse extends FollowUpApiResponse {
  follow_up?: EmailFollowUp;
}

export interface UpdateFollowUpResponse extends FollowUpApiResponse {
  follow_up?: EmailFollowUp;
}

// Component Props Types
export interface FollowUpPanelProps {
  className?: string;
  maxHeight?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface FollowUpItemProps {
  followUp: EmailFollowUp;
  onComplete: (reason?: CompletionReason) => void;
  onSnooze: () => void;
  onResend: () => void;
  onNoResponse?: () => void;
  showActions?: boolean;
  variant?: 'table' | 'card';
}

export interface FollowUpTableProps {
  followUps: EmailFollowUp[];
  onAction: (followUpId: string, action: string, data?: any) => void;
  loading?: boolean;
  emptyMessage?: string;
}

// Hook Types
export interface UseFollowUpsOptions {
  status?: FollowUpStatus;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseFollowUpsReturn {
  followUps: {
    pending: EmailFollowUp[];
    completed: EmailFollowUp[];
    noResponse: EmailFollowUp[];
  };
  stats: FollowUpStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateFollowUp: (followUpId: string, action: string, data?: any) => Promise<void>;
  createFollowUp: (input: CreateFollowUpInput) => Promise<EmailFollowUp>;
}

// Utility Types
export interface FollowUpDateHelpers {
  isOverdue: (followUp: EmailFollowUp) => boolean;
  isDueToday: (followUp: EmailFollowUp) => boolean;
  isDueSoon: (followUp: EmailFollowUp) => boolean;
  formatDueDate: (followUp: EmailFollowUp) => string;
  getDaysUntilDue: (followUp: EmailFollowUp) => number;
  getFollowUpLabel: (followUpNumber: FollowUpNumber) => string;
}

// Table Column Configuration
export interface FollowUpTableColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (followUp: EmailFollowUp) => React.ReactNode;
}