import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { 
  HeaderComponent, 
  FooterComponent
} from '../../shared';
import type { PDFComponentProps } from '../../../types';

export const GoldenVisaSummaryPage: React.FC<PDFComponentProps> = ({ data }) => {
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
            Should you have any questions or need further clarification, please don't hesitate to reach out.
          </Text>
          
          <Text style={[styles.introText, { marginBottom: 12 }]}>
            The basis of our TME Services professional fees and costs are in AED. All government costs will always be charged on a cost basis.
          </Text>
          
          <Text style={[styles.introText, { marginBottom: 12 }]}>
            The above-mentioned cost amounts in AED are estimated costs at the time of the application. At the time of invoicing, we will charge the actual costs based on invoices and receipts.
          </Text>
          
          <Text style={[styles.introText, { marginBottom: 12 }]}>
            A fee of 2%, for internal administration and regulatory compliance, will be applied.
          </Text>
          
          <Text style={[styles.introText, { marginBottom: 12 }]}>
            All the above-mentioned TME Services professional fees exclude VAT, which will be charged as applicable, currently 5%.
          </Text>
          
          <Text style={[styles.introText, { marginBottom: 12 }]}>
            We look forward to assisting you through each step of the process and ensuring a smooth, compliant setup tailored to your specific requirements.
          </Text>
        </View>
      </View>

      <FooterComponent />
    </Page>
  );
};