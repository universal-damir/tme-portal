import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { formatDateDDMMYYYY } from '../../../utils';
import type { PDFComponentProps } from '../../../types';

// ClientDetailsSection - Golden visa specific client information
// Displays: Name, Date, Golden Visa Type, Currency, Exchange Rate
export const ClientDetailsSection: React.FC<PDFComponentProps> = ({ data }) => {
  // Format client name
  const clientName = data.clientDetails.addressToCompany 
    ? data.clientDetails.companyName 
    : `${data.clientDetails.firstName} ${data.clientDetails.lastName}`;

  // Format date
  const formattedDate = formatDateDDMMYYYY(data.clientDetails.date);

  // Access golden visa data from transformed data
  const goldenVisaData = (data as any).goldenVisaData;

  // Get visa type display name
  const getVisaTypeDisplay = () => {
    switch (goldenVisaData?.visaType) {
      case 'property-investment':
        return 'Property Investment';
      case 'time-deposit':
        return 'Time Deposit';
      case 'skilled-employee':
        return 'Skilled Employee';
      default:
        return 'Golden Visa';
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Client Details</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>
          {data.clientDetails.addressToCompany ? 'Company:' : 'Name:'}
        </Text>
        <Text style={styles.value}>{clientName}</Text>
      </View>

      {data.clientDetails.addressToCompany && (
        <View style={styles.row}>
          <Text style={styles.label}>Contact Person:</Text>
          <Text style={styles.value}>
            {data.clientDetails.firstName} {data.clientDetails.lastName}
          </Text>
        </View>
      )}

      <View style={styles.row}>
        <Text style={styles.label}>Date:</Text>
        <Text style={styles.value}>{formattedDate}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Golden Visa Type:</Text>
        <Text style={styles.value}>{getVisaTypeDisplay()}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Currency:</Text>
        <Text style={styles.value}>{data.clientDetails.secondaryCurrency}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Exchange Rate:</Text>
        <Text style={styles.value}>1 AED = {(1 / data.clientDetails.exchangeRate).toFixed(4)} {data.clientDetails.secondaryCurrency}</Text>
      </View>
    </View>
  );
}; 