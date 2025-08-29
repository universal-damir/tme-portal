import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { CITTransferPricingPage, ConfAccDocsPage, CITAssessmentConclusionPage } from './pages';
import { styles } from '../../styles';
import type { PDFComponentProps } from '../../types';
import type { CITReturnLettersData, LetterType } from '@/types/cit-return-letters';

interface CITReturnLettersDocumentProps {
  data: PDFComponentProps['data'] & { 
    citReturnLettersData: CITReturnLettersData;
    letterType: LetterType;
  };
}

interface CITReturnLettersCombinedDocumentProps {
  data: PDFComponentProps['data'] & { 
    citReturnLettersData: CITReturnLettersData;
    selectedLetterTypes: LetterType[];
  };
}

// Single letter document (existing functionality)
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
      {letterType === 'CIT TP' ? (
        <CITTransferPricingPage data={data} />
      ) : letterType === 'Conf acc docs + FS' ? (
        <ConfAccDocsPage data={data} />
      ) : letterType === 'CIT assess+concl, non deduct, elect' ? (
        <CITAssessmentConclusionPage data={data} />
      ) : (
        <NotImplementedPage letterType={letterType} />
      )}
    </Document>
  );
};

// Combined document for preview (multiple letters in one document)
export const CITReturnLettersCombinedDocument: React.FC<CITReturnLettersCombinedDocumentProps> = ({ data }) => {
  const { selectedLetterTypes } = data;

  return (
    <Document>
      {selectedLetterTypes.includes('CIT TP') ? <CITTransferPricingPage data={data} /> : null}
      {selectedLetterTypes.includes('Conf acc docs + FS') ? <ConfAccDocsPage data={data} /> : null}
      {selectedLetterTypes.includes('CIT assess+concl, non deduct, elect') ? <CITAssessmentConclusionPage data={data} /> : null}
    </Document>
  );
};