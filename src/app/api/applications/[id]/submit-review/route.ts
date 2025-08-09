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

    console.log('🔧 API ROUTE: Calling ApplicationsService.submitForReview');
    
    // Submit for review
    const success = await ApplicationsService.submitForReview({
      application_id: id,
      reviewer_id: parseInt(reviewer_id),
      urgency,
      comments
    }, userId);
    
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
            urgency: urgency === 'urgent' ? 'high' : 'standard', // Map urgency values
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
    console.error('Submit review error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: config.debugMode ? (error as Error).message : 'Failed to submit for review'
      }, 
      { status: config.debugMode ? 500 : 200 }
    );
  }
}