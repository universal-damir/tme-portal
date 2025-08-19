/**
 * Client Service
 * Handles all client-related operations for the invoicing system
 */

import { query, transaction } from '@/lib/database';
import { InvoiceClient, ClientListResponse } from '@/types/invoicing';
import { AnnualCodeManager } from './annual-code-manager';

export class ClientService {
  /**
   * Get all clients with optional filters
   */
  static async getClients(params?: {
    isActive?: boolean;
    isRecurring?: boolean;
    issuingCompany?: 'DET' | 'FZCO' | 'DMCC';
    searchTerm?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ClientListResponse> {
    const {
      isActive = true,
      isRecurring,
      issuingCompany,
      searchTerm,
      page = 1,
      pageSize = 50
    } = params || {};

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCounter = 1;

    // Build WHERE conditions
    if (isActive !== undefined) {
      whereConditions.push(`is_active = $${paramCounter}`);
      queryParams.push(isActive);
      paramCounter++;
    }

    if (isRecurring !== undefined) {
      whereConditions.push(`is_recurring = $${paramCounter}`);
      queryParams.push(isRecurring);
      paramCounter++;
    }

    if (issuingCompany) {
      whereConditions.push(`issuing_company = $${paramCounter}`);
      queryParams.push(issuingCompany);
      paramCounter++;
    }

    if (searchTerm) {
      whereConditions.push(`(
        client_name ILIKE $${paramCounter} OR 
        client_code ILIKE $${paramCounter} OR 
        annual_code ILIKE $${paramCounter} OR
        vat_number ILIKE $${paramCounter}
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
      FROM invoice_clients 
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    queryParams.push(pageSize, offset);
    
    const dataQuery = `
      SELECT 
        id,
        client_code,
        client_name,
        client_address,
        manager_name,
        manager_email,
        vat_number,
        annual_code,
        annual_code_year,
        issuing_company,
        is_active,
        is_recurring,
        default_services,
        created_at,
        updated_at,
        created_by
      FROM invoice_clients 
      ${whereClause}
      ORDER BY client_name ASC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const result = await query(dataQuery, queryParams);

    return {
      clients: result.rows.map(this.mapRowToClient),
      total
    };
  }

  /**
   * Get a single client by ID
   */
  static async getClientById(id: number): Promise<InvoiceClient | null> {
    const result = await query(
      'SELECT * FROM invoice_clients WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToClient(result.rows[0]);
  }

  /**
   * Get a client by client code
   */
  static async getClientByCode(clientCode: string): Promise<InvoiceClient | null> {
    const result = await query(
      'SELECT * FROM invoice_clients WHERE client_code = $1',
      [clientCode]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToClient(result.rows[0]);
  }

  /**
   * Create a new client
   */
  static async createClient(
    clientData: Omit<InvoiceClient, 'id' | 'createdAt' | 'updatedAt' | 'annualCode' | 'annualCodeYear'>,
    createdBy: number
  ): Promise<InvoiceClient> {
    return await transaction(async (client) => {
      // Generate the next client code (5-digit)
      const clientCode = await this.generateNextClientCode();
      
      // Get annual code for the new client
      const currentYear = AnnualCodeManager.getCurrentYear();
      const annualCode = await AnnualCodeManager.getNextAnnualCode();

      const result = await client.query(
        `INSERT INTO invoice_clients (
          client_code,
          client_name,
          client_address,
          manager_name,
          manager_email,
          vat_number,
          annual_code,
          annual_code_year,
          issuing_company,
          is_active,
          is_recurring,
          default_services,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          clientCode,
          clientData.clientName,
          clientData.clientAddress,
          clientData.managerName,
          clientData.managerEmail,
          clientData.vatNumber,
          annualCode,
          currentYear,
          clientData.issuingCompany,
          clientData.isActive ?? true,
          clientData.isRecurring ?? false,
          JSON.stringify(clientData.defaultServices || []),
          createdBy
        ]
      );

      return this.mapRowToClient(result.rows[0]);
    });
  }

  /**
   * Update an existing client
   */
  static async updateClient(
    id: number,
    updates: Partial<Omit<InvoiceClient, 'id' | 'clientCode' | 'createdAt' | 'updatedAt'>>
  ): Promise<InvoiceClient | null> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCounter = 1;

    // Build dynamic update query
    const allowedFields = [
      'client_name',
      'client_address',
      'manager_name',
      'manager_email',
      'vat_number',
      'issuing_company',
      'is_active',
      'is_recurring',
      'default_services'
    ];

    const fieldMappings: Record<string, string> = {
      clientName: 'client_name',
      clientAddress: 'client_address',
      managerName: 'manager_name',
      managerEmail: 'manager_email',
      vatNumber: 'vat_number',
      issuingCompany: 'issuing_company',
      isActive: 'is_active',
      isRecurring: 'is_recurring',
      defaultServices: 'default_services'
    };

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMappings[key];
      if (dbField && value !== undefined) {
        updateFields.push(`${dbField} = $${paramCounter}`);
        updateValues.push(
          key === 'defaultServices' ? JSON.stringify(value) : value
        );
        paramCounter++;
      }
    }

    if (updateFields.length === 0) {
      return await this.getClientById(id);
    }

    updateValues.push(id);

    const result = await query(
      `UPDATE invoice_clients 
       SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCounter}
       RETURNING *`,
      updateValues
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToClient(result.rows[0]);
  }

  /**
   * Delete a client (soft delete by setting is_active = false)
   */
  static async deleteClient(id: number): Promise<boolean> {
    const result = await query(
      'UPDATE invoice_clients SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }

  /**
   * Generate the next available 5-digit client code
   */
  private static async generateNextClientCode(): Promise<string> {
    const result = await query(
      'SELECT MAX(CAST(client_code AS INTEGER)) as max_code FROM invoice_clients WHERE client_code ~ \'^[0-9]+$\''
    );

    const maxCode = result.rows[0].max_code || 10000;
    const nextCode = maxCode + 1;

    if (nextCode > 99999) {
      throw new Error('Client code limit reached (99999)');
    }

    return String(nextCode).padStart(5, '0');
  }

  /**
   * Check if a client code is available
   */
  static async isClientCodeAvailable(clientCode: string): Promise<boolean> {
    const result = await query(
      'SELECT COUNT(*) as count FROM invoice_clients WHERE client_code = $1',
      [clientCode]
    );

    return result.rows[0].count === 0;
  }

  /**
   * Get clients with upcoming invoice generation
   */
  static async getRecurringClients(): Promise<InvoiceClient[]> {
    const result = await query(
      `SELECT * FROM invoice_clients 
       WHERE is_active = true AND is_recurring = true
       ORDER BY client_name ASC`
    );

    return result.rows.map(this.mapRowToClient);
  }

  /**
   * Assign annual codes in bulk (for year reset)
   */
  static async assignAnnualCodesInBulk(): Promise<void> {
    await AnnualCodeManager.bulkAssignForNewYear();
  }

  /**
   * Map database row to InvoiceClient type
   */
  private static mapRowToClient(row: any): InvoiceClient {
    return {
      id: row.id,
      clientCode: row.client_code,
      clientName: row.client_name,
      clientAddress: row.client_address,
      managerName: row.manager_name,
      managerEmail: row.manager_email,
      vatNumber: row.vat_number,
      annualCode: row.annual_code,
      annualCodeYear: row.annual_code_year,
      issuingCompany: row.issuing_company,
      isActive: row.is_active,
      isRecurring: row.is_recurring,
      defaultServices: row.default_services,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by
    };
  }

  /**
   * Import clients from CSV or Excel
   */
  static async importClients(
    clients: Array<Omit<InvoiceClient, 'id' | 'createdAt' | 'updatedAt' | 'annualCode' | 'annualCodeYear'>>,
    createdBy: number
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const clientData of clients) {
      try {
        await this.createClient(clientData, createdBy);
        success++;
      } catch (error: any) {
        failed++;
        errors.push(`Failed to import ${clientData.clientName}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  }
}