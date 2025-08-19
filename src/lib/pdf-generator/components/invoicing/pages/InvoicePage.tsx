import React from 'react';
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { HeaderComponent, FooterComponent } from '../../shared';
import { Invoice } from '@/types/invoicing';
import { getBrandingForInvoice } from '../utils/invoiceBrandingMapper';

// Invoice-specific styles
const invoiceStyles = StyleSheet.create({
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#243F7B',
  },
  invoiceTitleLine: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#243F7B',
    textAlign: 'right',
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  clientInfo: {
    width: '45%',
    paddingRight: 15,
  },
  invoiceInfo: {
    width: '45%',
    paddingLeft: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#243F7B',
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
  clientDetailLine: {
    fontSize: 10,
    color: '#333333',
    marginBottom: 3,
    lineHeight: 1.3,
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
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
    minHeight: 18,
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
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#DEE2E6',
    minHeight: 18,
    alignItems: 'center',
  },
  sectionName: {
    fontSize: 10,
    fontWeight: 'bold',
    flex: 1,
    color: '#243F7B',
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
    fontSize: 11,
    fontWeight: 'bold',
    color: '#243F7B',
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#243F7B',
  },
  paymentInfo: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    marginTop: 20,
    borderRadius: 5,
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#243F7B',
  },
  paymentDetails: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 1.4,
  },
  notes: {
    marginTop: 20,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#243F7B',
  },
  notesText: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 1.4,
  },
});

interface InvoicePageProps {
  invoice: Invoice;
}

export const InvoicePage: React.FC<InvoicePageProps> = ({ invoice }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatCurrencyForTable = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Get branding for this invoice using the proper mapping
  const branding = getBrandingForInvoice(invoice.client?.issuingCompany || 'FZCO');

  // Clean up client address to remove duplicate "P.O. Box"
  const cleanClientAddress = (address: string) => {
    if (!address) return '';
    // Remove duplicate "P.O. Box" or "PO Box" patterns
    return address.replace(/P\.?O\.?\s*Box\s+P\.?O\.?\s*Box/gi, 'P.O. Box').trim();
  };

  // Get dynamic payment information based on issuing company
  const getPaymentInfo = (issuingCompany: string) => {
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
    
    switch (issuingCompany?.toUpperCase()) {
      case 'DET':
      case 'MGT':
      case 'MANAGEMENT':
        return `This tax invoice is system generated and carries no signature. Payment shall be made within 7 days after invoice date.

Clients VAT TRN: ${invoice.client?.vatNumber || 'N/A'}
MGT VAT TRN: 10407 45547 00003
${formattedDate}

Payment shall be made in the name TME Management Consultants LLC
Commercial Bank of Dubai PSC, swift code CBDUAEADXXX, Jebel Ali Branch, Dubai, UAE 
AED Account: 10 0745 7383, IBAN AE 83 023 0000 0010 0745 7383

Please use purpose code PMS (Professional & Management Consulting Services) for payments`;

      case 'FZCO':
      case 'IFZA':
        return `This tax invoice is system generated and carries no signature. Payment shall be made within 7 days after invoice date.

Payment shall be made in the name TME Services FZCO
Commercial Bank of Dubai PSC, swift code CBDUAEADXXX, Jebel Ali Branch, Dubai, UAE
Please use purpose code PMS (Professional & Management Consulting Services) for payments

Please reference invoice number ${invoice.invoiceNumber} in your payment.`;

      case 'DMCC':
        return `This tax invoice is system generated and carries no signature. Payment shall be made within 7 days after invoice date.

Payment shall be made in the name TME Services DMCC
Commercial Bank of Dubai PSC, swift code CBDUAEADXXX, Jebel Ali Branch, Dubai, UAE 
AED Account: 10 0217 5113, IBAN AE42 023 0000 0010 0217 5113

Please use purpose code PMS (Professional & Management Consulting Services) for payments`;

      default:
        return `This tax invoice is system generated and carries no signature. Payment shall be made within 7 days after invoice date.

Please reference invoice number ${invoice.invoiceNumber} in your payment.`;
    }
  };

  // Transform invoice to data format expected by HeaderComponent
  const transformedData = {
    authorityInformation: {
      responsibleAuthority: getBrandingAuthorityName(invoice.client?.issuingCompany || 'FZCO')
    },
    clientDetails: {
      firstName: invoice.client?.clientName?.split(' ')[0] || '',
      lastName: invoice.client?.clientName?.split(' ').slice(1).join(' ') || '',
      companyName: invoice.client?.clientName || '',
    }
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Use the proven HeaderComponent */}
      <HeaderComponent data={transformedData} />

      {/* Invoice Title Section */}
      <View style={invoiceStyles.invoiceHeader}>
        <View style={{ flex: 1 }} />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={invoiceStyles.invoiceTitleLine}>INVOICE {invoice.invoiceNumber}</Text>
        </View>
      </View>

      {/* Invoice and Client Details */}
      <View style={invoiceStyles.invoiceDetails}>
        <View style={invoiceStyles.clientInfo}>
          <Text style={invoiceStyles.sectionTitle}>Bill To:</Text>
          <Text style={[invoiceStyles.clientDetailLine, { fontSize: 11, fontWeight: 'bold', marginBottom: 5 }]}>
            {invoice.client?.clientName}
          </Text>
          <Text style={invoiceStyles.clientDetailLine}>
            {cleanClientAddress(invoice.client?.clientAddress || '')}
          </Text>
          {invoice.client?.vatNumber && (
            <Text style={invoiceStyles.clientDetailLine}>
              VAT Number: {invoice.client.vatNumber}
            </Text>
          )}
        </View>
        <View style={invoiceStyles.invoiceInfo}>
          <Text style={invoiceStyles.sectionTitle}>Invoice Details:</Text>
          <View style={invoiceStyles.detailRow}>
            <Text style={invoiceStyles.detailLabel}>Invoice Date:</Text>
            <Text style={invoiceStyles.detailValue}>{formatDate(invoice.invoiceDate)}</Text>
          </View>
          {invoice.dueDate && (
            <View style={invoiceStyles.detailRow}>
              <Text style={invoiceStyles.detailLabel}>Due Date:</Text>
              <Text style={invoiceStyles.detailValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
          )}
          <View style={invoiceStyles.detailRow}>
            <Text style={invoiceStyles.detailLabel}>Currency:</Text>
            <Text style={invoiceStyles.detailValue}>AED</Text>
          </View>
          <View style={invoiceStyles.detailRow}>
            <Text style={invoiceStyles.detailLabel}>VAT Rate:</Text>
            <Text style={invoiceStyles.detailValue}>{invoice.vatRate}%</Text>
          </View>
        </View>
      </View>

      {/* Dynamic Items Table */}
      <View style={invoiceStyles.itemsTable}>
        {/* Table Header */}
        <View style={invoiceStyles.tableHeader}>
          <Text style={[invoiceStyles.tableHeaderCell, { flex: 3 }]}>Description</Text>
          <Text style={[invoiceStyles.tableHeaderCell, { flex: 0.8, textAlign: 'center' }]}>Qty</Text>
          <Text style={[invoiceStyles.tableHeaderCell, { flex: 0.8, textAlign: 'center' }]}>Unit</Text>
          <Text style={[invoiceStyles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Unit Price</Text>
          <Text style={[invoiceStyles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Net Amount</Text>
          <Text style={[invoiceStyles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>VAT (5%)</Text>
          <Text style={[invoiceStyles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Gross Amount</Text>
        </View>

        {/* Dynamic Items grouped by sections */}
        {invoice.sections?.map((section, sectionIndex) => (
          <React.Fragment key={sectionIndex}>
            {/* Section Header */}
            <View style={invoiceStyles.sectionRow}>
              <Text style={invoiceStyles.sectionName}>{section.name}</Text>
            </View>
            
            {/* Section Items */}
            {section.items?.map((item, itemIndex) => {
              const netAmount = item.quantity * item.unit_price;
              const vatAmount = netAmount * 0.05;
              const grossAmount = netAmount + vatAmount;
              
              return (
                <View key={itemIndex} style={invoiceStyles.tableRow}>
                  <Text style={[invoiceStyles.tableCell, { flex: 3 }]}>{item.description}</Text>
                  <Text style={[invoiceStyles.tableCell, { flex: 0.8, textAlign: 'center' }]}>{item.quantity}</Text>
                  <Text style={[invoiceStyles.tableCell, { flex: 0.8, textAlign: 'center' }]}>{item.unit || '-'}</Text>
                  <Text style={[invoiceStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrencyForTable(item.unit_price)}</Text>
                  <Text style={[invoiceStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrencyForTable(netAmount)}</Text>
                  <Text style={[invoiceStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrencyForTable(vatAmount)}</Text>
                  <Text style={[invoiceStyles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrencyForTable(grossAmount)}</Text>
                </View>
              );
            })}
          </React.Fragment>
        ))}
      </View>

      {/* Totals */}
      <View style={invoiceStyles.totalsSection}>
        <View style={invoiceStyles.totalRow}>
          <Text style={invoiceStyles.totalLabel}>Subtotal:</Text>
          <Text style={invoiceStyles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
        </View>
        <View style={invoiceStyles.totalRow}>
          <Text style={invoiceStyles.totalLabel}>VAT ({invoice.vatRate}%):</Text>
          <Text style={invoiceStyles.totalValue}>{formatCurrency(invoice.vatAmount)}</Text>
        </View>
        <View style={invoiceStyles.grandTotalRow}>
          <Text style={invoiceStyles.grandTotalLabel}>Total Amount:</Text>
          <Text style={invoiceStyles.grandTotalValue}>
            {formatCurrency(invoice.totalAmount)}
          </Text>
        </View>
      </View>

      {/* Notes */}
      {invoice.notes && (
        <View style={invoiceStyles.notes}>
          <Text style={invoiceStyles.notesTitle}>Notes:</Text>
          <Text style={invoiceStyles.notesText}>{invoice.notes}</Text>
        </View>
      )}

      {/* Payment Information */}
      <View style={invoiceStyles.paymentInfo}>
        <Text style={invoiceStyles.paymentTitle}>Payment Information</Text>
        <Text style={invoiceStyles.paymentDetails}>
          {getPaymentInfo(invoice.client?.issuingCompany || 'FZCO')}
        </Text>
      </View>

      {/* Use the proven FooterComponent */}
      <FooterComponent data={transformedData} />
    </Page>
  );
};

// Helper function to get authority name for branding system
function getBrandingAuthorityName(issuingCompany: string): string {
  switch (issuingCompany?.toUpperCase()) {
    case 'FZCO':
    case 'IFZA':
      return 'IFZA (International Free Zone Authority)';
    case 'DET':
    case 'MGT':
    case 'MANAGEMENT':
      return 'DET (Dubai Department of Economy and Tourism)';
    case 'DMCC':
      return 'DMCC (Dubai Multi Commodities Centre)';
    default:
      return 'IFZA (International Free Zone Authority)';
  }
}