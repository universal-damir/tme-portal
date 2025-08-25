import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { getCompanyDetailsByAuthority } from '../../../utils/citAuthorityMapping';
import type { PDFComponentProps } from '../../../types';
import type { CITReturnLettersData } from '@/types/cit-return-letters';

interface CITLetterHeaderComponentProps {
  data: PDFComponentProps['data'] & { 
    citReturnLettersData: CITReturnLettersData;
  };
}

export const CITLetterHeaderComponent: React.FC<CITLetterHeaderComponentProps> = ({ data }) => {
  const { citReturnLettersData } = data;
  const selectedClient = citReturnLettersData.selectedClient;
  
  // Get company details based on client's registered authority
  const companyDetails = getCompanyDetailsByAuthority(
    selectedClient?.registered_authority || 'DXB IFZA FZ' // Default fallback
  );

  return (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image style={{ width: 50, height: 50, marginRight: 12 }} src="/logo.png" />
          <View>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#243F7B', marginBottom: 2 }}>
              {companyDetails.name}
            </Text>
            <Text style={{ fontSize: 8, color: '#6b7280', marginBottom: 1 }}>
              (CIT TRN {companyDetails.citTrn} | VAT TRN {companyDetails.vatTrn})
            </Text>
            <Text style={{ fontSize: 8, color: '#6b7280', marginBottom: 1 }}>
              PO Box {companyDetails.poBox} | {companyDetails.city} | {companyDetails.country}
            </Text>
            <Text style={{ fontSize: 8, color: '#6b7280' }}>
              T {companyDetails.phone} | {companyDetails.email} | {companyDetails.website}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};