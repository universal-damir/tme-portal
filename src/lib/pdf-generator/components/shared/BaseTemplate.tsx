import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../styles';
import { HeaderComponent, FooterComponent } from './';
import { getBrandingByAuthority } from '../../branding';
import type { PDFComponentProps } from '../../types';

export interface BaseTemplateSection {
  title: string;
  content: React.ReactNode;
}

export interface BaseTemplateProps extends PDFComponentProps {
  documentTitle: string;
  sections: BaseTemplateSection[];
  showCoverPage?: boolean;
  showSummaryPage?: boolean;
}

// BaseTemplate - Reusable template for simple forms
// Provides consistent layout and branding for new tabs
export const BaseTemplate: React.FC<BaseTemplateProps> = ({ 
  data, 
  documentTitle, 
  sections, 
  showCoverPage = true,
  showSummaryPage = true 
}) => {
  const branding = getBrandingByAuthority(data.authorityInformation.responsibleAuthority);
  
  const CoverPageSection = () => (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />
      
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Document Title */}
        <View style={styles.section}>
          <Text style={styles.title}>{documentTitle}</Text>
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{data.clientDetails.addressToCompany ? 'Company:' : 'Client Name:'}</Text>
            <Text style={styles.value}>
              {data.clientDetails.addressToCompany 
                ? data.clientDetails.companyName 
                : `${data.clientDetails.firstName} ${data.clientDetails.lastName}`}
            </Text>
          </View>
          {data.clientDetails.addressToCompany && (
            <View style={styles.row}>
              <Text style={styles.label}>Contact Person:</Text>
              <Text style={styles.value}>{data.clientDetails.firstName} {data.clientDetails.lastName}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{new Date().toLocaleDateString('en-GB')}</Text>
          </View>
        </View>

        {/* Authority Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authority Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Responsible Authority:</Text>
            <Text style={styles.value}>{data.authorityInformation.responsibleAuthority}</Text>
          </View>
           
        </View>
      </View>

      <FooterComponent />
    </Page>
  );

  const ContentPages = () => (
    <>
      {sections.map((section, index) => (
        <Page key={index} size="A4" style={styles.page}>
          <HeaderComponent data={data} />
          
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.content}
            </View>
          </View>

          <FooterComponent />
        </Page>
      ))}
    </>
  );

  const SummaryPageSection = () => (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />
      
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.introText}>
            Thank you for your interest in our services. This document provides a comprehensive overview of 
            your requirements and our proposed solutions.
          </Text>
          <Text style={[styles.introText, { marginTop: 12 }]}>
            Should you have any questions or require further clarification on any aspect of this proposal, 
            please do not hesitate to contact us at {branding.header.phone} or {branding.header.email}.
          </Text>
          <Text style={[styles.introText, { marginTop: 12 }]}>
            We look forward to working with you and supporting your business objectives in the UAE.
          </Text>
        </View>

        {/* Signature Section */}
        <View style={[styles.section, { marginTop: 60 }]}>
          <Text style={styles.sectionTitle}>Authorization</Text>
          <View style={{ marginTop: 40 }}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>Prepared by:</Text>
            </View>
            <Text style={styles.signatureText}>{branding.header.companyName}</Text>
            <Text style={styles.signatureText}>Date: {new Date().toLocaleDateString('en-GB')}</Text>
          </View>
        </View>
      </View>

      <FooterComponent />
    </Page>
  );

  return (
    <Document>
      {showCoverPage && <CoverPageSection />}
      <ContentPages />
      {showSummaryPage && <SummaryPageSection />}
    </Document>
  );
}; 