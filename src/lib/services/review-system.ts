// Review System Database Service
// Safe database operations with error handling and rollback capabilities

import { Pool } from 'pg';
import { 
  Application, 
  Notification, 
  ApplicationType, 
  ApplicationStatus,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ReviewSubmission,
  ReviewAction,
  Reviewer,
  ReviewMessage,
  ReviewMessageType,
  ReviewUserRole
} from '@/types/review-system';
import { getReviewSystemConfig, withReviewSystemEnabled } from '@/lib/config/review-system';

// Database connection (reuse existing pool)
let pool: Pool;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 50, // Increased from 20 to handle concurrent users
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000, // Increased from 2000
      maxUses: 7500, // Close connections after 7500 uses to prevent leaks
    });
    
    // Add error handling for pool
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }
  return pool;
}

// Application title generation functions
async function generateApplicationTitle(applicationType: string, formData: any): Promise<string> {
  console.log('🔧 generateApplicationTitle called with:', { 
    applicationType, 
    typeOfType: typeof applicationType,
    exactMatch: applicationType === 'golden-visa',
    formDataKeys: formData ? Object.keys(formData) : null,
    hasFormData: !!formData
  });
  
  if (applicationType === 'golden-visa') {
    console.log('🔧 Calling generateGoldenVisaTitle...');
    const title = await generateGoldenVisaTitle(formData);
    console.log('🔧 Generated Golden Visa title:', title);
    return title;
  } else if (applicationType === 'cost-overview') {
    console.log('🔧 Calling generateCostOverviewTitle...');
    const title = generateCostOverviewTitle(formData);
    console.log('🔧 Generated Cost Overview title:', title);
    return title;
  } else if (applicationType === 'company-services') {
    console.log('🔧 Calling generateCompanyServicesTitle...');
    const title = generateCompanyServicesTitle(formData);
    console.log('🔧 Generated Company Services title:', title);
    return title;
  } else if (applicationType === 'taxation') {
    console.log('🔧 Calling generateTaxationTitle...');
    const title = generateTaxationTitle(formData);
    console.log('🔧 Generated Taxation title:', title);
    return title;
  } else if (applicationType === 'cit-return-letters') {
    console.log('🔧 Calling generateCITReturnLettersTitle...');
    const title = generateCITReturnLettersTitle(formData);
    console.log('🔧 Generated CIT Return Letters title:', title);
    return title;
  }
  
  console.log('🔧 No matching type, using fallback. Type was:', applicationType);
  // Default fallback
  return 'Application';
}

async function generateGoldenVisaTitle(formData: any): Promise<string> {
  console.log('🔧 generateGoldenVisaTitle called - using modern filename generation');
  
  try {
    // Use the same filename generation logic as PDF/preview
    const { generateGoldenVisaFilename } = await import('@/lib/pdf-generator/integrations/FilenameIntegrations');
    
    const clientInfo = {
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      companyName: formData.companyName || '',
      date: formData.date || new Date().toISOString().split('T')[0],
    };
    
    const filename = generateGoldenVisaFilename(formData, clientInfo);
    console.log('🔧 Generated Golden Visa filename:', filename);
    
    // Remove .pdf extension for notification title
    return filename.replace('.pdf', '');
  } catch (error) {
    console.error('🔧 Error generating Golden Visa filename, using fallback:', error);
    
    // Fallback to simple format if filename generation fails
    const date = new Date(formData.date || new Date());
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const formattedDate = `${yy}${mm}${dd}`;
    
    const name = formData.companyName || 
                 (formData.firstName && formData.lastName ? `${formData.lastName} ${formData.firstName}` : '') ||
                 formData.firstName || formData.lastName || 'Client';
    
    return `${formattedDate} ${name} Golden Visa`;
  }
}

function generateCostOverviewTitle(formData: any): string {
  // Use the same detailed filename generation as the PDF export
  console.log('🔧 CRITICAL DEBUG: generateCostOverviewTitle called with:', {
    keys: formData ? Object.keys(formData) : null,
    hasClientDetails: !!formData?.clientDetails,
    hasAuthorityInfo: !!formData?.authorityInformation,
    clientDetailsKeys: formData?.clientDetails ? Object.keys(formData.clientDetails) : null,
    authorityInfoKeys: formData?.authorityInformation ? Object.keys(formData.authorityInformation) : null
  });
  
  try {
    const { generateDynamicFilename } = require('@/lib/pdf-generator/integrations/FilenameIntegrations');
    console.log('🔧 CRITICAL DEBUG: About to call generateDynamicFilename with data structure:', formData);
    const filename = generateDynamicFilename(formData);
    console.log('🔧 CRITICAL DEBUG: generateDynamicFilename succeeded, filename:', filename);
    // Remove the .pdf extension for notification display
    return filename.replace('.pdf', '');
  } catch (error) {
    console.error('Failed to generate detailed title, error details:', error);
    console.error('FormData structure:', {
      hasClientDetails: !!formData.clientDetails,
      hasAuthorityInfo: !!formData.authorityInformation,
      clientDetailsKeys: formData.clientDetails ? Object.keys(formData.clientDetails) : null,
      authorityInfoKeys: formData.authorityInformation ? Object.keys(formData.authorityInformation) : null,
      fullFormDataKeys: formData ? Object.keys(formData) : null
    });
    
    // Enhanced fallback that better matches PDF filename format
    const date = new Date(formData.clientDetails?.date || new Date());
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const formattedDate = `${yy}${mm}${dd}`;
    
    // Use same naming logic as PDF generator - check addressToCompany first
    const firstName = formData.clientDetails?.firstName || '';
    const lastName = formData.clientDetails?.lastName || '';
    const companyName = formData.clientDetails?.companyName || '';
    const addressToCompany = formData.clientDetails?.addressToCompany || false;
    
    // Determine name for title based on addressToCompany checkbox (same as PDF generator)
    const nameForTitle = addressToCompany && companyName ? 
      companyName : 
      (firstName ? 
        (lastName ? `${lastName} ${firstName}` : firstName) : 
        (companyName || 'CLIENT'));
    
    const authority = formData.authorityInformation?.responsibleAuthority || 'Unknown Authority';
    
    // Check if this is DET authority for different format
    const isDET = authority === 'DET (Dubai Department of Economy and Tourism)';
    
    if (isDET) {
      // For DET: YYMMDD <NAME> DET CORP/INDIV AED <SECONDARY_CURRENCY>
      const setupType = formData.clientDetails?.companySetupType === 'Corporate Setup' ? 'CORP' : 'INDIV';
      const secondaryCurrency = formData.clientDetails?.secondaryCurrency || 'USD';
      return `${formattedDate} ${nameForTitle} DET ${setupType} setup AED ${secondaryCurrency}`;
    } else {
      // For IFZA and other authorities: Include basic visa info
      const numberOfYears = formData.ifzaLicense?.licenseYears || 1;
      const visaQuota = formData.ifzaLicense?.visaQuota || 0;
      const visaUsed = formData.visaCosts?.numberOfVisas || 0;
      const spouseVisas = formData.visaCosts?.spouseVisa ? 1 : 0;
      const childrenVisas = formData.visaCosts?.numberOfChildVisas || 0;
      const secondaryCurrency = formData.clientDetails?.secondaryCurrency || 'USD';
      
      // Get simplified authority name
      const cleanedAuthority = authority.includes('IFZA') ? 'IFZA' : 
                              authority.includes('DET') ? 'DET' : 
                              authority.replace(/[()]/g, '').split(' ')[0];
      
      return `${formattedDate} ${nameForTitle} ${cleanedAuthority} ${numberOfYears} ${visaQuota} ${visaUsed} ${spouseVisas} ${childrenVisas} setup AED ${secondaryCurrency}`;
    }
  }
}

function generateCompanyServicesTitle(formData: any): string {
  // Use the same detailed filename generation as PDF export for consistency
  try {
    const { generateCompanyServicesFilename } = require('@/lib/pdf-generator/integrations/FilenameIntegrations');
    const filename = generateCompanyServicesFilename(formData, {});
    return filename.replace('.pdf', '');
  } catch (error) {
    console.warn('Failed to generate detailed title, using fallback:', error);
    
    // Fallback to basic format - customize for company services
    const date = new Date(formData.date || new Date());
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const formattedDate = `${yy}${mm}${dd}`;
    
    const firstName = formData.firstName || '';
    const lastName = formData.lastName || '';
    const companyName = formData.companyName || '';
    
    const nameForTitle = companyName || 
      (firstName && lastName ? `${lastName} ${firstName}` : firstName || lastName || 'CLIENT');
    
    return `${formattedDate} TME Services ${nameForTitle}`;
  }
}

function generateTaxationTitle(formData: any): string {
  try {
    const { generateTaxationFilename } = require('@/lib/pdf-generator/utils/taxationDataTransformer');
    const filename = generateTaxationFilename(formData, {});
    return filename.replace('.pdf', '');
  } catch (error) {
    // Fallback implementation matching PDF filename format
    const date = new Date(formData.date || new Date());
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const formattedDate = `${yy}${mm}${dd}`;
    
    // Get company abbreviation from company type
    const companyAbbreviation = formData.companyType === 'management-consultants' ? 'MGT' : 'FZCO';
    
    // Get company short name
    const companyShortName = formData.shortCompanyName || 'Company';
    
    // Format tax end period as dd.mm.yyyy
    const formatTaxEndPeriod = () => {
      const toDate = formData.citDisclaimer?.taxPeriodRange?.toDate;
      if (toDate) {
        const endDate = new Date(toDate);
        const day = endDate.getDate().toString().padStart(2, '0');
        const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
        const year = endDate.getFullYear();
        return `${day}.${month}.${year}`;
      }
      return '31.12.2025'; // Default fallback
    };
    
    return `${formattedDate} ${companyAbbreviation} ${companyShortName} CIT Disclaimer ${formatTaxEndPeriod()}`;
  }
}

function generateCITReturnLettersTitle(formData: any): string {
  try {
    // Check for selectedLetterTypes (new format) or fallback to letterType (legacy)
    const hasLetterTypes = formData.selectedLetterTypes && formData.selectedLetterTypes.length > 0;
    const hasLegacyLetterType = formData.letterType && formData.letterType !== '';
    
    if (!formData.selectedClient || (!hasLetterTypes && !hasLegacyLetterType)) {
      return 'CIT Return Letters';
    }
    
    const companyCode = formData.selectedClient?.company_code || '';
    const companyShortName = formData.selectedClient?.company_name_short || 'Company';
    
    // Use selectedLetterTypes if available, otherwise fallback to letterType
    let letterTypes: string;
    if (hasLetterTypes) {
      // For both single and multiple letters, use full names separated by " - "
      letterTypes = formData.selectedLetterTypes.join(' - ');
    } else {
      letterTypes = formData.letterType || 'Letter';
    }
    
    // Return with company code instead of date
    return `${companyCode} ${companyShortName} ${letterTypes}`;
  } catch (error) {
    console.warn('Failed to generate CIT return letters title, using fallback:', error);
    return 'CIT Return Letters Application';
  }
}

// Safe database operation wrapper
async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  operationName: string,
  rethrowErrors: boolean = false
): Promise<T> {
  const config = getReviewSystemConfig();
  
  if (!config.enabled) {
    if (config.debugMode) {
      console.log(`Review system disabled, skipping ${operationName}`);
    }
    return fallback;
  }

  try {
    return await operation();
  } catch (error) {
    console.error(`Review system ${operationName} failed:`, error);
    
    // Log to audit table for debugging
    try {
      await logError(operationName, error);
    } catch (logError) {
      console.error('Failed to log review system error:', logError);
    }
    
    // For critical operations like create, re-throw the error instead of returning fallback
    if (rethrowErrors) {
      throw error;
    }
    
    return fallback;
  }
}

// Error logging function
async function logError(operation: string, error: any): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, resource, details)
      VALUES (NULL, $1, 'review_system', $2)
    `, [
      `review_system_error_${operation}`,
      JSON.stringify({
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    ]);
  } catch (e) {
    // Silent fail - don't throw errors in error logging
  }
}

// Applications service
export class ApplicationsService {
  
  static async create(data: CreateApplicationRequest, userId: number): Promise<Application | null> {
    console.log('🔧 BACKEND: ApplicationsService.create called with:', { 
      type: data.type, 
      title: data.title, 
      userId,
      hasFormData: !!data.form_data 
    });
    
    const config = getReviewSystemConfig();
    console.log('🔧 BACKEND: Config check:', { 
      enabled: config.enabled,
      canUseCITReturnLettersReview: config.canUseCITReturnLettersReview 
    });
    
    return safeDbOperation(async () => {
      const pool = getPool();
      
      // Safety check: Limit applications per user
      const countResult = await pool.query(`
        SELECT COUNT(*) as count 
        FROM applications 
        WHERE submitted_by_id = $1 AND status != 'approved'
      `, [userId]);
      
      if (parseInt(countResult.rows[0].count) >= config.maxApplicationsPerUser) {
        console.error('🔧 BACKEND: Maximum applications limit reached for user:', userId);
        console.error('🔧 BACKEND: Current count:', countResult.rows[0].count, 'Limit:', config.maxApplicationsPerUser);
        throw new Error('Maximum applications limit reached');
      }
      
      console.log('🔧 BACKEND: Inserting application with:', {
        type: data.type,
        title: data.title,
        userId,
        formDataKeys: data.form_data ? Object.keys(data.form_data) : []
      });
      
      const result = await pool.query(`
        INSERT INTO applications (type, title, form_data, submitted_by_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [data.type, data.title, data.form_data, userId]);
      
      console.log('🔧 BACKEND: SQL result:', {
        rowCount: result.rowCount,
        hasRows: result.rows.length > 0,
        firstRow: result.rows[0] || null
      });
      
      if (!result.rows[0]) {
        console.error('🔧 BACKEND: No rows returned from INSERT');
        throw new Error('Database INSERT returned no rows');
      }
      
      const application = result.rows[0] as Application;
      console.log('🔧 BACKEND: Application created successfully:', {
        id: application.id,
        type: application.type,
        title: application.title
      });
      
      return application;
    }, null, 'create_application', true);
  }
  
  static async update(id: string, data: UpdateApplicationRequest, userId: number): Promise<Application | null> {
    console.log('🔧 BACKEND: ApplicationsService.update called with:', { 
      id, 
      hasTitle: !!data.title, 
      hasFormData: !!data.form_data, 
      userId 
    });
    
    return safeDbOperation(async () => {
      const pool = getPool();
      
      // Verify ownership or reviewer access
      const accessCheck = await pool.query(`
        SELECT 
          a.submitted_by_id, 
          a.type,
          a.status,
          a.reviewer_id
        FROM applications a
        WHERE a.id = $1
      `, [id]);
      
      if (accessCheck.rows.length === 0) {
        throw new Error('Application not found');
      }
      
      // Also check if user has reviewer role
      const userRoleCheck = await pool.query(`
        SELECT role FROM users WHERE id = $1
      `, [userId]);
      
      const application = accessCheck.rows[0];
      const userRole = userRoleCheck.rows[0]?.role;
      const isOwner = application.submitted_by_id === userId;
      const isAssignedReviewer = application.reviewer_id === userId;
      const hasReviewerRole = userRole === 'admin' || userRole === 'reviewer' || userRole === 'super_admin';
      const isUnderReview = ['under_review', 'rejected', 'pending_review'].includes(application.status);
      
      console.log('🔧 BACKEND: Application access check:', {
        found: true,
        existingType: application.type,
        isOwner,
        isAssignedReviewer,
        hasReviewerRole,
        userRole,
        isUnderReview,
        status: application.status,
        userId,
        submittedBy: application.submitted_by_id,
        reviewerId: application.reviewer_id
      });
      
      // Allow update if:
      // 1. User is the owner (original submitter)
      // 2. User has reviewer role and app is under review/rejected/pending
      // 3. User is specifically assigned as reviewer
      if (!isOwner && !(hasReviewerRole && isUnderReview) && !isAssignedReviewer) {
        throw new Error('Application not found or access denied');
      }
      
      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      if (data.title) {
        updateFields.push(`title = $${paramCount++}`);
        values.push(data.title);
      }
      
      if (data.form_data) {
        updateFields.push(`form_data = $${paramCount++}`);
        values.push(data.form_data);
      }
      
      // CRITICAL FIX: Allow updating application type
      if (data.type) {
        updateFields.push(`type = $${paramCount++}`);
        values.push(data.type);
        console.log('🔧 BACKEND: Updating application type to:', data.type);
      }
      
      // Check if we have any fields to update
      if (updateFields.length === 0) {
        console.log('🔧 BACKEND: No fields to update, skipping SQL query');
        return ownerCheck.rows[0] as Application;
      }
      
      values.push(id);
      
      const result = await pool.query(`
        UPDATE applications 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `, values);
      
      return result.rows[0] as Application;
    }, null, 'update_application');
  }
  
  static async getByUser(userId: number): Promise<Application[]> {
    return safeDbOperation(async () => {
      const pool = getPool();
      
      const result = await pool.query(`
        SELECT a.*, 
               sb.full_name as submitted_by_name,
               r.full_name as reviewer_name
        FROM applications a
        LEFT JOIN users sb ON a.submitted_by_id = sb.id
        LEFT JOIN users r ON a.reviewer_id = r.id
        WHERE a.submitted_by_id = $1
        ORDER BY a.created_at DESC
      `, [userId]);
      
      return result.rows as Application[];
    }, [], 'get_applications_by_user');
  }
  
  static async getForReview(userId: number): Promise<Application[]> {
    return safeDbOperation(async () => {
      const pool = getPool();
      
      const result = await pool.query(`
        SELECT a.*, 
               sb.full_name as submitted_by_name,
               r.full_name as reviewer_name
        FROM applications a
        LEFT JOIN users sb ON a.submitted_by_id = sb.id
        LEFT JOIN users r ON a.reviewer_id = r.id
        WHERE a.reviewer_id = $1 AND a.status IN ('pending_review', 'under_review')
        ORDER BY a.created_at DESC
      `, [userId]);
      
      return result.rows as Application[];
    }, [], 'get_applications_for_review');
  }
  
  static async getById(applicationId: string, userId: number): Promise<Application | null> {
    return safeDbOperation(async () => {
      const pool = getPool();
      
      const result = await pool.query(`
        SELECT a.*, 
               sb.id as submitted_by_id_ref, sb.full_name as submitted_by_name, sb.email as submitted_by_email, sb.department as submitted_by_department,
               r.id as reviewer_id_ref, r.full_name as reviewer_name, r.email as reviewer_email, r.department as reviewer_department
        FROM applications a
        LEFT JOIN users sb ON a.submitted_by_id = sb.id
        LEFT JOIN users r ON a.reviewer_id = r.id
        WHERE a.id = $1 AND (a.submitted_by_id = $2 OR a.reviewer_id = $2)
        ORDER BY a.created_at DESC
      `, [applicationId, userId]);
      
      const row = result.rows[0];
      if (!row) return null;
      
      // Transform the flat result into the expected Application structure
      const application: Application = {
        id: row.id,
        type: row.type,
        title: row.title,
        form_data: row.form_data,
        status: row.status,
        submitted_by_id: row.submitted_by_id,
        reviewer_id: row.reviewer_id,
        submitter_message: row.submitter_message,
        review_comments: row.review_comments,
        urgency: row.urgency,
        submitted_at: row.submitted_at,
        reviewed_at: row.reviewed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        // Transform the joined user data into nested objects
        submitted_by: row.submitted_by_name ? {
          id: row.submitted_by_id_ref,
          full_name: row.submitted_by_name,
          email: row.submitted_by_email,
          department: row.submitted_by_department
        } : undefined,
        reviewer: row.reviewer_name ? {
          id: row.reviewer_id_ref,
          full_name: row.reviewer_name,
          email: row.reviewer_email,
          department: row.reviewer_department
        } : undefined
      };
      
      return application;
    }, null, 'get_application_by_id');
  }
  
  static async submitForReview(submission: ReviewSubmission, userId: number): Promise<boolean> {
    console.log('🔧 BACKEND: submitForReview called with:', { submission, userId });
    return safeDbOperation(async () => {
      console.log('🔧 BACKEND: Inside safeDbOperation');
      const config = getReviewSystemConfig();
      console.log('🔧 BACKEND: Config loaded:', { enabled: config.enabled, reviewSubmissionEnabled: config.reviewSubmissionEnabled });
      
      if (!config.reviewSubmissionEnabled) {
        throw new Error('Review submission is currently disabled');
      }
      
      const pool = getPool();
      const client = await pool.connect();
      
      try {
        // Start transaction for atomic operation
        await client.query('BEGIN');
        
        // Check if this is a resubmission (application was previously rejected)
        let isResubmission = false;
        let newRevision = 1;
        
        try {
          const prevStatusResult = await client.query(`
            SELECT status, revision_number FROM applications WHERE id = $1 AND submitted_by_id = $2
          `, [submission.application_id, userId]);
          
          isResubmission = prevStatusResult.rows.length > 0 && prevStatusResult.rows[0].status === 'rejected';
          const currentRevision = prevStatusResult.rows[0]?.revision_number || 1;
          newRevision = isResubmission ? currentRevision + 1 : currentRevision;
        } catch (error) {
          // If revision_number column doesn't exist, rollback and restart transaction
          console.warn('Revision tracking not available, using fallback logic');
          
          // Rollback the current transaction
          await client.query('ROLLBACK');
          
          // Start a new transaction
          await client.query('BEGIN');
          
          // Use fallback logic without revision_number
          const prevStatusResult = await client.query(`
            SELECT status FROM applications WHERE id = $1 AND submitted_by_id = $2
          `, [submission.application_id, userId]);
          
          isResubmission = prevStatusResult.rows.length > 0 && prevStatusResult.rows[0].status === 'rejected';
          newRevision = 1; // Default to 1 if no revision tracking available
        }
        
        // Update application status and store submitter message
        const submitterComments = submission.comments || null;
        
        // Try to update with revision_number, fallback if column doesn't exist
        try {
          await client.query(`
            UPDATE applications 
            SET status = 'pending_review', 
                reviewer_id = $1, 
                urgency = $2,
                revision_number = $3,
                submitted_at = CURRENT_TIMESTAMP
            WHERE id = $4 AND submitted_by_id = $5
          `, [submission.reviewer_id, submission.urgency, newRevision, submission.application_id, userId]);
        } catch (error) {
          // If revision_number column doesn't exist, rollback and use simple update
          console.warn('Revision tracking not available for UPDATE, using fallback');
          
          // Rollback the current transaction
          await client.query('ROLLBACK');
          
          // Start a new transaction
          await client.query('BEGIN');
          
          // Update without revision_number
          await client.query(`
            UPDATE applications 
            SET status = 'pending_review', 
                reviewer_id = $1, 
                urgency = $2,
                submitted_at = CURRENT_TIMESTAMP
            WHERE id = $3 AND submitted_by_id = $4
          `, [submission.reviewer_id, submission.urgency, submission.application_id, userId]);
        }
        
        // Store submitter message in form_data temporarily
        if (submitterComments) {
          await client.query(`
            UPDATE applications 
            SET form_data = form_data || jsonb_build_object('_submitter_message', $1::text)
            WHERE id = $2
          `, [submitterComments, submission.application_id]);
        }
        
        // Get application data for notification title generation
        console.log('🔧 BACKEND: Getting application data for ID:', submission.application_id);
        const appResult = await client.query(`
          SELECT type, title, form_data FROM applications WHERE id = $1
        `, [submission.application_id]);
        console.log('🔧 BACKEND: Query result:', { 
          rowCount: appResult.rows.length, 
          firstRow: appResult.rows[0] ? { 
            type: appResult.rows[0].type, 
            title: appResult.rows[0].title,
            hasFormData: !!appResult.rows[0].form_data 
          } : null 
        });
        
        let applicationTitle = 'Application';
        
        if (appResult.rows.length > 0) {
          try {
            const applicationType = appResult.rows[0].type;
            const formData = appResult.rows[0].form_data;
            
            console.log('🔧 DEBUG submitForReview - Application Type Check:', {
              rawType: applicationType,
              typeIsString: typeof applicationType === 'string',
              typeLength: applicationType ? applicationType.length : 0,
              exactlyGoldenVisa: applicationType === 'golden-visa',
              exactlyCostOverview: applicationType === 'cost-overview',
              hasFormData: !!formData,
              formDataKeys: formData ? Object.keys(formData) : []
            });
            
            applicationTitle = await generateApplicationTitle(applicationType, formData);
            
            console.log('🔧 DEBUG Generated title:', applicationTitle);
          } catch (error) {
            console.error('Error generating notification title:', error);
            applicationTitle = appResult.rows[0].title || 'Application';
          }
        }
        
        // Get submitter info for notification
        const submitterResult = await client.query(`
          SELECT full_name, employee_code FROM users WHERE id = $1
        `, [userId]);
        
        const submitterInfo = submitterResult.rows[0];
        
        // Create notification for reviewer
        console.log('🔧 Creating notification with:', {
          title: applicationTitle,
          type: 'review_requested',
          application_id: submission.application_id
        });
        
        await NotificationsService.create({
          user_id: submission.reviewer_id,
          type: 'review_requested',
          title: applicationTitle,
          message: submission.comments || 'A new application has been submitted for your review.',
          application_id: submission.application_id,
          metadata: {
            submitter_name: submitterInfo?.full_name,
            submitter_employee_code: submitterInfo?.employee_code
          }
        });
        
        await client.query('COMMIT');
        return true;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('🔧 submitForReview transaction error:', error);
        throw error;
      } finally {
        // CRITICAL: Always release the client back to the pool
        client.release();
      }
    }, false, 'submit_for_review');
  }
  
  static async performReviewAction(action: ReviewAction, userId: number): Promise<boolean> {
    return safeDbOperation(async () => {
      const config = getReviewSystemConfig();
      
      if (!config.allowReviewActions) {
        throw new Error('Review actions are currently disabled');
      }
      
      const pool = getPool();
      const client = await pool.connect();
      
      try {
        // Start transaction for atomic operation
        await client.query('BEGIN');
        
        // Update application status based on action
        const newStatus = action.action === 'approve' ? 'approved' : 'rejected';
        
        await client.query(`
          UPDATE applications 
          SET status = $1, 
              review_comments = $2,
              reviewed_at = CURRENT_TIMESTAMP
          WHERE id = $3 AND reviewer_id = $4
        `, [newStatus, action.comments, action.application_id, userId]);
        
        // Get application details and reviewer info for notification
        const appResult = await client.query(`
          SELECT a.submitted_by_id, a.type, a.title, a.form_data, u.full_name as reviewer_name, u.employee_code as reviewer_employee_code
          FROM applications a
          JOIN users u ON a.reviewer_id = u.id
          WHERE a.id = $1
        `, [action.application_id]);
        
        if (appResult.rows.length > 0) {
          const app = appResult.rows[0];
          
          // Generate proper application title using same logic as submitForReview
          let applicationTitle = 'Application';
          
          try {
            const applicationType = app.type;
            const formData = app.form_data;
            
            applicationTitle = await generateApplicationTitle(applicationType, formData);
          } catch (error) {
            console.error('Error generating notification title:', error);
            applicationTitle = app.title || 'Application';
          }
          
          // Create notification for submitter
          await NotificationsService.create({
            user_id: app.submitted_by_id,
            type: action.action === 'approve' ? 'application_approved' : 'application_rejected',
            title: `${applicationTitle} ${action.action === 'approve' ? 'Approved' : 'Rejected'}`,
            message: action.comments,
            application_id: action.application_id,
            metadata: {
              reviewer_name: app.reviewer_name,
              reviewer_employee_code: app.reviewer_employee_code
            }
          });
        }
        
        await client.query('COMMIT');
        return true;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('🔧 performReviewAction transaction error:', error);
        throw error;
      } finally {
        // CRITICAL: Always release the client back to the pool
        client.release();
      }
    }, false, 'perform_review_action');
  }
  // Message History methods
  static async getMessageHistory(applicationId: string): Promise<ReviewMessage[]> {
    return safeDbOperation(async () => {
      const pool = getPool();
      
      try {
        const result = await pool.query(`
          SELECT rm.*, u.full_name, u.email, u.department, u.employee_code, u.role
          FROM review_messages rm
          LEFT JOIN users u ON rm.user_id = u.id
          WHERE rm.application_id = $1
          ORDER BY rm.created_at ASC
        `, [applicationId]);
        
        return result.rows.map(row => ({
          id: row.id,
          application_id: row.application_id,
          user_id: row.user_id,
          user_role: row.user_role as ReviewUserRole,
          message: row.message,
          message_type: row.message_type as ReviewMessageType,
          created_at: row.created_at,
          user: row.full_name ? {
            id: row.user_id,
            full_name: row.full_name,
            email: row.email,
            department: row.department,
            employee_code: row.employee_code,
            role: row.role
          } : undefined
        })) as ReviewMessage[];
      } catch (error: any) {
        // If table doesn't exist yet, return empty array
        if (error.message && (error.message.includes('review_messages') || error.message.includes('relation') || error.message.includes('does not exist'))) {
          console.log('🔧 MESSAGE HISTORY: review_messages table does not exist yet, returning empty array');
          return [];
        }
        throw error;
      }
    }, [], 'get_message_history');
  }
  
  static async addMessage(
    applicationId: string, 
    userId: number, 
    userRole: ReviewUserRole, 
    message: string, 
    messageType: ReviewMessageType = 'comment'
  ): Promise<ReviewMessage | null> {
    return safeDbOperation(async () => {
      const pool = getPool();
      
      try {
        const result = await pool.query(`
          INSERT INTO review_messages (application_id, user_id, user_role, message, message_type)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [applicationId, userId, userRole, message, messageType]);
        
        if (result.rows.length === 0) return null;
        
        const row = result.rows[0];
        
        // Get user information
        const userResult = await pool.query(`
          SELECT full_name, email, department
          FROM users 
          WHERE id = $1
        `, [userId]);
        
        return {
          id: row.id,
          application_id: row.application_id,
          user_id: row.user_id,
          user_role: row.user_role as ReviewUserRole,
          message: row.message,
          message_type: row.message_type as ReviewMessageType,
          created_at: row.created_at,
          user: userResult.rows.length > 0 ? {
            id: row.user_id,
            full_name: userResult.rows[0].full_name,
            email: userResult.rows[0].email,
            department: userResult.rows[0].department
          } : undefined
        } as ReviewMessage;
      } catch (error: any) {
        // If table doesn't exist yet, log and return null (graceful degradation)
        if (error.message && (error.message.includes('review_messages') || error.message.includes('relation') || error.message.includes('does not exist'))) {
          console.log('🔧 MESSAGE HISTORY: review_messages table does not exist yet, skipping message save');
          return null;
        }
        throw error;
      }
    }, null, 'add_review_message');
  }
  
  static async getByIdInternal(applicationId: string): Promise<Application | null> {
    return safeDbOperation(async () => {
      const pool = getPool();
      
      const result = await pool.query(`
        SELECT a.*, 
               sb.id as submitted_by_id_ref, sb.full_name as submitted_by_name, sb.email as submitted_by_email, sb.department as submitted_by_department,
               r.id as reviewer_id_ref, r.full_name as reviewer_name, r.email as reviewer_email, r.department as reviewer_department
        FROM applications a
        LEFT JOIN users sb ON a.submitted_by_id = sb.id
        LEFT JOIN users r ON a.reviewer_id = r.id
        WHERE a.id = $1
        ORDER BY a.created_at DESC
      `, [applicationId]);
      
      const row = result.rows[0];
      if (!row) return null;
      
      // Transform the flat result into the expected Application structure
      const application: Application = {
        id: row.id,
        type: row.type as any,
        title: row.title,
        form_data: row.form_data,
        status: row.status as any,
        submitted_by_id: row.submitted_by_id,
        reviewer_id: row.reviewer_id,
        submitter_message: row.submitter_message,
        review_comments: row.review_comments,
        urgency: row.urgency as any,
        submitted_at: row.submitted_at,
        reviewed_at: row.reviewed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
      
      // Add populated user relations if they exist
      if (row.submitted_by_id_ref) {
        application.submitted_by = {
          id: row.submitted_by_id_ref,
          full_name: row.submitted_by_name,
          email: row.submitted_by_email,
          department: row.submitted_by_department
        };
      }
      
      if (row.reviewer_id_ref) {
        application.reviewer = {
          id: row.reviewer_id_ref,
          full_name: row.reviewer_name,
          email: row.reviewer_email,
          department: row.reviewer_department
        };
      }
      
      return application;
    }, null, 'get_application_by_id_internal');
  }

  static async getApplicationWithHistory(applicationId: string): Promise<Application | null> {
    return safeDbOperation(async () => {
      const pool = getPool();
      
      // Get application
      const application = await ApplicationsService.getByIdInternal(applicationId);
      if (!application) return null;
      
      // Get message history
      const messages = await ApplicationsService.getMessageHistory(applicationId);
      
      return {
        ...application,
        messages
      };
    }, null, 'get_application_with_history');
  }
}

// Notifications service
export class NotificationsService {
  
  static async create(data: {
    user_id: number;
    type: string;
    title: string;
    message: string;
    application_id?: string;
    metadata?: Record<string, any>;
  }): Promise<Notification | null> {
    return safeDbOperation(async () => {
      const config = getReviewSystemConfig();
      
      if (!config.notificationsEnabled) {
        return null; // Silent skip if notifications disabled
      }
      
      const pool = getPool();
      
      // Safety check: Limit notifications per user
      const countResult = await pool.query(`
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = $1 AND created_at > NOW() - INTERVAL '24 hours'
      `, [data.user_id]);
      
      if (parseInt(countResult.rows[0].count) >= config.maxNotificationsPerUser) {
        console.warn(`Notification limit reached for user ${data.user_id}`);
        return null;
      }
      
      console.log('🔧 NotificationsService.create called with:', {
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        application_id: data.application_id
      });
      
      // Try to insert with metadata column first (if migration has been run)
      let result;
      try {
        result = await pool.query(`
          INSERT INTO notifications (user_id, type, title, message, application_id, metadata)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [data.user_id, data.type, data.title, data.message, data.application_id, JSON.stringify(data.metadata || {})]);
        
        console.log('🔧 Notification created successfully:', result.rows[0]);
      } catch (error: any) {
        // If metadata column doesn't exist, fall back to old schema
        if (error.message && error.message.includes('metadata')) {
          console.log('Metadata column not found, using legacy notification schema');
          result = await pool.query(`
            INSERT INTO notifications (user_id, type, title, message, application_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
          `, [data.user_id, data.type, data.title, data.message, data.application_id]);
          
          console.log('🔧 Notification created (legacy):', result.rows[0]);
        } else {
          throw error;
        }
      }
      
      const notification = result.rows[0] as Notification;
      
      // Queue email notification (non-blocking)
      try {
        const { NotificationEmailService } = await import('./notification-email');
        
        // Prepare email metadata
        const emailMetadata: Record<string, any> = {
          ...(data.metadata || {}),
          form_name: data.title,
          portal_url: process.env.NEXT_PUBLIC_PORTAL_URL || 'http://192.168.97.149'
        };
        
        // Add type-specific metadata
        if (data.type === 'review_requested') {
          const reviewerResult = await pool.query(
            `SELECT full_name, employee_code FROM users WHERE id = $1`,
            [data.user_id]
          );
          if (reviewerResult.rows[0]) {
            // Extract first name from full name
            const fullName = reviewerResult.rows[0].full_name;
            const firstName = fullName ? fullName.split(' ')[0] : 'User';
            emailMetadata.reviewer_name = firstName;
            emailMetadata.reviewer_employee_code = reviewerResult.rows[0].employee_code;
          }
          
          // Get submitter info if we have metadata
          if (data.metadata?.submitter_id) {
            const submitterResult = await pool.query(
              `SELECT full_name, employee_code FROM users WHERE id = $1`,
              [data.metadata.submitter_id]
            );
            if (submitterResult.rows[0]) {
              emailMetadata.submitter_name = submitterResult.rows[0].full_name;
              emailMetadata.submitter_code = submitterResult.rows[0].employee_code || '';
            }
          } else if (data.metadata?.submitter_name) {
            emailMetadata.submitter_name = data.metadata.submitter_name;
            emailMetadata.submitter_code = data.metadata?.submitter_code || '';
          }
          
          emailMetadata.urgency = data.metadata?.urgency || 'standard';
          emailMetadata.show_urgency = emailMetadata.urgency === 'urgent';
          emailMetadata.comments = data.message;
        } else if (data.type === 'review_completed' || data.type === 'application_approved' || data.type === 'application_rejected') {
          const userResult = await pool.query(
            `SELECT full_name, employee_code FROM users WHERE id = $1`,
            [data.user_id]
          );
          if (userResult.rows[0]) {
            const fullName = userResult.rows[0].full_name;
            const firstName = fullName ? fullName.split(' ')[0] : 'User';
            emailMetadata.submitter_name = firstName;
            emailMetadata.user_name = firstName;
            
            // For application_rejected, include full name and employee code
            if (data.type === 'application_rejected') {
              emailMetadata.submitter_full_name = fullName;
              emailMetadata.submitter_code = userResult.rows[0].employee_code || '';
            }
          }
          
          if (data.type === 'review_completed') {
            emailMetadata.status = data.metadata?.status || 'completed';
            emailMetadata.status_class = data.metadata?.status === 'approved' ? 'approved' : 
                                        data.metadata?.status === 'rejected' ? 'rejected' : 'revision';
            emailMetadata.feedback = data.message;
            // Include full name and employee code for review_completed emails
            const fullName = userResult.rows[0]?.full_name || 'User';
            emailMetadata.submitter_full_name = fullName;
            emailMetadata.submitter_code = userResult.rows[0]?.employee_code || '';
            // Add urgency handling
            emailMetadata.urgency = data.metadata?.urgency || 'standard';
            emailMetadata.show_urgency = emailMetadata.urgency === 'urgent';
          } else if (data.type === 'application_approved') {
            // Format date as dd.MM.yyyy
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            emailMetadata.approval_date = `${day}.${month}.${year}`;
            emailMetadata.comments = data.message;
            // Note: Removed submitter_full_name and submitter_code as per request
            // Add urgency handling for approved applications
            emailMetadata.urgency = data.metadata?.urgency || 'standard';
            emailMetadata.show_urgency = emailMetadata.urgency === 'urgent';
          } else if (data.type === 'application_rejected') {
            emailMetadata.feedback = data.message;
            // Add urgency handling for rejected applications
            emailMetadata.urgency = data.metadata?.urgency || 'standard';
            emailMetadata.show_urgency = emailMetadata.urgency === 'urgent';
          }
          
          if (data.metadata?.reviewer_name) {
            emailMetadata.reviewer_name = data.metadata.reviewer_name;
          }
        }
        
        // Queue the email
        await NotificationEmailService.queueEmail({
          notification_id: notification.id,
          user_id: data.user_id,
          type: data.type as any,
          title: data.title,
          message: data.message,
          metadata: emailMetadata
        });
        
        console.log(`📧 Email queued for notification ${notification.id}`);
      } catch (emailError) {
        console.error('❌ Failed to queue email notification:', emailError);
        // Don't fail notification creation if email queueing fails
      }
      
      // Trigger TODO automation for specific notification types (review workflows only)
      if (['application_approved', 'application_rejected'].includes(data.type)) {
        try {
          const { NotificationTodoAutomation } = await import('./notification-todo-automation');
          
          // Get additional application data for TODO generation
          let additionalData = {};
          
          if (data.application_id) {
            const appResult = await pool.query(`
              SELECT a.*, u.full_name as client_name, u.email as client_email
              FROM applications a
              LEFT JOIN users u ON a.submitted_by_id = u.id
              WHERE a.id = $1
            `, [data.application_id]);
            
            if (appResult.rows.length > 0) {
              const app = appResult.rows[0];
              additionalData = {
                application_title: app.title,
                client_name: app.client_name,
                client_email: app.client_email,
                document_type: app.type,
                form_data: app.form_data,
                reviewer_name: data.metadata?.reviewer_name
              };
            }
          }
          
          // Create notification data for TODO automation
          const notificationData = {
            id: notification.id,
            user_id: data.user_id,
            type: data.type,
            title: data.title,
            message: data.message,
            data: {
              application_id: data.application_id,
              ...additionalData,
              metadata: data.metadata
            },
            created_at: new Date().toISOString()
          };
          
          await NotificationTodoAutomation.processNotification(notificationData);
          console.log(`✅ TODO automation triggered for notification ${notification.id}`);
          
        } catch (error) {
          console.error('❌ Failed to trigger TODO automation:', error);
          // Don't fail notification creation if TODO automation fails
        }
      }
      
      return notification;
    }, null, 'create_notification');
  }
  
  static async getByUser(userId: number): Promise<{
    notifications: Notification[];
    unread_count: number;
  }> {
    return safeDbOperation(async () => {
      const config = getReviewSystemConfig();
      const pool = getPool();
      
      // Get notifications with limit for safety
      const notificationsResult = await pool.query(`
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `, [userId, config.maxNotificationsToFetch]);
      
      // Get unread count
      const unreadResult = await pool.query(`
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = $1 AND is_read = false
      `, [userId]);
      
      return {
        notifications: notificationsResult.rows as Notification[],
        unread_count: parseInt(unreadResult.rows[0].count)
      };
    }, { notifications: [], unread_count: 0 }, 'get_notifications_by_user');
  }
  
  static async markAsRead(notificationId: string, userId: number): Promise<boolean> {
    return safeDbOperation(async () => {
      const pool = getPool();
      
      await pool.query(`
        UPDATE notifications 
        SET is_read = true 
        WHERE id = $1 AND user_id = $2
      `, [notificationId, userId]);
      
      return true;
    }, false, 'mark_notification_read');
  }
  
  static async markAllAsRead(userId: number): Promise<boolean> {
    return safeDbOperation(async () => {
      const pool = getPool();
      
      await pool.query(`
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = $1 AND is_read = false
      `, [userId]);
      
      return true;
    }, false, 'mark_all_notifications_read');
  }
}

// Reviewers service
export class ReviewersService {
  
  static async getAvailableReviewers(currentUserId: number, documentType?: string): Promise<Reviewer[]> {
    return safeDbOperation(async () => {
      const config = getReviewSystemConfig();
      
      if (!config.showReviewerDropdown) {
        return []; // Silent return if feature disabled
      }
      
      const pool = getPool();
      
      try {
        console.log(`🔧 ReviewersService: Getting reviewers for userId: ${currentUserId}, documentType: ${documentType}`);
        
        // Check if this is a document type that should use specific reviewers
        const specificReviewerDocTypes = ['cost-overview', 'golden-visa', 'company-services'];
        const taxationDocType = ['taxation', 'cit-return-letters'];
        const useSpecificReviewers = documentType && specificReviewerDocTypes.includes(documentType);
        const useTaxationReviewers = documentType && taxationDocType.includes(documentType);
        
        let reviewersResult;
        
        if (useSpecificReviewers) {
          // For specific document types: only show Uwe, Tina, and Onur
          console.log(`🔧 ReviewersService: Using specific reviewers (Uwe, Tina, Onur) for ${documentType}`);
          reviewersResult = await pool.query(`
            SELECT id, full_name, email, department, role, employee_code
            FROM users 
            WHERE id != $1 
            AND email IN ('uwe@TME-Services.com', 'tina@TME-Services.com', 'onur@TME-Services.com')
            ORDER BY 
              CASE WHEN email = 'uwe@TME-Services.com' THEN 0 ELSE 1 END,
              full_name ASC
            LIMIT $2
          `, [currentUserId, config.maxReviewersToFetch]);
        } else if (useTaxationReviewers) {
          // For CIT Return Letters and taxation documents: only show admins + specific employee codes
          console.log(`🔧 ReviewersService: Using admins + specific employee codes for ${documentType}`);
          reviewersResult = await pool.query(`
            SELECT id, full_name, email, department, role, employee_code
            FROM users 
            WHERE id != $1 
            AND status = 'active'
            AND (role = 'admin' OR employee_code IN ('19 DS', '38 TZ', '33 MK', '42 RJ', '58 YF', '80 RoJ', '86 MA', '92 CM', '112 NM'))
            ORDER BY 
              CASE WHEN role = 'admin' THEN 0 ELSE 1 END,
              employee_code ASC
            LIMIT $2
          `, [currentUserId, config.maxReviewersToFetch]);
        } else {
          // For other document types: use department-based approach
          // Get current user's department
          const userResult = await pool.query(`
            SELECT department FROM users WHERE id = $1
          `, [currentUserId]);
          
          if (userResult.rows.length === 0) {
            console.log('🔧 ReviewersService: Current user not found, using default department');
          }
          
          const userDepartment = userResult.rows.length > 0 ? userResult.rows[0].department : 'General';
          console.log(`🔧 ReviewersService: Using department-based reviewers for user department: ${userDepartment}`);
          
          // Get department colleagues + UH user Uwe Hohmann
          reviewersResult = await pool.query(`
            SELECT id, full_name, email, department, role, employee_code
            FROM users 
            WHERE id != $1 
            AND (department = $2 OR email = 'uwe@TME-Services.com')
            ORDER BY 
              CASE WHEN email = 'uwe@TME-Services.com' THEN 0 ELSE 1 END,
              full_name ASC
            LIMIT $3
          `, [currentUserId, userDepartment, config.maxReviewersToFetch]);
        }
        
        console.log(`🔧 ReviewersService: Raw query result:`, reviewersResult.rows);
        console.log(`🔧 ReviewersService: Found ${reviewersResult.rows.length} reviewers for ${useSpecificReviewers ? 'specific document type' : useTaxationReviewers ? 'taxation department' : 'department-based selection'}`);
        
        const reviewers = reviewersResult.rows.map(row => ({
          id: row.id,
          full_name: row.full_name,
          email: row.email,
          department: row.department,
          employee_code: row.employee_code,
          is_universal: row.email === 'uwe@TME-Services.com'
        })) as Reviewer[];
        
        // If no reviewers found, add fallback reviewers
        if (reviewers.length === 0) {
          console.log('🔧 ReviewersService: No reviewers found in database, using fallback');
          
          if (useSpecificReviewers) {
            // For specific document types, return the 3 specific fallback users
            return [
              {
                id: 999,
                full_name: 'UH - Uwe Hohmann',
                email: 'uwe@TME-Services.com',
                department: 'Company Setup',
                employee_code: '09 UH',
                is_universal: true
              },
              {
                id: 998,
                full_name: 'Tina Reimann',
                email: 'tina@TME-Services.com',
                department: 'Company Setup',
                employee_code: '96 TR',
                is_universal: false
              },
              {
                id: 997,
                full_name: 'Onur Ozturk',
                email: 'onur@TME-Services.com',
                department: 'Company Setup',
                employee_code: '102 OO',
                is_universal: false
              }
            ];
          } else if (useTaxationReviewers) {
            // For taxation documents, return Tax and Compliance + Admin + Accounting + Uwe fallback
            return [
              {
                id: 999,
                full_name: 'UH - Uwe Hohmann',
                email: 'uwe@TME-Services.com',
                department: 'Tax and Compliance',
                employee_code: '09 UH',
                is_universal: true
              },
              {
                id: 996,
                full_name: 'Tax Reviewer',
                email: 'tax@TME-Services.com',
                department: 'Tax and Compliance',
                employee_code: 'TAX',
                is_universal: false
              },
              {
                id: 995,
                full_name: 'Admin Reviewer',
                email: 'admin@TME-Services.com',
                department: 'Admin',
                employee_code: 'ADM',
                is_universal: false
              },
              {
                id: 994,
                full_name: 'Accounting Reviewer',
                email: 'accounting@TME-Services.com',
                department: 'Accounting',
                employee_code: 'ACC',
                is_universal: false
              }
            ];
          } else {
            // For department-based, return general fallback
            return [
              {
                id: 999,
                full_name: 'UH - Uwe Hohmann',
                email: 'uwe@TME-Services.com',
                department: 'Management',
                employee_code: '09 UH',
                is_universal: true
              },
              {
                id: 998,
                full_name: 'Test Reviewer',
                email: 'test@TME-Services.com',
                department: 'General',
                employee_code: 'TR',
                is_universal: false
              }
            ];
          }
        }
        
        return reviewers;
        
      } catch (error) {
        console.error('🔧 ReviewersService: Database error:', error);
        
        // Fallback: Return at least UH user Uwe if database fails
        return [
          {
            id: 999, // Special ID for UH user
            full_name: 'UH - Uwe Hohmann',
            email: 'uwe@TME-Services.com',
            department: 'Management',
            employee_code: 'UH',
            is_universal: true
          }
        ];
      }
      
    }, [], 'get_available_reviewers');
  }
}


// Health check function for monitoring
export async function checkReviewSystemHealth(): Promise<{
  enabled: boolean;
  database_connection: boolean;
  tables_exist: boolean;
  error?: string;
}> {
  const config = getReviewSystemConfig();
  
  if (!config.enabled) {
    return {
      enabled: false,
      database_connection: false,
      tables_exist: false
    };
  }
  
  try {
    const pool = getPool();
    
    // Test database connection
    await pool.query('SELECT 1');
    
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('applications', 'notifications')
    `);
    
    return {
      enabled: true,
      database_connection: true,
      tables_exist: tablesResult.rows.length === 2
    };
  } catch (error) {
    return {
      enabled: true,
      database_connection: false,
      tables_exist: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}