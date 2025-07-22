import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { 
  HeaderComponent, 
  FooterComponent
} from '../../shared';
import type { PDFComponentProps } from '../../../types';

// Service data with PNG icon filenames from portfolio-icons folder
const services = [
  {
    icon: 'company-setup.png',
    title: 'Company Formation',
    description: 'Efficient company formation services tailored to your needs'
  },
  {
    icon: 'tax-consulting.png',
    title: 'Tax Consulting',
    description: 'Complete tax consulting and tax filing services'
  },
  {
    icon: 'accounting.png',
    title: 'Accounting & Payroll',
    description: 'Accounting & payroll for your company and employees'
  },
  {
    icon: 'visa.png',
    title: 'Visa & Emirates ID',
    description: 'We help you obtain your UAE Visa & Emirates ID'
  },
  {
    icon: 'compliance.png',
    title: 'Compliance',
    description: 'Expert assistance for regulatory\ncompliance in the UAE'
  },
  {
    icon: 'backoffice.png',
    title: 'Back-Office (PRO)',
    description: 'Back-Office solutions to optimize your\nbusiness processes'
  },
  {
    icon: 'restructuring.png',
    title: 'Restructuring',
    description: 'We support your plans to restructure your UAE business efficiently'
  },
  {
    icon: 'real-estate.png',
    title: 'Real Estate',
    description: 'We support your UAE real estate\npurchase or sale'
  },
  {
    icon: 'digital-marketing.png',
    title: 'Digital Marketing',
    description: 'Modern digital marketing solutions for your business'
  },
  {
    icon: 'IT.png',
    title: 'IT',
    description: 'Efficient IT solutions for your business needs'
  },
  {
    icon: 'cyber-security.png',
    title: 'Cyber Security',
    description: 'Protect your business with up-to-date technological solutions'
  },
  {
    icon: 'legal.png',
    title: 'Legal',
    description: 'Expert legal advice for your business'
  }
];

// ServicePortfolioPage - Overview of all TME Services offerings
// Following the established pattern from other service pages
export const ServicePortfolioPage: React.FC<PDFComponentProps> = ({ data }) => {
  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      {/* Main content area that will flex to fill available space */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Our Service Portfolio
          </Text>
          
          {/* Intro paragraph */}
          <Text style={[styles.introText, { marginBottom: 20 }]}>
            For your convenience, we have listed all the services we offer below. While not all may apply to your current setup, this overview can help you plan ahead as your business grows. If you would like to discuss any of these in more detail, feel free to get in touch, we are here to support you.
          </Text>
          
          {/* Services Grid - 3 columns */}
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            justifyContent: 'space-between',
            marginTop: 8
          }}>
            {services.map((service, index) => (
              <View 
                key={index} 
                style={{
                  width: '30%',
                  marginBottom: 20,
                  marginRight: 8,
                  padding: 12,
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  backgroundColor: '#fdfdfd'
                }}
              >
                {/* Service Icon */}
                <View style={{
                  width: 48,
                  height: 48,
                  marginBottom: 6,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Image
                    src={`/portfolio-icons/${service.icon}`}
                    style={{
                      width: 32,
                      height: 32,
                      objectFit: 'contain'
                    }}
                  />
                </View>
                
                {/* Service Title */}
                <Text style={{
                  fontSize: 9,
                  fontWeight: 'bold',
                  color: '#243F7B',
                  marginBottom: 2,
                  lineHeight: 1.3
                }}>
                  {service.title}
                </Text>
                
                {/* Service Description */}
                <Text style={{
                  fontSize: 8,
                  color: '#6b7280',
                  lineHeight: 1.4
                }}>
                  {service.description}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <FooterComponent />
    </Page>
  );
}; 