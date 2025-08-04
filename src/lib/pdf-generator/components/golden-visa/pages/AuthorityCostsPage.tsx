import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { 
  HeaderComponent, 
  FooterComponent, 
  IntroSection
} from '../../shared';
import { 
  AuthorityFeesSection
} from '@/lib/pdf-generator/components/golden-visa/sections';
import { generateGoldenVisaExplanations } from '../../../utils/goldenVisaDataTransformer';
import type { PDFComponentProps } from '../../../types';
import type { GoldenVisaData } from '@/types/golden-visa';

// AuthorityCostsPage - Detailed breakdown of authority fees and TME Services
// Uses shared CompactCostTable components with clean styling and numbered explanations
export const AuthorityCostsPage: React.FC<PDFComponentProps> = ({ data }) => {
  // Access golden visa data from transformed data
  const goldenVisaData = (data as PDFComponentProps['data'] & { goldenVisaData: GoldenVisaData }).goldenVisaData;

  // Generate explanations
  const explanations = generateGoldenVisaExplanations(goldenVisaData);

  // Render explanation elements with compact styling - handle the correct object structure
  const explanationElements = explanations.map((explanation, index) => (
    <Text key={`explanation-${explanation.id}-${index}`} style={[styles.introText, { marginBottom: 6 }]}>
      <Text style={{ fontWeight: 'bold' }}>{explanation.title}:</Text>{' '}
      {explanation.explanation}
    </Text>
  ));

  const introContent = `This page provides a detailed breakdown of all authority costs, including TME Services professional fee required for your Golden Visa application. Each cost component is clearly itemized for complete transparency in the application process.`;

  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      <IntroSection
        headline="Golden Visa Costs Breakdown"
        content={introContent}
      />

      {/* Authority Fees Section (now includes TME Services) */}
      <AuthorityFeesSection data={data} />

      {/* Explanations Section - Compact spacing like cost overview */}
      {explanationElements.length > 0 && (
        <View style={{ marginTop: 8, marginBottom: 16 }}>
          <Text style={styles.introHeadline}>Service Explanations</Text>
          <View style={{ marginTop: 6 }}>
            {explanationElements}
          </View>
        </View>
      )}

      <FooterComponent />
    </Page>
  );
}; 