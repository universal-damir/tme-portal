import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import type { PDFComponentProps } from '../../../types';

// ComplianceServices type (define inline for consistency)
interface ComplianceServices {
  enabled?: boolean;
  periodicBankReviewType?: 'basic' | 'standard' | 'complex' | '';
  periodicBankReviewFee?: number;
  uboRegisterUpdatesType?: 'basic' | 'standard' | 'complex' | '';
  uboRegisterUpdatesFee?: number;
}

// ComplianceServicesSection - Display compliance services information in PDF
export const ComplianceServicesSection: React.FC<PDFComponentProps> = ({ data }) => {
  // Access company services data from transformed data
  const companyServicesData = (data as any).companyServicesData;
  const complianceServices = companyServicesData?.complianceServices as ComplianceServices;
  const exchangeRate = data.clientDetails.exchangeRate;
  const secondaryCurrency = data.clientDetails.secondaryCurrency;

  // Don't render if compliance services are not enabled
  if (!complianceServices?.enabled) {
    return null;
  }

  // Check if we have any services to display
  const hasPeriodicBankReview = complianceServices.periodicBankReviewType && complianceServices.periodicBankReviewFee;
  const hasUboRegisterUpdates = complianceServices.uboRegisterUpdatesType && complianceServices.uboRegisterUpdatesFee;

  // Don't render if no services are configured
  if (!hasPeriodicBankReview && !hasUboRegisterUpdates) {
    return null;
  }

  // Format currency values
  const formatCurrency = (aedValue: number | undefined) => {
    if (!aedValue) return { aed: '0', secondary: '0' };
    const secondaryValue = Math.round(aedValue / exchangeRate);
    return {
      aed: aedValue.toLocaleString(),
      secondary: secondaryValue.toLocaleString(),
    };
  };

  // Use currency code instead of symbol
  const secondaryCurrencyCode = secondaryCurrency; // EUR, USD, GBP

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Compliance Services</Text>
      
      {/* Main intro text */}
      <Text style={styles.introText}>
        Staying compliant with regulatory and banking requirements is essential to maintaining uninterrupted operations in the UAE.
      </Text>
      <Text style={styles.introText}>
        At TME Services, we offer support to ensure your company meets ongoing compliance obligations with banks and government authorities.
      </Text>

      {/* Periodic Bank Review Section */}
      {hasPeriodicBankReview && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.introText, { fontWeight: 'bold', marginBottom: 6 }]}>
            Periodic Bank Review
          </Text>
          <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
            Banks in the UAE periodically conduct compliance KYC (Know Your Client) reviews to verify the legitimacy and structure of client accounts. We assist by preparing, reviewing, and submitting all required legal documents and information to the bank's Relationship Manager or the Compliance Department.
          </Text>
          <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
            We also coordinate with your local company and/or parent company in case of missing documentation, and keep you informed throughout the process until the KYC review is closed.
          </Text>
          <Text style={[styles.introText, { marginBottom: 6 }]}>
            Service fee: AED {formatCurrency(complianceServices.periodicBankReviewFee).aed} (~ {secondaryCurrencyCode} {formatCurrency(complianceServices.periodicBankReviewFee).secondary})
          </Text>
        </View>
      )}

      {/* UBO, Shareholder, and Company Register Updates Section */}
      {hasUboRegisterUpdates && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.introText, { fontWeight: 'bold', marginBottom: 6 }]}>
            UBO, Shareholder, and Company Register Updates
          </Text>
          <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
            Changes to your company's Ultimate Beneficial Owner (UBO), shareholder structure, or other corporate registers must be properly reported to the relevant authorities.
          </Text>
          <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 6 }]}>
            We handle the full process, including assessment, preparation of the reporting form, and submission.
          </Text>
          <Text style={[styles.introText, { marginBottom: 6 }]}>
            Service fee: AED {formatCurrency(complianceServices.uboRegisterUpdatesFee).aed} (~ {secondaryCurrencyCode} {formatCurrency(complianceServices.uboRegisterUpdatesFee).secondary})
          </Text>
        </View>
      )}

      {/* Closing text */}
      <Text style={[styles.introText, { marginTop: 12, fontStyle: 'italic' }]}>
        These services help safeguard your business from compliance-related disruptions and ensure you remain aligned with current UAE regulations.
      </Text>
    </View>
  );
}; 