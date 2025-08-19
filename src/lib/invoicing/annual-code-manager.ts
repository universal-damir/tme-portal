/**
 * Annual Code Manager
 * Handles the assignment and management of 3-digit annual codes
 * Codes are reset every January 1st and assigned alphabetically
 */

import { query, transaction } from '@/lib/database';
import { InvoiceClient } from '@/types/invoicing';

export class AnnualCodeManager {
  /**
   * Get the current year for annual codes
   */
  static getCurrentYear(): number {
    return new Date().getFullYear();
  }

  /**
   * Check if annual codes need to be reset
   */
  static async needsReset(): Promise<boolean> {
    const currentYear = this.getCurrentYear();
    
    const result = await query(
      'SELECT COUNT(*) as count FROM invoice_clients WHERE annual_code_year < $1',
      [currentYear]
    );
    
    return result.rows[0].count > 0;
  }

  /**
   * Reset all annual codes for the new year
   * This should be run on January 1st or when first invoice of new year is created
   */
  static async resetAnnualCodes(): Promise<void> {
    const currentYear = this.getCurrentYear();
    
    await transaction(async (client) => {
      // Reset all client annual codes
      await client.query(
        'UPDATE invoice_clients SET annual_code = NULL, annual_code_year = $1',
        [currentYear]
      );
      
      // Reset or create the sequence counter for the current year
      await client.query(
        `INSERT INTO annual_code_sequence (year, last_code) 
         VALUES ($1, 0) 
         ON CONFLICT (year) 
         DO UPDATE SET last_code = 0`,
        [currentYear]
      );
    });
  }

  /**
   * Assign annual codes to all clients alphabetically
   * Called after reset or when bulk assigning codes
   */
  static async assignAllAnnualCodes(): Promise<void> {
    const currentYear = this.getCurrentYear();
    
    await transaction(async (client) => {
      // Get all active clients without annual codes, sorted alphabetically
      const clientsResult = await client.query(
        `SELECT id, client_name 
         FROM invoice_clients 
         WHERE is_active = true 
           AND (annual_code IS NULL OR annual_code_year < $1)
         ORDER BY client_name ASC`,
        [currentYear]
      );
      
      const clients = clientsResult.rows;
      
      // Assign codes sequentially
      for (let i = 0; i < clients.length; i++) {
        const code = String(i + 1).padStart(3, '0');
        
        await client.query(
          `UPDATE invoice_clients 
           SET annual_code = $1, annual_code_year = $2 
           WHERE id = $3`,
          [code, currentYear, clients[i].id]
        );
      }
      
      // Update the sequence counter
      await client.query(
        `INSERT INTO annual_code_sequence (year, last_code) 
         VALUES ($1, $2) 
         ON CONFLICT (year) 
         DO UPDATE SET last_code = $2`,
        [currentYear, clients.length]
      );
    });
  }

  /**
   * Get the next available annual code for a new client
   */
  static async getNextAnnualCode(): Promise<string> {
    const currentYear = this.getCurrentYear();
    
    return await transaction(async (client) => {
      // Get current last code
      const sequenceResult = await client.query(
        'SELECT last_code FROM annual_code_sequence WHERE year = $1',
        [currentYear]
      );
      
      let nextCode: number;
      
      if (sequenceResult.rows.length === 0) {
        // First code of the year
        nextCode = 1;
        await client.query(
          'INSERT INTO annual_code_sequence (year, last_code) VALUES ($1, $2)',
          [currentYear, 1]
        );
      } else {
        // Increment last code
        nextCode = sequenceResult.rows[0].last_code + 1;
        
        if (nextCode > 999) {
          throw new Error('Annual code limit reached (999). Cannot assign more codes this year.');
        }
        
        await client.query(
          'UPDATE annual_code_sequence SET last_code = $1 WHERE year = $2',
          [nextCode, currentYear]
        );
      }
      
      return String(nextCode).padStart(3, '0');
    });
  }

  /**
   * Assign annual code to a specific client
   */
  static async assignAnnualCode(clientId: number): Promise<string> {
    const currentYear = this.getCurrentYear();
    
    return await transaction(async (client) => {
      // Check if client already has a code for this year
      const existingResult = await client.query(
        'SELECT annual_code FROM invoice_clients WHERE id = $1 AND annual_code_year = $2',
        [clientId, currentYear]
      );
      
      if (existingResult.rows.length > 0 && existingResult.rows[0].annual_code) {
        return existingResult.rows[0].annual_code;
      }
      
      // Get next available code
      const code = await this.getNextAnnualCode();
      
      // Assign to client
      await client.query(
        'UPDATE invoice_clients SET annual_code = $1, annual_code_year = $2 WHERE id = $3',
        [code, currentYear, clientId]
      );
      
      return code;
    });
  }

  /**
   * Bulk assign annual codes for new year
   * This maintains alphabetical order while preserving existing assignments
   */
  static async bulkAssignForNewYear(): Promise<void> {
    const currentYear = this.getCurrentYear();
    
    await transaction(async (client) => {
      // First, check if we need to reset
      const needsResetResult = await client.query(
        'SELECT COUNT(*) as count FROM invoice_clients WHERE annual_code_year < $1',
        [currentYear]
      );
      
      if (needsResetResult.rows[0].count === 0) {
        return; // No reset needed
      }
      
      // Get all active clients sorted alphabetically
      const clientsResult = await client.query(
        `SELECT id, client_name, annual_code, annual_code_year
         FROM invoice_clients 
         WHERE is_active = true
         ORDER BY client_name ASC`
      );
      
      const clients = clientsResult.rows;
      let codeCounter = 1;
      
      for (const clientData of clients) {
        const code = String(codeCounter).padStart(3, '0');
        
        await client.query(
          'UPDATE invoice_clients SET annual_code = $1, annual_code_year = $2 WHERE id = $3',
          [code, currentYear, clientData.id]
        );
        
        codeCounter++;
      }
      
      // Update sequence counter
      await client.query(
        `INSERT INTO annual_code_sequence (year, last_code) 
         VALUES ($1, $2) 
         ON CONFLICT (year) 
         DO UPDATE SET last_code = $2`,
        [currentYear, codeCounter - 1]
      );
    });
  }

  /**
   * Get annual code statistics
   */
  static async getStatistics(): Promise<{
    currentYear: number;
    totalAssigned: number;
    totalAvailable: number;
    lastAssignedCode: string;
  }> {
    const currentYear = this.getCurrentYear();
    
    const [sequenceResult, clientsResult] = await Promise.all([
      query('SELECT last_code FROM annual_code_sequence WHERE year = $1', [currentYear]),
      query('SELECT COUNT(*) as count FROM invoice_clients WHERE annual_code_year = $1 AND annual_code IS NOT NULL', [currentYear])
    ]);
    
    const lastCode = sequenceResult.rows[0]?.last_code || 0;
    const totalAssigned = parseInt(clientsResult.rows[0].count);
    
    return {
      currentYear,
      totalAssigned,
      totalAvailable: 999 - lastCode,
      lastAssignedCode: String(lastCode).padStart(3, '0')
    };
  }

  /**
   * Validate an annual code format
   */
  static isValidCode(code: string): boolean {
    return /^\d{3}$/.test(code) && parseInt(code) >= 1 && parseInt(code) <= 999;
  }

  /**
   * Check if annual code is already assigned
   */
  static async isCodeAssigned(code: string, year?: number): Promise<boolean> {
    const checkYear = year || this.getCurrentYear();
    
    const result = await query(
      'SELECT COUNT(*) as count FROM invoice_clients WHERE annual_code = $1 AND annual_code_year = $2',
      [code, checkYear]
    );
    
    return result.rows[0].count > 0;
  }
}