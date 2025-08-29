// Review System TypeScript Types
// Core interfaces for the generic review workflow system

// Application status enum
export type ApplicationStatus = 'draft' | 'pending_review' | 'under_review' | 'approved' | 'rejected';

// Application types enum  
export type ApplicationType = 'golden-visa' | 'cost-overview' | 'company-services' | 'taxation' | 'corporate-changes' | 'cit-return-letters';

// Urgency levels
export type UrgencyLevel = 'standard' | 'urgent';

// Notification types
export type NotificationType = 'review_requested' | 'review_completed' | 'application_approved' | 'application_rejected';

// Review message types
export type ReviewMessageType = 'comment' | 'submission' | 'approval' | 'rejection' | 'revision';

// User roles in review process
export type ReviewUserRole = 'submitter' | 'reviewer';

// Core Application interface
export interface Application {
  id: string;
  type: ApplicationType;
  title: string;
  form_data: Record<string, any>; // Generic form data - will be typed per application type
  status: ApplicationStatus;
  
  // User relationships
  submitted_by_id: number;
  reviewer_id?: number;
  
  // Review details
  submitter_message?: string; // Original message from submitter when submitting for review
  review_comments?: string; // Reviewer's feedback after review
  urgency: UrgencyLevel;
  
  // Timestamps
  submitted_at?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  
  // Populated relations (from joins)
  submitted_by?: {
    id: number;
    full_name: string;
    email: string;
    department: string;
  };
  reviewer?: {
    id: number;
    full_name: string;
    email: string;
    department: string;
  };
  
  // Message history (optional, populated when needed)
  messages?: ReviewMessage[];
}

// Review Message interface
export interface ReviewMessage {
  id: string;
  application_id: string;
  user_id: number;
  user_role: ReviewUserRole;
  message: string;
  message_type: ReviewMessageType;
  created_at: string;
  
  // Populated user information
  user?: {
    id: number;
    full_name: string;
    email: string;
    department: string;
  };
}

// Notification interface
export interface Notification {
  id: string;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  application_id?: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
  
  // Populated relations
  application?: Application;
}

// Reviewer selection interface
export interface Reviewer {
  id: number;
  full_name: string;
  email: string;
  department: string;
  employee_code: string;
  is_universal?: boolean; // For UH user Uwe
}

// Review submission interface
export interface ReviewSubmission {
  application_id: string;
  reviewer_id: number;
  urgency: UrgencyLevel;
  comments?: string;
}

// Review action interface
export interface ReviewAction {
  application_id: string;
  action: 'approve' | 'reject';
  comments: string;
}

// Form data type mappings for each application type
export interface ApplicationFormData {
  'golden-visa': import('./golden-visa').GoldenVisaData;
  'cost-overview': any; // Will be defined when implementing cost overview
  'company-services': any; // Will be defined when implementing company services
  'taxation': any; // Will be defined when implementing taxation
  'corporate-changes': any; // Will be defined when implementing corporate changes
  'cit-return-letters': import('./cit-return-letters').CITReturnLettersData;
}

// Generic application interface with typed form data
export interface TypedApplication<T extends ApplicationType> extends Omit<Application, 'form_data'> {
  type: T;
  form_data: ApplicationFormData[T];
}

// API Response interfaces
export interface CreateApplicationRequest {
  type: ApplicationType;
  title: string;
  form_data: Record<string, any>;
}

export interface UpdateApplicationRequest {
  type?: ApplicationType; // Allow updating application type
  title?: string;
  form_data?: Record<string, any>;
}

export interface ApplicationsResponse {
  applications: Application[];
  total: number;
  page: number;
  limit: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

// Review system configuration
export interface ReviewSystemConfig {
  enabled: boolean;
  auto_save_interval: number; // milliseconds
  notification_polling_interval: number; // milliseconds
}

// Status display configuration
export interface StatusConfig {
  status: ApplicationStatus;
  label: string;
  color: string;
  icon: string;
  description: string;
}

export const STATUS_CONFIGS: Record<ApplicationStatus, StatusConfig> = {
  draft: {
    status: 'draft',
    label: 'Draft',
    color: '#6B7280', // gray-500
    icon: 'FileEdit',
    description: 'Application is being prepared'
  },
  pending_review: {
    status: 'pending_review',
    label: 'Pending Review',
    color: '#F59E0B', // amber-500
    icon: 'Clock',
    description: 'Waiting for reviewer assignment'
  },
  under_review: {
    status: 'under_review',
    label: 'Under Review',
    color: '#3B82F6', // blue-500
    icon: 'Eye',
    description: 'Currently being reviewed'
  },
  approved: {
    status: 'approved',
    label: 'Approved',
    color: '#10B981', // emerald-500
    icon: 'CheckCircle',
    description: 'Application approved and ready'
  },
  rejected: {
    status: 'rejected',
    label: 'Rejected',
    color: '#EF4444', // red-500
    icon: 'XCircle',
    description: 'Application requires changes'
  }
};

// Urgency level configuration
export const URGENCY_CONFIGS: Record<UrgencyLevel, { label: string; color: string; priority: number }> = {
  standard: {
    label: 'Standard Priority',
    color: '#6B7280', // gray-500
    priority: 1
  },
  urgent: {
    label: 'Urgent Priority',
    color: '#EF4444', // red-500
    priority: 2
  }
};