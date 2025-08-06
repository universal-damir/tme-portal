/**
 * TodoStats Component
 * Displays todo statistics with TME Design System styling
 * Phase 3: Frontend Components Implementation
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, Target, TrendingUp } from 'lucide-react';
import { TodoStats as TodoStatsType } from '@/types/todo';

export interface TodoStatsProps {
  stats: TodoStatsType;
  loading?: boolean;
  showInsights?: boolean;
  className?: string;
}

const TodoStats: React.FC<TodoStatsProps> = ({ 
  stats, 
  loading = false, 
  showInsights = true, 
  className = '' 
}) => {
  // Calculate additional metrics
  const activeTodos = stats.pending_count + stats.in_progress_count;
  const completionRate = stats.total_todos > 0 
    ? Math.round((stats.completed_count / stats.total_todos) * 100) 
    : 0;

  const priorityLevel = stats.overdue_count > 5 ? 'critical' : 
                       stats.overdue_count > 2 ? 'high' : 
                       stats.overdue_count > 0 ? 'medium' : 'normal';

  const workloadLevel = activeTodos > 10 ? 'heavy' : 
                       activeTodos > 5 ? 'moderate' : 'light';

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-lg">
                <div className="h-8 bg-gray-300 rounded-full w-8 mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-12 mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Active Tasks',
      value: activeTodos,
      icon: Target,
      color: activeTodos > 10 ? '#EF4444' : activeTodos > 5 ? '#F59E0B' : '#243F7B',
      bgColor: activeTodos > 10 ? '#FEF2F2' : activeTodos > 5 ? '#FFFBEB' : '#F8FAFC'
    },
    {
      label: 'Completed',
      value: stats.completed_count,
      icon: CheckCircle,
      color: '#10B981',
      bgColor: '#ECFDF5'
    },
    {
      label: 'Overdue',
      value: stats.overdue_count,
      icon: AlertTriangle,
      color: stats.overdue_count > 0 ? '#EF4444' : '#6B7280',
      bgColor: stats.overdue_count > 0 ? '#FEF2F2' : '#F9FAFB',
      urgent: stats.overdue_count > 0
    },
    {
      label: 'Due Soon',
      value: stats.due_soon_count,
      icon: Clock,
      color: stats.due_soon_count > 0 ? '#F59E0B' : '#6B7280',
      bgColor: stats.due_soon_count > 0 ? '#FFFBEB' : '#F9FAFB'
    }
  ];

  return (
    <motion.div 
      className={`space-y-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 
          className="text-lg font-semibold" 
          style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}
        >
          Task Overview
        </h3>
        {completionRate > 0 && (
          <motion.div 
            className="flex items-center gap-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span 
              className="text-sm font-medium"
              style={{ color: '#10B981', fontFamily: 'Inter, sans-serif' }}
            >
              {completionRate}% Complete
            </span>
          </motion.div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.label}
            className="relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md"
            style={{ 
              backgroundColor: card.bgColor,
              borderColor: card.urgent ? card.color : '#E5E7EB'
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            {/* Urgent indicator */}
            {card.urgent && (
              <motion.div 
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
            
            <div className="flex items-start justify-between">
              <div>
                <motion.div 
                  className="text-2xl font-bold mb-1"
                  style={{ color: card.color, fontFamily: 'Inter, sans-serif' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {card.value}
                </motion.div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}
                >
                  {card.label}
                </div>
              </div>
              <card.icon 
                className="w-6 h-6" 
                style={{ color: card.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Insights Section */}
      {showInsights && stats.total_todos > 0 && (
        <motion.div
          className="p-4 rounded-lg border border-gray-200 bg-white"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.5 }}
        >
          <h4 
            className="text-sm font-semibold mb-3"
            style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}
          >
            Productivity Insights
          </h4>
          
          <div className="space-y-2">
            {/* Completion Rate */}
            <div className="flex items-center justify-between">
              <span 
                className="text-sm"
                style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}
              >
                Completion Rate
              </span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                  />
                </div>
                <span 
                  className="text-sm font-medium"
                  style={{ color: '#10B981', fontFamily: 'Inter, sans-serif' }}
                >
                  {completionRate}%
                </span>
              </div>
            </div>

            {/* Workload Level */}
            <div className="flex items-center justify-between">
              <span 
                className="text-sm"
                style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}
              >
                Current Workload
              </span>
              <span 
                className={`text-sm font-medium px-2 py-1 rounded-full ${
                  workloadLevel === 'heavy' ? 'bg-red-100 text-red-700' :
                  workloadLevel === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {workloadLevel.charAt(0).toUpperCase() + workloadLevel.slice(1)}
              </span>
            </div>

            {/* Priority Alert */}
            {priorityLevel !== 'normal' && (
              <motion.div 
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  priorityLevel === 'critical' ? 'bg-red-50 border border-red-200' :
                  priorityLevel === 'high' ? 'bg-orange-50 border border-orange-200' :
                  'bg-yellow-50 border border-yellow-200'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <AlertTriangle className={`w-4 h-4 ${
                  priorityLevel === 'critical' ? 'text-red-500' :
                  priorityLevel === 'high' ? 'text-orange-500' :
                  'text-yellow-500'
                }`} />
                <span 
                  className={`text-sm font-medium ${
                    priorityLevel === 'critical' ? 'text-red-700' :
                    priorityLevel === 'high' ? 'text-orange-700' :
                    'text-yellow-700'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {stats.overdue_count} overdue task{stats.overdue_count !== 1 ? 's' : ''} need{stats.overdue_count === 1 ? 's' : ''} immediate attention
                </span>
              </motion.div>
            )}

            {/* Positive reinforcement */}
            {priorityLevel === 'normal' && completionRate > 70 && (
              <motion.div 
                className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span 
                  className="text-sm font-medium text-green-700"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Great job! You're staying on top of your tasks
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {stats.total_todos === 0 && (
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p 
            className="text-sm text-gray-500"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            No tasks yet. New todos will appear here automatically
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TodoStats;