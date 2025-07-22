'use client';

import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatMessage as ChatMessageType } from '@/types/ai-assistant';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Bot, Trash2, Sparkles } from 'lucide-react';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessageType[];
  onSendMessage: (message: string) => Promise<void>;
  onClearHistory: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isOpen,
  onClose,
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const hasMessages = messages.length > 0;

  return (
    <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[480px] p-0 flex flex-col h-full shadow-2xl border-l-2 border-purple-200"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bot className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold text-gray-900">
                  AI Assistant
                </SheetTitle>
                <SheetDescription className="text-sm text-gray-600">
                  Fill your form with natural language
                </SheetDescription>
              </div>
            </div>
            
            {hasMessages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearHistory}
                className="text-gray-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-gradient-to-b from-purple-50/20 to-white"
        >
          {!hasMessages ? (
            // Welcome screen
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to AI Assistant
                </h3>
                <p className="text-gray-600 text-sm max-w-sm">
                  Tell me what kind of UAE business setup you need, and I&apos;ll fill out the form and generate a PDF preview automatically.
                </p>
              </div>

              {/* Examples */}
              <div className="w-full max-w-sm space-y-3">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Try these examples:
                </p>
                <div className="space-y-2">
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
                      <span className="text-gray-600">&quot;{example}&quot;</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Messages list
            <div className="space-y-1">
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
        <ChatInput
          onSendMessage={onSendMessage}
          disabled={isLoading}
          isLoading={isLoading}
          placeholder={hasMessages 
            ? "Continue the conversation..." 
            : "Describe your UAE business setup needs..."
          }
        />
      </SheetContent>
    </Sheet>
  );
};