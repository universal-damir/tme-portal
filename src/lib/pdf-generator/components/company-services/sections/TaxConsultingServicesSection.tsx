import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import type { PDFComponentProps } from '../../../types';
import type { TaxConsultingServices } from '@/types/company-services';

// Helper function to format currency with comma separators
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US');
};

// Helper function to format secondary currency amount in brackets
const formatSecondaryCurrency = (amount: number, exchangeRate: number, currency: string): string => {
  const converted = Math.round(amount / exchangeRate);
  return `(~ ${currency} ${converted.toLocaleString()})`;
};

// TaxConsultingServicesSection - Display tax consulting services information in PDF
export const TaxConsultingServicesSection: React.FC<PDFComponentProps> = ({ data }) => {
  // Access company services data from transformed data
  const companyServicesData = (data as any).companyServicesData;
  const taxServices = companyServicesData?.taxConsultingServices as TaxConsultingServices;
  const exchangeRate = data.clientDetails.exchangeRate;
  const secondaryCurrency = data.clientDetails.secondaryCurrency;

  // Don't render if tax consulting services are not enabled
  if (!taxServices?.enabled) {
    return null;
  }

  return (
    <View style={styles.section}>
      {/* Corporate Income Tax Section */}
      {((taxServices.citRegistration && taxServices.citRegistration > 0) || taxServices.citType) && (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>CIT (Corporate Income Tax)</Text>
          
          <Text style={[styles.introText, { marginBottom: 8 }]}>
            To comply with UAE requirements, all companies must create an EmaraTax account and complete CIT registration with the FTA (Federal Tax Authority) to obtain a 15-digit CIT TRN (Tax Registration Number).
          </Text>
          
          {taxServices.citRegistration && taxServices.citRegistration > 0 && (
            <Text style={[styles.introText, { marginBottom: 8 }]}>
              Our service fee for this process is AED {formatCurrency(taxServices.citRegistration)} {formatSecondaryCurrency(taxServices.citRegistration, exchangeRate, secondaryCurrency)}.
            </Text>
          )}
          
          <Text style={[styles.introText, { marginBottom: 8 }]}>
          Under UAE CIT regulations, a 0% tax rate applies to taxable income up to AED 375,000, while income exceeding AED 375,000 is taxed at 9%.
          </Text>
          
          {taxServices.citType && (
            <>
              <Text style={[styles.introText, { marginBottom: 8 }]}>
                All UAE-registered companies must file their CIT return annually, based on their financial year.
              </Text>
              
              {/* Conditional text based on CIT type */}
              {taxServices.citType === 'sbr-regular' && (
                <Text style={[styles.introText, { marginBottom: 8 }]}>
                  Our fee for the yearly CIT return filing is AED 2,599 {formatSecondaryCurrency(2599, exchangeRate, secondaryCurrency)} if Small Business Relief applies, or AED 5,198 {formatSecondaryCurrency(5198, exchangeRate, secondaryCurrency)} if revenue exceeds AED 3,000,000.
                </Text>
              )}
              
              {taxServices.citType === 'qfzp' && (
                <Text style={[styles.introText, { marginBottom: 8 }]}>
                  Our fee for the yearly CIT return filing for QFZP (Qualifying Free Zone Person) is AED 10,396 {formatSecondaryCurrency(10396, exchangeRate, secondaryCurrency)}.
                </Text>
              )}
            </>
          )}
        </View>
      )}

      {/* Value Added Tax Section */}
      {((taxServices.vatRegistration && taxServices.vatRegistration > 0) || (taxServices.vatReturnFiling && taxServices.vatReturnFiling > 0)) && (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>VAT (Value Added Tax)</Text>
          
          {taxServices.vatRegistration && taxServices.vatRegistration > 0 && (
            <Text style={[styles.introText, { marginBottom: 8 }]}>
              For VAT {taxServices.vatType === 'registration' ? 'registration' : 
                       taxServices.vatType === 'exception' ? 'exemption' : 'de-registration'} with the FTA to obtain a 15-digit VAT TRN (Tax Registration Number), or VAT TIN (Tax Identification Number), our service fee is AED {formatCurrency(taxServices.vatRegistration)} {formatSecondaryCurrency(taxServices.vatRegistration, exchangeRate, secondaryCurrency)}.
            </Text>
          )}
          
          <Text style={[styles.introText, { marginBottom: 8 }]}>
          The UAE VAT regulations apply two tax rates - 0% or 5% depending on the nature of the business activity. Businesses with taxable revenue exceeding AED 375,000 MUST register for VAT, while those earning more than AED 187,500 can register voluntarily.
          </Text>
          
          
          {taxServices.vatReturnFiling && taxServices.vatReturnFiling > 0 && (
            <Text style={styles.introText}>
              If TME Services handles the accounting:
              {'\n'}• Our fee for quarterly VAT return filing is AED {formatCurrency(taxServices.vatReturnFiling)} {formatSecondaryCurrency(taxServices.vatReturnFiling, exchangeRate, secondaryCurrency)} per return
              {'\n'}• For nil VAT return filing, our fee is AED 562 {formatSecondaryCurrency(562, exchangeRate, secondaryCurrency)} per return
            </Text>
          )}
        </View>
      )}

      {/* Client-Managed Accounting Section */}
      {taxServices.clientManagedAccounting && (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>VAT Return Filing – Client-Managed Accounting</Text>
          
          <Text style={[styles.introText, { marginBottom: 8 }]}>
            If the client handles the accounting (not TME Services), our service includes the review of VAT input/output, revenue, and reverse charge mechanism ledgers, as well as the filing of the VAT return in line with the relevant tax period.
          </Text>
          
          <Text style={[styles.introText, { marginBottom: 8 }]}>
            Our service fee is based on when we receive all necessary accounting records and documentation:
          </Text>
          
          <Text style={[styles.introText, { marginBottom: 8, fontWeight: 'bold' }]}>
            Quarterly VAT Return Filing
          </Text>
          
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text style={[styles.introText, { marginBottom: 4 }]}>
              • Documents received by the 10<Text style={{ fontSize: 8, verticalAlign: 'super' }}>th</Text> of the following month: AED 5,899 {formatSecondaryCurrency(5899, exchangeRate, secondaryCurrency)}
            </Text>
            <Text style={[styles.introText, { marginBottom: 4 }]}>
              • Documents received by the 17<Text style={{ fontSize: 8, verticalAlign: 'super' }}>th</Text> of the following month: AED 6,489 {formatSecondaryCurrency(6489, exchangeRate, secondaryCurrency)}
            </Text>
            <Text style={[styles.introText, { marginBottom: 4 }]}>
              • Documents received by the 24<Text style={{ fontSize: 8, verticalAlign: 'super' }}>th</Text> of the following month: AED 7,079 {formatSecondaryCurrency(7079, exchangeRate, secondaryCurrency)}
            </Text>
          </View>
          
          <Text style={[styles.introText, { marginBottom: 8, fontWeight: 'bold' }]}>
            Monthly VAT Return Filing
          </Text>
          
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text style={[styles.introText, { marginBottom: 4 }]}>
              • Documents received by the 10<Text style={{ fontSize: 8, verticalAlign: 'super' }}>th</Text> of the following month: AED 2,950 {formatSecondaryCurrency(2950, exchangeRate, secondaryCurrency)}
            </Text>
            <Text style={[styles.introText, { marginBottom: 4 }]}>
              • Documents received by the 17<Text style={{ fontSize: 8, verticalAlign: 'super' }}>th</Text> of the following month: AED 3,245 {formatSecondaryCurrency(3245, exchangeRate, secondaryCurrency)}
            </Text>
            <Text style={[styles.introText, { marginBottom: 4 }]}>
              • Documents received by the 24<Text style={{ fontSize: 8, verticalAlign: 'super' }}>th</Text> of the following month: AED 3,540 {formatSecondaryCurrency(3540, exchangeRate, secondaryCurrency)}
            </Text>
          </View>
        </View>
      )}

      {/* Consulting & Tax Compliance Support Section */}
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>Tax Consulting Support</Text>
        
        <Text style={styles.introText}>
          For clarifying VAT refund matters in response to FTA inquiries, our service fee is AED 664 {formatSecondaryCurrency(664, exchangeRate, secondaryCurrency)} per hour.
          {'\n'}For consulting on VAT, CIT, UBO (Ultimate Beneficial Ownership), or related topics, our fee is AED 1,450 {formatSecondaryCurrency(1450, exchangeRate, secondaryCurrency)} per hour.
          {'\n'}Email correspondence is billed at 5 minutes per email, based on the applicable hourly rate.
          {'\n'}For VAT or CIT profile amendments on the FTA portal, our fee is AED 158 {formatSecondaryCurrency(158, exchangeRate, secondaryCurrency)} per amendment per profile.
        </Text>
      </View>


    </View>
  );
}; 