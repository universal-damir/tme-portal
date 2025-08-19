/**
 * Invoice Number Generator
 * Format: YYMMXXX-YYYYY-NN PMS
 * 
 * YY - Last two digits of year
 * MM - Two-digit month
 * XXX - 3-digit annual client code
 * YYYYY - 5-digit permanent client code
 * NN - Company code (DET=30, FZCO=10, DMCC=00)
 * PMS - Fixed suffix
 */

import { InvoiceNumberComponents } from '@/types/invoicing';

export class InvoiceNumberGenerator {
  private static readonly COMPANY_CODES = {
    'DET': '30',
    'FZCO': '10',
    'DMCC': '00'
  } as const;

  /**
   * Generate a complete invoice number
   */
  static generate(
    clientCode: string,
    annualCode: string,
    issuingCompany: 'DET' | 'FZCO' | 'DMCC',
    date: Date = new Date()
  ): string {
    // Validate inputs
    this.validateClientCode(clientCode);
    this.validateAnnualCode(annualCode);

    // Extract date components
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // Get company code
    const companyCode = this.COMPANY_CODES[issuingCompany];

    // Construct invoice number
    return `${year}${month}${annualCode}-${clientCode}-${companyCode} PMS`;
  }

  /**
   * Parse an invoice number into its components
   */
  static parse(invoiceNumber: string): InvoiceNumberComponents {
    // Remove PMS suffix if present
    const cleanNumber = invoiceNumber.replace(' PMS', '');
    
    // Match pattern: YYMMXXX-YYYYY-NN
    const pattern = /^(\d{2})(\d{2})(\d{3})-(\d{5})-(\d{2})$/;
    const match = cleanNumber.match(pattern);

    if (!match) {
      throw new Error(`Invalid invoice number format: ${invoiceNumber}`);
    }

    return {
      year: match[1],
      month: match[2],
      annualCode: match[3],
      clientCode: match[4],
      companyCode: match[5]
    };
  }

  /**
   * Get the issuing company from company code
   */
  static getIssuingCompany(companyCode: string): 'DET' | 'FZCO' | 'DMCC' | null {
    const entries = Object.entries(this.COMPANY_CODES);
    const found = entries.find(([_, code]) => code === companyCode);
    return found ? found[0] as 'DET' | 'FZCO' | 'DMCC' : null;
  }

  /**
   * Validate client code format (5 digits)
   */
  private static validateClientCode(code: string): void {
    if (!/^\d{5}$/.test(code)) {
      throw new Error(`Invalid client code: ${code}. Must be 5 digits.`);
    }
  }

  /**
   * Validate annual code format (3 digits)
   */
  private static validateAnnualCode(code: string): void {
    if (!/^\d{3}$/.test(code)) {
      throw new Error(`Invalid annual code: ${code}. Must be 3 digits.`);
    }
  }

  /**
   * Format invoice number for display
   */
  static formatForDisplay(invoiceNumber: string): string {
    // Ensure PMS suffix is present
    if (!invoiceNumber.endsWith(' PMS')) {
      return `${invoiceNumber} PMS`;
    }
    return invoiceNumber;
  }

  /**
   * Get month name from invoice number
   */
  static getMonthName(invoiceNumber: string): string {
    const components = this.parse(invoiceNumber);
    const monthNumber = parseInt(components.month, 10);
    const date = new Date(2000, monthNumber - 1, 1);
    return date.toLocaleString('en-US', { month: 'long' });
  }

  /**
   * Get full year from invoice number
   */
  static getFullYear(invoiceNumber: string): number {
    const components = this.parse(invoiceNumber);
    const yearPrefix = parseInt(components.year, 10);
    const currentYear = new Date().getFullYear();
    const currentYearPrefix = currentYear % 100;
    
    // Determine century
    if (yearPrefix > currentYearPrefix + 10) {
      // Probably from previous century
      return 2000 + yearPrefix;
    } else {
      return 2000 + yearPrefix;
    }
  }

  /**
   * Check if invoice number is valid
   */
  static isValid(invoiceNumber: string): boolean {
    try {
      this.parse(invoiceNumber);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate next invoice number for a client
   * This would typically query the database for the latest invoice
   */
  static async generateNext(
    clientCode: string,
    annualCode: string,
    issuingCompany: 'DET' | 'FZCO' | 'DMCC'
  ): Promise<string> {
    // In a real implementation, this would:
    // 1. Query the database for the latest invoice for this client
    // 2. Check if we're in a new month
    // 3. Generate the appropriate number
    
    return this.generate(clientCode, annualCode, issuingCompany, new Date());
  }
}