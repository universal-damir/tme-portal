import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { formatDateDDMMYYYY } from '../../../utils';
import { 
  HeaderComponent, 
  FooterComponent,
  SignatureSection
} from '../../shared';
import { 
  TaxConsultingServicesSection,
  CITServicesSection,
  VATServicesSection
} from '../sections';
import type { TaxConsultingServices } from '@/types/company-services';
import type { PDFComponentProps } from '../../../types';

// Helper function to format secondary currency amount in brackets
const formatSecondaryCurrency = (amount: number, exchangeRate: number, currency: string): string => {
  const converted = Math.round(amount / exchangeRate);
  return `(~ ${currency} ${converted.toLocaleString()})`;
};

// Tax Consulting Support Section - Standalone component
const TaxConsultingSupportSection: React.FC<PDFComponentProps> = ({ data }) => {
  const exchangeRate = data.clientDetails.exchangeRate;
  const secondaryCurrency = data.clientDetails.secondaryCurrency;
  
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.sectionTitle}>Tax Consulting Support</Text>
      
      <Text style={styles.introText}>
        For consulting on VAT, CIT, UBO (Ultimate Beneficial Owner), or related topics, our fee is AED 1,450 {formatSecondaryCurrency(1450, exchangeRate, secondaryCurrency)} per hour.
        {'\n'}Email correspondence is billed at 5 minutes per email, based on the applicable hourly rate.
        {'\n'}For VAT or CIT profile amendments on the FTA portal, our fee is AED 158 {formatSecondaryCurrency(158, exchangeRate, secondaryCurrency)} per amendment per profile.
      </Text>
    </View>
  );
};

// TaxConsultingServicesPage - Dedicated page for tax consulting services
// Following the established pattern from cost-overview pages
export const TaxConsultingServicesPage: React.FC<PDFComponentProps> = ({ data }) => {
  // Access company services data from transformed data
  const companyServicesData = (data as any).companyServicesData;
  const taxServices = companyServicesData?.taxConsultingServices;
  const isLastService = (data as any).lastServiceName === 'taxConsulting';
  const isFirstService = (data as any).firstServiceName === 'taxConsulting';

  // Don't render if tax consulting services are not enabled
  if (!taxServices?.enabled) {
    return null;
  }

  // Determine if we should render separate pages for CIT and VAT
  const shouldUseSeparatePages = taxServices.clientManagedAccounting;

  // Check if CIT services should be rendered
  const shouldRenderCIT = (taxServices.citRegistration && taxServices.citRegistration > 0) || taxServices.citType;
  
  // Check if VAT services should be rendered
  const shouldRenderVAT = ((taxServices.vatRegistration && taxServices.vatRegistration > 0) || (taxServices.vatReturnFiling && taxServices.vatReturnFiling > 0)) || taxServices.clientManagedAccounting;

  if (!shouldUseSeparatePages) {
    // Render single page with combined content (original behavior)
    return (
      <Page size="A4" style={styles.page}>
        <HeaderComponent data={data} showClientInfo={false} />

        {/* Main content area that will flex to fill available space */}
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {/* Client Details Section - only on first service page */}
          {isFirstService && (
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <View style={{ width: '50%', paddingRight: 8 }}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Client Details</Text>
                  <View style={styles.contentArea}>
                    <View style={styles.row}>
                      <Text style={styles.label}>Client Name:</Text>
                      <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                        {`${data.clientDetails?.firstName || companyServicesData?.firstName || ''} ${data.clientDetails?.lastName || companyServicesData?.lastName || ''}`.trim() || 'Not provided'}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Company Name:</Text>
                      <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                        {data.clientDetails?.companyName || companyServicesData?.companyName || '-'}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Date:</Text>
                      <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                        {formatDateDDMMYYYY(data.clientDetails?.date || companyServicesData?.date)}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Exchange Rate:</Text>
                      <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                        {(data.clientDetails?.exchangeRate || companyServicesData?.exchangeRate || 3.67).toFixed(2)} AED = 1 {data.clientDetails?.secondaryCurrency || companyServicesData?.secondaryCurrency || 'EUR'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={{ width: '50%', paddingLeft: 8 }}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Signature</Text>
                  <View style={{ ...styles.contentArea, minHeight: 100, justifyContent: 'flex-start' }}>
                    <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                      Agreed to service charges listed below.{'\n'}They will apply when the individual service is performed.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          
          <TaxConsultingServicesSection data={data} />

        </View>

        <FooterComponent />
      </Page>
    );
  }

  // Render separate pages for CIT and VAT when clientManagedAccounting is true
  // Determine which page should have the signature (always the last page rendered)
  const shouldSignatureCIT = isLastService && shouldRenderCIT && !shouldRenderVAT;
  const shouldSignatureVAT = isLastService && shouldRenderVAT;
  
  // Client info should only show on the very first page rendered
  // If CIT is rendered, it gets client info. If only VAT is rendered, VAT gets it.
  const shouldShowClientInfoOnCIT = isFirstService && shouldRenderCIT;
  const shouldShowClientInfoOnVAT = isFirstService && shouldRenderVAT && !shouldRenderCIT;

  return (
    <>
      {/* CIT Services Page - First page */}
      {shouldRenderCIT && (
        <Page size="A4" style={styles.page}>
          <HeaderComponent data={data} showClientInfo={false} />

          {/* Main content area that will flex to fill available space */}
          <View style={{ flex: 1, flexDirection: 'column' }}>
            {/* Client Details Section - only on first service page */}
            {shouldShowClientInfoOnCIT && (
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ width: '50%', paddingRight: 8 }}>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Client Details</Text>
                    <View style={styles.contentArea}>
                      <View style={styles.row}>
                        <Text style={styles.label}>Client Name:</Text>
                        <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                          {`${data.clientDetails?.firstName || companyServicesData?.firstName || ''} ${data.clientDetails?.lastName || companyServicesData?.lastName || ''}`.trim() || 'Not provided'}
                        </Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>Company Name:</Text>
                        <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                          {data.clientDetails?.companyName || companyServicesData?.companyName || '-'}
                        </Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>Date:</Text>
                        <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                          {formatDateDDMMYYYY(data.clientDetails?.date || companyServicesData?.date)}
                        </Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>Exchange Rate:</Text>
                        <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                          {(data.clientDetails?.exchangeRate || companyServicesData?.exchangeRate || 3.67).toFixed(2)} AED = 1 {data.clientDetails?.secondaryCurrency || companyServicesData?.secondaryCurrency || 'EUR'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={{ width: '50%', paddingLeft: 8 }}>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Signature</Text>
                    <View style={{ ...styles.contentArea, minHeight: 100, justifyContent: 'flex-start' }}>
                      <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                        Agreed to service charges listed below.{'\n'}They will apply when the individual service is performed.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
            
            <CITServicesSection data={data} />

            {/* Add Tax Consulting Support section if VAT is not rendered (CIT is the last tax service) */}
            {!shouldRenderVAT && (
              <TaxConsultingSupportSection data={data} />
            )}

          </View>

          <FooterComponent />
        </Page>
      )}

      {/* VAT Services Page - Second page */}
      {shouldRenderVAT && (
        <Page size="A4" style={styles.page}>
          <HeaderComponent data={data} showClientInfo={false} />

          {/* Main content area that will flex to fill available space */}
          <View style={{ flex: 1, flexDirection: 'column' }}>
            {/* Client Details Section - only on first service page */}
            {shouldShowClientInfoOnVAT && (
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ width: '50%', paddingRight: 8 }}>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Client Details</Text>
                    <View style={styles.contentArea}>
                      <View style={styles.row}>
                        <Text style={styles.label}>Client Name:</Text>
                        <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                          {`${data.clientDetails?.firstName || companyServicesData?.firstName || ''} ${data.clientDetails?.lastName || companyServicesData?.lastName || ''}`.trim() || 'Not provided'}
                        </Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>Company Name:</Text>
                        <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                          {data.clientDetails?.companyName || companyServicesData?.companyName || '-'}
                        </Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>Date:</Text>
                        <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                          {formatDateDDMMYYYY(data.clientDetails?.date || companyServicesData?.date)}
                        </Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>Exchange Rate:</Text>
                        <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                          {(data.clientDetails?.exchangeRate || companyServicesData?.exchangeRate || 3.67).toFixed(2)} AED = 1 {data.clientDetails?.secondaryCurrency || companyServicesData?.secondaryCurrency || 'EUR'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={{ width: '50%', paddingLeft: 8 }}>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Signature</Text>
                    <View style={{ ...styles.contentArea, minHeight: 100, justifyContent: 'flex-start' }}>
                      <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#1f2937' }}>
                        Agreed to service charges listed below.{'\n'}They will apply when the individual service is performed.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
            
            <VATServicesSection data={data} />

          </View>

          <FooterComponent />
        </Page>
      )}
    </>
  );
}; 