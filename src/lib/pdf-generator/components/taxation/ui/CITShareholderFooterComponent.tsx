import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import type { PDFComponentProps } from '../../../types';

interface CITShareholderFooterComponentProps extends Pick<PDFComponentProps, 'data'> {
  // Custom footer for CIT Shareholder Declaration
  // Format: {COMPANY NAME} | Commercial Licence Number {LICENCENUMBER} | Dubai, UAE | {contact number}
}

export const CITShareholderFooterComponent: React.FC<CITShareholderFooterComponentProps> = ({ data }) => {
  // Get data from the taxation data
  const taxationData = (data as any).taxationData;
  const companyName = data.clientDetails.companyName || '--';
  
  // Get data from CIT Shareholder Declaration
  const citData = taxationData?.citShareholderDeclaration;
  
  // Use CIT Shareholder Declaration data
  const licenceNumber = citData?.licenceNumber || 'LICENCE NUMBER';
  const contactNumber = citData?.clientContactNumber || 'CONTACT NUMBER';

  // Format phone number as +971 XX X XX XX XX
  const formatPhoneNumber = (phone: string) => {
    if (!phone || phone.length < 9) return '+971 58 5 36 53 44';
    
    // Clean the phone number of any non-digit characters first
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 9) return '+971 58 5 36 53 44';
    
    return `+971 ${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 3)} ${cleanPhone.slice(3, 5)} ${cleanPhone.slice(5, 7)} ${cleanPhone.slice(7, 9)}`;
  };

  // Format the footer text
  const footerText = `${companyName} | Commercial Licence Number ${licenceNumber} | Dubai, UAE | ${formatPhoneNumber(contactNumber)}`;

  return (
    <View style={[styles.footer, { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 }]}>
      <Text style={{
        fontSize: 10,
        color: '#666666',
        textAlign: 'center'
      }}>
        {footerText}
      </Text>
    </View>
  );
}; 