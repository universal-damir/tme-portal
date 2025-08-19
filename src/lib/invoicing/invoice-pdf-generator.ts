/**
 * Invoice PDF Generator
 * Generates PDF documents for invoices
 */

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { Invoice } from '@/types/invoicing';
import { NewInvoiceDocument } from '@/lib/pdf-generator/components/invoicing';

export class InvoicePDFGenerator {
  /**
   * Generate PDF blob for an invoice
   */
  static async generatePDF(invoice: Invoice): Promise<Blob> {
    try {
      // Validate invoice data
      if (!invoice) {
        throw new Error('Invoice data is required');
      }

      if (!invoice.client) {
        throw new Error('Invoice must have client information');
      }

      if (!invoice.sections || invoice.sections.length === 0) {
        throw new Error('Invoice must have at least one section with items');
      }

      // Create PDF document using new architecture
      const doc = React.createElement(NewInvoiceDocument, { invoice }) as any;
      const asPdf = pdf(doc);
      
      return await asPdf.toBlob();
    } catch (error) {
      console.error('Invoice PDF Generation Error:', error);
      throw error;
    }
  }

  /**
   * Generate PDF with filename
   */
  static async generatePDFWithFilename(invoice: Invoice): Promise<{ blob: Blob; filename: string }> {
    const blob = await this.generatePDF(invoice);
    const filename = this.generateFilename(invoice);
    
    return { blob, filename };
  }

  /**
   * Generate standardized filename for invoice PDF
   */
  static generateFilename(invoice: Invoice): string {
    try {
      // Format: InvoiceNumber_ClientName_Date.pdf
      // Example: 241201-10001-10_PMS_ABC_Trading_LLC_2024-12-01.pdf
      
      const invoiceNumber = invoice.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
      const clientName = (invoice.client?.clientName || 'Unknown_Client')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      
      const invoiceDate = new Date(invoice.invoiceDate).toISOString().split('T')[0];
      
      return `${invoiceNumber}_${clientName}_${invoiceDate}.pdf`;
    } catch (error) {
      console.error('Error generating invoice filename:', error);
      // Fallback filename
      return `Invoice_${invoice.id || Date.now()}.pdf`;
    }
  }

  /**
   * Generate multiple invoice PDFs (for batch operations)
   */
  static async generateMultiplePDFs(invoices: Invoice[]): Promise<{ 
    invoice: Invoice; 
    blob: Blob; 
    filename: string;
  }[]> {
    const results = [];
    
    for (const invoice of invoices) {
      try {
        const { blob, filename } = await this.generatePDFWithFilename(invoice);
        results.push({ invoice, blob, filename });
      } catch (error) {
        console.error(`Failed to generate PDF for invoice ${invoice.invoiceNumber}:`, error);
        // Continue with other invoices even if one fails
      }
    }
    
    return results;
  }

  /**
   * Get PDF file size estimate (for UI display)
   */
  static estimatePDFSize(invoice: Invoice): number {
    // Rough estimation based on content
    let estimatedSize = 50000; // Base size ~50KB
    
    // Add size for items
    if (invoice.sections) {
      const totalItems = invoice.sections.reduce((sum, section) => 
        sum + (section.items?.length || 0), 0
      );
      estimatedSize += totalItems * 1000; // ~1KB per item
    }
    
    // Add size for notes
    if (invoice.notes) {
      estimatedSize += invoice.notes.length * 10;
    }
    
    return Math.round(estimatedSize);
  }

  /**
   * Validate invoice data for PDF generation
   */
  static validateInvoiceForPDF(invoice: Invoice): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!invoice) {
      errors.push('Invoice data is missing');
      return { isValid: false, errors };
    }

    if (!invoice.invoiceNumber) {
      errors.push('Invoice number is required');
    }

    if (!invoice.client) {
      errors.push('Client information is required');
    } else {
      if (!invoice.client.clientName) {
        errors.push('Client name is required');
      }
      if (!invoice.client.clientCode) {
        errors.push('Client code is required');
      }
    }

    if (!invoice.invoiceDate) {
      errors.push('Invoice date is required');
    }

    if (!invoice.sections || invoice.sections.length === 0) {
      errors.push('Invoice must have at least one section');
    } else {
      let hasItems = false;
      invoice.sections.forEach((section, index) => {
        if (!section.name) {
          errors.push(`Section ${index + 1} must have a name`);
        }
        if (section.items && section.items.length > 0) {
          hasItems = true;
          section.items.forEach((item, itemIndex) => {
            if (!item.description) {
              errors.push(`Item ${itemIndex + 1} in section "${section.name}" must have a description`);
            }
            if (item.quantity <= 0) {
              errors.push(`Item ${itemIndex + 1} in section "${section.name}" must have a positive quantity`);
            }
            if (item.unit_price < 0) {
              errors.push(`Item ${itemIndex + 1} in section "${section.name}" cannot have negative unit price`);
            }
          });
        }
      });
      
      if (!hasItems) {
        errors.push('Invoice must have at least one item');
      }
    }

    if (typeof invoice.subtotal !== 'number' || invoice.subtotal < 0) {
      errors.push('Valid subtotal is required');
    }

    if (typeof invoice.vatAmount !== 'number' || invoice.vatAmount < 0) {
      errors.push('Valid VAT amount is required');
    }

    if (typeof invoice.totalAmount !== 'number' || invoice.totalAmount <= 0) {
      errors.push('Valid total amount is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}