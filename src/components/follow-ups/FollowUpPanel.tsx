/**
 * FollowUpPanel Component
 * Main email follow-up tracking panel with 3-tab layout
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Send, CheckCircle, XCircle } from 'lucide-react';
import { useFollowUps } from '@/hooks/useFollowUps';
import FollowUpTable from './FollowUpTable';

export interface FollowUpPanelProps {
  className?: string;
  maxHeight?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const FollowUpPanel: React.FC<FollowUpPanelProps> = ({
  className = '',
  maxHeight = '600px',
  autoRefresh = true,
  refreshInterval = 60000
}) => {
  const [activeTab, setActiveTab] = useState<'follow_up' | 'completed' | 'no_response'>('follow_up');
  
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

  const getTabCount = (tab: string): number => {
    switch (tab) {
      case 'follow_up':
        return followUps.pending.length;
      case 'completed':
        return followUps.completed.length;
      case 'no_response':
        return followUps.noResponse.length;
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
                  backgroundColor: isActive ? '#374151' : 'transparent'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(key as any)}
              >
                <IconComponent className="w-4 h-4" />
                {label}
                {count > 0 && (
                  <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="mt-3 flex gap-4 text-xs">
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
                      followUps={followUps.pending}
                      onAction={handleAction}
                      emptyMessage="No pending follow-ups. Great job staying on top of client communication!"
                      loading={loading}
                    />
                  )}

                  {activeTab === 'completed' && (
                    <FollowUpTable
                      followUps={followUps.completed}
                      onAction={handleAction}
                      variant="completed"
                      emptyMessage="No completed follow-ups yet."
                      loading={loading}
                    />
                  )}

                  {activeTab === 'no_response' && (
                    <FollowUpTable
                      followUps={followUps.noResponse}
                      onAction={handleAction}
                      variant="no_response"
                      emptyMessage="No clients have been marked as non-responsive."
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