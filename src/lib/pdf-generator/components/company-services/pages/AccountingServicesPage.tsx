import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { formatDateDDMMYYYY } from '../../../utils';
import { 
  HeaderComponent, 
  FooterComponent
} from '../../shared';
import { 
  AccountingServicesSection,
  AnnualAccountingServicesSection
} from '../sections';
import type { PDFComponentProps } from '../../../types';

// Helper function to format secondary currency amount in brackets
const formatSecondaryCurrency = (amount: number, exchangeRate: number, currency: string): string => {
  const converted = Math.round(amount / exchangeRate);
  return `(~ ${currency} ${converted.toLocaleString()})`;
};

// AccountingServicesPage - Dedicated page for accounting services
// Following the established pattern from cost-overview pages
export const AccountingServicesPage: React.FC<PDFComponentProps> = ({ data }) => {
  // Access company services data from transformed data
  const companyServicesData = (data as any).companyServicesData;
  const accountingServices = companyServicesData?.accountingServices;
  const isLastService = (data as any).lastServiceName === 'accounting';
  const isFirstService = (data as any).firstServiceName === 'accounting';

  // Don't render if accounting services are not enabled
  if (!accountingServices?.enabled) {
    return null;
  }

  // Check if we need to render annual services on a separate page
  // For quarterly/yearly, we always show annual services on a separate page if they exist
  const shouldShowAnnualServicesPage = accountingServices.serviceType !== 'monthly' && 
    (accountingServices.plStatementFee || accountingServices.auditReportFee || accountingServices.localAuditorFee ||
     accountingServices.payrollServices || accountingServices.payrollServicesEnabled);

  return (
    <>
      {/* Main Accounting Services Page */}
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
          
          <AccountingServicesSection data={data} />

          {/* Additional Services Text - For monthly OR when quarterly/yearly is NOT first service */}
          {(accountingServices.serviceType === 'monthly' || (accountingServices.serviceType !== 'monthly' && !isFirstService)) && 
           (accountingServices.vatBooking || accountingServices.costCenterBooking || accountingServices.monthlyGroupReporting) && (
            <View style={{ marginTop: 20 }}>
              <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 12 }]}>
                {accountingServices.vatBooking && (
                  <>For VAT booking, our fee is 20% of the monthly financial accounting fee.{'\n'}</>
                )}
                {accountingServices.costCenterBooking && (
                  <>For cost-center booking and reporting, our fee is 25% of the monthly financial accounting fee.{'\n'}</>
                )}
                {accountingServices.monthlyGroupReporting && (
                  <>For the preparation of monthly group reporting, our fee is AED 1,236 {formatSecondaryCurrency(1236, data.clientDetails.exchangeRate, data.clientDetails.secondaryCurrency)}.{'\n'}</>
                )}
                To ensure smooth processing, we recommend scanning and sending all relevant accounting documents, such as invoices, receipts, bank statements, and others, directly to us via Share Point.
              </Text>
            </View>
          )}
        </View>

        <FooterComponent />
      </Page>

      {/* Annual Accounting Services Page - Only for quarterly/yearly services */}
      {shouldShowAnnualServicesPage && (
        <Page size="A4" style={styles.page}>
          <HeaderComponent data={data} showClientInfo={false} />

          {/* Main content area that will flex to fill available space */}
          <View style={{ flex: 1, flexDirection: 'column' }}>
            {/* Client Details Section - only if accounting is first service and we're on the annual page */}
            {isFirstService && (
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ width: '50%', paddingRight: 8 }}>
                  {/* Empty space to maintain layout consistency */}
                </View>
                <View style={{ width: '50%', paddingLeft: 8 }}>
                  {/* Empty space to maintain layout consistency */}
                </View>
              </View>
            )}
            
            {/* Additional Services Information - Only when accounting is first service */}
            {isFirstService && (accountingServices.vatBooking || accountingServices.costCenterBooking || accountingServices.monthlyGroupReporting) && (
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 12 }]}>
                  {accountingServices.vatBooking && (
                    <>For VAT booking, our fee is 20% of the monthly financial accounting fee.{'\n'}</>
                  )}
                  {accountingServices.costCenterBooking && (
                    <>For cost-center booking and reporting, our fee is 25% of the monthly financial accounting fee.{'\n'}</>
                  )}
                  {accountingServices.monthlyGroupReporting && (
                    <>For the preparation of monthly group reporting, our fee is AED 1,236 {formatSecondaryCurrency(1236, data.clientDetails.exchangeRate, data.clientDetails.secondaryCurrency)}.{'\n'}</>
                  )}
                  To ensure smooth processing, we recommend scanning and sending all relevant accounting documents, such as invoices, receipts, bank statements, and others, directly to us via Share Point.
                </Text>
              </View>
            )}
            
            <AnnualAccountingServicesSection data={data} />
          </View>

          <FooterComponent />
        </Page>
      )}
    </>
  );
}; 