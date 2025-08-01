'use client';

import React from 'react';
import { ChatMessage as ChatMessageType } from '@/types/ai-assistant';
import { Bot, User, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/ui/user-avatar';

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
  const { user } = useAuth();

  return (
    <div className={cn(
      "flex gap-3 p-4",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      {showAvatar && (
        <div className="h-8 w-8 flex-shrink-0">
          {isUser ? (
            user ? (
              <UserAvatar user={user} size="sm" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="h-4 w-4" style={{ color: '#243F7B' }} />
              </div>
            )
          ) : (
            <div 
              className="h-8 w-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#243F7B' }}
            >
              <Bot className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        "flex flex-col gap-1 max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Message bubble */}
        <div 
          className={cn(
            "px-4 py-2 rounded-lg text-sm leading-relaxed",
            isUser ? (
              "text-white rounded-br-sm"
            ) : (
              "bg-gray-100 text-gray-900 rounded-bl-sm border border-gray-200"
            ),
            isLoading && "opacity-70"
          )}
          style={isUser ? { backgroundColor: '#243F7B' } : {}}
        >
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