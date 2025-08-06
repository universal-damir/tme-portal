/**
 * useTodos Hook
 * React hook for todo state management with API integration
 * Phase 3: Frontend Components Implementation
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Todo, TodoFilterState, TodoStats, CreateTodoInput, TodoStatus } from '@/types/todo';

export interface UseTodosOptions {
  filters?: TodoFilterState;
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialLoad?: boolean;
}

export interface UseTodosReturn {
  // Data
  todos: Todo[];
  stats: TodoStats | null;
  
  // State
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  
  // Actions
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  updateTodoStatus: (todoId: string, status: TodoStatus) => Promise<void>;
  bulkUpdateStatus: (todoIds: string[], status: 'completed' | 'dismissed') => Promise<void>;
  createTodo: (input: CreateTodoInput) => Promise<Todo>;
  
  // Filters
  filters: TodoFilterState;
  setFilters: (filters: TodoFilterState) => void;
}

export function useTodos(options: UseTodosOptions = {}): UseTodosReturn {
  const {
    filters: initialFilters = {},
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    initialLoad = true
  } = options;

  // State
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<TodoFilterState>(initialFilters);

  // Refs
  const abortControllerRef = useRef<AbortController>();
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const limit = 50;

  // Build query string from filters
  const buildQueryString = useCallback((filterState: TodoFilterState, offsetValue: number = 0): string => {
    const params = new URLSearchParams();
    
    if (filterState.status && filterState.status.length > 0) {
      params.set('status', filterState.status.join(','));
    }
    
    if (filterState.category && filterState.category.length > 0) {
      params.set('category', filterState.category.join(','));
    }
    
    if (filterState.priority && filterState.priority.length > 0) {
      params.set('priority', filterState.priority.join(','));
    }
    
    if (filterState.overdue_only) {
      params.set('overdue_only', 'true');
    }
    
    if (filterState.due_soon_only) {
      params.set('due_soon_only', 'true');
    }
    
    params.set('limit', limit.toString());
    params.set('offset', offsetValue.toString());
    
    return params.toString();
  }, []);

  // Fetch todos from API
  const fetchTodos = useCallback(async (filterState: TodoFilterState, offsetValue: number = 0, append: boolean = false): Promise<void> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const queryString = buildQueryString(filterState, offsetValue);
      const response = await fetch(`/api/user/todos?${queryString}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch todos');
      }

      // Update todos
      if (append) {
        setTodos(prev => [...prev, ...data.todos]);
      } else {
        setTodos(data.todos);
      }

      setTotal(data.total);
      setOffset(offsetValue + data.todos.length);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error('Failed to fetch todos:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch todos');
      
      if (!append) {
        setTodos([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  // Fetch todo statistics
  const fetchStats = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/user/todos/stats');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch todo stats:', error);
    }
  }, []);

  // Main refetch function
  const refetch = useCallback(async (): Promise<void> => {
    setOffset(0);
    await Promise.all([
      fetchTodos(filters, 0, false),
      fetchStats()
    ]);
  }, [fetchTodos, fetchStats, filters]);

  // Load more todos (pagination)
  const loadMore = useCallback(async (): Promise<void> => {
    if (!loading && hasMore) {
      await fetchTodos(filters, offset, true);
    }
  }, [fetchTodos, filters, offset, loading]);

  // Update todo status
  const updateTodoStatus = useCallback(async (todoId: string, status: TodoStatus): Promise<void> => {
    try {
      setError(null);

      const response = await fetch(`/api/user/todos/${todoId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update todo status');
      }

      // Update local state
      setTodos(prev => prev.map(todo => 
        todo.id === todoId ? { ...todo, status, updated_at: new Date() } : todo
      ));

      // Refresh stats
      await fetchStats();

    } catch (error) {
      console.error('Failed to update todo status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update todo status');
      throw error;
    }
  }, [fetchStats]);

  // Bulk update todo statuses
  const bulkUpdateStatus = useCallback(async (todoIds: string[], status: 'completed' | 'dismissed'): Promise<void> => {
    try {
      setError(null);

      const response = await fetch('/api/user/todos/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ todo_ids: todoIds, status })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to bulk update todos');
      }

      // Update local state
      setTodos(prev => prev.map(todo => 
        todoIds.includes(todo.id) 
          ? { ...todo, status, updated_at: new Date() }
          : todo
      ));

      // Refresh stats
      await fetchStats();

    } catch (error) {
      console.error('Failed to bulk update todos:', error);
      setError(error instanceof Error ? error.message : 'Failed to bulk update todos');
      throw error;
    }
  }, [fetchStats]);

  // Create new todo
  const createTodo = useCallback(async (input: CreateTodoInput): Promise<Todo> => {
    try {
      setError(null);

      const response = await fetch('/api/user/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create todo');
      }

      const newTodo = data.todo;

      // Add to local state
      setTodos(prev => [newTodo, ...prev]);
      setTotal(prev => prev + 1);

      // Refresh stats
      await fetchStats();

      return newTodo;

    } catch (error) {
      console.error('Failed to create todo:', error);
      setError(error instanceof Error ? error.message : 'Failed to create todo');
      throw error;
    }
  }, [fetchStats]);

  // Handle filter changes
  const handleSetFilters = useCallback((newFilters: TodoFilterState) => {
    setFilters(newFilters);
    setOffset(0);
  }, []);

  // No automatic initial load - only manual refresh

  // No auto-refresh - only manual refresh

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Calculate hasMore
  const hasMore = offset < total;

  return {
    // Data
    todos,
    stats,
    
    // State
    loading,
    error,
    total,
    hasMore,
    
    // Actions
    refetch,
    loadMore,
    updateTodoStatus,
    bulkUpdateStatus,
    createTodo,
    
    // Filters
    filters,
    setFilters: handleSetFilters
  };
}

// Utility hook for todo actions
export function useTodoActions() {
  const updateStatus = useCallback(async (todoId: string, status: TodoStatus) => {
    const response = await fetch(`/api/user/todos/${todoId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to update todo status');
    }

    return response.json();
  }, []);

  const completeTodo = useCallback((todoId: string) => updateStatus(todoId, 'completed'), [updateStatus]);
  const dismissTodo = useCallback((todoId: string) => updateStatus(todoId, 'dismissed'), [updateStatus]);
  const startTodo = useCallback((todoId: string) => updateStatus(todoId, 'in_progress'), [updateStatus]);

  return {
    updateStatus,
    completeTodo,
    dismissTodo,
    startTodo
  };
}

// Utility hook for todo filtering
export function useTodoFilters() {
  const [filters, setFilters] = useState<TodoFilterState>({});

  const filterByStatus = useCallback((status: TodoStatus[]) => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  const filterByCategory = useCallback((category: any[]) => {
    setFilters(prev => ({ ...prev, category }));
  }, []);

  const filterByPriority = useCallback((priority: any[]) => {
    setFilters(prev => ({ ...prev, priority }));
  }, []);

  const showOverdueOnly = useCallback((overdue: boolean) => {
    setFilters(prev => ({ ...prev, overdue_only: overdue }));
  }, []);

  const showDueSoonOnly = useCallback((dueSoon: boolean) => {
    setFilters(prev => ({ ...prev, due_soon_only: dueSoon }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    filters,
    setFilters,
    filterByStatus,
    filterByCategory,
    filterByPriority,
    showOverdueOnly,
    showDueSoonOnly,
    clearFilters
  };
}