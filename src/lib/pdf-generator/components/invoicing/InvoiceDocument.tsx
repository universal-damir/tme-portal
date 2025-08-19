import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { Invoice } from '@/types/invoicing';
import { globalStyles } from '../../styles';

// Invoice-specific styles
const styles = StyleSheet.create({
  page: {
    ...globalStyles.page,
    padding: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#243F7B',
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 10,
  },
  companyInfo: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#243F7B',
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#243F7B',
    textAlign: 'right',
    marginTop: 5,
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  clientInfo: {
    flex: 1,
    paddingRight: 20,
  },
  invoiceInfo: {
    flex: 1,
    paddingLeft: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#243F7B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  detailLabel: {
    fontSize: 10,
    color: '#666666',
    width: 80,
  },
  detailValue: {
    fontSize: 10,
    color: '#333333',
    flex: 1,
  },
  itemsTable: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DEE2E6',
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#495057',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
    minHeight: 35,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 9,
    color: '#333333',
    paddingRight: 5,
  },
  sectionRow: {
    flexDirection: 'row',
    backgroundColor: '#E8F0FF',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DEE2E6',
  },
  sectionName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#243F7B',
    flex: 1,
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 250,
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 11,
    color: '#666666',
  },
  totalValue: {
    fontSize: 11,
    color: '#333333',
    fontWeight: 'bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 250,
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#243F7B',
  },
  grandTotalLabel: {
    fontSize: 14,
    color: '#243F7B',
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 16,
    color: '#243F7B',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
  },
  paymentInfo: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    marginBottom: 20,
    borderRadius: 5,
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#243F7B',
    marginBottom: 8,
  },
  paymentDetails: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 1.4,
  },
  notes: {
    marginTop: 20,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#243F7B',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 1.4,
  },
  footerText: {
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
    marginTop: 15,
  },
});

interface InvoiceDocumentProps {
  invoice: Invoice;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCompanyDetails = (company: string) => {
    switch (company) {
      case 'DET':
        return {
          name: 'Dynamic Experts Trading LLC',
          address: 'Office 123, Business Center\nDubai, United Arab Emirates',
          trn: 'TRN: 100000000000003',
          phone: '+971-4-123-4567',
          email: 'info@dettrading.ae'
        };
      case 'FZCO':
        return {
          name: 'TME Professional Services FZCO',
          address: 'Free Zone Office 456\nDubai, United Arab Emirates', 
          trn: 'TRN: 100000000000003',
          phone: '+971-4-234-5678',
          email: 'info@tmepro.ae'
        };
      case 'DMCC':
        return {
          name: 'TME Global Services DMCC',
          address: 'DMCC Business Centre\nDubai, United Arab Emirates',
          trn: 'TRN: 100000000000003',
          phone: '+971-4-345-6789',
          email: 'info@tmeglobal.ae'
        };
      default:
        return {
          name: 'TME Professional Services',
          address: 'Dubai, United Arab Emirates',
          trn: 'TRN: 100000000000003',
          phone: '+971-4-123-4567',
          email: 'info@tmepro.ae'
        };
    }
  };

  const companyDetails = getCompanyDetails(invoice.client?.issuingCompany || 'FZCO');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.companyInfo, { fontSize: 14, fontWeight: 'bold', color: '#243F7B' }]}>
              {companyDetails.name}
            </Text>
            <Text style={styles.companyInfo}>
              {companyDetails.address}
            </Text>
            <Text style={styles.companyInfo}>
              {companyDetails.trn}
            </Text>
            <Text style={styles.companyInfo}>
              Phone: {companyDetails.phone}
            </Text>
            <Text style={styles.companyInfo}>
              Email: {companyDetails.email}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Invoice and Client Details */}
        <View style={styles.invoiceDetails}>
          <View style={styles.clientInfo}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <Text style={[styles.detailValue, { fontSize: 12, fontWeight: 'bold', marginBottom: 5 }]}>
              {invoice.client?.clientName}
            </Text>
            <Text style={styles.detailValue}>
              {invoice.client?.clientAddress}
            </Text>
            {invoice.client?.vatNumber && (
              <Text style={styles.detailValue}>
                VAT Number: {invoice.client.vatNumber}
              </Text>
            )}
            <Text style={styles.detailValue}>
              Client Code: {invoice.client?.clientCode}
            </Text>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.sectionTitle}>Invoice Details:</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invoice Date:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.invoiceDate)}</Text>
            </View>
            {invoice.dueDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Due Date:</Text>
                <Text style={styles.detailValue}>{formatDate(invoice.dueDate)}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Currency:</Text>
              <Text style={styles.detailValue}>AED</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>VAT Rate:</Text>
              <Text style={styles.detailValue}>{invoice.vatRate}%</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.itemsTable}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'center' }]}>Unit</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Net Amount</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>VAT (5%)</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Gross Amount</Text>
          </View>

          {/* Items grouped by sections */}
          {invoice.sections?.map((section, sectionIndex) => (
            <React.Fragment key={sectionIndex}>
              {/* Section Header */}
              <View style={styles.sectionRow}>
                <Text style={styles.sectionName}>{section.name}</Text>
              </View>
              
              {/* Section Items */}
              {section.items?.map((item, itemIndex) => {
                const netAmount = item.quantity * item.unit_price;
                const vatAmount = netAmount * 0.05;
                const grossAmount = netAmount + vatAmount;
                
                return (
                  <View key={itemIndex} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 3 }]}>{item.description}</Text>
                    <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'center' }]}>{item.quantity}</Text>
                    <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'center' }]}>{item.unit || '-'}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(item.unit_price)}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(netAmount)}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(vatAmount)}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(grossAmount)}</Text>
                  </View>
                );
              })}
            </React.Fragment>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT ({invoice.vatRate}%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.vatAmount)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Amount:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.totalAmount)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {/* Payment Information */}
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>Payment Information</Text>
            <Text style={styles.paymentDetails}>
              Bank: Emirates NBD Bank{'\n'}
              Account Name: {companyDetails.name}{'\n'}
              Account Number: 1234567890{'\n'}
              IBAN: AE070260001234567890{'\n'}
              Swift Code: EBILAEAD{'\n'}
              {'\n'}
              Please reference invoice number {invoice.invoiceNumber} in your payment.
            </Text>
          </View>

          <Text style={styles.footerText}>
            This invoice is generated electronically and is valid without signature.{'\n'}
            Thank you for your business with TME Professional Services.
          </Text>
        </View>
      </Page>
    </Document>
  );
};