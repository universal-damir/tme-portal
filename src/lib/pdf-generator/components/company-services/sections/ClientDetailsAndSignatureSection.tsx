import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { formatDateDDMMYYYY } from '../../../utils';
import type { PDFComponentProps } from '../../../types';

// ClientDetailsAndSignatureSection - Reusable component for client details and signature
// Used on the first service page only
export const ClientDetailsAndSignatureSection: React.FC<PDFComponentProps> = ({ data }) => {
  const companyServicesData = (data as PDFComponentProps['data'] & { companyServicesData?: any })?.companyServicesData;
  const clientDetails = data.clientDetails;

  return (
    <View style={{ flexDirection: 'row', marginBottom: 16 }}>
      {/* Client Details - Left Column */}
      <View style={{ width: '50%', paddingRight: 8 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Details</Text>
          <View style={styles.contentArea}>
            <View style={styles.row}>
              <Text style={styles.label}>Client Name:</Text>
              <Text style={styles.value}>
                {`${clientDetails?.firstName || companyServicesData?.firstName || ''} ${clientDetails?.lastName || companyServicesData?.lastName || ''}`.trim() || 'Not provided'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Company Name:</Text>
              <Text style={styles.value}>
                {clientDetails?.companyName || companyServicesData?.companyName || '-'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>
                {formatDateDDMMYYYY(clientDetails?.date || companyServicesData?.date)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Exchange Rate:</Text>
              <Text style={styles.value}>
                {(clientDetails?.exchangeRate || companyServicesData?.exchangeRate || 3.67).toFixed(2)} AED = 1 {clientDetails?.secondaryCurrency || companyServicesData?.secondaryCurrency || 'EUR'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Signature - Right Column */}
      <View style={{ width: '50%', paddingLeft: 8 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signature</Text>
          <View style={styles.contentArea}>
            <View style={{ marginBottom: 25 }}>
              <Text style={styles.value}>Agreed to services below.</Text>
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.label}>Signature:</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};