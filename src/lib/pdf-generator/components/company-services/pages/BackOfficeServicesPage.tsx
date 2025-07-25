import React from 'react';
import { Page, View } from '@react-pdf/renderer';
import { styles } from '../../../styles';
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

  // Don't render if back-office services are not enabled
  if (!backOfficeServices?.enabled) {
    return null;
  }

  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      {/* Main content area that will flex to fill available space */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <BackOfficeServicesSection data={data} />
      </View>

      <FooterComponent />
    </Page>
  );
}; 