import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { 
  HeaderComponent, 
  FooterComponent
} from '../../shared';
import type { PDFComponentProps } from '../../../types';

interface TaxationCoverPageProps {
  data: PDFComponentProps['data'] & { taxationData: any };
}

export const TaxationCoverPage: React.FC<TaxationCoverPageProps> = ({ data }) => {
  // Access taxation data from transformed data
  const taxationData = data.taxationData;
  
  // Generate intro content
  const getIntroContent = () => {
    const content = `We are pleased to provide this disclaimer regarding our Corporate Tax Services with respect to Transfer Pricing requirements under the UAE Corporate Tax Law. This document outlines important considerations and limitations that apply to our tax advisory services.`;
    
    return data.clientDetails.addressToCompany ? 
      content :
      `Dear ${data.clientDetails.firstName},

${content}`;
  };

  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      {/* Main content area that will flex to fill available space */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        {/* Document Title */}
        <View style={styles.section}>
          <Text style={styles.title}>Corporate Tax Services Disclaimer</Text>
        </View>

        {/* Intro Content */}
        <View style={styles.section}>
          <Text style={styles.introText}>{getIntroContent()}</Text>
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          
          {data.clientDetails.companyName && (
            <View style={styles.row}>
              <Text style={styles.label}>Company:</Text>
              <Text style={styles.value}>{data.clientDetails.companyName}</Text>
            </View>
          )}
          
          <View style={styles.row}>
            <Text style={styles.label}>Client Name:</Text>
            <Text style={styles.value}>{data.clientDetails.firstName} {data.clientDetails.lastName}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{new Date(data.clientDetails.date).toLocaleDateString('en-GB')}</Text>
          </View>
        </View>

        {/* Spacer to push footer to bottom */}
        <View style={{ flex: 1 }} />
      </View>

      <FooterComponent />
    </Page>
  );
}; 