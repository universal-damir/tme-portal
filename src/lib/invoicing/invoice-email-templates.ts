/**
 * Invoice Email Templates
 * Templates for invoice-related emails
 */

import { Invoice } from '@/types/invoicing';

export interface InvoiceEmailData {
  invoice: Invoice;
  clientName: string;
  managerName?: string;
  companyName?: string;
  additionalNotes?: string;
}

/**
 * Generate invoice email subject
 */
export function generateInvoiceEmailSubject(invoice: Invoice, clientName: string): string {
  return `Invoice ${invoice.invoiceNumber} - ${clientName} - TME Professional Services`;
}

/**
 * Generate invoice email content
 */
export function generateInvoiceEmailContent(data: InvoiceEmailData): string {
  const { invoice, clientName, managerName, companyName, additionalNotes } = data;
  
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-AE') : 'Upon receipt';
  const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString('en-AE');
  const totalAmount = new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2
  }).format(invoice.totalAmount);

  return `
    <div style="font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #333;">
      <p style="margin-bottom: 12px;">Dear ${clientName},</p>
      
      <p style="margin-bottom: 12px;">
        We hope this email finds you well. Please find attached your invoice for professional services rendered.
      </p>
      
      <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px 0; color: #243F7B;">Invoice Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; font-weight: bold; width: 150px;">Invoice Number:</td>
            <td style="padding: 4px 0;">${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Invoice Date:</td>
            <td style="padding: 4px 0;">${invoiceDate}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Due Date:</td>
            <td style="padding: 4px 0;">${dueDate}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Total Amount:</td>
            <td style="padding: 4px 0; color: #243F7B; font-weight: bold; font-size: 12pt;">${totalAmount}</td>
          </tr>
          ${companyName ? `
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Company:</td>
            <td style="padding: 4px 0;">${companyName}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      ${invoice.notes ? `
      <div style="margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #243F7B;">Invoice Notes:</h4>
        <p style="margin-bottom: 12px; padding: 12px; background-color: #fff3cd; border-left: 4px solid #ffc107; font-style: italic;">
          ${invoice.notes}
        </p>
      </div>
      ` : ''}
      
      <p style="margin-bottom: 12px;">
        <strong>Payment Instructions:</strong>
      </p>
      <ul style="margin-bottom: 16px; padding-left: 20px;">
        <li style="margin-bottom: 6px;">Please settle this invoice by the due date mentioned above</li>
        <li style="margin-bottom: 6px;">Wire transfer details are included in the attached invoice</li>
        <li style="margin-bottom: 6px;">Please reference the invoice number in your payment</li>
        <li style="margin-bottom: 6px;">Kindly send the payment confirmation to our accounts team</li>
      </ul>
      
      ${additionalNotes ? `
      <div style="margin: 20px 0; padding: 12px; background-color: #e7f3ff; border-left: 4px solid #0066cc; border-radius: 4px;">
        <h4 style="margin: 0 0 8px 0; color: #243F7B;">Additional Notes:</h4>
        <p style="margin: 0; color: #333;">${additionalNotes}</p>
      </div>
      ` : ''}
      
      <p style="margin-bottom: 12px;">
        Should you have any questions regarding this invoice or require any clarification, please do not hesitate to contact us.
      </p>
      
      <p style="margin-bottom: 12px;">
        Thank you for your continued business and trust in our services.
      </p>
      
      <div style="margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 16px;">
        <p style="margin-bottom: 8px;">Best regards,</p>
        <p style="margin-bottom: 4px; font-weight: bold; color: #243F7B;">
          ${managerName || 'TME Professional Services Team'}
        </p>
        <p style="margin-bottom: 4px; color: #666; font-size: 9pt;">
          TME Professional & Management Consulting Services
        </p>
        <p style="margin-bottom: 4px; color: #666; font-size: 9pt;">
          Email: accounts@tmepro.ae | Web: www.tmepro.ae
        </p>
        <p style="margin: 0; color: #666; font-size: 9pt;">
          Professional Services in UAE Business Setup & Compliance
        </p>
      </div>
    </div>
  `;
}

/**
 * Generate invoice approval notification email for managers
 */
export function generateApprovalNotificationEmail(invoice: Invoice, clientName: string, requestedBy: string): string {
  const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString('en-AE');
  const totalAmount = new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2
  }).format(invoice.totalAmount);

  return `
    <div style="font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #333;">
      <p style="margin-bottom: 12px;">Dear Manager,</p>
      
      <p style="margin-bottom: 12px;">
        A new invoice requires your approval. Please review the details below and approve or reject as appropriate.
      </p>
      
      <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px 0; color: #856404;">Pending Invoice Approval</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; font-weight: bold; width: 150px;">Invoice Number:</td>
            <td style="padding: 4px 0;">${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Client:</td>
            <td style="padding: 4px 0;">${clientName}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Invoice Date:</td>
            <td style="padding: 4px 0;">${invoiceDate}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Total Amount:</td>
            <td style="padding: 4px 0; color: #856404; font-weight: bold; font-size: 12pt;">${totalAmount}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Requested By:</td>
            <td style="padding: 4px 0;">${requestedBy}</td>
          </tr>
        </table>
      </div>
      
      ${invoice.notes ? `
      <div style="margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #243F7B;">Invoice Notes:</h4>
        <p style="margin-bottom: 12px; padding: 12px; background-color: #e7f3ff; border-left: 4px solid #0066cc;">
          ${invoice.notes}
        </p>
      </div>
      ` : ''}
      
      ${invoice.internalNotes ? `
      <div style="margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #dc3545;">Internal Notes:</h4>
        <p style="margin-bottom: 12px; padding: 12px; background-color: #f8d7da; border-left: 4px solid #dc3545;">
          ${invoice.internalNotes}
        </p>
      </div>
      ` : ''}
      
      <div style="margin: 20px 0; text-align: center;">
        <p style="margin-bottom: 16px; font-weight: bold;">
          Please log in to the TME Portal to review and approve this invoice.
        </p>
        <p style="margin-bottom: 12px; color: #666; font-size: 9pt;">
          Navigate to: Invoicing → Approvals → Pending Approvals
        </p>
      </div>
      
      <div style="margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 16px;">
        <p style="margin: 0; color: #666; font-size: 9pt;">
          This is an automated notification from TME Professional Services Portal.
        </p>
      </div>
    </div>
  `;
}

/**
 * Generate invoice approval decision notification email
 */
export function generateApprovalDecisionEmail(
  invoice: Invoice, 
  clientName: string, 
  decision: 'approved' | 'rejected' | 'revision_requested',
  approverName: string,
  comments?: string
): string {
  const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString('en-AE');
  const totalAmount = new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2
  }).format(invoice.totalAmount);

  const statusColor = {
    approved: '#28a745',
    rejected: '#dc3545',
    revision_requested: '#ffc107'
  }[decision];

  const statusText = {
    approved: 'Approved',
    rejected: 'Rejected', 
    revision_requested: 'Revision Requested'
  }[decision];

  const statusIcon = {
    approved: '✅',
    rejected: '❌',
    revision_requested: '⚠️'
  }[decision];

  return `
    <div style="font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #333;">
      <p style="margin-bottom: 12px;">Hello,</p>
      
      <p style="margin-bottom: 12px;">
        Your invoice has been reviewed by the manager. Please see the details below:
      </p>
      
      <div style="background-color: #f8f9fa; border: 2px solid ${statusColor}; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px 0; color: ${statusColor};">
          ${statusIcon} Invoice ${statusText}
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; font-weight: bold; width: 150px;">Invoice Number:</td>
            <td style="padding: 4px 0;">${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Client:</td>
            <td style="padding: 4px 0;">${clientName}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Total Amount:</td>
            <td style="padding: 4px 0; font-weight: bold; font-size: 12pt;">${totalAmount}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Reviewed By:</td>
            <td style="padding: 4px 0;">${approverName}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Status:</td>
            <td style="padding: 4px 0; color: ${statusColor}; font-weight: bold;">${statusText}</td>
          </tr>
        </table>
      </div>
      
      ${comments ? `
      <div style="margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #243F7B;">Manager Comments:</h4>
        <p style="margin-bottom: 12px; padding: 12px; background-color: #e7f3ff; border-left: 4px solid #0066cc;">
          ${comments}
        </p>
      </div>
      ` : ''}
      
      ${decision === 'approved' ? `
      <div style="margin: 20px 0; padding: 12px; background-color: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
        <p style="margin: 0; color: #155724; font-weight: bold;">
          ✅ Your invoice has been approved and is ready to be sent to the client.
        </p>
      </div>
      ` : decision === 'revision_requested' ? `
      <div style="margin: 20px 0; padding: 12px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
        <p style="margin: 0; color: #856404; font-weight: bold;">
          ⚠️ Please make the requested revisions and resubmit for approval.
        </p>
      </div>
      ` : `
      <div style="margin: 20px 0; padding: 12px; background-color: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;">
        <p style="margin: 0; color: #721c24; font-weight: bold;">
          ❌ This invoice has been rejected. Please review and create a new invoice if needed.
        </p>
      </div>
      `}
      
      <p style="margin-bottom: 12px;">
        Please log in to the TME Portal to view the full invoice details and take any necessary actions.
      </p>
      
      <div style="margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 16px;">
        <p style="margin: 0; color: #666; font-size: 9pt;">
          This is an automated notification from TME Professional Services Portal.
        </p>
      </div>
    </div>
  `;
}