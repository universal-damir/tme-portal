import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
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

  // Check if we have any commercial services to display
  const hasCommercialServices = accountingServices?.commercialServices && accountingServices.commercialServicesFee && accountingServices.commercialServicesFee > 0;
  const hasPayrollServices = (accountingServices?.payrollServices && accountingServices.payrollSetupFee && accountingServices.payrollSetupFee > 0) || 
                           (accountingServices?.payrollServicesEnabled && accountingServices.payrollServicesPerPersonFee && accountingServices.payrollServicesPerPersonFee > 0);
  const hasBankAccountServices = (accountingServices?.personalUAEBank && accountingServices.personalUAEBankFee && accountingServices.personalUAEBankFee > 0) ||
                               (accountingServices?.digitalBankWIO && accountingServices.digitalBankWIOFee && accountingServices.digitalBankWIOFee > 0) ||
                               (accountingServices?.traditionalUAEBank && accountingServices.traditionalUAEBankFee && accountingServices.traditionalUAEBankFee > 0);

  // Don't render if no services are enabled
  if (!hasCommercialServices && !hasPayrollServices && !hasBankAccountServices) {
    return null;
  }

  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      {/* Main content area that will flex to fill available space */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        {/* Commercial Services Section */}
        {hasCommercialServices && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Commercial Services</Text>
            
            <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 8 }]}>
              Additionally, we provide comprehensive handling of your company's financial tasks - such as reviewing and processing monthly payments for services like Etisalat, du, DEWA, and others, as well as managing salary disbursements via cheque or online banking. Designed to let management focus on key business areas, this service is already active across our client base and comes at a fixed monthly rate of AED {formatCurrency(accountingServices.commercialServicesFee!)} {formatSecondaryCurrency(accountingServices.commercialServicesFee!, exchangeRate, secondaryCurrency)}, or alternatively based on actual hours worked.
            </Text>
          </View>
        )}

        {/* Payroll Services Section */}
        {hasPayrollServices && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Payroll Services</Text>
            
            <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 8 }]}>
              Managing employee salaries accurately and on time is essential for maintaining trust and compliance within your organization. We offer reliable payroll services to ensure your staff are paid efficiently and in line with UAE labor regulations.
            </Text>
            
            {accountingServices.payrollServices && accountingServices.payrollSetupFee && accountingServices.payrollSetupFee > 0 && (
              <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
                For a one-time company payroll setup, our service fee is AED {formatCurrency(accountingServices.payrollSetupFee)} {formatSecondaryCurrency(accountingServices.payrollSetupFee, exchangeRate, secondaryCurrency)}.
              </Text>
            )}
            
            {accountingServices.payrollServicesEnabled && accountingServices.payrollServicesPerPersonFee && accountingServices.payrollServicesPerPersonFee > 0 && (
              <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
                Ongoing payroll management, including the preparation of monthly salary slips, is charged at AED {formatCurrency(accountingServices.payrollServicesPerPersonFee)} {formatSecondaryCurrency(accountingServices.payrollServicesPerPersonFee, exchangeRate, secondaryCurrency)} per employee per month.
              </Text>
            )}
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