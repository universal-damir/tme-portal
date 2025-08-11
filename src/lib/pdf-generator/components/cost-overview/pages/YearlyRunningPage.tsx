import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { HeaderComponent, FooterComponent, IntroSection, CostTable } from '../../shared';
import { 
  calculateAllCosts, 
  calculateTotals, 
  shouldShowInitialSetup,
  generateYearlyRunningServiceDescriptions,
  generateNumberedYearlyRunningServices,
  formatYearlyRunningServiceDescription
} from '../../../utils';
import type { PDFComponentProps, CostItem } from '../../../types';

// YearlyRunningPage - Annual maintenance costs
export const YearlyRunningPage: React.FC<PDFComponentProps> = ({ data }) => {
  // Only render if this authority supports the cost breakdown
  if (!shouldShowInitialSetup(data.authorityInformation.responsibleAuthority)) {
    return null;
  }

  const { costs, authorityConfig } = calculateAllCosts(data);
  const { yearlyTotal } = calculateTotals(data, costs);
  const exchangeRate = data.clientDetails.exchangeRate;

  // Generate yearly running cost items with numbering
  const generateYearlyCostItems = (): CostItem[] => {
    if (!costs?.yearlyRunning) return [];
    
    const yearlyRunningServiceDescriptions = generateYearlyRunningServiceDescriptions(data, costs.yearlyRunning, authorityConfig);
    const numberedYearlyServices = generateNumberedYearlyRunningServices(yearlyRunningServiceDescriptions);
    
    return numberedYearlyServices.map(service => ({
      description: formatYearlyRunningServiceDescription(service),
      amount: service.amount,
      secondaryAmount: service.amount / exchangeRate,
      isReduction: false
    }));
  };

  // Generate explanations for yearly running costs
  const generateYearlyRunningExplanations = () => {
    if (!costs?.yearlyRunning) return [];
    
    const yearlyRunningDescriptions = generateYearlyRunningServiceDescriptions(data, costs.yearlyRunning, authorityConfig);
    const numberedYearlyServices = generateNumberedYearlyRunningServices(yearlyRunningDescriptions);
    
    return numberedYearlyServices
      .filter(service => service.explanation)
      .map((service) => (
        <Text key={service.id} style={[styles.introText, { marginBottom: 4 }]}>
          <Text style={{ fontWeight: 'bold' }}>{service.number}. {service.description}:</Text>{' '}
          {service.explanation}
        </Text>
      ));
  };

  const yearlyCostItems = generateYearlyCostItems();
  const yearlyExplanationElements = generateYearlyRunningExplanations();

  // Generate intro content based on multi-year logic
  const licenseYears = data.ifzaLicense?.licenseYears || 1;
  const isIFZAMultiYear = data.authorityInformation.responsibleAuthority === 'IFZA (International Free Zone Authority)' && licenseYears > 1;
  
  // Generate intro content with proper authority display name
  const getAuthorityDisplayName = () => {
    const authority = data.authorityInformation.responsibleAuthority;
    if (authority === 'DET (Dubai Department of Economy and Tourism)') {
      return 'DET (Dubai Department of Economy and Tourism)';
    }
    return authority;
  };

  const introContent = isIFZAMultiYear 
    ? `This overview outlines the expected recurring costs for maintaining your company licence with ${getAuthorityDisplayName()}. These costs will be applied each year after initial ${licenseYears} years. The total cost may vary slightly year to year based on regulatory updates or optional services. Of course, you can also opt for multiple year renewal.`
    : `This overview outlines the expected recurring costs for maintaining your company licence with ${getAuthorityDisplayName()}. The total cost may vary slightly year to year based on regulatory updates or optional services.`;
  
  const pageTitle = isIFZAMultiYear 
    ? `Yearly Running Costs (After ${licenseYears} Years)`
    : 'Yearly Running Costs';
  
  const tableTitle = isIFZAMultiYear 
    ? `Yearly Running Costs`
    : 'Yearly Running Costs';

  return (
    <>
      {/* Page 1: Yearly Running Costs Table */}
      <Page size="A4" style={styles.page}>
        <HeaderComponent data={data} />

        <IntroSection
          headline={pageTitle}
          content={introContent}
        />

        <CostTable
          data={data}
          title={tableTitle}
          items={yearlyCostItems}
          total={yearlyTotal}
          secondaryTotal={yearlyTotal / exchangeRate}
          theme="yellow"
        />

        {/* Yearly Running Explanations - Always shown under table */}
        {yearlyExplanationElements.length > 0 && (
          <View style={{ marginTop: 16, marginBottom: 24 }}>
            <Text style={styles.introHeadline}>Yearly Running Cost Service Descriptions</Text>
            <View style={{ marginTop: 8 }}>
              {yearlyExplanationElements}
            </View>
          </View>
        )}

        <FooterComponent />
      </Page>
    </>
  );
}; 