// App Initializer - ensures services are started
// This module auto-initializes when imported

import { initializeEmailQueueProcessor, emailQueueProcessor } from './email-queue-processor';

// Use global to ensure truly singleton across hot reloads
const globalWithProcessor = global as typeof globalThis & {
  __emailProcessorInitialized?: boolean;
};

export function ensureAppInitialized() {
  // Check both local and global state to prevent duplicates
  if (globalWithProcessor.__emailProcessorInitialized) {
    console.log('[App Initializer] Services already initialized globally');
    return;
  }
  
  // Also check if processor is already running
  const status = emailQueueProcessor.getStatus();
  if (status.running) {
    console.log('[App Initializer] Email processor already running');
    globalWithProcessor.__emailProcessorInitialized = true;
    return;
  }
  
  console.log('[App Initializer] Starting background services...');
  
  // Initialize email queue processor
  initializeEmailQueueProcessor();
  
  // Mark as initialized globally
  globalWithProcessor.__emailProcessorInitialized = true;
  console.log('[App Initializer] Services started successfully');
}

// Auto-initialize on module load in non-test environments
if (process.env.NODE_ENV !== 'test') {
  // Delay initialization to avoid startup race conditions
  if (typeof process !== 'undefined' && process.nextTick) {
    process.nextTick(() => {
      ensureAppInitialized();
    });
  }
}