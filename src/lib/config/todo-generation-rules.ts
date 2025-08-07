/**
 * Todo Generation Rules Engine
 * Smart business logic for converting notifications to actionable todos
 * Phase 2: Backend Services Implementation
 */

import { CreateTodoInput } from '@/lib/services/todo-service';

export interface TodoGenerationRule {
  title: (data: any) => string;
  description?: (data: any) => string;
  category: 'review' | 'follow_up' | 'reminder' | 'action';
  priority: (data: any) => 'low' | 'medium' | 'high' | 'urgent';
  due_date: (data: any) => Date;
  action_type: string;
  action_data: (data: any) => any;
  auto_complete_criteria?: (data: any) => any; // Criteria for auto-completion
}

export interface NotificationData {
  user_id: number;
  type: string;
  title: string;
  message: string;
  application_id?: string;
  application_title?: string;
  submitter_name?: string;
  reviewer_name?: string;
  client_name?: string;
  client_email?: string;
  document_type?: string;
  filename?: string;
  urgency?: 'low' | 'medium' | 'high';
  status?: 'approved' | 'rejected';
  sent_date?: Date;
  days_ago?: number;
  form_name?: string;
  form_data?: any;
}

/**
 * Smart Todo Generation Rules
 * Maps notification types to todo generation logic
 */
export const TODO_GENERATION_RULES: Record<string, TodoGenerationRule> = {
  
  // ========================================
  // REVIEW WORKFLOW TODOS
  // ========================================
  
  'review_requested': {
    title: (data: NotificationData) => 
      `Review ${data.application_title || data.filename || 'application'}`,
    
    description: (data: NotificationData) => 
      `Review submitted by ${data.submitter_name || 'user'} requires your attention. ` +
      `${data.urgency === 'high' ? 'This is marked as high priority.' : ''}`,
    
    category: 'review',
    
    priority: (data: NotificationData) => {
      if (data.urgency === 'high') return 'urgent';
      return 'high'; // Reviews are generally high priority
    },
    
    due_date: (data: NotificationData) => {
      // High urgency gets 4 hours, normal gets 24 hours
      const hours = data.urgency === 'high' ? 4 : 24;
      return new Date(Date.now() + hours * 60 * 60 * 1000);
    },
    
    action_type: 'review_document',
    
    action_data: (data: NotificationData) => ({
      application_id: data.application_id,
      application_title: data.application_title,
      submitter_name: data.submitter_name,
      urgency: data.urgency,
      filename: data.filename
    }),

    auto_complete_criteria: (data: NotificationData) => ({
      action_type: 'review_document',
      application_id: data.application_id
    })
  },

  'application_approved': {
    title: (data: NotificationData) => 
      `Send ${data.application_title || data.filename || 'approved document'} to ${data.client_name || 'client'}`,
    
    description: (data: NotificationData) => 
      `Your application has been approved by ${data.reviewer_name || 'reviewer'}. ` +
      `Send the approved document to the client promptly.`,
    
    category: 'action',
    priority: () => 'high',
    
    due_date: () => new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
    
    action_type: 'send_approved_document',
    
    action_data: (data: NotificationData) => ({
      application_id: data.application_id,
      application_title: data.application_title,
      client_name: data.client_name,
      reviewer_name: data.reviewer_name,
      document_type: data.document_type,
      filename: data.filename,
      approval_date: new Date()
    }),

    auto_complete_criteria: (data: NotificationData) => ({
      application_id: data.application_id,
      category: ['review']
    })
  },

  'application_rejected': {
    title: (data: NotificationData) => {
      // Extract form name from application title (remove PDF extension if present)
      const formName = data.application_title?.replace('.pdf', '') || data.filename?.replace('.pdf', '') || 'form';
      const rejectionReason = data.message || 'No specific reason provided';
      
      return `Edit ${formName} - Reason: ${rejectionReason}`;
    },
    
    description: (data: NotificationData) => {
      const reviewerFeedback = data.message || 'No specific feedback provided';
      return `Your application was rejected by ${data.reviewer_name || 'reviewer'}. ` +
        `Reviewer feedback: "${reviewerFeedback}". Please address the issues and resubmit.`;
    },
    
    category: 'action',
    priority: () => 'high',
    
    due_date: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    
    action_type: 'edit_rejected_document',
    
    action_data: (data: NotificationData) => ({
      application_id: data.application_id,
      application_title: data.application_title,
      client_name: data.client_name,
      reviewer_name: data.reviewer_name,
      rejection_reason: data.message,
      document_type: data.document_type,
      filename: data.filename,
      rejection_date: new Date()
    }),

    auto_complete_criteria: (data: NotificationData) => ({
      application_id: data.application_id,
      category: ['review'],
      status: 'resubmitted'
    })
  },

  'review_completed': {
    title: (data: NotificationData) => 
      `Follow up on ${data.application_title || data.filename || 'application'} review result`,
    
    description: (data: NotificationData) => {
      const statusText = data.status === 'approved' ? 'approved' : 'rejected';
      return `Application has been ${statusText}. Send result to client and follow up if needed.`;
    },
    
    category: 'follow_up',
    priority: () => 'medium',
    
    due_date: (data: NotificationData) => {
      // Approved items get 2 hours, rejected get 4 hours (more urgent to explain)
      const hours = data.status === 'approved' ? 2 : 4;
      return new Date(Date.now() + hours * 60 * 60 * 1000);
    },
    
    action_type: 'send_review_result',
    
    action_data: (data: NotificationData) => ({
      application_id: data.application_id,
      application_title: data.application_title,
      client_name: data.client_name,
      review_status: data.status,
      reviewer_name: data.reviewer_name,
      filename: data.filename
    })
  },

  // ========================================
  // DOCUMENT LIFECYCLE TODOS
  // ========================================

  'pdf_sent_to_client': {
    title: (data: NotificationData) => 
      `Follow up with ${data.client_name || 'client'} on ${data.document_type || data.filename || 'document'}`,
    
    description: (data: NotificationData) => 
      `Document sent to client. Check if they have questions or need assistance after 7 days.`,
    
    category: 'follow_up',
    priority: () => 'medium',
    
    due_date: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    
    action_type: 'contact_client',
    
    action_data: (data: NotificationData) => ({
      client_name: data.client_name,
      document_type: data.document_type,
      filename: data.filename,
      sent_date: data.sent_date || new Date(),
      follow_up_reason: 'document_sent'
    })
  },

  'document_generated': {
    title: (data: NotificationData) => 
      `Send ${data.document_type || data.filename || 'document'} to ${data.client_name || 'client'}`,
    
    description: (data: NotificationData) => 
      `Document has been generated and is ready to be sent to the client.`,
    
    category: 'action',
    priority: () => 'high',
    
    due_date: () => new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
    
    action_type: 'send_document',
    
    action_data: (data: NotificationData) => ({
      client_name: data.client_name,
      document_type: data.document_type,
      filename: data.filename,
      application_id: data.application_id
    }),

    auto_complete_criteria: (data: NotificationData) => ({
      action_type: 'send_document',
      client_name: data.client_name,
      document_type: data.document_type
    })
  },

  // ========================================
  // CLIENT COMMUNICATION REMINDERS
  // ========================================

  'client_no_response': {
    title: (data: NotificationData) => 
      `URGENT: Contact ${data.client_name || 'client'} - No response for ${data.days_ago || 7}+ days`,
    
    description: (data: NotificationData) => 
      `Client hasn't responded to ${data.document_type || 'document'} sent ${data.days_ago || 7} days ago. ` +
      `Immediate follow-up required.`,
    
    category: 'reminder',
    priority: () => 'urgent',
    
    due_date: () => new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    
    action_type: 'urgent_follow_up',
    
    action_data: (data: NotificationData) => ({
      client_name: data.client_name,
      document_type: data.document_type,
      days_overdue: data.days_ago,
      original_sent_date: data.sent_date,
      urgency_level: 'high'
    })
  },

  'payment_pending': {
    title: (data: NotificationData) => 
      `Follow up on pending payment from ${data.client_name || 'client'}`,
    
    description: (data: NotificationData) => 
      `Payment for services is pending. Contact client to check on payment status.`,
    
    category: 'follow_up',
    priority: () => 'high',
    
    due_date: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    
    action_type: 'payment_follow_up',
    
    action_data: (data: NotificationData) => ({
      client_name: data.client_name,
      amount: data.application_id, // Could be amount
      service_type: data.document_type,
      days_pending: data.days_ago || 0
    })
  },

  'meeting_reminder': {
    title: (data: NotificationData) => 
      `Prepare for meeting with ${data.client_name || 'client'}`,
    
    description: (data: NotificationData) => 
      `Upcoming meeting scheduled. Review client file and prepare necessary documents.`,
    
    category: 'action',
    priority: () => 'high',
    
    due_date: (data: NotificationData) => {
      // Meeting prep should be done 2 hours before meeting
      const meetingDate = data.sent_date || new Date(Date.now() + 24 * 60 * 60 * 1000);
      return new Date(meetingDate.getTime() - 2 * 60 * 60 * 1000);
    },
    
    action_type: 'meeting_preparation',
    
    action_data: (data: NotificationData) => ({
      client_name: data.client_name,
      meeting_date: data.sent_date,
      meeting_type: data.document_type,
      application_id: data.application_id
    })
  },

  // ========================================
  // SYSTEM MAINTENANCE TODOS
  // ========================================

  'document_expiring': {
    title: (data: NotificationData) => 
      `Renew expiring ${data.document_type || 'document'} for ${data.client_name || 'client'}`,
    
    description: (data: NotificationData) => 
      `Document is expiring soon. Contact client to initiate renewal process.`,
    
    category: 'reminder',
    priority: () => 'high',
    
    due_date: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    
    action_type: 'renewal_contact',
    
    action_data: (data: NotificationData) => ({
      client_name: data.client_name,
      document_type: data.document_type,
      expiry_date: data.sent_date,
      renewal_required: true
    })
  },

  // ========================================
  // GOLDEN VISA SPECIFIC TODOS
  // ========================================

  'golden_visa_submitted': {
    title: (data: NotificationData) => 
      `Process Golden Visa application for ${data.client_name || 'client'}`,
    
    description: (data: NotificationData) => 
      `Golden Visa application submitted and requires processing. Review documents and initiate government submission.`,
    
    category: 'action',
    priority: () => 'high',
    
    due_date: () => new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    
    action_type: 'process_golden_visa',
    
    action_data: (data: NotificationData) => ({
      client_name: data.client_name,
      application_id: data.application_id,
      submission_type: 'golden_visa',
      priority_processing: true
    })
  },

  // ========================================
  // GENERIC FALLBACK RULE
  // ========================================

  'default': {
    title: (data: NotificationData) => 
      `Action required: ${data.title || 'Review notification'}`,
    
    description: (data: NotificationData) => 
      data.message || 'Please review this notification and take appropriate action.',
    
    category: 'action',
    priority: () => 'medium',
    
    due_date: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    
    action_type: 'general_action',
    
    action_data: (data: NotificationData) => ({
      notification_type: data.type,
      original_title: data.title,
      original_message: data.message
    })
  }
};

/**
 * Generate a todo from notification data
 */
export function generateTodoFromNotification(
  notificationData: NotificationData
): CreateTodoInput {
  const { type, user_id } = notificationData;
  
  // Get the appropriate rule, fallback to default
  const rule = TODO_GENERATION_RULES[type] || TODO_GENERATION_RULES['default'];
  
  const todoInput: CreateTodoInput = {
    user_id,
    title: rule.title(notificationData),
    description: rule.description ? rule.description(notificationData) : undefined,
    category: rule.category,
    priority: rule.priority(notificationData),
    due_date: rule.due_date(notificationData),
    action_type: rule.action_type,
    action_data: rule.action_data(notificationData),
    auto_generated: true,
    client_name: notificationData.client_name,
    document_type: notificationData.document_type,
    application_id: notificationData.application_id
  };

  return todoInput;
}

/**
 * Get auto-completion criteria for a notification type
 */
export function getAutoCompletionCriteria(
  notificationType: string, 
  notificationData: NotificationData
): any {
  const rule = TODO_GENERATION_RULES[notificationType];
  
  if (rule && rule.auto_complete_criteria) {
    return rule.auto_complete_criteria(notificationData);
  }
  
  return null;
}

/**
 * Business logic for determining if a notification should generate a todo
 */
export function shouldGenerateTodo(
  notificationType: string, 
  notificationData: NotificationData
): boolean {
  // Skip todo generation for certain conditions
  if (!notificationData.user_id) {
    return false;
  }

  // Skip if notification is just informational
  const informationalTypes = ['login', 'logout', 'profile_updated'];
  if (informationalTypes.includes(notificationType)) {
    return false;
  }

  // Skip if client has already responded (for follow-up todos)
  if (notificationType === 'client_no_response' && notificationData.days_ago && notificationData.days_ago < 7) {
    return false;
  }

  // Business hours check for urgent todos
  if (notificationType === 'client_no_response' || notificationType === 'payment_pending') {
    const now = new Date();
    const hour = now.getHours();
    const isBusinessHours = hour >= 9 && hour <= 17; // 9 AM to 5 PM
    
    if (!isBusinessHours) {
      // Adjust due date to next business day
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM next day
    }
  }

  return true;
}

/**
 * Calculate smart due dates based on business rules
 */
export function calculateSmartDueDate(
  notificationType: string,
  baseDate: Date,
  priority: 'low' | 'medium' | 'high' | 'urgent'
): Date {
  let hoursToAdd = 24; // Default 24 hours

  // Priority-based adjustments
  switch (priority) {
    case 'urgent':
      hoursToAdd = 2;
      break;
    case 'high':
      hoursToAdd = 8;
      break;
    case 'medium':
      hoursToAdd = 24;
      break;
    case 'low':
      hoursToAdd = 72;
      break;
  }

  // Type-specific adjustments
  if (notificationType.includes('review')) {
    hoursToAdd = Math.min(hoursToAdd, 24); // Reviews max 24h
  }
  
  if (notificationType.includes('follow_up')) {
    hoursToAdd = Math.max(hoursToAdd, 168); // Follow-ups min 7 days
  }

  // Skip weekends for business tasks
  const dueDate = new Date(baseDate.getTime() + hoursToAdd * 60 * 60 * 1000);
  const dayOfWeek = dueDate.getDay();
  
  if (dayOfWeek === 0) { // Sunday
    dueDate.setDate(dueDate.getDate() + 1); // Move to Monday
  } else if (dayOfWeek === 6) { // Saturday
    dueDate.setDate(dueDate.getDate() + 2); // Move to Monday
  }

  return dueDate;
}