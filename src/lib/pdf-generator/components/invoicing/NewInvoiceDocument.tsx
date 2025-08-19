import React from 'react';
import { Document } from '@react-pdf/renderer';
import { InvoicePage } from './pages/InvoicePage';
import { Invoice } from '@/types/invoicing';

// Invoice Document Props interface
interface InvoiceDocumentProps {
  invoice: Invoice;
}

// InvoiceDocument - Main orchestrator component following proven architecture
// Uses the same pattern as OfferDocument/GoldenVisaDocument with modular structure
export const NewInvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice }) => {
  // Defensive check to prevent crashes when data is malformed
  if (!invoice) {
    console.error('InvoiceDocument: Invalid invoice data provided', invoice);
    throw new Error('Invalid invoice data provided to PDF generator. Please ensure all required fields are filled.');
  }

  if (!invoice.client) {
    console.error('InvoiceDocument: Invoice missing client information', invoice);
    throw new Error('Invoice must have client information');
  }

  if (!invoice.sections || invoice.sections.length === 0) {
    console.error('InvoiceDocument: Invoice missing sections/items', invoice);
    throw new Error('Invoice must have at least one section with items');
  }

  return (
    <Document>
      {/* Invoice Page - Uses HeaderComponent, dynamic table, FooterComponent */}
      <InvoicePage invoice={invoice} />
    </Document>
  );
};