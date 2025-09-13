/**
 * FollowUpPanel Component
 * Main email follow-up tracking panel with 3-tab layout
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Send, CheckCircle, XCircle, Search, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { useFollowUps } from '@/hooks/useFollowUps';
import FollowUpTable from './FollowUpTable';

export interface FollowUpPanelProps {
  className?: string;
  maxHeight?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

type SortOption = 'due_date_asc' | 'due_date_desc' | 'sent_date_asc' | 'sent_date_desc' | 'client_name_asc' | 'client_name_desc';

const FollowUpPanel: React.FC<FollowUpPanelProps> = ({
  className = '',
  maxHeight = '600px',
  autoRefresh = true,
  refreshInterval = 60000
}) => {
  const [activeTab, setActiveTab] = useState<'follow_up' | 'completed' | 'no_response'>('follow_up');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('due_date_asc');
  
  const {
    followUps,
    stats,
    loading,
    error,
    refetch,
    updateFollowUp
  } = useFollowUps({
    autoRefresh,
    refreshInterval
  });

  const handleAction = async (followUpId: string, action: string, data?: any) => {
    try {
      await updateFollowUp(followUpId, action, data);
    } catch (error) {
      console.error('Failed to update follow-up:', error);
    }
  };

  // Filter and sort follow-ups
  const filterAndSortFollowUps = useMemo(() => {
    return (items: any[]) => {
      // First, filter by search query
      let filtered = items;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = items.filter(item =>
          item.client_name?.toLowerCase().includes(query) ||
          item.client_email?.toLowerCase().includes(query) ||
          item.email_subject?.toLowerCase().includes(query)
        );
      }

      // Then, sort by selected option
      const sorted = [...filtered];
      switch (sortOption) {
        case 'due_date_asc':
          sorted.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
          break;
        case 'due_date_desc':
          sorted.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
          break;
        case 'sent_date_asc':
          sorted.sort((a, b) => new Date(a.sent_date).getTime() - new Date(b.sent_date).getTime());
          break;
        case 'sent_date_desc':
          sorted.sort((a, b) => new Date(b.sent_date).getTime() - new Date(a.sent_date).getTime());
          break;
        case 'client_name_asc':
          sorted.sort((a, b) => (a.client_name || '').localeCompare(b.client_name || ''));
          break;
        case 'client_name_desc':
          sorted.sort((a, b) => (b.client_name || '').localeCompare(a.client_name || ''));
          break;
      }

      return sorted;
    };
  }, [searchQuery, sortOption]);

  // Apply filters and sorting to follow-ups
  const processedFollowUps = useMemo(() => ({
    pending: filterAndSortFollowUps(followUps.pending),
    completed: filterAndSortFollowUps(followUps.completed),
    noResponse: filterAndSortFollowUps(followUps.noResponse)
  }), [followUps, filterAndSortFollowUps]);

  const getTabCount = (tab: string): number => {
    switch (tab) {
      case 'follow_up':
        return processedFollowUps.pending.length;
      case 'completed':
        return processedFollowUps.completed.length;
      case 'no_response':
        return processedFollowUps.noResponse.length;
      default:
        return 0;
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'follow_up':
        return Send;
      case 'completed':
        return CheckCircle;
      case 'no_response':
        return XCircle;
      default:
        return Send;
    }
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
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 
                className="text-xl font-bold"
                style={{ color: '#243F7B', fontFamily: 'Inter, sans-serif' }}
              >
                Email Response Tracker
              </h3>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                Track and manage client email responses
              </p>
            </div>
          </div>
          
          <motion.button
            className="p-2 rounded-lg hover:bg-white/50 transition-colors border border-gray-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refetch}
            disabled={loading}
            title="Refresh follow-ups"
          >
            <RefreshCw className={`w-5 h-5 text-gray-700 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>

        {/* Search and Sort Controls */}
        <div className="mt-4 flex flex-col lg:flex-row gap-3">
          {/* Search Box */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by client name, email, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] text-sm"
                onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
              {searchQuery && (
                <motion.button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery('')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="pl-10 pr-10 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] text-sm appearance-none cursor-pointer"
              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <option value="due_date_asc">Due Date (Earliest First)</option>
              <option value="due_date_desc">Due Date (Latest First)</option>
              <option value="sent_date_asc">Sent Date (Oldest First)</option>
              <option value="sent_date_desc">Sent Date (Newest First)</option>
              <option value="client_name_asc">Client Name (A-Z)</option>
              <option value="client_name_desc">Client Name (Z-A)</option>
            </select>
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              {sortOption.includes('asc') ? (
                <ArrowUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ArrowDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex space-x-1 rounded-lg p-1">
          {[
            { key: 'follow_up', label: 'Awaiting Response' },
            { key: 'completed', label: 'Completed' },
            { key: 'no_response', label: 'No Response (3 attempts)' }
          ].map(({ key, label }) => {
            const isActive = activeTab === key;
            const count = getTabCount(key);
            const IconComponent = getTabIcon(key);
            
            return (
              <motion.button
                key={key}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
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
                <IconComponent className="w-4 h-4" />
                {label}
                {count > 0 && (
                  <span
                    className="ml-1 px-2 py-0.5 text-xs rounded-full font-semibold"
                    style={{
                      backgroundColor: '#D2BC99',
                      color: '#243F7B'
                    }}
                  >
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="mt-3 flex gap-4 text-xs items-center">
            {stats.overdue_count > 0 && (
              <span className="text-red-600 font-medium">
                {stats.overdue_count} overdue
              </span>
            )}
            {stats.due_today_count > 0 && (
              <span className="text-orange-600 font-medium">
                {stats.due_today_count} due today
              </span>
            )}
            <span className="text-gray-500">
              {stats.total_pending} pending total
            </span>
            {searchQuery && (
              <span className="ml-auto text-blue-600 font-medium flex items-center gap-1">
                <Search className="w-3 h-3" />
                Filtered results
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div 
        className="overflow-y-auto overflow-x-hidden"
        style={{ maxHeight }}
      >
        {loading && followUps.pending.length === 0 && (
          <div className="p-8">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-100 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        )}


        {!loading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Show setup message only if no stats exist (table not initialized) */}
              {!stats && followUps.pending.length === 0 && followUps.completed.length === 0 && followUps.noResponse.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="text-gray-400 mb-4">
                      <Send className="w-12 h-12 mx-auto" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Follow-up System Ready
                    </h4>
                    <p className="text-xs text-gray-500 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                      When you send emails with attachments, follow-ups will automatically appear here.
                    </p>
                    <div className="text-xs text-gray-400 p-3 bg-gray-50 rounded-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <p className="mb-2">To initialize the database tables:</p>
                      <code className="text-xs bg-white px-2 py-1 rounded font-mono border border-gray-200">
                        npm run migrate:follow-ups
                      </code>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'follow_up' && (
                    <FollowUpTable
                      followUps={processedFollowUps.pending}
                      onAction={handleAction}
                      emptyMessage={searchQuery ? `No pending follow-ups found for "${searchQuery}"` : "No pending follow-ups. Great job staying on top of client communication!"}
                      loading={loading}
                    />
                  )}

                  {activeTab === 'completed' && (
                    <FollowUpTable
                      followUps={processedFollowUps.completed}
                      onAction={handleAction}
                      variant="completed"
                      emptyMessage={searchQuery ? `No completed follow-ups found for "${searchQuery}"` : "No completed follow-ups yet."}
                      loading={loading}
                    />
                  )}

                  {activeTab === 'no_response' && (
                    <FollowUpTable
                      followUps={processedFollowUps.noResponse}
                      onAction={handleAction}
                      variant="no_response"
                      emptyMessage={searchQuery ? `No non-responsive clients found for "${searchQuery}"` : "No clients have been marked as non-responsive."}
                      loading={loading}
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default FollowUpPanel;