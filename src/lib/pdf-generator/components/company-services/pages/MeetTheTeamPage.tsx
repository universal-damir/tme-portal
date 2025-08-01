import React from 'react';
import { Page, View, Text, Image, Link } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { 
  HeaderComponent, 
  FooterComponent
} from '../../shared';
import type { PDFComponentProps } from '../../../types';

// Staff photo mapping for smaller file sizes
const staffPhotoMapping = {
  'UH': '09 UH.jpg',
  'MK': '33 MK.jpg',
  'DH': '13 DH.jpg',
  'NF': '22 NF.jpg',
  'TR': '96 TR.jpg',
  'RJ': '42 RJ.jpg',
  'DS': '19 DS.jpg',
  'HH': '14 HH.jpg',
  'OO': '102 OO.jpg',
  'YF': '58 YF.jpg',
  'TZ': '38 TZ.jpg',
  'DN': '70 DN.jpg',
};

// Team members data - arranged in 4x3 grid order: UH MK DH NF / TR RJ DS HH / OO YF TZ DN
const teamMembers = [
  {
    name: 'Uwe Hohmann',
    title: 'Commercial- & Tax Consultant',
    email: 'uwe@TME-Services.com',
    initials: 'UH',
  },
  {
    name: 'Malavika Kolera',
    title: 'Director - Tax & Compliance',
    email: 'malavika@TME-Services.com',
    initials: 'MK',
  },
  {
    name: 'Dijendra Hegde',
    title: 'Chief Financial Officer (CFO)',
    email: 'dijendra@TME-Services.com',
    initials: 'DH',
  },
  {
    name: 'Natali Fernando',
    title: 'Manager - Client Support',
    email: 'natali@TME-Services.com',
    initials: 'NF',
  },
  {
    name: 'Tina Reimann',
    title: 'Assistant - Business Development',
    email: 'tina@TME-Services.com',
    initials: 'TR',
  },
  {
    name: 'Reshma Joseph',
    title: 'Manager - VAT',
    email: 'reshma@TME-Services.com',
    initials: 'RJ',
  },
  {
    name: 'Dakshath Shetty',
    title: 'Manager - Accounting',
    email: 'dakshath@TME-Services.com',
    initials: 'DS',
  },
  {
    name: 'Hafees Hameed',
    title: 'Manager - IT Consulting',
    email: 'hafees@TME-Services.com',
    initials: 'HH',
  },
  {
    name: 'Onur Ozturk',
    title: 'Assistant - Business Development',
    email: 'onur@TME-Services.com',
    initials: 'OO',
  },
  {
    name: 'Yashika Fernandes',
    title: 'Executive - CIT',
    email: 'yashika@TME-Services.com',
    initials: 'YF',
  },
  {
    name: 'Tariq Zarif',
    title: 'Manager - Accounting',
    email: 'tariq@TME-Services.com',
    initials: 'TZ',
  },
  {
    name: 'Damir Novalic',
    title: 'Manager - Digital Marketing',
    email: 'damir@TME-Services.com',
    initials: 'DN',
  },
];

// MeetTheTeamPage - Page showcasing TME Services team members and contacts
// Following the established pattern from other service pages
export const MeetTheTeamPage: React.FC<PDFComponentProps> = ({ data }) => {
  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      {/* Main content area that will flex to fill available space */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Your contacts at TME Services
          </Text>
          
          {/* Intro paragraph */}
          <Text style={[styles.introText, { marginBottom: 16 }]}>
            Your dedicated contact at TME Services is here to support you with any questions or service coordination you may need. Please feel free to reach out directly for assistance tailored to your business.
          </Text>
          
          {/* Team Grid - 4 columns (4x3 layout) with 15% larger photos and text */}
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            justifyContent: 'space-between',
            marginTop: 8,
            marginBottom: 24
          }}>
            {teamMembers.map((member, index) => (
              <View 
                key={index} 
                style={{
                  width: '22%',
                  marginBottom: 16,
                  alignItems: 'center',
                  textAlign: 'center'
                }}
              >
                {/* Photo - 15% larger: 60 -> 69 */}
                <View style={{
                  width: 69,
                  height: 69,
                  borderRadius: 7,
                  overflow: 'hidden',
                  marginBottom: 6,
                  border: '1px solid #e5e7eb'
                }}>
                  <Image
                    src={`/staff-photos/${staffPhotoMapping[member.initials as keyof typeof staffPhotoMapping]}`}
                    style={{
                      width: 69,
                      height: 69,
                      objectFit: 'cover'
                    }}
                  />
                </View>
                
                {/* Name - 15% larger: 9 -> 10.35 */}
                <Text style={{
                  fontSize: 10.35,
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: 3,
                  textAlign: 'center'
                }}>
                  {member.name}
                </Text>
                
                {/* Title - 15% larger: 7 -> 8.05 */}
                <Text style={{
                  fontSize: 8.05,
                  color: '#6b7280',
                  marginBottom: 3,
                  textAlign: 'center',
                  lineHeight: 1.2
                }}>
                  {member.title}
                </Text>
                
                {/* Email - 15% larger: 7 -> 8.05 */}
                <Link 
                  src={`mailto:${member.email}`}
                  style={{
                    fontSize: 8.05,
                    color: '#0066cc',
                    textDecoration: 'underline',
                    textAlign: 'center'
                  }}
                >
                  {member.email}
                </Link>
              </View>
            ))}
          </View>

          {/* Committed to Excellence Section */}
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionTitle}>
              Committed to Excellence
            </Text>
            
            <Text style={[styles.introText, { marginBottom: 16 }]}>
              TME Services is an ISO 9001:2015 certified company and a proud partner of the ETL GLOBAL network, demonstrating our ongoing commitment to quality, reliability, and international standards.
            </Text>
            
            {/* Certification Images - Left aligned, 50% width container */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              gap: 20,
              marginTop: 6,
              width: '50%'
            }}>
              {/* ISO Certification - 15% smaller: 120x80 -> 102x68 */}
              <View style={{
                alignItems: 'center'
              }}>
                <Image
                  src="/iso.png"
                  style={{
                    width: 120,
                    height: 80,
                    objectFit: 'contain'
                  }}
                />
              </View>
              
              {/* ETL Global - 15% smaller: 120x80 -> 102x68 */}
              <View style={{
                alignItems: 'center'
              }}>
                <Image
                  src="/etl.png"
                  style={{
                    width: 102,
                    height: 68,
                    objectFit: 'contain'
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      <FooterComponent />
    </Page>
  );
}; 