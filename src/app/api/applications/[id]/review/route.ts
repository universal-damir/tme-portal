// Review Application Action API Route
// Safe approve/reject actions with comprehensive validation

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationsService } from '@/lib/services/review-system';
import { getReviewSystemConfig } from '@/lib/config/review-system';
import { verifySession } from '@/lib/auth';
import { logAuditEvent, getClientIP, getUserAgent } from '@/lib/audit';
import { query } from '@/lib/database';

// POST /api/applications/[id]/review - Approve or reject application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Safety check: Feature flag
  const config = getReviewSystemConfig();
  if (!config.enabled || !config.allowReviewActions) {
    return NextResponse.json({ success: false, message: 'Review actions are currently disabled' }, { status: 200 });
  }

  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;

    const body = await request.json();
    const { action, comments } = body;

    // Validation
    if (!action) {
      return NextResponse.json(
        { error: 'Missing required field: action' }, 
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: approve or reject' }, 
        { status: 400 }
      );
    }

    // Comments are required for reject, optional for approve
    if (action === 'reject' && (!comments || comments.trim().length < 10)) {
      return NextResponse.json(
        { error: 'Comments are required when rejecting (minimum 10 characters)' }, 
        { status: 400 }
      );
    }

    // Perform review action
    const success = await ApplicationsService.performReviewAction({
      application_id: id,
      action,
      comments: comments ? comments.trim() : ''
    }, userId);

    if (success) {
      // Get application title and form data for the audit log
      let formName = null;
      let filename = null;
      try {
        const appResult = await query('SELECT title, type, form_data FROM applications WHERE id = $1', [id]);
        if (appResult.rows.length > 0) {
          formName = appResult.rows[0].title;
          const applicationData = appResult.rows[0].form_data;
          const applicationType = appResult.rows[0].type;
          
          // Generate PDF filename using the same logic as PDF generation
          if (applicationData && applicationType) {
            try {
              switch (applicationType) {
                case 'cost_overview': {
                  const { generateDynamicFilename } = await import('@/lib/pdf-generator/utils/filename');
                  filename = generateDynamicFilename(applicationData);
                  break;
                }
                case 'golden_visa': {
                  const { generateGoldenVisaFilename } = await import('@/lib/pdf-generator/utils/goldenVisaDataTransformer');
                  const clientInfo = {
                    firstName: applicationData.firstName || '',
                    lastName: applicationData.lastName || '',
                    companyName: applicationData.companyName || '',
                    date: applicationData.date || new Date().toISOString().split('T')[0],
                  };
                  filename = generateGoldenVisaFilename(applicationData, clientInfo);
                  break;
                }
                case 'company_services': {
                  const { generateCompanyServicesFilename } = await import('@/lib/pdf-generator/utils/companyServicesDataTransformer');
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
              console.warn('Failed to generate filename for audit log:', error);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to get application data for audit log:', error);
      }

      // Log audit event for review action
      await logAuditEvent({
        user_id: userId,
        action: action === 'approve' ? 'review_approved' : 'review_rejected',
        resource: 'review_system',
        details: {
          application_id: id,
          action,
          comments: comments || null,
          form_name: formName,
          filename: filename
        },
        ip_address: getClientIP(request),
        user_agent: getUserAgent(request)
      });

      // Trigger todo automation for review completion  
      try {
        const { NotificationTodoAutomation } = await import('@/lib/services/notification-todo-automation');
        
        // Create mock notification to trigger auto-completion
        const mockNotification = {
          id: `approval_${id}_${Date.now()}`,
          type: 'application_approved',
          user_id: userId, // Reviewer who performed the action
          data: {
            application_id: id,
            action,
            form_name: formName,
            filename: filename,
            application_title: formName
          },
          created_at: new Date().toISOString()
        };

        await NotificationTodoAutomation.processNotification(mockNotification);
        console.log(`✅ Triggered todo auto-completion for application ${id}`);
      } catch (error) {
        console.error('❌ Failed to trigger todo auto-completion:', error);
        // Don't fail the main request if todo automation fails
      }

      return NextResponse.json({ 
        success: true,
        message: `Application ${action}ed successfully`
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Failed to perform review action'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Review action error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: config.debugMode ? (error as Error).message : 'Failed to perform review action'
      }, 
      { status: config.debugMode ? 500 : 200 }
    );
  }
}