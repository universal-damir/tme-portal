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

// CITServicesSection - Display CIT (Corporate Income Tax) services information in PDF
export const CITServicesSection: React.FC<PDFComponentProps> = ({ data }) => {
  // Access company services data from transformed data
  const companyServicesData = (data as any).companyServicesData;
  const taxServices = companyServicesData?.taxConsultingServices as TaxConsultingServices;
  const exchangeRate = data.clientDetails.exchangeRate;
  const secondaryCurrency = data.clientDetails.secondaryCurrency;

  // Don't render if CIT services are not applicable
  if (!((taxServices.citRegistration && taxServices.citRegistration > 0) || taxServices.citType)) {
    return null;
  }

  return (
    <View style={styles.section}>
      {/* Corporate Income Tax Section */}
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>CIT (Corporate Income Tax)</Text>
        
        {/* Only show compliance text if citRegistrationEnabled is true */}
        {taxServices.citRegistrationEnabled && (
          <Text style={[styles.introText, { marginBottom: 8 }]}>
            To comply with UAE requirements, <Text style={{ fontWeight: 'bold', textDecoration: 'underline' }}>ALL</Text> companies <Text style={{ fontWeight: 'bold', textDecoration: 'underline' }}>MUST</Text> create an EmaraTax account and complete CIT registration with the FTA (Federal Tax Authority) to obtain a 15-digit CIT TRN (Tax Registration Number).
          </Text>
        )}
        
        {taxServices.citRegistration && taxServices.citRegistration > 0 && (
          <Text style={[styles.introText, { marginBottom: 8 }]}>
            Our service fee for the CIT registration process is AED {formatCurrency(taxServices.citRegistration)} {formatSecondaryCurrency(taxServices.citRegistration, exchangeRate, secondaryCurrency)}.
          </Text>
        )}
        
        <Text style={[styles.introText, { marginBottom: 8 }]}>
        Under UAE CIT regulations, a 0% tax rate applies to taxable income up to AED 375,000, while income exceeding AED 375,000 is taxed at 9%.
        </Text>
        
        {taxServices.citType && (
          <>
            <Text style={[styles.introText, { marginBottom: 8 }]}>
              <Text style={{ fontWeight: 'bold', textDecoration: 'underline' }}>ALL</Text> UAE-registered companies <Text style={{ fontWeight: 'bold', textDecoration: 'underline' }}>MUST</Text> file their CIT return annually, based on their financial year.
            </Text>
            
            {/* Conditional text based on CIT type */}
            {taxServices.citType === 'sbr-regular' && (
              <Text style={[styles.introText, { marginBottom: 8 }]}>
                Our service fee for the yearly CIT return filing is AED 2,599 {formatSecondaryCurrency(2599, exchangeRate, secondaryCurrency)} if Small Business Relief applies, or AED 5,198 {formatSecondaryCurrency(5198, exchangeRate, secondaryCurrency)} if standard rules apply (revenue exceeds AED 3,000,000).
              </Text>
            )}
            
            {taxServices.citType === 'qfzp' && (
              <Text style={[styles.introText, { marginBottom: 8 }]}>
                Our service fee for the yearly CIT return filing for QFZP (Qualifying Free Zone Person) is AED 10,396 {formatSecondaryCurrency(10396, exchangeRate, secondaryCurrency)}.
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
};