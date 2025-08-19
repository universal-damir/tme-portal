/**
 * Invoice Service
 * Handles all invoice-related operations
 */

import { query, transaction } from '@/lib/database';
import { Invoice, InvoiceStatus, InvoiceFormData } from '@/types/invoicing';
import { InvoiceNumberGenerator } from './invoice-number-generator';
import { ClientService } from './client-service';

export class InvoiceService {
  /**
   * Create a new invoice
   */
  static async createInvoice(
    data: InvoiceFormData & { status?: InvoiceStatus },
    createdBy: number
  ): Promise<Invoice> {
    return await transaction(async (client) => {
      // Get client details
      const invoiceClient = await ClientService.getClientById(data.clientId!);
      if (!invoiceClient) {
        throw new Error('Client not found');
      }

      // Generate invoice number
      const invoiceNumber = InvoiceNumberGenerator.generate(
        invoiceClient.clientCode,
        invoiceClient.annualCode || '001',
        invoiceClient.issuingCompany,
        new Date(data.invoiceDate)
      );

      // Calculate totals
      let subtotal = 0;
      const allItems: any[] = [];
      
      for (const section of data.sections) {
        for (const item of section.items) {
          const netAmount = item.quantity * item.unitPrice;
          subtotal += netAmount;
          allItems.push({
            ...item,
            netAmount,
            section: section.name
          });
        }
      }

      const vatAmount = subtotal * 0.05; // 5% VAT
      const totalAmount = subtotal + vatAmount;

      // Create invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices (
          invoice_number,
          client_id,
          invoice_date,
          due_date,
          status,
          subtotal,
          vat_rate,
          vat_amount,
          total_amount,
          paid_amount,
          notes,
          internal_notes,
          is_recurring,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          invoiceNumber,
          data.clientId,
          data.invoiceDate,
          data.dueDate || null,
          data.status || 'draft',
          subtotal,
          5.00,
          vatAmount,
          totalAmount,
          0,
          data.notes || null,
          data.internalNotes || null,
          data.isNewClient ? false : invoiceClient.isRecurring,
          createdBy
        ]
      );

      const invoice = invoiceResult.rows[0];

      // Create sections and items
      for (const section of data.sections) {
        // Create section
        const sectionResult = await client.query(
          `INSERT INTO invoice_sections (invoice_id, section_name, sort_order, subtotal)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [
            invoice.id,
            section.name,
            data.sections.indexOf(section),
            section.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
          ]
        );

        const sectionId = sectionResult.rows[0].id;

        // Create items for this section
        for (const item of section.items) {
          await client.query(
            `INSERT INTO invoice_items (
              invoice_id,
              section_id,
              description,
              quantity,
              unit,
              unit_price,
              net_amount,
              sort_order
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              invoice.id,
              sectionId,
              item.description,
              item.quantity,
              item.unit || null,
              item.unitPrice,
              item.quantity * item.unitPrice,
              section.items.indexOf(item)
            ]
          );
        }
      }

      // If status is pending_approval, create approval record
      if (data.status === 'pending_approval') {
        await client.query(
          `INSERT INTO invoice_approvals (invoice_id, requested_by, assigned_to, status)
           VALUES ($1, $2, $3, $4)`,
          [
            invoice.id,
            createdBy,
            createdBy, // TODO: Get actual manager ID
            'pending'
          ]
        );

        // Update invoice with submission timestamp
        await client.query(
          `UPDATE invoices 
           SET submitted_for_approval_at = CURRENT_TIMESTAMP,
               submitted_by = $1
           WHERE id = $2`,
          [createdBy, invoice.id]
        );
      }

      return this.mapRowToInvoice(invoice);
    });
  }

  /**
   * Get all invoices with filters
   */
  static async getInvoices(params?: {
    status?: InvoiceStatus;
    clientId?: number;
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ invoices: Invoice[]; total: number }> {
    const {
      status,
      clientId,
      dateFrom,
      dateTo,
      searchTerm,
      page = 1,
      pageSize = 50
    } = params || {};

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCounter = 1;

    if (status) {
      whereConditions.push(`i.status = $${paramCounter}`);
      queryParams.push(status);
      paramCounter++;
    }

    if (clientId) {
      whereConditions.push(`i.client_id = $${paramCounter}`);
      queryParams.push(clientId);
      paramCounter++;
    }

    if (dateFrom) {
      whereConditions.push(`i.invoice_date >= $${paramCounter}`);
      queryParams.push(dateFrom);
      paramCounter++;
    }

    if (dateTo) {
      whereConditions.push(`i.invoice_date <= $${paramCounter}`);
      queryParams.push(dateTo);
      paramCounter++;
    }

    if (searchTerm) {
      whereConditions.push(`(
        i.invoice_number ILIKE $${paramCounter} OR 
        c.client_name ILIKE $${paramCounter} OR
        c.client_code ILIKE $${paramCounter}
      )`);
      queryParams.push(`%${searchTerm}%`);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM invoices i
      LEFT JOIN invoice_clients c ON i.client_id = c.id
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    queryParams.push(pageSize, offset);
    
    const dataQuery = `
      SELECT 
        i.*,
        c.client_code,
        c.client_name,
        c.client_address,
        c.manager_name,
        c.annual_code,
        c.annual_code_year,
        c.issuing_company,
        c.is_active as client_is_active,
        c.is_recurring as client_is_recurring
      FROM invoices i
      LEFT JOIN invoice_clients c ON i.client_id = c.id
      ${whereClause}
      ORDER BY i.invoice_date DESC, i.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const result = await query(dataQuery, queryParams);

    return {
      invoices: result.rows.map(row => this.mapRowToInvoice(row)),
      total
    };
  }

  /**
   * Get a single invoice by ID
   */
  static async getInvoiceById(id: number): Promise<Invoice | null> {
    const result = await query(
      `SELECT 
        i.*,
        c.client_code,
        c.client_name,
        c.client_address,
        c.manager_name,
        c.annual_code,
        c.annual_code_year,
        c.issuing_company,
        c.is_active as client_is_active,
        c.is_recurring as client_is_recurring
      FROM invoices i
      LEFT JOIN invoice_clients c ON i.client_id = c.id
      WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const invoice = this.mapRowToInvoice(result.rows[0]);

    // Get sections and items
    const sectionsResult = await query(
      `SELECT * FROM invoice_sections WHERE invoice_id = $1 ORDER BY sort_order`,
      [id]
    );

    const itemsResult = await query(
      `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY section_id, sort_order`,
      [id]
    );

    // Get payments
    const paymentsResult = await query(
      `SELECT * FROM invoice_payments WHERE invoice_id = $1 ORDER BY payment_date DESC`,
      [id]
    );

    invoice.sections = sectionsResult.rows;
    invoice.items = itemsResult.rows;
    invoice.payments = paymentsResult.rows;

    return invoice;
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(
    id: number,
    status: InvoiceStatus,
    userId: number
  ): Promise<Invoice | null> {
    const updates: any = { status };
    
    if (status === 'approved') {
      updates.approved_at = 'CURRENT_TIMESTAMP';
      updates.approved_by = userId;
    } else if (status === 'sent') {
      updates.sent_at = 'CURRENT_TIMESTAMP';
    }

    const setClauses = Object.keys(updates).map((key, index) => 
      `${key} = ${key === 'approved_at' || key === 'sent_at' ? updates[key] : `$${index + 2}`}`
    );
    
    const values = Object.entries(updates)
      .filter(([key]) => key !== 'approved_at' && key !== 'sent_at')
      .map(([_, value]) => value);

    const result = await query(
      `UPDATE invoices 
       SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToInvoice(result.rows[0]);
  }

  /**
   * Record a payment for an invoice
   */
  static async recordPayment(
    invoiceId: number,
    amount: number,
    paymentDate: string,
    paymentMethod?: string,
    referenceNumber?: string,
    notes?: string,
    recordedBy: number
  ): Promise<void> {
    await query(
      `INSERT INTO invoice_payments (
        invoice_id,
        payment_date,
        amount,
        payment_method,
        reference_number,
        notes,
        recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [invoiceId, paymentDate, amount, paymentMethod, referenceNumber, notes, recordedBy]
    );
  }

  /**
   * Map database row to Invoice type
   */
  private static mapRowToInvoice(row: any): Invoice {
    const invoice: Invoice = {
      id: row.id,
      invoiceNumber: row.invoice_number,
      clientId: row.client_id,
      invoiceDate: row.invoice_date,
      dueDate: row.due_date,
      status: row.status,
      subtotal: parseFloat(row.subtotal),
      vatRate: parseFloat(row.vat_rate),
      vatAmount: parseFloat(row.vat_amount),
      totalAmount: parseFloat(row.total_amount),
      paidAmount: parseFloat(row.paid_amount || 0),
      balanceDue: parseFloat(row.balance_due || row.total_amount - (row.paid_amount || 0)),
      isRecurring: row.is_recurring,
      templateId: row.template_id,
      notes: row.notes,
      internalNotes: row.internal_notes,
      submittedForApprovalAt: row.submitted_for_approval_at,
      submittedBy: row.submitted_by,
      approvedAt: row.approved_at,
      approvedBy: row.approved_by,
      approvalNotes: row.approval_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      sentAt: row.sent_at,
      sentToEmails: row.sent_to_emails
    };

    // If client data is included
    if (row.client_name) {
      invoice.client = {
        id: row.client_id,
        clientCode: row.client_code,
        clientName: row.client_name,
        clientAddress: row.client_address,
        managerName: row.manager_name,
        annualCode: row.annual_code,
        annualCodeYear: row.annual_code_year,
        issuingCompany: row.issuing_company,
        isActive: row.client_is_active,
        isRecurring: row.client_is_recurring
      };
    }

    return invoice;
  }
}