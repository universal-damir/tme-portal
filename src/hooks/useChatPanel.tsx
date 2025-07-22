'use client';

import { useState, useCallback } from 'react';

export interface ChatPanelState {
  isOpen: boolean;
  isMinimized: boolean;
  hasUnreadMessages: boolean;
}

export const useChatPanel = (initialState?: Partial<ChatPanelState>) => {
  const [state, setState] = useState<ChatPanelState>({
    isOpen: false,
    isMinimized: false,
    hasUnreadMessages: false,
    ...initialState
  });

  const openPanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      hasUnreadMessages: false
    }));
  }, []);

  const closePanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      isMinimized: false
    }));
  }, []);

  const togglePanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
      hasUnreadMessages: prev.isOpen ? prev.hasUnreadMessages : false
    }));
  }, []);

  const minimizePanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: true
    }));
  }, []);

  const maximizePanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: false
    }));
  }, []);

  const toggleMinimize = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: !prev.isMinimized
    }));
  }, []);

  const setUnreadMessages = useCallback((hasUnread: boolean) => {
    setState(prev => ({
      ...prev,
      hasUnreadMessages: hasUnread
    }));
  }, []);

  return {
    ...state,
    openPanel,
    closePanel,
    togglePanel,
    minimizePanel,
    maximizePanel,
    toggleMinimize,
    setUnreadMessages
  };
};