import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { formatDateDDMMYYYY } from '../../../utils';
import type { PDFComponentProps } from '../../../types';

// ClientInfoSection extracted from the original PDF generator cover page
export const ClientInfoSection: React.FC<PDFComponentProps> = ({ data }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Client Details</Text>
      <View style={styles.contentArea}>
        <View style={styles.row}>
          <Text style={styles.label}>Client Name:</Text>
          <Text style={styles.value}>
            {`${data.clientDetails.firstName || ''} ${data.clientDetails.lastName || ''}`.trim() || 'Not provided'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Company Name:</Text>
          <Text style={styles.value}>
            {data.clientDetails.companyName || '-'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>
            {formatDateDDMMYYYY(data.clientDetails.date)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Setup Type:</Text>
          <Text style={styles.value}>
            {data.clientDetails.companySetupType
              .replace('Individual Setup', 'Individual Shareholder')
              .replace('Corporate Setup', 'Corporate Shareholder')}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Exchange Rate:</Text>
          <Text style={styles.value}>
            {data.clientDetails.exchangeRate.toFixed(2)} AED = 1 {data.clientDetails.secondaryCurrency}
          </Text>
        </View>
      </View>
    </View>
  );
}; 