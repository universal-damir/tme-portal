import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
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

// AnnualAccountingServicesSection - Separate component for annual services
export const AnnualAccountingServicesSection: React.FC<PDFComponentProps> = ({ data }) => {
  // Access company services data from transformed data
  const companyServicesData = (data as any).companyServicesData;
  const accountingServices = companyServicesData?.accountingServices as AccountingServices;
  const exchangeRate = data.clientDetails.exchangeRate;
  const secondaryCurrency = data.clientDetails.secondaryCurrency;

  // Don't render if accounting services are not enabled
  if (!accountingServices?.enabled) {
    return null;
  }

  // Check if we have any annual services to display
  const hasAnnualServices = accountingServices.plStatementFee || accountingServices.auditReportFee || accountingServices.localAuditorFee;

  // Don't render if no annual services are configured
  if (!hasAnnualServices) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Annual Accounting Services</Text>
      
      <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 16 }]}>
        In addition to our regular accounting services, we provide comprehensive annual accounting services to ensure your business meets all regulatory requirements and maintains accurate financial records for compliance and decision-making purposes.
      </Text>

      {accountingServices.plStatementFee && accountingServices.plStatementFee > 0 && (
        <>
          <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 4, fontWeight: 'bold' }]}>
            Year-End Financial Statement:
          </Text>
          <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 8 }]}>
            For the preparation of the annual financial statement (balance sheet and P/L (Profit/Loss)), our service fee is AED {formatCurrency(accountingServices.plStatementFee)} {formatSecondaryCurrency(accountingServices.plStatementFee, exchangeRate, secondaryCurrency)}.
          </Text>
        </>
      )}
      
      {accountingServices.auditReportFee && accountingServices.auditReportFee > 0 && (
        <>
          <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 4, fontWeight: 'bold' }]}>
            Audit Coordination:
          </Text>
          <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
            If an audit report is required by the authority or requested by shareholders, our fee for managing and coordinating the audit process is AED {formatCurrency(accountingServices.auditReportFee)} {formatSecondaryCurrency(accountingServices.auditReportFee, exchangeRate, secondaryCurrency)}.
          </Text>
          <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 8 }]}>
            If the accounting is not handled by us, or if the audit is conducted by one of the Big Four firms, the audit coordination fee is AED 10,428 {formatSecondaryCurrency(10428, exchangeRate, secondaryCurrency)}.
          </Text>
        </>
      )}
      
      {accountingServices.localAuditorFee && (
        <>
          <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 4, fontWeight: 'bold' }]}>
            External Auditor Fee:
          </Text>
          <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
            Based on our experience, the fee charged by an external local auditor typically ranges between AED 8,000 and AED 10,000. Upon request, we can recommend a trusted auditor we have worked with extensively - one who is familiar with our standards and procedures.
          </Text>
        </>
      )}
    </View>
  );
}; 