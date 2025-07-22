import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { HeaderComponent, FooterComponent, IntroSection, CostTable } from '../../shared';
import { IndividualVisaBreakdownPage } from '../breakdowns';
import { 
  calculateAllCosts, 
  shouldShowVisaCosts,
  generateCompanyVisaServiceDescriptions,
  generateNumberedVisaServices,
  formatVisaServiceDescription
} from '../../../utils';
import type { PDFComponentProps, CostItem } from '../../../types';

// VisaCostsPage - Complex visa cost breakdown with multiple visa types
export const VisaCostsPage: React.FC<PDFComponentProps> = ({ data }) => {
  // Only render if visa costs should be shown
  if (!shouldShowVisaCosts(data)) {
    return null;
  }

  const { costs, authorityConfig } = calculateAllCosts(data);
  const exchangeRate = data.clientDetails.exchangeRate;

  // Generate company visa cost items
  const generateCompanyVisaCostItems = (): CostItem[] => {
    if (!costs?.visaCosts) return [];
    
    const companyVisaServiceDescriptions = generateCompanyVisaServiceDescriptions(data, costs.visaCosts, authorityConfig);
    const numberedVisaServices = generateNumberedVisaServices(companyVisaServiceDescriptions);
    
    return numberedVisaServices.map(service => ({
      description: formatVisaServiceDescription(service),
      amount: service.amount,
      secondaryAmount: service.amount / exchangeRate,
      isReduction: service.isReduction
    }));
  };

  // NOTE: Family visa functions have been moved to FamilyVisaDocument

  // Generate explanations for company visa costs
  const generateCompanyVisaExplanations = () => {
    if (!costs?.visaCosts) return [];
    
    const companyVisaDescriptions = generateCompanyVisaServiceDescriptions(data, costs.visaCosts, authorityConfig);
    const numberedCompanyServices = generateNumberedVisaServices(companyVisaDescriptions);
    
    return numberedCompanyServices
      .filter(service => service.explanation)
      .map((service) => (
        <Text key={service.id} style={[styles.introText, { marginBottom: 4 }]}>
          <Text style={{ fontWeight: 'bold' }}>{service.number}. {service.description}:</Text>{' '}
          {service.explanation}
        </Text>
      ));
  };

  const companyVisaCostItems = generateCompanyVisaCostItems();

  const introContent = `Below is a breakdown of the typical costs associated with obtaining 2-year UAE employment residence visa. This overview includes mandatory services, with pricing noted per visa where applicable. The final selection depends on your needs, and not all items may be required for every application.`;

  // Calculate totals for different visa types
  const companyVisaTotal = costs?.visaCosts.total || 0;

  // Generate explanation elements for each section
  const companyExplanationElements = generateCompanyVisaExplanations();

  return (
    <>
      {/* COMMENTED OUT: Total Visa Cost Overview - as requested by user */}
      {false && (
        <Page size="A4" style={styles.page}>
          <HeaderComponent data={data} />

          <IntroSection
            headline="Visa Cost Overview"
            content={introContent}
          />

          <CostTable
            data={data}
            title="VISA COST BREAKDOWN (2-YEAR EMPLOYMENT VISA)"
            items={companyVisaCostItems}
            total={companyVisaTotal}
            secondaryTotal={companyVisaTotal / exchangeRate}
            theme="blue"
          />

          <View style={{ marginTop: 8, marginBottom: 24 }}>
            <Text style={styles.introHeadline}>Employment Visa Service Descriptions</Text>
            <View style={{ marginTop: 8 }}>
              {companyExplanationElements}
            </View>
          </View>

          <FooterComponent />
        </Page>
      )}

      {/* Individual Visa Breakdown Page - Only if multiple visas */}
      <IndividualVisaBreakdownPage data={data} />

      {/* NOTE: Family visa pages have been moved to a separate FamilyVisaDocument */}
      {/* This maintains cleaner separation between employment and family visas */}
    </>
  );
}; 