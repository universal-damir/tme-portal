'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, MessageCircle } from 'lucide-react';
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
        "hover:scale-110 transition-all duration-300 ease-in-out",
        "group active:scale-95",
        isOpen && "rotate-180",
        className
      )}
      style={{ 
        backgroundColor: '#243F7B', 
        borderColor: 'rgba(255, 255, 255, 0.2)',
        boxShadow: '0 25px 50px -12px rgba(36, 63, 123, 0.25)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#1e3a6f';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#243F7B';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      }}
    >
      {/* Icon with AI text */}
      <div className="relative flex items-center justify-center">
        {isOpen ? (
          <X className="h-6 w-6 text-white transition-transform duration-300 group-hover:rotate-90" />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <MessageCircle className="h-5 w-5 text-white transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xs font-bold text-white mt-0.5">AI</span>
          </div>
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