// Submit Application for Review API Route
// Safe review submission with comprehensive validation

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationsService } from '@/lib/services/review-system';
import { getReviewSystemConfig } from '@/lib/config/review-system';
import { verifySession } from '@/lib/auth';
import { logAuditEvent, getClientIP, getUserAgent } from '@/lib/audit';
import { query } from '@/lib/database';

// POST /api/applications/[id]/submit-review - Submit application for review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log('🔧 API ROUTE: submit-review called for application ID:', id);
  console.log('🔧 API ROUTE: Application ID type:', typeof id, 'Length:', id?.length);
  
  // Validate application ID format (should be UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !uuidRegex.test(id)) {
    console.log('🔧 API ROUTE: Invalid application ID format:', id);
    return NextResponse.json(
      { error: 'Invalid application ID format' }, 
      { status: 400 }
    );
  }
  
  // Safety check: Feature flag
  const config = getReviewSystemConfig();
  console.log('🔧 API ROUTE: Config check:', { enabled: config.enabled, reviewSubmissionEnabled: config.reviewSubmissionEnabled });
  
  if (!config.enabled || !config.reviewSubmissionEnabled) {
    console.log('🔧 API ROUTE: Review submission disabled');
    return NextResponse.json({ success: false, message: 'Review submission is currently disabled' }, { status: 200 });
  }

  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;

    const body = await request.json();
    console.log('🔧 API ROUTE: Request body:', body);
    
    const { reviewer_id, urgency, comments } = body;

    // Validation
    if (!reviewer_id || !urgency) {
      console.log('🔧 API ROUTE: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: reviewer_id and urgency' }, 
        { status: 400 }
      );
    }

    if (!['standard', 'urgent'].includes(urgency)) {
      console.log('🔧 API ROUTE: Invalid urgency level:', urgency);
      return NextResponse.json(
        { error: 'Invalid urgency level. Must be: standard or urgent' }, 
        { status: 400 }
      );
    }

    // Map frontend urgency values to database values
    // Frontend sends: 'standard' or 'urgent'
    // Database expects: 'low', 'medium', or 'high'
    const dbUrgency = urgency === 'urgent' ? 'high' : 'medium';
    console.log('🔧 API ROUTE: Mapping urgency for database:', urgency, '->', dbUrgency);

    // Check if this is a resubmission BEFORE submitting (before status changes)
    let isResubmission = false;
    try {
      const appDataBefore = await ApplicationsService.getByIdInternal(id);
      isResubmission = appDataBefore && appDataBefore.status === 'rejected';
    } catch (error) {
      console.error('Failed to check application status for resubmission detection:', (error as Error).message);
    }

    
    // Add timeout and retry logic
    const submitWithRetry = async (retries = 3): Promise<boolean> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          // Create a timeout promise
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
          });
          
          // Submit for review with timeout
          const submitPromise = ApplicationsService.submitForReview({
            application_id: id,
            reviewer_id: parseInt(reviewer_id),
            urgency: dbUrgency,
            comments
          }, userId);
          
          const result = await Promise.race([submitPromise, timeoutPromise]);
          console.log(`🔧 API ROUTE: Submit attempt ${attempt} succeeded`);
          return result;
        } catch (error) {
          console.error(`🔧 API ROUTE: Submit attempt ${attempt} failed:`, error);
          if (attempt === retries) {
            throw error;
          }
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
      return false;
    };
    
    const success = await submitWithRetry();
    console.log('🔧 API ROUTE: ApplicationsService result:', success);

    if (success) {
      // Get application title and form data for the audit log
      let formName = null;
      let filename = null;
      let reviewerName = null;
      try {
        const appResult = await query('SELECT title, type, form_data FROM applications WHERE id = $1', [id]);
        if (appResult.rows.length > 0) {
          formName = appResult.rows[0].title;
          const applicationData = appResult.rows[0].form_data;
          const applicationType = appResult.rows[0].type;
          
          // Generate PDF filename using the same logic as PDF generation
          if (applicationData && applicationType) {
            try {
              console.log('🔧 SUBMIT-REVIEW: Attempting filename generation for type:', applicationType);
              console.log('🔧 SUBMIT-REVIEW: Application data keys:', applicationData ? Object.keys(applicationData) : null);
              
              switch (applicationType) {
                case 'cost-overview': {
                  const { generateDynamicFilename } = await import('@/lib/pdf-generator/integrations/FilenameIntegrations');
                  console.log('🔧 SUBMIT-REVIEW: Calling generateDynamicFilename with data:', {
                    hasClientDetails: !!applicationData.clientDetails,
                    hasAuthorityInfo: !!applicationData.authorityInformation,
                    dataStructure: applicationData ? Object.keys(applicationData) : null
                  });
                  filename = generateDynamicFilename(applicationData);
                  console.log('🔧 SUBMIT-REVIEW: Generated filename:', filename);
                  break;
                }
                case 'golden-visa': {
                  const { generateGoldenVisaFilename } = await import('@/lib/pdf-generator/integrations/FilenameIntegrations');
                  const clientInfo = {
                    firstName: applicationData.firstName || '',
                    lastName: applicationData.lastName || '',
                    companyName: applicationData.companyName || '',
                    date: applicationData.date || new Date().toISOString().split('T')[0],
                  };
                  filename = generateGoldenVisaFilename(applicationData, clientInfo);
                  break;
                }
                case 'company-services': {
                  const { generateCompanyServicesFilename } = await import('@/lib/pdf-generator/integrations/FilenameIntegrations');
                  const clientInfo = {
                    firstName: applicationData.firstName || '',
                    lastName: applicationData.lastName || '',
                    companyName: applicationData.companyName || '',
                    shortCompanyName: applicationData.shortCompanyName || '',
                    date: applicationData.date || new Date().toISOString().split('T')[0],
                  };
                  filename = generateCompanyServicesFilename(applicationData, clientInfo);
                  break;
                }
                case 'taxation': {
                  const { generateTaxationFilename } = await import('@/lib/pdf-generator/utils/taxationDataTransformer');
                  const clientInfo = {
                    firstName: applicationData.firstName || '',
                    lastName: applicationData.lastName || '',
                    companyName: applicationData.companyName || '',
                    date: applicationData.date || new Date().toISOString().split('T')[0],
                  };
                  filename = generateTaxationFilename(applicationData, clientInfo);
                  break;
                }
                case 'cit-return-letters': {
                  // Generate filename for CIT Return Letters
                  const companyCode = applicationData.selectedClient?.company_code || '';
                  const companyShortName = applicationData.selectedClient?.company_name_short || 'Company';
                  let letterTypes = '';
                  
                  if (applicationData.selectedLetterTypes && applicationData.selectedLetterTypes.length > 0) {
                    letterTypes = applicationData.selectedLetterTypes.join(' - ');
                  } else if (applicationData.letterType) {
                    letterTypes = applicationData.letterType;
                  } else {
                    letterTypes = 'CIT Return Letters';
                  }
                  
                  filename = `${companyCode} ${companyShortName} ${letterTypes}`;
                  break;
                }
              }
            } catch (error) {
              console.error('🔧 SUBMIT-REVIEW: Failed to generate filename for audit log:', error);
              console.error('🔧 SUBMIT-REVIEW: Error details:', error.message || error);
              console.error('🔧 SUBMIT-REVIEW: Application data that failed:', {
                type: applicationType,
                dataKeys: applicationData ? Object.keys(applicationData) : null,
                clientDetails: applicationData?.clientDetails ? Object.keys(applicationData.clientDetails) : null,
                authorityInfo: applicationData?.authorityInformation ? Object.keys(applicationData.authorityInformation) : null
              });
            }
          }
        }
        
        // Get reviewer name
        try {
          const reviewerResult = await query('SELECT full_name FROM users WHERE id = $1', [parseInt(reviewer_id)]);
          if (reviewerResult.rows.length > 0) {
            reviewerName = reviewerResult.rows[0].full_name;
          }
        } catch (error) {
          console.warn('Failed to get reviewer name for audit log:', error);
        }
      } catch (error) {
        console.warn('Failed to get application data for audit log:', error);
      }

      // Log audit event for form submission
      await logAuditEvent({
        user_id: userId,
        action: 'form_submitted_for_review',
        resource: 'review_system',
        details: {
          application_id: id,
          reviewer_id: parseInt(reviewer_id),
          reviewer_name: reviewerName,
          urgency,
          comments: comments || null,
          form_name: formName,
          filename: filename
        },
        ip_address: getClientIP(request),
        user_agent: getUserAgent(request)
      });

      // Trigger todo generation for the reviewer
      try {
        const { NotificationTodoAutomation } = await import('@/lib/services/notification-todo-automation');
        
        // Create a mock notification for todo generation
        const mockNotification = {
          id: `review_${id}_${Date.now()}`,
          type: 'review_requested', // Match the actual notification type
          user_id: parseInt(reviewer_id), // Todo goes to the reviewer
          data: {
            application_id: id,
            application_title: filename ? filename.replace('.pdf', '') : formName, // Prefer fresh filename over potentially stale DB title
            reviewer_id: parseInt(reviewer_id),
            reviewer_name: reviewerName,
            submitter_name: session.user.full_name, // Rule expects this field
            urgency: dbUrgency, // Use the already mapped urgency value
            comments: comments || null,
            form_name: filename ? filename.replace('.pdf', '') : formName, // Use fresh filename
            filename: filename,
            client_name: filename ? filename.replace('.pdf', '') : formName, // Use fresh filename as client identifier
            document_type: 'Application Review',
            submitter_id: userId
          },
          created_at: new Date().toISOString()
        };

        await NotificationTodoAutomation.processNotification(mockNotification);
        console.log('✅ Todo generated for reviewer:', reviewerName);
      } catch (error) {
        console.error('❌ Failed to generate todo for reviewer:', error);
        // Don't fail the main request if todo generation fails
      }

      // Save the submitter's message to message history
      if (comments && comments.trim()) {
        try {
          const messageType = isResubmission ? 'resubmission' : 'submission';
          await ApplicationsService.addMessage(
            id,
            userId,
            'submitter',
            comments.trim(),
            messageType
          );
        } catch (error) {
          console.error('Failed to save submitter message to history:', (error as Error).message);
        }
      }

      return NextResponse.json({ 
        success: true,
        message: 'Application submitted for review successfully'
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Failed to submit application for review'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('🔧 SUBMIT REVIEW ERROR: Full error details:', error);
    console.error('🔧 SUBMIT REVIEW ERROR: Error message:', (error as Error).message);
    console.error('🔧 SUBMIT REVIEW ERROR: Error stack:', (error as Error).stack);
    
    // Return detailed error information for debugging
    return NextResponse.json(
      { 
        success: false,
        error: (error as Error).message,
        details: config.debugMode ? {
          stack: (error as Error).stack,
          name: (error as Error).name
        } : undefined
      }, 
      { status: 400 }
    );
  }
}