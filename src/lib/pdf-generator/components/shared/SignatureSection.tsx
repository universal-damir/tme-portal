import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../styles';
import { formatDateDDMMYYYY } from '../../utils';
import type { PDFComponentProps } from '../../types';

// SignatureSection - Signature area for agreement
// Shows: "Agreed to the offer above", dynamic date, Signature line
export const SignatureSection: React.FC<PDFComponentProps> = ({ data }) => {
  const formattedDate = formatDateDDMMYYYY(data.clientDetails.date);

  return (
    <View style={styles.signatureSection}>
      <Text style={styles.signatureText}>
        Agreed to the offer above, {formattedDate}
      </Text>
      
      <View style={styles.signatureRow}>
        <View style={styles.signatureLine}></View>
      </View>
      
      <Text style={styles.signatureLabel}>Signature</Text>
    </View>
  );
}; 