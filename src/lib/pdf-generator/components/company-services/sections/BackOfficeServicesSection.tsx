import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import type { PDFComponentProps, CostItem } from '../../../types';
import { BackOfficeServices } from '@/types/company-services';

// Team size configurations with pricing tiers (same as in the React component)
const TEAM_CONFIGURATIONS = {
  micro: {
    label: 'Micro Team',
    tiers: [
      { staffRange: '1–2 staff', monthlyFee: 500 },
      { staffRange: '3–4 staff', monthlyFee: 960 },
      { staffRange: '5–6 staff', monthlyFee: 1374 },
    ]
  },
  small: {
    label: 'Small Team',
    tiers: [
      { staffRange: '1–3 staff', monthlyFee: 750 },
      { staffRange: '4–6 staff', monthlyFee: 1440 },
      { staffRange: '7–10 staff', monthlyFee: 2280 },
    ]
  },
  medium: {
    label: 'Medium Team',
    tiers: [
      { staffRange: '1–4 staff', monthlyFee: 980 },
      { staffRange: '5–6 staff', monthlyFee: 1440 },
      { staffRange: '7–8 staff', monthlyFee: 1860 },
    ]
  },
  large: {
    label: 'Large Team',
    tiers: [
      { staffRange: '1–5 staff', monthlyFee: 1250 },
      { staffRange: '6–10 staff', monthlyFee: 2400 },
      { staffRange: '11–15 staff', monthlyFee: 3412 },
      { staffRange: '16–20 staff', monthlyFee: 4273 },
    ]
  },
};

// BackOfficeServicesSection - Display back-office services information in PDF
export const BackOfficeServicesSection: React.FC<PDFComponentProps> = ({ data }) => {
  // Access company services data from transformed data
  const companyServicesData = (data as any).companyServicesData;
  const backOfficeServices = companyServicesData?.backOfficeServices as BackOfficeServices;
  const exchangeRate = data.clientDetails.exchangeRate;
  const secondaryCurrency = data.clientDetails.secondaryCurrency;

  // Don't render if back-office services are not enabled
  if (!backOfficeServices?.enabled || !backOfficeServices.teamSize) {
    return null;
  }

  // Get team configuration
  const teamConfig = TEAM_CONFIGURATIONS[backOfficeServices.teamSize as keyof typeof TEAM_CONFIGURATIONS];
  
  if (!teamConfig) {
    return null;
  }

  // Generate authority description based on company type
  const getAuthorityDescription = () => {
    return companyServicesData?.companyType === 'tme-fzco' 
      ? 'Freezone Authority'
      : 'General Directorate of Residency and Foreign Affairs (GDRFA), Ministry of Human Resources and Emiratization (MoHRE), and Department of Economy and Tourism (DET)';
  };

  // Generate table data for pricing as CostItem[]
  const costItems: CostItem[] = teamConfig.tiers.map(tier => {
    const secondaryAmount = Math.round(tier.monthlyFee / exchangeRate);
    return {
      description: tier.staffRange,
      amount: tier.monthlyFee,
      secondaryAmount: secondaryAmount,
    };
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Back-Office (PRO) Services</Text>
      
      {/* Service Description */}
      <Text style={styles.introText}>
        Managing government-related processes in the UAE can be time-consuming and complex. 
        As an additional service, TME Services offers comprehensive Back-Office (PRO) support, 
        handling all administrative tasks with {getAuthorityDescription()}.
      </Text>
      
      <Text style={styles.introText}>
        These services cover activities like trade license renewal, visa applications and renewals, 
        labor contracts, and more. By outsourcing these tasks to us, the management team can stay 
        focused on core business operations such as sales and growth.
      </Text>
      
      <Text style={styles.introText}>
        We offer scalable monthly plans based on your team size, allowing you to grow with us as your 
        business expands.
      </Text>

      {/* Pricing Table */}
      <View style={{ marginTop: 12 }}>
        <Text style={[styles.value, { fontWeight: 'bold', marginBottom: 6 }]}>
          Monthly Pricing
        </Text>
        
        <View style={styles.costTable}>
          {/* Table Header */}
          <View style={[styles.tableHeaderBlue, { marginBottom: 4, backgroundColor: '#243F7B' }]}>
            <Text style={styles.tableHeaderDescription}>Team Size</Text>
            <Text style={styles.tableHeaderCurrency}>AED (Monthly)</Text>
            <Text style={styles.tableHeaderCurrency}>{secondaryCurrency} (Monthly)</Text>
          </View>

          {/* Table Rows */}
          {costItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCellDescription}>{item.description}</Text>
              <Text style={styles.tableCellAmount}>{item.amount.toLocaleString()}</Text>
              <Text style={styles.tableCellAmount}>{item.secondaryAmount.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Note */}
      <Text style={[styles.introText, { marginTop: 12, fontStyle: 'italic' }]}>
        Note: All pricing is based on monthly fees with a 12-month minimum commitment requirement.
      </Text>
    </View>
  );
}; 