import React from 'react';
import { Page, View } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { 
  HeaderComponent, 
  FooterComponent
} from '../../shared';
import { 
  TaxConsultingServicesSection
} from '../sections';
import type { PDFComponentProps } from '../../../types';

// TaxConsultingServicesPage - Dedicated page for tax consulting services
// Following the established pattern from cost-overview pages
export const TaxConsultingServicesPage: React.FC<PDFComponentProps> = ({ data }) => {
  // Access company services data from transformed data
  const companyServicesData = (data as any).companyServicesData;
  const taxServices = companyServicesData?.taxConsultingServices;

  // Don't render if tax consulting services are not enabled
  if (!taxServices?.enabled) {
    return null;
  }

  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      {/* Main content area that will flex to fill available space */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <TaxConsultingServicesSection data={data} />
      </View>

      <FooterComponent />
    </Page>
  );
}; 