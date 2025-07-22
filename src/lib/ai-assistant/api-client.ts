import { 
  AIAssistantRequest, 
  AIAssistantAPIResponse, 
  AIResponse 
} from '@/types/ai-assistant';

/**
 * AI Assistant API client for making requests to the OpenAI service
 */
class AIAssistantClient {
  private baseUrl = '/api/ai-assistant';

  /**
   * Send a message to the AI assistant
   */
  async sendMessage(request: AIAssistantRequest): Promise<AIResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: AIAssistantAPIResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Unknown API error');
      }

      if (!data.data) {
        throw new Error('No data received from API');
      }

      return data.data;
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError) {
        throw new Error('Network error - please check your connection');
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Send a message with retry logic
   */
  async sendMessageWithRetry(
    request: AIAssistantRequest, 
    maxRetries: number = 3
  ): Promise<AIResponse> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.sendMessage(request);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes('400')) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }
}

/**
 * Default AI assistant client instance
 */
export const aiAssistantClient = new AIAssistantClient();

/**
 * Utility function for quick message sending
 */
export async function sendAIMessage(
  message: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  currentFormData?: any
): Promise<AIResponse> {
  return aiAssistantClient.sendMessage({
    message,
    conversationHistory,
    currentFormData,
  });
}