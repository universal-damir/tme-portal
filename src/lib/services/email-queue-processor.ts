// Email Queue Processor
// Runs at intervals to process pending notification emails

import { NotificationEmailService } from './notification-email';

class EmailQueueProcessor {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private processingInterval = 30000; // 30 seconds default

  // Start the queue processor
  start(intervalMs: number = 30000): void {
    if (this.intervalId) {
      console.log('Email queue processor already running');
      return;
    }

    this.processingInterval = intervalMs;
    console.log(`Starting email queue processor with ${intervalMs}ms interval`);

    // Process immediately on start
    this.processQueue();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, intervalMs);
  }

  // Stop the queue processor
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Email queue processor stopped');
    }
  }

  // Process the queue
  private async processQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      console.log('Queue already being processed, skipping');
      return;
    }

    this.isProcessing = true;

    try {
      // Check if we're in production or if email is enabled
      if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASSWORD) {
        console.log('Email credentials not configured, skipping queue processing');
        return;
      }

      await NotificationEmailService.processQueue(10); // Process up to 10 emails at a time
    } catch (error) {
      console.error('Error in queue processor:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Get processor status
  getStatus(): { running: boolean; processing: boolean; interval: number } {
    return {
      running: this.intervalId !== null,
      processing: this.isProcessing,
      interval: this.processingInterval
    };
  }
}

// Singleton instance
export const emailQueueProcessor = new EmailQueueProcessor();

// Function to initialize the processor (called from app initialization)
export function initializeEmailQueueProcessor(): void {
  // Start in production or development (for testing)
  const shouldStart = 
    process.env.NODE_ENV === 'production' || 
    process.env.NODE_ENV === 'development' ||
    process.env.ENABLE_EMAIL_QUEUE === 'true';

  if (shouldStart) {
    const interval = parseInt(process.env.EMAIL_QUEUE_INTERVAL || '30000');
    emailQueueProcessor.start(interval);
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, stopping email queue processor');
      emailQueueProcessor.stop();
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, stopping email queue processor');
      emailQueueProcessor.stop();
    });
  } else {
    console.log('Email queue processor not started (development mode or disabled)');
  }
}