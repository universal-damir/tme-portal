import React from 'react';
import { Page, View } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { 
  HeaderComponent, 
  FooterComponent,
  SignatureSection
} from '../../shared';
import { 
  AccountingServicesSection,
  AnnualAccountingServicesSection
} from '../sections';
import type { PDFComponentProps } from '../../../types';

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
  const shouldShowAnnualServicesPage = accountingServices.serviceType !== 'monthly' && 
    (accountingServices.plStatementFee || accountingServices.auditReportFee || accountingServices.localAuditorFee);

  return (
    <>
      {/* Main Accounting Services Page */}
      <Page size="A4" style={styles.page}>
        <HeaderComponent data={data} showClientInfo={isFirstService} />

        {/* Main content area that will flex to fill available space */}
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <AccountingServicesSection data={data} />

          {/* Add signature section if this is the last service page and no annual services page */}
          {isLastService && !shouldShowAnnualServicesPage && (
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

      {/* Annual Accounting Services Page - Only for quarterly/yearly services */}
      {shouldShowAnnualServicesPage && (
        <Page size="A4" style={styles.page}>
          <HeaderComponent data={data} />

          {/* Main content area that will flex to fill available space */}
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <AnnualAccountingServicesSection data={data} />

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
      )}
    </>
  );
}; 