'use client';

import { useState, useCallback, useRef } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { 
  ChatMessage, 
  AIFormData, 
  UseAIAssistantReturn 
} from '@/types/ai-assistant';
import { OfferData } from '@/types/offer';
import { aiAssistantClient } from '@/lib/ai-assistant/api-client';
import { 
  mapAIResponseToFormData, 
  applyToForm, 
  generateChangesSummary,
  validateForPDFGeneration
} from '@/lib/ai-assistant/data-mapper';

interface UseAIAssistantProps {
  setValue: UseFormSetValue<OfferData>;
  currentFormData: OfferData;
  trigger?: () => Promise<boolean>;
  onFormUpdate?: (summary: string) => void;
  onAutoGeneratePDF?: (updatedData: OfferData) => Promise<void>;
}

export function useAIAssistant({
  setValue,
  currentFormData,
  trigger,
  onFormUpdate,
  onAutoGeneratePDF
}: UseAIAssistantProps): UseAIAssistantReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBeenUsed, setHasBeenUsed] = useState(false);
  
  // Keep track of last message for retry functionality
  const lastMessageRef = useRef<string>('');

  const openChat = useCallback(() => {
    setIsOpen(true);
    setError(null);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
    lastMessageRef.current = '';
  }, []);

  const generateMessageId = () => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addMessage = useCallback((message: Omit<ChatMessage, 'id'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateMessageId(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  const applyFormData = useCallback((aiFormData: AIFormData) => {
    try {
      // Map AI response to form data structure
      const mappedFormData = mapAIResponseToFormData(aiFormData);
      
      // AI response mapping completed
      
      // Apply to form using setValue
      applyToForm(mappedFormData, setValue);
      
      // Force form validation/re-render after applying data
      setTimeout(async () => {
        // Trigger form validation to ensure dependent fields are updated
        if (trigger) {
          await trigger();
        }
        
        // Force key field updates to ensure watchers and calculations fire
        if (mappedFormData.authorityInformation?.responsibleAuthority) {
          setValue('authorityInformation.responsibleAuthority', mappedFormData.authorityInformation.responsibleAuthority);
        }
        if (mappedFormData.authorityInformation?.shareCapitalAED) {
          setValue('authorityInformation.shareCapitalAED', mappedFormData.authorityInformation.shareCapitalAED);
        }
        if (mappedFormData.clientDetails?.companySetupType) {
          setValue('clientDetails.companySetupType', mappedFormData.clientDetails.companySetupType);
        }
        if (mappedFormData.ifzaLicense?.visaQuota !== undefined) {
          setValue('ifzaLicense.visaQuota', mappedFormData.ifzaLicense.visaQuota);
        }
        if (mappedFormData.ifzaLicense?.tmeServicesFee !== undefined) {
          setValue('ifzaLicense.tmeServicesFee', mappedFormData.ifzaLicense.tmeServicesFee);
        }
        if (mappedFormData.ifzaLicense?.activitiesToBeConfirmed !== undefined) {
          setValue('ifzaLicense.activitiesToBeConfirmed', mappedFormData.ifzaLicense.activitiesToBeConfirmed);
        }
        if (mappedFormData.detLicense?.activitiesToBeConfirmed !== undefined) {
          setValue('detLicense.activitiesToBeConfirmed', mappedFormData.detLicense.activitiesToBeConfirmed);
        }
        if (mappedFormData.visaCosts?.numberOfVisas !== undefined) {
          setValue('visaCosts.numberOfVisas', mappedFormData.visaCosts.numberOfVisas);
        }
        
        // Trigger another validation after forced updates
        setTimeout(() => {
          if (trigger) {
            trigger();
          }
        }, 50);
      }, 150);
      
      // Generate summary for user feedback
      const summary = generateChangesSummary(aiFormData);
      onFormUpdate?.(summary);
      
      // Show success toast and automatically generate PDF preview if form is complete
      const validation = validateForPDFGeneration(mappedFormData);
      
      if (validation.isValid) {
        // Form is valid, auto-generate PDF preview without notification
        
        // Automatically trigger PDF preview generation with merged data
        setTimeout(() => {
          // Merge current form data with the mapped AI updates
          const mergedData = {
            ...currentFormData,
            ...mappedFormData,
            // Ensure nested objects are properly merged (handle undefined cases)
            clientDetails: {
              ...currentFormData.clientDetails,
              ...mappedFormData.clientDetails
            },
            authorityInformation: {
              ...(currentFormData.authorityInformation || {}),
              ...(mappedFormData.authorityInformation || {})
            },
            visaCosts: {
              ...(currentFormData.visaCosts || {}),
              ...(mappedFormData.visaCosts || {})
            },
            ifzaLicense: {
              ...(currentFormData.ifzaLicense || {}),
              ...(mappedFormData.ifzaLicense || {})
            },
            detLicense: {
              ...(currentFormData.detLicense || {}),
              ...(mappedFormData.detLicense || {})
            }
          };
          
          // Additional validation to ensure client details are present
          const hasClientInfo = mergedData.clientDetails?.firstName || 
                               mergedData.clientDetails?.lastName || 
                               mergedData.clientDetails?.companyName;
          
          // PDF data merge completed
          onAutoGeneratePDF?.(mergedData);
        }, 3000); // Longer delay to ensure form fully renders with authority-dependent sections
        
      } else {
        // Form partially updated, no notification needed
      }

    } catch (error) {
      console.error('Error applying form data:', error);
      // Error logged to console, no toast notification
    }
  }, [setValue, onFormUpdate, onAutoGeneratePDF]);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (isLoading || !userMessage.trim()) {
      return;
    }

    setError(null);
    lastMessageRef.current = userMessage;

    // Add user message
    const userMsg = addMessage({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    // Add loading AI message
    const aiMsg = addMessage({
      role: 'assistant',
      content: 'Thinking...',
      timestamp: new Date(),
      isLoading: true,
    });

    setIsLoading(true);

    try {
      // Prepare conversation history for API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Send to AI API
      const aiResponse = await aiAssistantClient.sendMessageWithRetry({
        message: userMessage,
        conversationHistory,
        currentFormData: currentFormData
      });

      // Update AI message with response
      updateMessage(aiMsg.id, {
        content: aiResponse.message,
        isLoading: false,
      });

      // Apply form data if provided
      if (aiResponse.formData && Object.keys(aiResponse.formData).length > 0) {
        applyFormData(aiResponse.formData);
        setHasBeenUsed(true); // Mark as used when form data is applied
      }

      // Handle clarification questions
      if (aiResponse.requiresClarification && aiResponse.clarificationQuestions?.length) {
        // Add follow-up questions as separate message
        setTimeout(() => {
          addMessage({
            role: 'assistant',
            content: `I need some clarification:\n\n${aiResponse.clarificationQuestions!.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
            timestamp: new Date(),
          });
        }, 500);
      }

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';

      setError(errorMessage);
      
      // Update AI message to show error
      updateMessage(aiMsg.id, {
        content: 'Sorry, I encountered an error. Please try again.',
        isLoading: false,
      });

      // Error logged to console, no toast notification

    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, addMessage, updateMessage, applyFormData]);

  const retryLastMessage = useCallback(async () => {
    if (lastMessageRef.current) {
      // Remove the last AI message if it was an error
      setMessages(prev => prev.slice(0, -1));
      await sendMessage(lastMessageRef.current);
    }
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    isOpen,
    error,
    hasBeenUsed,
    sendMessage,
    openChat,
    closeChat,
    clearHistory,
    applyFormData,
    retryLastMessage,
  };
}