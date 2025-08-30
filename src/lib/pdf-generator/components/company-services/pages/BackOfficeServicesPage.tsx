import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { formatDateDDMMYYYY } from '../../../utils';
import { 
  HeaderComponent, 
  FooterComponent
} from '../../shared';
import { 
  BackOfficeServicesSection
} from '../sections';
import type { PDFComponentProps } from '../../../types';

// BackOfficeServicesPage - Dedicated page for back-office services
// Following the established pattern from cost-overview pages
export const BackOfficeServicesPage: React.FC<PDFComponentProps> = ({ data }) => {
  // Access company services data from transformed data
  const companyServicesData = (data as any).companyServicesData;
  const backOfficeServices = companyServicesData?.backOfficeServices;
  const isLastService = (data as any).lastServiceName === 'backOffice';
  const isFirstService = (data as any).firstServiceName === 'backOffice';

  // Don't render if back-office services are not enabled
  if (!backOfficeServices?.enabled) {
    return null;
  }

  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} showClientInfo={false} />

      {/* Main content area that will flex to fill available space */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        {/* Client Details Section - only on first service page */}
        {isFirstService && (
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <View style={{ width: '50%', paddingRight: 8 }}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Client Details</Text>
                <View style={styles.contentArea}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Client Name:</Text>
                    <Text style={styles.value}>
                      {`${data.clientDetails?.firstName || companyServicesData?.firstName || ''} ${data.clientDetails?.lastName || companyServicesData?.lastName || ''}`.trim() || 'Not provided'}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Company Name:</Text>
                    <Text style={styles.value}>
                      {data.clientDetails?.companyName || companyServicesData?.companyName || '-'}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Date:</Text>
                    <Text style={styles.value}>
                      {formatDateDDMMYYYY(data.clientDetails?.date || companyServicesData?.date)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Exchange Rate:</Text>
                    <Text style={styles.value}>
                      {(data.clientDetails?.exchangeRate || companyServicesData?.exchangeRate || 3.67).toFixed(2)} AED = 1 {data.clientDetails?.secondaryCurrency || companyServicesData?.secondaryCurrency || 'EUR'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={{ width: '50%', paddingLeft: 8 }}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Signature</Text>
                <View style={{ ...styles.contentArea, minHeight: 100, justifyContent: 'flex-start' }}>
                  <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                    Agreed to service charges listed below.{'\n'}They will apply when the individual service is performed.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        
        <BackOfficeServicesSection data={data} />
      </View>

      <FooterComponent />
    </Page>
  );
}; 