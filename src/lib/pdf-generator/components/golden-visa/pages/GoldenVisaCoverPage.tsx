import React from 'react';
import { Page, View } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { 
  HeaderComponent, 
  FooterComponent, 
  IntroSection,
  SignatureSection
} from '../../shared';
import { 
  VisaRequirementsSection,
  CostSummarySection
} from '@/lib/pdf-generator/components/golden-visa/sections';
import type { PDFComponentProps } from '../../../types';

// GoldenVisaCoverPage - Cover page with client details and cost overview
// Replaces the monolithic approach with modular sections
export const GoldenVisaCoverPage: React.FC<PDFComponentProps> = ({ data }) => {
  // Access golden visa data from transformed data
  const goldenVisaData = (data as any).goldenVisaData;

  // Generate intro content based on visa type and requirements
  const getIntroContent = () => {
    if (!goldenVisaData?.primaryVisaRequired) {
      const content = `We are pleased to share a personalized proposal for your dependent Golden Visa application. This document provides a transparent breakdown of costs and fees for dependent visa applications only, based on your specific requirements.`;
      
      return data.clientDetails.addressToCompany ? 
        content :
        `Dear ${data.clientDetails.firstName},

${content}`;
    }

    const visaTypeDisplay = goldenVisaData?.visaType === 'property-investment' 
      ? 'Property Investment'
      : goldenVisaData?.visaType === 'time-deposit'
      ? 'Time Deposit'
      : 'Skilled Employee';

    const content = `We are pleased to share a personalized proposal for your Golden Visa application. This document provides a transparent breakdown of costs and fees based on the requirements.`;
    
    return data.clientDetails.addressToCompany ? 
      content :
      `Dear ${data.clientDetails.firstName},

${content}`;
  };

  // Generate headline based on visa type and requirements
  const getHeadline = () => {
    if (!goldenVisaData?.primaryVisaRequired) {
      return 'Golden Visa (10 Years) Dependent';
    }

    const visaTypeDisplay = goldenVisaData?.visaType === 'property-investment' 
      ? 'Property Investment'
      : goldenVisaData?.visaType === 'time-deposit'
      ? 'Time Deposit'
      : 'Skilled Employee';

    return `Golden Visa (10 Years) ${visaTypeDisplay}`;
  };

  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      {/* Main content area that will flex to fill available space */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <IntroSection
          headline={getHeadline()}
          content={getIntroContent()}
        />

        <VisaRequirementsSection data={data} />

        <CostSummarySection data={data} />

        {/* Spacer to push signature to bottom */}
        <View style={{ flex: 1 }} />

        {/* Fixed signature section at bottom */}
        <SignatureSection data={data} />
      </View>

      <FooterComponent />
    </Page>
  );
}; 