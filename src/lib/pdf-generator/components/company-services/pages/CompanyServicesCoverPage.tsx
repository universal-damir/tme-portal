import React from 'react';
import { Page, View, Link, Text, Image } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { 
  HeaderComponent, 
  FooterComponent
} from '../../shared';
import { 
  CompanyServicesInfoSection
} from '../sections';
import type { PDFComponentProps } from '../../../types';

// Client logos in alphabetical order
const clientLogos = [
  'avahle.png',
  'bito.png',
  'castolin-eutectics.png',
  'dehn.png',
  'ebm-papst.png',
  'elatec.png',
  'febi.jpg',
  'haribo.png',
  'hesse.jpg',
  'hydro.jpg',
  'kdrei.png',
  'meiko.png',
  'peters-indu.png',
  'riedel.png',
  'studio-49.png',
];

// Government logos in alphabetical order
const governmentLogos = [
  'det-logo.png',
  'dubai-courts-logo.png',
  'dubai-gov-logo.png',
  'gdrfa-logo.png',
  'FTA Logo.png',
  'EmaraTAX-logo.png',
  'icp-logo.png',
  'mohre-logo.png',
];

// Freezone logos in alphabetical order
const freezoneLogos = [
  'dafza-logo.png',
  'difc-logo.png',
  'dmcc-logo.png',
  'dso-logo.png',
  'dda-logo.png',
  'ifza-logo.png',
  'jafza-logo.png',
  'meydan-logo.png',
];

// CompanyServicesCoverPage - Cover page with client details and service overview
// Following the established pattern from GoldenVisaCoverPage
export const CompanyServicesCoverPage: React.FC<PDFComponentProps> = ({ data }) => {
  // Access company services data from transformed data
  const companyServicesData = (data as any).companyServicesData;

  // Generate intro content - always use the same content without Dear greeting
  const getIntroContent = () => {
    return (
      <>
        Once your company is established, staying compliant and running smoothly in the UAE requires consistent attention to key operational areas - from accounting and taxation to banking, payroll, and government-related processes.
        {'\n\n'}
        At TME Services, we offer a full range of post-setup support designed to help your business operate efficiently while staying in line with UAE regulations. Our services are designed to support businesses operating under the UAE's favorable tax environment, helping reduce administrative burden, ensure compliance, and allow you to focus on growing your business.
        {'\n\n'}
        
      </>
    );
  };

  // Generate headline - fixed headline
  const getHeadline = () => {
    return `TME Services - Complete Business Support in the UAE`;
  };

  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      {/* Main content area that will flex to fill available space */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        {/* Custom intro section with links */}
        <View style={styles.introSection}>
          <Text style={styles.introHeadline}>{getHeadline()}</Text>
          <Text 
            style={styles.introText}
            hyphenationCallback={(word) => [word]}
          >
            {getIntroContent()}
          </Text>
        </View>

        {/* Companies That Trust Us Section */}
        <View style={{...styles.introSection, marginBottom: 8}}>
          <Text style={styles.sectionTitle}>Companies That Trust Us</Text>
          <Text 
            style={styles.introText}
            hyphenationCallback={(word) => [word]}
          >
            You are in good company. Leading international brands across sectors have chosen to work with us for their business setup and ongoing support in the UAE. By partnering with TME Services, you will be joining a network of companies that value efficiency, compliance, and long-term success.
          </Text>
          
          {/* Logo Grid - 5 columns per row */}
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            justifyContent: 'space-between',
            marginTop: 8,
            gap: 4
          }}>
            {clientLogos.map((logo, index) => (
              <View 
                key={index} 
                style={{
                  width: '18%',
                  height: 30,
                  marginBottom: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff',
                  borderRadius: 4,
                  padding: 4
                }}
              >
                <Image
                  src={`/clients-logos/${logo}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Working Closely With UAE Government Entities Section */}
        <View style={{...styles.introSection, marginBottom: 8, marginTop: 16}}>
          <Text style={styles.sectionTitle}>Working Closely With UAE Government Entities</Text>
          <Text 
            style={styles.introText}
            hyphenationCallback={(word) => [word]}
          >
            We collaborate with the relevant government bodies to manage all essential processes - visas, licensing, compliance, and regulatory tasks, so your business stays fully aligned with UAE requirements.
          </Text>
          
          {/* Government Logo Grid - 4 columns x 2 rows */}
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            justifyContent: 'space-between',
            marginTop: 8,
            gap: 4
          }}>
            {governmentLogos.map((logo, index) => (
              <View 
                key={index} 
                style={{
                  width: '22%',
                  height: 30,
                  marginBottom: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff',
                  borderRadius: 4,
                  padding: 4
                }}
              >
                <Image
                  src={`/government-logos/${logo}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Partnered With Leading UAE Free Zones Section */}
        <View style={{...styles.introSection, marginBottom: 8, marginTop: 12}}>
          <Text style={styles.sectionTitle}>Partnered With Leading UAE Free Zones</Text>
          <Text 
            style={styles.introText}
            hyphenationCallback={(word) => [word]}
          >
            Our team works directly with the UAE's top free zones to streamline company formation, approvals, and renewals, ensuring a smooth and efficient experience from setup to operation.
          </Text>
          
          {/* Freezone Logo Grid - 4 columns x 2 rows */}
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            justifyContent: 'space-between',
            marginTop: 8,
            gap: 4
          }}>
            {freezoneLogos.map((logo, index) => (
              <View 
                key={index} 
                style={{
                  width: '22%',
                  height: 30,
                  marginBottom: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff',
                  borderRadius: 4,
                  padding: 4
                }}
              >
                <Image
                  src={`/freezone-logos/${logo}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              </View>
            ))}
          </View>
        </View>

        <CompanyServicesInfoSection data={data} />
      </View>

      <FooterComponent />
    </Page>
  );
}; 