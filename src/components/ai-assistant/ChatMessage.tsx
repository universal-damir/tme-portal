'use client';

import React from 'react';
import { ChatMessage as ChatMessageType } from '@/types/ai-assistant';
import { Avatar } from '@/components/ui/avatar';
import { Bot, User, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
  showAvatar?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  showAvatar = true 
}) => {
  const isUser = message.role === 'user';
  const isLoading = message.isLoading;

  return (
    <div className={cn(
      "flex gap-3 p-4",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      {showAvatar && (
        <Avatar className={cn(
          "h-8 w-8 flex-shrink-0",
          isUser ? "bg-blue-100" : "bg-purple-100"
        )}>
          {isUser ? (
            <User className="h-4 w-4 text-blue-600" />
          ) : (
            <Bot className="h-4 w-4 text-purple-600" />
          )}
        </Avatar>
      )}

      {/* Message Content */}
      <div className={cn(
        "flex flex-col gap-1 max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Message bubble */}
        <div className={cn(
          "px-4 py-2 rounded-lg text-sm leading-relaxed",
          isUser ? (
            "bg-blue-600 text-white rounded-br-sm"
          ) : (
            "bg-gray-100 text-gray-900 rounded-bl-sm border border-gray-200"
          ),
          isLoading && "opacity-70"
        )}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">AI is thinking...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )}
        </div>

        {/* Timestamp and status */}
        <div className={cn(
          "flex items-center gap-1 text-xs text-gray-400",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          {isUser && !isLoading && (
            <CheckCircle className="h-3 w-3 text-green-500" />
          )}
        </div>
      </div>
    </div>
  );
};