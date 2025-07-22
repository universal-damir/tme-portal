import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { TaxationData } from '@/types/taxation';

interface ClientDetailsSectionProps {
  data: TaxationData;
  clientInfo: {
    firstName: string;
    lastName: string;
    companyName: string;
    date: string;
  };
}

export const ClientDetailsSection: React.FC<ClientDetailsSectionProps> = ({ data, clientInfo }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Client Information</Text>
      
      {data.companyName && (
        <View style={styles.row}>
          <Text style={styles.label}>Company:</Text>
          <Text style={styles.value}>{data.companyName}</Text>
        </View>
      )}
      
      <View style={styles.row}>
        <Text style={styles.label}>Client Name:</Text>
        <Text style={styles.value}>{data.firstName} {data.lastName}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Date:</Text>
        <Text style={styles.value}>{new Date(data.date).toLocaleDateString('en-GB')}</Text>
      </View>
    </View>
  );
}; 