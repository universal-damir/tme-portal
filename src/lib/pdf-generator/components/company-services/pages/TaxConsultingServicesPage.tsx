import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
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
        <HeaderComponent data={data} showClientInfo={isFirstService} />

        {/* Main content area that will flex to fill available space */}
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <TaxConsultingServicesSection data={data} />

          {/* Add signature section if this is the last service page */}
          {isLastService && (
            <>
              {/* Spacer to push signature to bottom */}
              <View style={{ flex: 1 }} />
              
              {/* Fixed signature section at bottom */}
              <SignatureSection data={data} />
            </>
          )}
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
          <HeaderComponent data={data} showClientInfo={shouldShowClientInfoOnCIT} />

          {/* Main content area that will flex to fill available space */}
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <CITServicesSection data={data} />

            {/* Add Tax Consulting Support section if VAT is not rendered (CIT is the last tax service) */}
            {!shouldRenderVAT && (
              <TaxConsultingSupportSection data={data} />
            )}

            {/* Add signature section if this is the last service page and only CIT is rendered */}
            {shouldSignatureCIT && (
              <>
                {/* Spacer to push signature to bottom */}
                <View style={{ flex: 1 }} />
                
                {/* Fixed signature section at bottom */}
                <SignatureSection data={data} />
              </>
            )}
          </View>

          <FooterComponent />
        </Page>
      )}

      {/* VAT Services Page - Second page */}
      {shouldRenderVAT && (
        <Page size="A4" style={styles.page}>
          <HeaderComponent data={data} showClientInfo={shouldShowClientInfoOnVAT} />

          {/* Main content area that will flex to fill available space */}
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <VATServicesSection data={data} />

            {/* Add signature section if this is the last service page */}
            {shouldSignatureVAT && (
              <>
                {/* Spacer to push signature to bottom */}
                <View style={{ flex: 1 }} />
                
                {/* Fixed signature section at bottom */}
                <SignatureSection data={data} />
              </>
            )}
          </View>

          <FooterComponent />
        </Page>
      )}
    </>
  );
}; 