import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { HeaderComponent, FooterComponent } from '../../shared';
import type { PDFComponentProps } from '../../../types';

// SummaryPage - Final page with closing message
export const SummaryPage: React.FC<PDFComponentProps> = ({ data }) => {
  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      <View style={styles.section}>
        <Text style={styles.introHeadline}>Summary</Text>
        
        <Text style={[styles.introText, { marginBottom: 8 }]}>
          We hope this overview gives you a clear understanding of the expected costs.
        </Text>
        
        <Text style={[styles.introText, { marginBottom: 8 }]}>
          We appreciate the opportunity to support your business setup and ongoing operations.
        </Text>
        
        <Text style={[styles.introText, { marginBottom: 8 }]}>
          Should you have any questions or need further clarification, please don't hesitate to reach out or contact us.
        </Text>
        
        <Text style={styles.introText}>
        The basis of our professional fee and costs are in AED. All government cost will ALWAYS be charged on cost basis.
        </Text>

        <Text style={styles.introText}>
        The above mentioned cost amounts in AED are estimated costs at the time of the application.
        </Text>

        <Text style={styles.introText}>
        At the time of invoicing we will charge the actual costs based on invoices and receipts.
        </Text>

        <Text style={styles.introText}>
          We look forward to assisting you through each step of the process and ensuring a smooth and compliant setup tailored to your requirements.
        </Text>

      </View>

      <FooterComponent />
    </Page>
  );
}; 