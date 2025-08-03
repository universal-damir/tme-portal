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
  ClientInfoSection, 
  AuthorityInfoSection, 
  ActivityCodesSection,
  InitialCostSummarySection
} from '../sections';
import { generateDynamicFilename } from '../../../utils/filename';
import type { PDFComponentProps } from '../../../types';

// CoverPage - First page of the PDF document
// Combines: Header, Intro, Client Info, Authority Info, Activity Codes, Footer
export const CoverPage: React.FC<PDFComponentProps> = ({ data }) => {
  // Generate intro content with proper authority display name
  const getAuthorityDisplayName = () => {
    const authority = data.authorityInformation.responsibleAuthority;
    if (authority === 'DET (Dubai Department of Economy and Tourism)') {
      return 'DET (Dubai Department of Economy and Tourism)';
    }
    return authority;
  };

  const introContent = data.clientDetails.addressToCompany ? 
    `We are pleased to share a personalized cost overview for your company setup in ${getAuthorityDisplayName()}. This document provides a transparent breakdown of fees and services. It is designed to give you clear insight into each cost element.` :
    `Dear ${data.clientDetails.firstName},

We are pleased to share a personalized cost overview for your company setup in ${getAuthorityDisplayName()}. This document provides a transparent breakdown of fees and services. It is designed to give you clear insight into each cost element.`;

  // Generate the filename to display on the cover page
  const filename = generateDynamicFilename(data);

  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      {/* Main content area that will flex to fill available space */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <IntroSection
          headline="Cost Overview"
          content={introContent}
          filename={filename}
        />

        <View style={styles.twoColumnLayout}>
          <View style={styles.leftColumn}>
            <ClientInfoSection data={data} />
          </View>
          <View style={styles.rightColumn}>
            <AuthorityInfoSection data={data} />
          </View>
        </View>

        <ActivityCodesSection data={data} />

        <InitialCostSummarySection data={data} />

        {/* Spacer to push signature to bottom */}
        <View style={{ flex: 1 }} />

        {/* Fixed signature section at bottom */}
        <SignatureSection data={data} />
      </View>

      <FooterComponent />
    </Page>
  );
}; 