import React from 'react';
import { View, Image, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { getBrandingForInvoice } from '../utils/invoiceBrandingMapper';
import { Invoice } from '@/types/invoicing';

interface InvoiceHeaderComponentProps {
  invoice: Invoice;
}

// Invoice-specific HeaderComponent 
// Uses getBrandingForInvoice directly instead of relying on authority mapping
export const InvoiceHeaderComponent: React.FC<InvoiceHeaderComponentProps> = ({ invoice }) => {
  // Get branding configuration based on issuing company
  const issuingCompany = invoice.client?.issuingCompany || 'FZCO';
  const branding = getBrandingForInvoice(issuingCompany);
  
  console.log('InvoiceHeaderComponent - Issuing Company:', issuingCompany);
  console.log('InvoiceHeaderComponent - Branding:', branding);

  return (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image style={{ width: 50, height: 50, marginRight: 12 }} src={branding.logo} />
          <View>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: branding.colors.primary, marginBottom: 2 }}>
              {branding.header.companyName}
            </Text>
            <Text style={{ fontSize: 8, color: branding.colors.secondary, marginBottom: 1 }}>
              {branding.header.address}
            </Text>
            <Text style={{ fontSize: 8, color: branding.colors.secondary, marginBottom: 1 }}>
              {branding.header.poBox} | {branding.header.location}
            </Text>
            <Text style={{ fontSize: 8, color: branding.colors.secondary }}>
              T {branding.header.phone} | {branding.header.email} | {branding.header.website}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};