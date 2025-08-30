import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { formatDateDDMMYYYY } from '../../../utils';
import { 
  HeaderComponent, 
  FooterComponent
} from '../../shared';
import type { PDFComponentProps } from '../../../types';
import type { AccountingServices } from '@/types/company-services';

// Helper function to format currency with comma separators
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US');
};

// Helper function to format secondary currency amount in brackets
const formatSecondaryCurrency = (amount: number, exchangeRate: number, currency: string): string => {
  const converted = Math.round(amount / exchangeRate);
  return `(~ ${currency} ${converted.toLocaleString()})`;
};

// CommercialServicesPage - Dedicated page for commercial services
// Following the established pattern from other service pages
export const CommercialServicesPage: React.FC<PDFComponentProps> = ({ data }) => {
  // Access company services data from transformed data
  const companyServicesData = (data as any).companyServicesData;
  const accountingServices = companyServicesData?.accountingServices as AccountingServices;
  const exchangeRate = data.clientDetails.exchangeRate;
  const secondaryCurrency = data.clientDetails.secondaryCurrency;
  const isLastService = (data as any).lastServiceName === 'commercial';
  const isFirstService = (data as any).firstServiceName === 'commercial';

  // Check if we have any commercial services to display
  const hasCommercialServices = accountingServices?.commercialServices && accountingServices.commercialServicesFee && accountingServices.commercialServicesFee > 0;
  const hasBankAccountServices = (accountingServices?.personalUAEBank && accountingServices.personalUAEBankFee && accountingServices.personalUAEBankFee > 0) ||
                               (accountingServices?.digitalBankWIO && accountingServices.digitalBankWIOFee && accountingServices.digitalBankWIOFee > 0) ||
                               (accountingServices?.traditionalUAEBank && accountingServices.traditionalUAEBankFee && accountingServices.traditionalUAEBankFee > 0);

  // Don't render if no services are enabled
  if (!hasCommercialServices && !hasBankAccountServices) {
    return null;
  }

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
                    <Text style={styles.value}>
                      {`${data.clientDetails?.firstName || companyServicesData?.firstName || ''} ${data.clientDetails?.lastName || companyServicesData?.lastName || ''}`.trim() || 'Not provided'}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Company Name:</Text>
                    <Text style={styles.value}>
                      {data.clientDetails?.companyName || companyServicesData?.companyName || '-'}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Date:</Text>
                    <Text style={styles.value}>
                      {formatDateDDMMYYYY(data.clientDetails?.date || companyServicesData?.date)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Exchange Rate:</Text>
                    <Text style={styles.value}>
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
        
        {/* Commercial Services Section */}
        {hasCommercialServices && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Commercial Services</Text>
            
            <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 8 }]}>
              Additionally, we provide comprehensive handling of your company's financial tasks - such as reviewing and processing monthly payments for services like Etisalat, du, DEWA, and others, as well as managing salary disbursements via cheque or online banking. Designed to let management focus on key business areas, this service is already active across our client base and comes at a fixed monthly rate of AED {formatCurrency(accountingServices.commercialServicesFee!)} {formatSecondaryCurrency(accountingServices.commercialServicesFee!, exchangeRate, secondaryCurrency)}, or alternatively based on actual hours worked.
            </Text>
          </View>
        )}

{/* Bank Account Setup Services Section */}
        {hasBankAccountServices && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Bank Account Setup Services</Text>
            
            <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
              Opening a UAE bank account is a key step in setting up and operating your business effectively. At TME Services, we assist with the full application process - ensuring all documentation is in order and guiding you through each step to improve the chances of a successful outcome.
            </Text>
            
            <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
              Our one-time service fees are as follows:
            </Text>
            
            <View style={{ marginLeft: 16, marginBottom: 6 }}>
              {/* Personal UAE Bank Account */}
              {accountingServices.personalUAEBank && accountingServices.personalUAEBankFee && accountingServices.personalUAEBankFee > 0 && (
                <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 4 }]}>
                  • Personal bank account with a UAE bank - AED {formatCurrency(accountingServices.personalUAEBankFee)} {formatSecondaryCurrency(accountingServices.personalUAEBankFee, exchangeRate, secondaryCurrency)}
                </Text>
              )}
              
              {/* Digital Bank WIO Account */}
              {accountingServices.digitalBankWIO && accountingServices.digitalBankWIOFee && accountingServices.digitalBankWIOFee > 0 && (
                <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 4 }]}>
                  • Company account with the UAE digital WIO bank or similar - AED {formatCurrency(accountingServices.digitalBankWIOFee)} {formatSecondaryCurrency(accountingServices.digitalBankWIOFee, exchangeRate, secondaryCurrency)}
                </Text>
              )}
              
              {/* Traditional UAE Bank Account */}
              {accountingServices.traditionalUAEBank && accountingServices.traditionalUAEBankFee && accountingServices.traditionalUAEBankFee > 0 && (
                <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 4 }]}>
                  • Company account with a traditional UAE bank - AED {formatCurrency(accountingServices.traditionalUAEBankFee)} {formatSecondaryCurrency(accountingServices.traditionalUAEBankFee, exchangeRate, secondaryCurrency)}
                </Text>
              )}
            </View>
          </View>
        )}

      </View>

      <FooterComponent />
    </Page>
  );
}; 