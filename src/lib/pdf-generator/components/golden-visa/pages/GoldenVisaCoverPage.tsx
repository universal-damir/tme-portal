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
import { GOLDEN_VISA_TRANSLATIONS, Locale } from '../../../translations/golden-visa';
import type { PDFComponentProps } from '../../../types';

// GoldenVisaCoverPage - Cover page with client details and cost overview
// Replaces the monolithic approach with modular sections
export const GoldenVisaCoverPage: React.FC<PDFComponentProps> = ({ data }) => {
  // Access golden visa data from transformed data
  const goldenVisaData = (data as any).goldenVisaData;
  const locale: Locale = (data as any).locale || 'en';
  const t = GOLDEN_VISA_TRANSLATIONS[locale];

  // Generate intro content based on visa type and requirements
  const getIntroContent = () => {
    const baseContent = goldenVisaData?.primaryVisaRequired 
      ? t.intro.standard 
      : t.intro.dependent;

    return data.clientDetails.addressToCompany 
      ? baseContent 
      : t.intro.withGreeting(data.clientDetails.firstName) + baseContent;
  };

  // Generate headline based on visa type and requirements
  const getHeadline = () => {
    if (!goldenVisaData?.primaryVisaRequired) {
      return t.headlines.dependent;
    }

    const visaType = goldenVisaData?.visaType;
    switch(visaType) {
      case 'property-investment': return t.headlines.propertyInvestment;
      case 'time-deposit': return t.headlines.timeDeposit;
      case 'skilled-employee': return t.headlines.skilledEmployee;
      default: return t.headlines.propertyInvestment;
    }
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