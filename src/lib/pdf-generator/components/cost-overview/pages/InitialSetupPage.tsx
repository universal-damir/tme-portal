import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { HeaderComponent, FooterComponent, IntroSection, CostTable } from '../../shared';
import { calculateAllCosts, calculateTotals, generateServiceDescriptions, generateNumberedServices, formatServiceDescription, generateDepositExplanations } from '../../../utils';
import type { PDFComponentProps, CostItem } from '../../../types';

// InitialSetupPage - Dynamic cost breakdown with deposits handling
export const InitialSetupPage: React.FC<PDFComponentProps> = ({ data }) => {
  const { costs } = calculateAllCosts(data);
  const { setupTotal } = calculateTotals(data, costs);
  const exchangeRate = data.clientDetails.exchangeRate;

  // Generate dynamic cost items using shared utility
  const generateCostItems = (): CostItem[] => {
    const serviceDescriptions = generateServiceDescriptions(data);
    const numberedServices = generateNumberedServices(serviceDescriptions);
    
    return numberedServices.map(service => ({
      description: formatServiceDescription(service),
      amount: service.amount,
      secondaryAmount: service.amount / exchangeRate,
      isReduction: service.isReduction || false
    }));
  };

  // Generate explanations using shared utility with better formatting
  const generateExplanations = () => {
    const serviceDescriptions = generateServiceDescriptions(data);
    const numberedServices = generateNumberedServices(serviceDescriptions);
    const depositExplanations = generateDepositExplanations(data);
    
    const explanationElements: React.ReactElement[] = [];
    
    // Add numbered service explanations
    numberedServices
      .filter(service => service.explanation)
      .forEach((service) => {
        explanationElements.push(
          <Text key={service.id} style={[styles.introText, { marginBottom: 4 }]}>
            <Text style={{ fontWeight: 'bold' }}>
              {service.number}. {service.id === 'ifza-license-fee' ? 'IFZA License Cost' : service.description.replace(/^\d+\.\s/, '')}:
            </Text>{' '}
            {service.explanation}
          </Text>
        );
      });
    
    // Add deposit explanations (not numbered, separate section)
    if (depositExplanations.length > 0) {
      depositExplanations.forEach((deposit) => {
        explanationElements.push(
          <Text key={deposit.id} style={[styles.introText, { marginBottom: 4 }]}>
            <Text style={{ fontWeight: 'bold' }}>{deposit.title}:</Text>{' '}
            {deposit.explanation}
          </Text>
        );
      });
    }
    
    return explanationElements;
  };

  // Generate deposits items
  const generateDepositsItems = (): CostItem[] => {
    const deposits: CostItem[] = [];

    // IFZA deposits
    if (data.ifzaLicense?.depositWithLandlord && (data.ifzaLicense?.depositAmount || 0) > 0) {
      deposits.push({
        description: 'Deposit with Landlord',
        amount: data.ifzaLicense.depositAmount || 0,
        secondaryAmount: (data.ifzaLicense.depositAmount || 0) / exchangeRate
      });
    }

    // DET deposits
    if (data.authorityInformation.responsibleAuthority === 'DET (Dubai Department of Economy and Tourism)' && 
        data.detLicense?.rentType && data.detLicense.rentType !== 'business-center') {
      if (data.detLicense?.officeRentAmount) {
        deposits.push({
          description: 'Landlord Deposit (5% of rent)',
          amount: data.detLicense.officeRentAmount * 0.05,
          secondaryAmount: (data.detLicense.officeRentAmount * 0.05) / exchangeRate
        });
      }
      
      if (data.detLicense?.rentType === 'office') {
        deposits.push({
          description: 'DEWA Deposit',
          amount: 2000,
          secondaryAmount: 2000 / exchangeRate
        });
      } else if (data.detLicense?.rentType === 'warehouse') {
        deposits.push({
          description: 'DEWA Deposit',
          amount: 4000,
          secondaryAmount: 4000 / exchangeRate
        });
      }
    }

    return deposits;
  };

  const costItems = generateCostItems();
  const depositsItems = generateDepositsItems();
  const depositsTotal = depositsItems.reduce((sum, item) => sum + item.amount, 0);
  const depositsSecondaryTotal = depositsItems.reduce((sum, item) => sum + item.secondaryAmount, 0);
  
  // Check if deposits should be included
  const shouldShowDeposits = depositsItems.length > 0;
  const titleSuffix = shouldShowDeposits ? ' (Including Deposits)' : '';

  // Generate intro content with proper authority display name
  const getAuthorityDisplayName = () => {
    const authority = data.authorityInformation.responsibleAuthority;
    if (authority === 'DET (Dubai Department of Economy and Tourism)') {
      return 'DET (Dubai Department of Economy and Tourism)';
    }
    return authority;
  };

  const introContent = `Below is a detailed breakdown of the one-time initial setup costs associated with setting up your company in ${getAuthorityDisplayName()}. Each line item is briefly explained to give you clarity on what is covered.`;

  // Always show explanations under the table for better layout
  const explanationElements = generateExplanations();

  // Determine if content should be split across pages - Authority-specific optimization
  const totalItems = costItems.length + depositsItems.length;
  const isDET = data.authorityInformation.responsibleAuthority === 'DET (Dubai Department of Economy and Tourism)';
  
  // Authority-specific thresholds for optimal layout
  // DET typically has 8-10 items + deposits, so we use a lower threshold to keep layout clean
  // IFZA typically has 6-8 items + deposits, so we can use a higher threshold
  const shouldSplitPages = (() => {
    if (!explanationElements.length) return false;
    
    if (isDET) {
      // For DET: Split if more than 8 total items (to match IFZA's clean layout)
      return totalItems > 8;
    } else {
      // For IFZA and others: Keep the original threshold of 10 items
      return totalItems >= 10;
    }
  })();

  return (
    <>
      {/* Page 1: Table and deposits */}
      <Page size="A4" style={styles.page}>
        <HeaderComponent data={data} />

        <IntroSection
          headline="Initial Setup Cost Overview"
          content={introContent}
        />

        <CostTable
          data={data}
          title={`One-Time Initial Setup Cost${titleSuffix}`}
          items={costItems}
          total={setupTotal}
          secondaryTotal={setupTotal / exchangeRate}
          theme="green"
          showDeposits={shouldShowDeposits}
          depositsItems={depositsItems}
          depositsTotal={depositsTotal}
          depositsSecondaryTotal={depositsSecondaryTotal}
        />

        {/* Service Explanations Section - Show on same page only if content fits */}
        {explanationElements.length > 0 && !shouldSplitPages && (
          <View style={{ marginTop: 16, marginBottom: 24 }}>
            <Text style={styles.introHeadline}>Initial Setup Cost Explanation</Text>
            <View style={{ marginTop: 8 }}>
              {explanationElements}
            </View>
          </View>
        )}

        <FooterComponent />
      </Page>

      {/* Page 2: Explanations (only when content is too long) */}
      {shouldSplitPages && explanationElements.length > 0 && (
        <Page size="A4" style={styles.page}>
          <HeaderComponent data={data} />

          <IntroSection
            headline="Initial Setup Cost Explanation"
            content="The following section provides detailed explanations for each line item in the initial setup cost breakdown to give you complete transparency on what is included."
          />

          <View style={{ marginTop: 8, marginBottom: 24 }}>
            {explanationElements}
          </View>

          <FooterComponent />
        </Page>
      )}
    </>
  );
}; 