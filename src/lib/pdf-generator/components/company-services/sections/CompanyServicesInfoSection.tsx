import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import type { PDFComponentProps } from '../../../types';
import type { CompanyServicesData } from '@/types/company-services';

// CompanyServicesInfoSection - Client details section matching CIT letters format
export const CompanyServicesInfoSection: React.FC<PDFComponentProps> = ({ data }) => {
  const companyServicesData = (data as PDFComponentProps['data'] & { companyServicesData?: CompanyServicesData })?.companyServicesData;
  const clientDetails = data.clientDetails;
  
  // Get client information
  const companyName = clientDetails?.companyName || companyServicesData?.companyName || '';
  const firstName = clientDetails?.firstName || companyServicesData?.firstName || '';
  const lastName = clientDetails?.lastName || companyServicesData?.lastName || '';
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : '';
  
  // Format date
  const formatLetterDate = () => {
    const letterDateToUse = companyServicesData?.date || new Date().toISOString().split('T')[0];
    const date = new Date(letterDateToUse);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <View style={{ marginTop: 20, marginBottom: 20 }}>
      {/* Client Information Section - matching CIT letters format */}
      {(companyName || fullName) && (
        <View style={{ marginBottom: 20 }}>
          {/* Company Name */}
          {companyName && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 10, color: '#374151' }}>{companyName}</Text>
            </View>
          )}
          
          {/* Client Name */}
          {fullName && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 10, color: '#374151' }}>{fullName}</Text>
            </View>
          )}

          {/* Location and Date */}
          <View style={{ marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#374151' }}>Dubai, United Arab Emirates</Text>
            <Text style={{ fontSize: 10, color: '#374151' }}>{formatLetterDate()}</Text>
          </View>

          {/* Dear Client greeting */}
          {firstName && (
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.value}>Dear {firstName},</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}; 