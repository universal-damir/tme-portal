/**
 * Todo System TypeScript Definitions
 * Type definitions for the notification-to-todo integration system
 * Phase 2: Backend Services Implementation
 */

// Export todo types from service (re-export for convenience)
export type {
  Todo,
  CreateTodoInput,
  TodoFilters,
  TodoStats
} from '@/lib/services/todo-service';

// Additional types for frontend components
export interface TodoListProps {
  todos: Todo[];
  onTodoUpdate: (todoId: string, status: TodoStatus) => void;
  onTodoSelect?: (todoId: string) => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export interface TodoItemProps {
  todo: Todo;
  onStatusUpdate: (status: TodoStatus) => void;
  onSelect?: () => void;
  className?: string;
  showActions?: boolean;
  compact?: boolean;
}

export interface TodoFiltersProps {
  filters: TodoFilterState;
  onFiltersChange: (filters: TodoFilterState) => void;
  stats: TodoStats;
  loading?: boolean;
}

export interface TodoStatsProps {
  stats: TodoStats;
  loading?: boolean;
  showInsights?: boolean;
  className?: string;
}

// Frontend-specific types
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'dismissed' | 'expired';
export type TodoCategory = 'to_send' | 'to_check' | 'to_follow_up';
export type TodoPriority = 'standard' | 'urgent';

export interface TodoFilterState {
  status?: TodoStatus[];
  category?: TodoCategory[];
  priority?: TodoPriority[];
  overdue_only?: boolean;
  due_soon_only?: boolean;
  search_query?: string;
}

export interface TodoAction {
  id: string;
  label: string;
  action: 'complete' | 'dismiss' | 'start' | 'pause' | 'delete';
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  requiresConfirmation?: boolean;
}

export interface TodoBulkAction {
  id: string;
  label: string;
  action: 'complete' | 'dismiss';
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  requiresConfirmation?: boolean;
}

// API Response Types
export interface TodoApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}

export interface GetTodosResponse extends TodoApiResponse {
  todos: Todo[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface CreateTodoResponse extends TodoApiResponse {
  todo?: Todo;
  todo_generated?: boolean;
}

export interface UpdateTodoResponse extends TodoApiResponse {
  todo?: Todo;
}

export interface TodoStatsResponse extends TodoApiResponse {
  stats: TodoStats & {
    active_todos: number;
    completion_rate: number;
    overdue_priority_level: 'normal' | 'medium' | 'high' | 'critical';
  };
  insights: {
    has_overdue: boolean;
    has_due_soon: boolean;
    productivity_score: number;
    needs_attention: boolean;
    workload_level: 'light' | 'moderate' | 'heavy';
  };
}

export interface BulkUpdateTodosResponse extends TodoApiResponse {
  updated_count: number;
  requested_count: number;
  status: 'completed' | 'dismissed';
}

// Hook Types
export interface UseTodosOptions {
  filters?: TodoFilterState;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseTodosReturn {
  todos: Todo[];
  stats: TodoStats | null;
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  updateTodoStatus: (todoId: string, status: TodoStatus) => Promise<void>;
  bulkUpdateStatus: (todoIds: string[], status: 'completed' | 'dismissed') => Promise<void>;
  createTodo: (input: CreateTodoInput) => Promise<Todo>;
}

// Component Configuration Types
export interface TodoListConfig {
  showCategories: boolean;
  showPriorities: boolean;
  showDueDates: boolean;
  showActions: boolean;
  showBulkActions: boolean;
  enableSearch: boolean;
  enableFilters: boolean;
  defaultSort: 'priority' | 'due_date' | 'created_at' | 'status';
  itemsPerPage: number;
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface TodoItemConfig {
  showDescription: boolean;
  showMetadata: boolean;
  showProgress: boolean;
  enableInlineEdit: boolean;
  enableQuickActions: boolean;
  compactMode: boolean;
}

// Theme and Styling Types
export interface TodoTheme {
  colors: {
    priority: {
      low: string;
      medium: string;
      high: string;
      urgent: string;
    };
    status: {
      pending: string;
      in_progress: string;
      completed: string;
      dismissed: string;
      expired: string;
    };
    category: {
      review: string;
      follow_up: string;
      reminder: string;
      action: string;
    };
  };
  animations: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
}

// Integration Types
export interface NotificationTodoMapping {
  notification_type: string;
  should_generate_todo: boolean;
  todo_template: {
    category: TodoCategory;
    priority: TodoPriority;
    due_hours: number;
    action_type: string;
  };
}

export interface AutoCompletionRule {
  trigger_notification_type: string;
  completion_criteria: {
    action_type?: string;
    application_id?: boolean;
    client_name?: boolean;
    document_type?: boolean;
  };
}

// Utility Types
export interface TodoDateHelpers {
  isOverdue: (todo: Todo) => boolean;
  isDueSoon: (todo: Todo, hours?: number) => boolean;
  getTimeUntilDue: (todo: Todo) => string;
  formatDueDate: (todo: Todo) => string;
  getDueDateColor: (todo: Todo) => string;
}

export interface TodoStatusHelpers {
  canTransitionTo: (from: TodoStatus, to: TodoStatus) => boolean;
  getAvailableActions: (status: TodoStatus) => TodoAction[];
  getStatusColor: (status: TodoStatus) => string;
  getStatusIcon: (status: TodoStatus) => string;
}

export interface TodoPriorityHelpers {
  getPriorityScore: (priority: TodoPriority) => number;
  getPriorityColor: (priority: TodoPriority) => string;
  getPriorityIcon: (priority: TodoPriority) => string;
  shouldShowUrgentIndicator: (todo: Todo) => boolean;
}

// Error Types
export interface TodoError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
}

export interface TodoValidationError extends TodoError {
  field: string;
  value: any;
  expected: string;
}

// Event Types
export interface TodoEvent {
  type: 'created' | 'updated' | 'completed' | 'dismissed' | 'deleted';
  todo_id: string;
  user_id: number;
  timestamp: Date;
  details?: any;
}

export interface TodoEventHandler {
  (event: TodoEvent): void;
}

// Search and Filter Types
export interface TodoSearchResult {
  todos: Todo[];
  total: number;
  query: string;
  filters: TodoFilterState;
  took_ms: number;
}

export interface TodoSearchOptions {
  query: string;
  filters?: TodoFilterState;
  sort?: 'relevance' | 'priority' | 'due_date' | 'created_at';
  limit?: number;
  offset?: number;
}

// Notification Integration Types
export interface TodoNotificationTrigger {
  notification_id: string;
  notification_type: string;
  user_id: number;
  data: any;
  should_generate_todo: boolean;
  generated_todo_id?: string;
  error?: string;
}

export interface TodoAutoCompletion {
  trigger_id: string;
  user_id: number;
  criteria: any;
  completed_todo_ids: string[];
  completed_count: number;
  timestamp: Date;
}