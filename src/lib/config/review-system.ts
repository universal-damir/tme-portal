// Review System Configuration
// Feature flags and environment-based configuration for extra safety

export interface ReviewSystemConfig {
  // Feature flags - can disable entire system instantly
  enabled: boolean;
  notificationsEnabled: boolean;
  reviewSubmissionEnabled: boolean;
  
  // Phase 3 - Review components feature flags
  showReviewerDropdown: boolean;
  showReviewModal: boolean;
  showStatusBadges: boolean;
  allowReviewActions: boolean;
  
  // Phase 4 - Golden Visa integration feature flags
  enableGoldenVisaReview: boolean;
  showGoldenVisaSubmitButton: boolean;
  showGoldenVisaStatus: boolean;
  requireApprovalForDownload: boolean;
  enableGoldenVisaAutoSave: boolean;
  
  // Polling configuration
  notificationPollingInterval: number; // milliseconds
  maxNotificationsToFetch: number;
  
  // UI configuration
  showNotificationBadge: boolean;
  showReviewButtons: boolean;
  
  // Safety limits
  maxApplicationsPerUser: number;
  maxNotificationsPerUser: number;
  maxReviewersToFetch: number;
  
  // Debug mode
  debugMode: boolean;
}

// Default configuration - conservative settings for safety
const DEFAULT_CONFIG: ReviewSystemConfig = {
  enabled: false, // Disabled by default - must be explicitly enabled
  notificationsEnabled: false,
  reviewSubmissionEnabled: false,
  
  // Phase 3 features - all disabled by default
  showReviewerDropdown: false,
  showReviewModal: false,
  showStatusBadges: false,
  allowReviewActions: false,
  
  // Phase 4 features - all disabled by default for ultra safety
  enableGoldenVisaReview: false,
  showGoldenVisaSubmitButton: false,
  showGoldenVisaStatus: false,
  requireApprovalForDownload: false,
  enableGoldenVisaAutoSave: false,
  
  notificationPollingInterval: 30000, // 30 seconds - conservative
  maxNotificationsToFetch: 50,
  
  showNotificationBadge: false,
  showReviewButtons: false,
  
  maxApplicationsPerUser: 100,
  maxNotificationsPerUser: 200,
  maxReviewersToFetch: 20,
  
  debugMode: false
};

// Get configuration from environment variables with safe fallbacks
export function getReviewSystemConfig(): ReviewSystemConfig {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Helper function to get env var (client-side uses NEXT_PUBLIC_ prefix)
  const getEnvVar = (name: string) => {
    const publicVar = process.env[`NEXT_PUBLIC_${name}`];
    const regularVar = process.env[name];
    const result = publicVar || regularVar;
    
    // Debug logging
    if (name === 'ENABLE_REVIEW_SYSTEM' || name === 'ENABLE_GOLDEN_VISA_REVIEW') {
      console.log(`🔧 Config Debug - ${name}:`, {
        publicVar: publicVar || 'undefined',
        regularVar: regularVar || 'undefined',
        result: result || 'NOT_SET'
      });
    }
    
    return result;
  };
  
  return {
    // Feature flags - TEMPORARILY HARDCODED FOR TESTING
    enabled: true, // getEnvVar('ENABLE_REVIEW_SYSTEM') === 'true',
    notificationsEnabled: true, // getEnvVar('ENABLE_NOTIFICATIONS') === 'true',
    reviewSubmissionEnabled: true, // getEnvVar('ENABLE_REVIEW_SUBMISSION') === 'true',
    
    // Phase 3 - Review components feature flags
    showReviewerDropdown: true, // getEnvVar('SHOW_REVIEWER_DROPDOWN') === 'true',
    showReviewModal: true, // getEnvVar('SHOW_REVIEW_MODAL') === 'true',
    showStatusBadges: true, // getEnvVar('SHOW_STATUS_BADGES') === 'true',
    allowReviewActions: true, // getEnvVar('ALLOW_REVIEW_ACTIONS') === 'true',
    
    // Phase 4 - Golden Visa integration feature flags
    enableGoldenVisaReview: true, // getEnvVar('ENABLE_GOLDEN_VISA_REVIEW') === 'true',
    showGoldenVisaSubmitButton: true, // getEnvVar('SHOW_GOLDEN_VISA_SUBMIT_BUTTON') === 'true',
    showGoldenVisaStatus: true, // getEnvVar('SHOW_GOLDEN_VISA_STATUS') === 'true',
    requireApprovalForDownload: false, // getEnvVar('REQUIRE_APPROVAL_FOR_DOWNLOAD') === 'true',
    enableGoldenVisaAutoSave: true, // getEnvVar('ENABLE_GOLDEN_VISA_AUTO_SAVE') === 'true',
    
    // Polling configuration
    notificationPollingInterval: parseInt(
      getEnvVar('NOTIFICATION_POLLING_INTERVAL') || '60000'
    ),
    maxNotificationsToFetch: parseInt(
      getEnvVar('MAX_NOTIFICATIONS_FETCH') || '50'
    ),
    
    // UI configuration
    showNotificationBadge: true, // getEnvVar('SHOW_NOTIFICATION_BADGE') === 'true',
    showReviewButtons: true, // getEnvVar('SHOW_REVIEW_BUTTONS') === 'true',
    
    // Safety limits
    maxApplicationsPerUser: parseInt(
      getEnvVar('MAX_APPLICATIONS_PER_USER') || '100'
    ),
    maxNotificationsPerUser: parseInt(
      getEnvVar('MAX_NOTIFICATIONS_PER_USER') || '200'
    ),
    maxReviewersToFetch: parseInt(
      getEnvVar('MAX_REVIEWERS_FETCH') || '20'
    ),
    
    // Debug mode - only in development
    debugMode: isDevelopment && getEnvVar('REVIEW_SYSTEM_DEBUG') === 'true'
  };
}

// Hook for React components to use configuration
export function useReviewSystemConfig(): ReviewSystemConfig & { 
  isEnabled: boolean;
  canShowNotifications: boolean;
  canSubmitReviews: boolean;
  canShowReviewComponents: boolean;
  canPerformReviewActions: boolean;
  canUseGoldenVisaReview: boolean;
  canShowGoldenVisaSubmit: boolean;
  canShowGoldenVisaStatus: boolean;
  shouldRequireApproval: boolean;
  canAutoSaveGoldenVisa: boolean;
} {
  const config = getReviewSystemConfig();
  
  return {
    ...config,
    isEnabled: config.enabled,
    canShowNotifications: config.enabled && config.notificationsEnabled,
    canSubmitReviews: config.enabled && config.reviewSubmissionEnabled,
    canShowReviewComponents: config.enabled && (config.showReviewerDropdown || config.showReviewModal || config.showStatusBadges),
    canPerformReviewActions: config.enabled && config.allowReviewActions,
    // Phase 4 - Golden Visa specific helpers
    canUseGoldenVisaReview: config.enabled && config.enableGoldenVisaReview,
    canShowGoldenVisaSubmit: config.enabled && config.enableGoldenVisaReview && config.showGoldenVisaSubmitButton,
    canShowGoldenVisaStatus: config.enabled && config.enableGoldenVisaReview && config.showGoldenVisaStatus,
    shouldRequireApproval: config.enabled && config.enableGoldenVisaReview && config.requireApprovalForDownload,
    canAutoSaveGoldenVisa: config.enabled && config.enableGoldenVisaReview && config.enableGoldenVisaAutoSave
  };
}

// Utility function to check if a specific feature is enabled
export function isFeatureEnabled(feature: keyof ReviewSystemConfig): boolean {
  const config = getReviewSystemConfig();
  return config.enabled && Boolean(config[feature]);
}

// Safe wrapper for review system operations
export function withReviewSystemEnabled<T>(
  operation: () => T,
  fallback: () => T
): T {
  if (getReviewSystemConfig().enabled) {
    try {
      return operation();
    } catch (error) {
      console.error('Review system operation failed:', error);
      return fallback();
    }
  }
  return fallback();
}

// Environment variables documentation
export const ENVIRONMENT_VARIABLES_DOCS = `
# Review System Environment Variables
# Add these to your .env file to control the review system

# Master switch - must be true for any review system functionality
ENABLE_REVIEW_SYSTEM=false

# Individual feature flags
ENABLE_NOTIFICATIONS=false
ENABLE_REVIEW_SUBMISSION=false

# Phase 3 - Review components feature flags
SHOW_REVIEWER_DROPDOWN=false
SHOW_REVIEW_MODAL=false
SHOW_STATUS_BADGES=false
ALLOW_REVIEW_ACTIONS=false

# Phase 4 - Golden Visa integration feature flags (ultra-safe defaults)
ENABLE_GOLDEN_VISA_REVIEW=false          # Master flag for Golden Visa review integration
SHOW_GOLDEN_VISA_SUBMIT_BUTTON=false     # Show "Submit for Review" button
SHOW_GOLDEN_VISA_STATUS=false            # Show application status indicators
REQUIRE_APPROVAL_FOR_DOWNLOAD=false      # Require approval before PDF download
ENABLE_GOLDEN_VISA_AUTO_SAVE=false       # Auto-save form data to database

# UI feature flags
SHOW_NOTIFICATION_BADGE=false
SHOW_REVIEW_BUTTONS=false

# Performance settings
NOTIFICATION_POLLING_INTERVAL=30000  # 30 seconds
MAX_NOTIFICATIONS_FETCH=50

# Safety limits
MAX_APPLICATIONS_PER_USER=100
MAX_NOTIFICATIONS_PER_USER=200

# Debug mode (development only)
REVIEW_SYSTEM_DEBUG=false
`;