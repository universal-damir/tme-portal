import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import type { PDFComponentProps } from '../../../types';
import type { AccountingServices } from '@/types/company-services';
import { AccountingPricingTable } from '../ui/AccountingPricingTable';
import { MONTHLY_PRICING } from '../utils/accountingPricingData';

// Helper function to format currency with comma separators
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US');
};

// Helper function to format secondary currency amount in brackets
const formatSecondaryCurrency = (amount: number, exchangeRate: number, currency: string): string => {
  const converted = Math.round(amount / exchangeRate);
  return `(~ ${currency} ${converted.toLocaleString()})`;
};



// AccountingServicesSection - Display accounting services information in PDF
export const AccountingServicesSection: React.FC<PDFComponentProps> = ({ data }) => {
  // Access company services data from transformed data
  const companyServicesData = (data as any).companyServicesData;
  const accountingServices = companyServicesData?.accountingServices as AccountingServices;
  const exchangeRate = data.clientDetails.exchangeRate;
  const secondaryCurrency = data.clientDetails.secondaryCurrency;

  // Don't render if accounting services are not enabled
  if (!accountingServices?.enabled) {
    return null;
  }

  // Check if we have any services to display
  const hasMainServices = accountingServices.transactionTier && accountingServices.serviceType;
  const hasAdditionalServices = accountingServices.vatBooking || accountingServices.costCenterBooking || accountingServices.monthlyGroupReporting;
  const hasCommercialServices = accountingServices.commercialServices || accountingServices.payrollServices || accountingServices.bankAccountOpening;

  // Don't render if no services are configured
  if (!hasMainServices && !hasAdditionalServices && !hasCommercialServices) {
    return null;
  }

  const { serviceType, transactionTier } = accountingServices;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Accounting Services</Text>
      
      {hasMainServices && (
        <>
          <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 8 }]}>
            Keeping your financial records accurate and compliant is essential for smooth business operations and compliance in the UAE. At TME Services, we provide {serviceType === 'monthly' ? 'monthly' : ''} financial accounting tailored to the volume of your transactions. Our services include preparing trial balances and P/L (Profit/Loss) statements, providing you with a clear overview of your business performance.
          </Text>

          <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 8 }]}>
            Our accounting service fees are based on the number of transactions. Based on your transaction volume, you can <Text style={{ textDecoration: 'underline' }}>choose from one</Text> of the following pricing tiers. These options are closely structured to offer flexibility and value as your business grows:
          </Text>

          {/* Monthly Services - Simple Bullet Points */}
          {serviceType === 'monthly' && transactionTier && (
            <View style={{ marginTop: 8, marginBottom: 8 }}>
              {(() => {
                                 // Get display tiers - always show 3 tiers, adjusting range if needed
                 const tiers = Object.keys(MONTHLY_PRICING).map(Number).sort((a, b) => a - b);
                 const currentIndex = tiers.findIndex(tier => tier === transactionTier);
                 let displayTiers: number[] = [];
                 if (currentIndex !== -1) {
                   let startIndex = currentIndex;
                   // If we're near the end, adjust start index to show 3 items
                   if (currentIndex + 3 > tiers.length) {
                     startIndex = Math.max(0, tiers.length - 3);
                   }
                   displayTiers = tiers.slice(startIndex, startIndex + 3);
                 }
                
                return displayTiers.map(tier => {
                  const price = MONTHLY_PRICING[tier as keyof typeof MONTHLY_PRICING];
                  return (
                    <Text key={tier} style={[styles.introText, { marginBottom: 6 }]}>
                      Up to {tier} transactions / month - <Text style={{ fontWeight: 'bold' }}>AED {formatCurrency(price)}</Text> <Text style={{ color: '#666666' }}>{formatSecondaryCurrency(price, exchangeRate, secondaryCurrency)}</Text>
                    </Text>
                  );
                });
              })()}
            </View>
          )}

          {/* Quarterly/Yearly Services - Complex Table */}
          {serviceType !== 'monthly' && serviceType && transactionTier && (
            <AccountingPricingTable
              data={data}
              serviceType={serviceType}
              transactionTier={transactionTier}
              exchangeRate={exchangeRate}
              secondaryCurrency={secondaryCurrency}
            />
          )}

          {/* Additional services as sentences */}
          {(accountingServices.vatBooking || accountingServices.costCenterBooking || accountingServices.monthlyGroupReporting) ? (
            <View style={{ marginTop: 8 }}>
              {accountingServices.vatBooking && (
                <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
                  For VAT booking, our fee is 20% of the monthly financial accounting fee.
                </Text>
              )}
              
              {accountingServices.costCenterBooking && (
                <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
                  For cost-center booking and reporting, our fee is 25% of the monthly financial accounting fee.
                </Text>
              )}
              
              {accountingServices.monthlyGroupReporting && (
                <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
                  For the preparation of monthly group reporting, our fee is AED 1,236 {formatSecondaryCurrency(1236, exchangeRate, secondaryCurrency)}.
                </Text>
              )}
              
              <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
                To ensure smooth processing, we recommend scanning and sending all relevant accounting documents, such as invoices, receipts, bank statements, and others, directly to us via Share Point.
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
              To ensure smooth processing, we recommend scanning and sending all relevant accounting documents, such as invoices, receipts, bank statements, and others, directly to us via Share Point.
              </Text>
            </View>
          )}
        </>
      )}

      {!hasMainServices && hasCommercialServices && (
        <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 8 }]}>
          At TME Services, we provide comprehensive commercial and payroll services to support your business operations in the UAE.
        </Text>
      )}

      {/* Annual Services Section - Only render for monthly services */}
      {serviceType === 'monthly' && (accountingServices.plStatementFee || accountingServices.auditReportFee || accountingServices.localAuditorFee) && (
        <View style={{ marginTop: 16 }}>
          <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 8, fontWeight: 'bold' }]}>
            Annual Accounting Services
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
                Audit Guiding:
              </Text>
              <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
                If an audit report is required by the authority or requested by shareholders, our servicefee for managing and guiding the audit process is AED {formatCurrency(accountingServices.auditReportFee)} {formatSecondaryCurrency(accountingServices.auditReportFee, exchangeRate, secondaryCurrency)}.
              </Text>
              <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 8 }]}>
              If the accounting is <Text style={{ fontWeight: 'bold' }}>not</Text> handled by us, <Text style={{ fontWeight: 'bold' }}>or</Text> if the audit is conducted by one of the Big Four firms, the audit guiding fee is AED 10,428 {formatSecondaryCurrency(10428, exchangeRate, secondaryCurrency)}.
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
      )}

    </View>
  );
}; 