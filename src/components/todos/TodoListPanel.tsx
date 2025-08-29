/**
 * TodoListPanel Component
 * Main todo container with filtering, stats, and list management
 * Phase 3: Frontend Components Implementation
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Filter, CheckSquare, Trash2, RefreshCw } from 'lucide-react';
import { Todo, TodoFilterState, TodoStats as TodoStatsType, TodoStatus } from '@/types/todo';
import { useTodos } from '@/hooks/useTodos';
import TodoItem from './TodoItem';
import TodoStatsComponent from './TodoStats';

export interface TodoListPanelProps {
  className?: string;
  maxHeight?: string;
  showFilters?: boolean;
  autoRefresh?: boolean;
}

const TodoListPanel: React.FC<TodoListPanelProps> = ({
  className = '',
  maxHeight = '600px',
  showFilters = true,
  autoRefresh = true
}) => {
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'completed'>('all');
  
  const {
    todos,
    stats,
    loading,
    error,
    total,
    hasMore,
    refetch,
    loadMore,
    updateTodoStatus,
    bulkUpdateStatus,
    filters,
    setFilters
  } = useTodos({
    autoRefresh: false,
    initialLoad: true
  });

  // Show all todos (filtering is now handled by tabs)
  const filteredTodos = useMemo(() => {
    if (!todos) return [];
    return todos; // Show all todos, tabs will handle the filtering
  }, [todos]);

  // Group todos by tab categories
  const tabGroups = useMemo(() => {
    const groups = {
      all: [] as Todo[],
      completed: [] as Todo[]
    };

    filteredTodos.forEach(todo => {
      if (todo.status === 'completed' || todo.status === 'dismissed') {
        groups.completed.push(todo);
      } else {
        groups.all.push(todo);
      }
    });

    return groups;
  }, [filteredTodos]);

  const handleTodoSelect = (todoId: string) => {
    setSelectedTodos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(todoId)) {
        newSet.delete(todoId);
      } else {
        newSet.add(todoId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const activeIds = filteredTodos
      .filter(todo => todo.status !== 'completed' && todo.status !== 'dismissed')
      .map(todo => todo.id);
    
    setSelectedTodos(new Set(activeIds));
  };

  const handleDeselectAll = () => {
    setSelectedTodos(new Set());
  };

  const handleBulkComplete = async () => {
    if (selectedTodos.size === 0) return;
    
    try {
      await bulkUpdateStatus(Array.from(selectedTodos), 'completed');
      setSelectedTodos(new Set());
    } catch (error) {
      console.error('Failed to bulk complete todos:', error);
    }
  };

  const handleBulkDismiss = async () => {
    if (selectedTodos.size === 0) return;
    
    try {
      await bulkUpdateStatus(Array.from(selectedTodos), 'dismissed');
      setSelectedTodos(new Set());
    } catch (error) {
      console.error('Failed to bulk dismiss todos:', error);
    }
  };

  const handleStatusUpdate = async (todoId: string, status: TodoStatus) => {
    try {
      await updateTodoStatus(todoId, status);
      // Remove from selection if it was selected
      if (selectedTodos.has(todoId)) {
        setSelectedTodos(prev => {
          const newSet = new Set(prev);
          newSet.delete(todoId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to update todo status:', error);
    }
  };

  const renderTodoGroup = (title: string, todos: Todo[], icon?: React.ReactNode, color?: string) => {
    if (todos.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h4 
            className="font-semibold text-sm"
            style={{ color: color || '#243F7B', fontFamily: 'Inter, sans-serif' }}
          >
            {title} ({todos.length})
          </h4>
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {todos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onStatusUpdate={(status) => handleStatusUpdate(todo.id, status)}
                onSelect={() => handleTodoSelect(todo.id)}
                selected={selectedTodos.has(todo.id)}
                showActions={true}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-full overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#243F7B' }}>
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 
                className="text-xl font-bold"
                style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}
              >
                My Tasks
              </h3>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                Stay organized and track your progress
              </p>
            </div>
          </div>
          
          <motion.button
            className="p-2 rounded-lg hover:bg-white/50 transition-colors border border-gray-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refetch}
            disabled={loading}
            title="Refresh tasks"
          >
            <RefreshCw className={`w-5 h-5 text-gray-700 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex space-x-1 rounded-lg p-1">
          {[
            { key: 'all', label: 'All', count: tabGroups.all.length },
            { key: 'completed', label: 'Completed', count: tabGroups.completed.length }
          ].map(({ key, label, count }) => {
            const isActive = activeTab === key;
            const showCount = key === 'all' || count > 0;
            
            return (
              <motion.button
                key={key}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  isActive 
                    ? 'text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  backgroundColor: isActive ? '#243F7B' : 'transparent'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(key as any)}
              >
                {label} {showCount && `(${count})`}
              </motion.button>
            );
          })}
        </div>

        {/* Bulk actions */}
        {selectedTodos.size > 0 && (
          <motion.div
            className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center justify-between">
              <span 
                className="text-sm font-medium text-blue-700"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {selectedTodos.size} task{selectedTodos.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                {/* Only show Complete/Dismiss buttons if there are non-completed tasks selected */}
                {Array.from(selectedTodos).some(todoId => {
                  const todo = filteredTodos.find(t => t.id === todoId);
                  return todo && todo.status !== 'completed' && todo.status !== 'dismissed';
                }) && (
                  <>
                    <motion.button
                      className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBulkComplete}
                    >
                      <CheckSquare className="w-4 h-4 inline mr-1" />
                      Complete
                    </motion.button>
                    <motion.button
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBulkDismiss}
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      Dismiss
                    </motion.button>
                  </>
                )}
                <button
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  onClick={handleDeselectAll}
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>


      {/* Todo list */}
      <div 
        className="p-4 overflow-y-auto overflow-x-hidden"
        style={{ maxHeight }}
      >
        {loading && filteredTodos.length === 0 && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse p-4 rounded-lg bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <motion.div
            className="p-4 bg-red-50 border border-red-200 rounded-lg text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-sm text-red-700 font-medium mb-2">Failed to load tasks</p>
            <p className="text-xs text-red-600">{error}</p>
            <motion.button
              className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refetch}
            >
              Try Again
            </motion.button>
          </motion.div>
        )}

        {!loading && !error && filteredTodos.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h4 
              className="text-lg font-medium text-gray-900 mb-2"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              No tasks found
            </h4>
            <p 
              className="text-sm text-gray-500"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {activeTab === 'all' && 'Click the refresh button to load your tasks'}
              {activeTab === 'completed' && 'Completed tasks will appear here after you complete them'}
            </p>
          </motion.div>
        )}

        {!loading && !error && tabGroups[activeTab].length > 0 && (
          <div>
            <AnimatePresence mode="wait">
              {tabGroups[activeTab].map((todo, index) => (
                <div key={todo.id} className={index === tabGroups[activeTab].length - 1 ? '' : 'border-b border-gray-200'}>
                  <TodoItem
                    todo={todo}
                    onStatusUpdate={(status) => handleStatusUpdate(todo.id, status)}
                    onSelect={() => handleTodoSelect(todo.id)}
                    selected={selectedTodos.has(todo.id)}
                    showActions={true}
                    variant="minimal"
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Load more button */}
        {hasMore && !loading && (
          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.button
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadMore}
            >
              Load More Tasks
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Selection helper */}
      {filteredTodos.filter(t => t.status !== 'completed' && t.status !== 'dismissed').length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span 
              className="text-xs text-gray-500"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {tabGroups[activeTab].length} {activeTab} tasks
            </span>
            <div className="flex items-center gap-2">
              {activeTab !== 'completed' && (
                <button
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  onClick={handleSelectAll}
                >
                  Select All
                </button>
              )}
              {selectedTodos.size > 0 && (
                <button
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                  onClick={handleDeselectAll}
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TodoListPanel;