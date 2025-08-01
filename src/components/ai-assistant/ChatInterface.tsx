'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatBottomPanel } from './ChatBottomPanel';
import { ChatFloatingButton } from './ChatFloatingButton';
import { ChatMessage as ChatMessageType } from '@/types/ai-assistant';
import { Bot, Trash2, Sparkles, X, Minimize2, Maximize2, CornerDownRight } from 'lucide-react';

type ChatMode = 'modal' | 'bottom-panel';

interface ChatInterfaceProps {
  mode?: ChatMode;
  isOpen: boolean;
  isMinimized?: boolean;
  onClose: () => void;
  onOpen?: () => void;
  onToggleMinimize?: () => void;
  messages: ChatMessageType[];
  onSendMessage: (message: string) => Promise<void>;
  onClearHistory: () => void;
  isLoading?: boolean;
  error?: string | null;
  hasUnreadMessages?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  mode = 'modal',
  isOpen,
  isMinimized = false,
  onClose,
  onOpen,
  onToggleMinimize,
  messages,
  onSendMessage,
  onClearHistory,
  isLoading = false,
  error = null,
  hasUnreadMessages = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Track window size for minimize positioning
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const hasMessages = messages.length > 0;

  // Bottom panel mode
  if (mode === 'bottom-panel') {
    return (
      <>
        {/* Only show floating button when panel is closed */}
        {!isOpen && (
          <ChatFloatingButton
            isOpen={isOpen}
            onClick={() => onOpen?.()}
            hasUnreadMessages={hasUnreadMessages}
          />
        )}
        <ChatBottomPanel
          isOpen={isOpen}
          isMinimized={isMinimized}
          onClose={onClose}
          onToggleMinimize={onToggleMinimize || (() => {})}
          messages={messages}
          onSendMessage={onSendMessage}
          onClearHistory={onClearHistory}
          isLoading={isLoading}
          error={error}
        />
      </>
    );
  }

  // Default modal mode
  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <ChatFloatingButton
          isOpen={isOpen}
          onClick={() => onOpen?.()}
          hasUnreadMessages={hasUnreadMessages}
        />
      )}

      {/* Modal overlay and content */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            
            {/* Modal */}
            <div className={`fixed z-50 bg-white shadow-2xl rounded-2xl flex flex-col ${
              isMinimized 
                ? 'bottom-6 right-6 w-80 h-20' 
                : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[700px]'
            }`}
            style={{ 
              fontFamily: 'Inter, sans-serif',
              resize: isMinimized ? 'none' : 'both',
              overflow: 'hidden',
              minWidth: isMinimized ? 'auto' : '400px',
              minHeight: isMinimized ? 'auto' : '500px',
              maxWidth: isMinimized ? 'auto' : '90vw',
              maxHeight: isMinimized ? 'auto' : '90vh'
            }}
            >
              {/* Header */}
              <div 
                className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 z-10"
                style={{ 
                  backgroundColor: '#f8fafc',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#243F7B' }}>
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  {!isMinimized && (
                    <div className="flex-1 cursor-move select-none">
                      <h3 className="text-lg font-semibold" style={{ color: '#243F7B' }}>
                        Quick PDF Form Assistant
                      </h3>
                      <p className="text-sm text-gray-600">
                        Enter client requirements to populate forms
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {hasMessages && !isMinimized && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClearHistory}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                      title="Clear History"
                    >
                      <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                    title="Minimize to floating bubble"
                  >
                    <Minimize2 className="h-4 w-4" style={{ color: '#243F7B' }} />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                    title="Close"
                  >
                    <X className="h-4 w-4" style={{ color: '#243F7B' }} />
                  </motion.button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Messages Area */}
                  <div 
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/20 to-white relative"
                    style={{ 
                      minHeight: '400px'
                    }}
                  >
                    {!hasMessages ? (
                      // Welcome screen
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                        <div className="mb-6">
                          <div 
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                            style={{ backgroundColor: '#f8fafc' }}
                          >
                            <Sparkles className="h-8 w-8" style={{ color: '#243F7B' }} />
                          </div>
                          <h3 className="text-xl font-semibold mb-2" style={{ color: '#243F7B' }}>
                            Quick PDF Form Assistant
                          </h3>
                          <p className="text-gray-600 text-sm max-w-sm">
                            Enter client requirements and I&apos;ll populate the form fields automatically.
                          </p>
                        </div>

                        {/* Examples */}
                        <div className="w-full max-w-sm space-y-3">
                          <p 
                            className="text-xs font-medium uppercase tracking-wide"
                            style={{ color: '#243F7B' }}
                          >
                            COMMON SETUPS:
                          </p>
                          <div className="space-y-2">
                            {[
                              "Individual shareholder, IFZA, two visa quota, one visa",
                              "Corporate shareholder, DET, two investor visas",
                              "Mainland LLC, Dubai, activities tbc, family visas",
                              "IFZA, individual, two visa quota, two investor visa, one reduced visa cost"
                            ].map((example, index) => (
                              <motion.div
                                key={index}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-3 bg-white rounded-lg border border-gray-200 text-sm text-left cursor-pointer hover:shadow-md hover:border-blue-600 hover:bg-slate-50 transition-all duration-200"
                                onClick={() => onSendMessage(example)}
                              >
                                <span className="text-gray-600">&quot;{example}&quot;</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Messages list
                      <div className="space-y-1 p-2">
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
                  <div 
                    className="border-t border-gray-200 bg-white"
                    style={{
                      borderBottomLeftRadius: '16px',
                      borderBottomRightRadius: '16px'
                    }}
                  >
                    <ChatInput
                      onSendMessage={onSendMessage}
                      disabled={isLoading}
                      isLoading={isLoading}
                      placeholder={hasMessages 
                        ? "Add more requirements..." 
                        : "Enter client requirements..."
                      }
                    />
                  </div>
                  
                  {/* Resize Handle */}
                  <div className="absolute bottom-2 right-2 opacity-30 hover:opacity-60 transition-opacity duration-200 pointer-events-none">
                    <CornerDownRight className="h-4 w-4 text-gray-400 rotate-90" />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};