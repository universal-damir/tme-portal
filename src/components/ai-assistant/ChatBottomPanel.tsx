'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatMessage as ChatMessageType } from '@/types/ai-assistant';
import { Bot, Trash2, Sparkles, Minimize2, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatBottomPanelProps {
  isOpen: boolean;
  isMinimized: boolean;
  onClose: () => void;
  onToggleMinimize: () => void;
  messages: ChatMessageType[];
  onSendMessage: (message: string) => Promise<void>;
  onClearHistory: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const ChatBottomPanel: React.FC<ChatBottomPanelProps> = ({
  isOpen,
  isMinimized,
  onClose,
  onToggleMinimize,
  messages,
  onSendMessage,
  onClearHistory,
  isLoading = false,
  error = null
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const hasMessages = messages.length > 0;

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={cn(
        "fixed bottom-0 bg-white shadow-2xl z-30",
        "transition-all duration-300 ease-in-out",
        "rounded-t-2xl border-x-2 border-t-2",
        isMinimized ? "h-14" : "h-96"
      )}
      style={{
        left: 'calc(var(--sidebar-width, 280px) + (100vw - var(--sidebar-width, 280px)) / 2)',
        transform: 'translateX(-50%)',
        width: 'min(600px, calc(100vw - var(--sidebar-width, 280px) - 4rem))',
        borderColor: '#e5e7eb',
        boxShadow: '0 -8px 32px rgba(36, 63, 123, 0.15)',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      {/* Header Bar */}
      <div 
        className="h-14 px-6 flex items-center justify-between border-b border-gray-200 rounded-t-2xl"
        style={{ backgroundColor: '#f8fafc' }}
      >
        {/* Left side - Title and status */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg shadow-sm" style={{ backgroundColor: '#243F7B' }}>
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: '#243F7B' }}>
              Quick PDF Form Assistant
            </h3>
            <p className="text-xs text-gray-600">
              {isLoading ? 'Processing...' : hasMessages ? `${messages.length} entries` : 'Ready to populate'}
            </p>
          </div>
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: '#243F7B' }} />
              <div className="w-1 h-1 rounded-full animate-pulse delay-100" style={{ backgroundColor: '#243F7B' }} />
              <div className="w-1 h-1 rounded-full animate-pulse delay-200" style={{ backgroundColor: '#243F7B' }} />
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {hasMessages && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClearHistory}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
              title="Clear chat history"
            >
              <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-600" />
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleMinimize}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? (
              <Maximize2 className="h-3 w-3" style={{ color: '#243F7B' }} />
            ) : (
              <Minimize2 className="h-3 w-3" style={{ color: '#243F7B' }} />
            )}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
            title="Close Form Assistant"
          >
            <X className="h-3 w-3" style={{ color: '#243F7B' }} />
          </motion.button>
        </div>
      </div>

      {/* Content Area - only shown when not minimized */}
      {!isMinimized && (
        <div className="h-[calc(100%-3.5rem)] flex flex-col">
          {/* Messages Area */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/20 to-white"
          >
            {!hasMessages ? (
              // Welcome screen
              <div className="h-full flex items-center justify-center p-6">
                <div className="max-w-2xl mx-auto text-center">
                  <div className="mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto shadow-lg"
                      style={{ backgroundColor: '#f8fafc' }}
                    >
                      <Sparkles className="h-6 w-6" style={{ color: '#243F7B' }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#243F7B' }}>
                      Quick PDF Form Assistant
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Enter client requirements and I&apos;ll populate the form fields automatically.
                    </p>
                  </div>

                  {/* Examples Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
                    <p 
                      className="col-span-full text-xs font-medium uppercase tracking-wide mb-2"
                      style={{ color: '#243F7B' }}
                    >
                      COMMON SETUPS:
                    </p>
                    {[
                      "Individual shareholder, IFZA, two visa quota, one visa",
                      "Corporate shareholder, DET, two investor visas",
                      "Mainland LLC, Dubai, activities tbc, two employment visas",
                      "IFZA, individual, two visa quota, two investor visa, one reduced visa cost"
                    ].map((example, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-3 bg-white rounded-lg border border-gray-200 text-sm text-left cursor-pointer hover:shadow-md transition-all duration-200"
                        onClick={() => onSendMessage(example)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#243F7B';
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        <span className="text-gray-700 text-xs">&quot;{example}&quot;</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Messages list
              <div className="p-4 space-y-2">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    showAvatar={true}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="mx-4 mb-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <strong>Error:</strong> {error}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <ChatInput
              onSendMessage={onSendMessage}
              disabled={isLoading}
              isLoading={isLoading}
              placeholder={hasMessages 
                ? "Add more requirements..." 
                : "Enter client requirements..."
              }
              compact={true}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};