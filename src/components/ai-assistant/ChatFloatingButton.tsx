'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot, X, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatFloatingButtonProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnreadMessages?: boolean;
  className?: string;
}

export const ChatFloatingButton: React.FC<ChatFloatingButtonProps> = ({
  isOpen,
  onClick,
  hasUnreadMessages = false,
  className
}) => {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl border-2 z-50",
        "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
        "border-white/20 hover:border-white/30",
        "transition-all duration-300 ease-in-out",
        "hover:scale-110 hover:shadow-purple-500/25",
        "group active:scale-95",
        isOpen && "rotate-180",
        className
      )}
    >
      {/* Icon with animation */}
      <div className="relative flex items-center justify-center">
        {isOpen ? (
          <X className="h-6 w-6 text-white transition-transform duration-300 group-hover:rotate-90" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110" />
        )}
        
        {/* Unread indicator */}
        {hasUnreadMessages && !isOpen && (
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
        
        {/* AI indicator dot */}
        {!hasUnreadMessages && (
          <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-green-400 rounded-full border border-white animate-pulse" />
        )}
      </div>

      {/* Ripple effect on hover */}
      <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
    </Button>
  );
};