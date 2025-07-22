'use client';

import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatMessage as ChatMessageType } from '@/types/ai-assistant';
import { Button } from '@/components/ui/button';
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
    <div 
      className={cn(
        "fixed bottom-0 bg-white border-t-2 border-purple-200 shadow-2xl z-30",
        "transition-all duration-300 ease-in-out",
        isMinimized ? "h-14" : "h-96"
      )}
      style={{
        left: 'var(--sidebar-width, 280px)',
        right: '0',
        boxShadow: '0 -8px 32px rgba(147, 51, 234, 0.15)'
      }}
    >
      {/* Header Bar */}
      <div className="h-14 px-6 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100">
        {/* Left side - Title and status */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg shadow-sm">
            <Bot className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              AI Assistant
            </h3>
            <p className="text-xs text-gray-600">
              {isLoading ? 'Thinking...' : hasMessages ? `${messages.length} messages` : 'Ready to help'}
            </p>
          </div>
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-100" />
              <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-200" />
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1">
          {hasMessages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearHistory}
              className="text-gray-500 hover:text-red-600 h-8 w-8 p-0"
              title="Clear chat history"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimize}
            className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? (
              <Maximize2 className="h-3 w-3" />
            ) : (
              <Minimize2 className="h-3 w-3" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 h-8 w-8 p-0"
            title="Close AI Assistant"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content Area - only shown when not minimized */}
      {!isMinimized && (
        <div className="h-[calc(100%-3.5rem)] flex flex-col">
          {/* Messages Area */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto bg-gradient-to-b from-purple-50/20 to-white"
          >
            {!hasMessages ? (
              // Welcome screen
              <div className="h-full flex items-center justify-center p-6">
                <div className="max-w-2xl mx-auto text-center">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center mb-3 mx-auto shadow-lg">
                      <Sparkles className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Welcome to AI Assistant
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Tell me what kind of UAE business setup you need, and I&apos;ll fill out the form and generate a PDF preview automatically.
                    </p>
                  </div>

                  {/* Examples Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
                    <p className="col-span-full text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                      Try these examples:
                    </p>
                    {[
                      "2 visa quote, IFZA",
                      "DET commercial license for tech company",
                      "IFZA setup with spouse and 2 child visas",
                      "Professional license for Ahmed's consultancy"
                    ].map((example, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white rounded-lg border border-gray-200 text-sm text-left cursor-pointer hover:bg-purple-50 hover:border-purple-200 hover:shadow-md transition-all duration-200 group"
                        onClick={() => onSendMessage(example)}
                      >
                        <span className="text-gray-700 text-xs">&quot;{example}&quot;</span>
                      </div>
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
          <div className="border-t border-purple-100 bg-white p-4">
            <ChatInput
              onSendMessage={onSendMessage}
              disabled={isLoading}
              isLoading={isLoading}
              placeholder={hasMessages 
                ? "Continue the conversation..." 
                : "Describe your UAE business setup needs..."
              }
              compact={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};