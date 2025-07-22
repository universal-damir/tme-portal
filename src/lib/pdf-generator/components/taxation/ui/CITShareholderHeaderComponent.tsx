import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import type { PDFComponentProps } from '../../../types';

interface CITShareholderHeaderComponentProps extends Pick<PDFComponentProps, 'data'> {
  // Custom header specifically for CIT Shareholder Declaration
  // Displays company name bold and centered
}

export const CITShareholderHeaderComponent: React.FC<CITShareholderHeaderComponentProps> = ({ data }) => {
  // Get company name from data
  const companyName = data.clientDetails.companyName || '--';

  return (
    <View style={[styles.header, { alignItems: 'center', justifyContent: 'center', paddingVertical: 25 }]}>
      <Text style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center'
      }}>
        {companyName}
      </Text>
    </View>
  );
}; 