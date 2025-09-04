import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { 
  HeaderComponent, 
  FooterComponent
} from '../../shared';
import type { PDFComponentProps } from '../../../types';

export const SummaryPage: React.FC<PDFComponentProps> = ({ data }) => {
  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      {/* Main content area that will flex to fill available space */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Summary
          </Text>
          
          <Text style={[styles.introText, { marginBottom: 12, marginTop: 16 }]}>
            Should you have any questions or need further clarification regarding the selected services, please don't hesitate to reach out.
          </Text>
          
          <Text style={[styles.introText, { marginBottom: 12 }]}>
            The basis of our service fee and costs are in AED. All government cost will always be charged on cost basis.
          </Text>
          
          <Text style={[styles.introText, { marginBottom: 12 }]}>
            The above-mentioned cost amounts in AED are estimated costs at the time of the application. At the time of invoicing we will charge the actual costs based on invoices and receipts.
          </Text>
          
          <Text style={[styles.introText, { marginBottom: 12 }]}>
            A fee of 2%, for internal administration and regulatory compliance, will be applied on the TME Services invoice value.
          </Text>
          
          <Text style={[styles.introText, { marginBottom: 12 }]}>
            All of the above-mentioned TME Services professional fees exclude VAT, which will be charged as applicable, currently 5%.
          </Text>
        </View>
      </View>

      <FooterComponent />
    </Page>
  );
};