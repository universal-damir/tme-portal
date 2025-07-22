'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  isLoading = false,
  placeholder = "Type your request... (e.g., '2 visa quote, IFZA')",
  compact = false
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || disabled || isLoading) {
      return;
    }

    const messageToSend = message.trim();
    setMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await onSendMessage(messageToSend);
    } catch (error) {
      // Error will be handled by the parent component
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  return (
    <div className={cn(
      "bg-white",
      !compact && "border-t border-gray-200 p-4"
    )}>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              "min-h-[44px] max-h-[150px] resize-none pr-12 text-sm",
              "focus:ring-purple-500 focus:border-purple-500",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            rows={1}
          />
          
          {/* Quick examples */}
          {!message && (
            <div className="absolute inset-x-0 top-full mt-2 text-xs text-gray-400">
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setMessage('2 visa quote, IFZA')}>
                  &quot;2 visa quote, IFZA&quot;
                </span>
                <span className="px-2 py-1 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setMessage('DET commercial license')}>
                  &quot;DET commercial license&quot;
                </span>
                <span className="px-2 py-1 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setMessage('IFZA with spouse visa')}>
                  &quot;IFZA with spouse visa&quot;
                </span>
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={!message.trim() || disabled || isLoading}
          className={cn(
            "h-11 w-11 p-0 bg-purple-600 hover:bg-purple-700",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};