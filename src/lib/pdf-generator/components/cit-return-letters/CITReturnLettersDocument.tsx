import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { CITTransferPricingPage, ConfAccDocsPage } from './pages';
import { styles } from '../../styles';
import type { PDFComponentProps } from '../../types';
import type { CITReturnLettersData } from '@/types/cit-return-letters';

interface CITReturnLettersDocumentProps {
  data: PDFComponentProps['data'] & { 
    citReturnLettersData: CITReturnLettersData;
    letterType: 'CIT TP' | 'Conf acc docs + FS' | 'CIT assess+concl, non deduct, elect';
  };
}

export const CITReturnLettersDocument: React.FC<CITReturnLettersDocumentProps> = ({ data }) => {
  const { letterType } = data;

  // Placeholder component for unimplemented letter types
  const NotImplementedPage = ({ letterType }: { letterType: string }) => (
    <Page size="A4" style={styles.page}>
      <View style={styles.contentArea}>
        <Text style={styles.title}>
          {letterType} - Not implemented yet
        </Text>
        <Text style={styles.introText}>
          This letter type will be implemented in a future update.
        </Text>
      </View>
    </Page>
  );

  return (
    <Document>
      {letterType === 'CIT TP' && <CITTransferPricingPage data={data} />}
      {letterType === 'Conf acc docs + FS' && <ConfAccDocsPage data={data} />}
      {letterType === 'CIT assess+concl, non deduct, elect' && <NotImplementedPage letterType="CIT assess+concl, non deduct, elect" />}
    </Document>
  );
};