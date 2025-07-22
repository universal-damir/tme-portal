import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { 
  HeaderComponent, 
  FooterComponent, 
  IntroSection,
  CompactCostTable
} from '../../shared';
import { 
  generateGoldenVisaSpouseVisaBreakdown,
  generateGoldenVisaChildrenVisaBreakdown,
  generateGoldenVisaIndividualChildVisaBreakdowns
} from '../../../utils/goldenVisaDataTransformer';
import type { PDFComponentProps, CostItem } from '../../../types';
import type { GoldenVisaData } from '@/types/golden-visa';

// DependentVisasPage - Family visa costs breakdown (conditional rendering)
// Only renders when spouse or children visas are selected
export const DependentVisasPage: React.FC<PDFComponentProps> = ({ data }) => {
  // Access golden visa data from transformed data
  const goldenVisaData = (data as PDFComponentProps['data'] & { goldenVisaData: GoldenVisaData }).goldenVisaData;
  const exchangeRate = data.clientDetails.exchangeRate;

  // Check if dependents are selected using actual data
  const hasSpouse = Boolean(goldenVisaData?.dependents?.spouse?.required);
  const hasChildren = Boolean((goldenVisaData?.dependents?.children?.count || 0) > 0);
  const hasDependents = hasSpouse || hasChildren;
  
  // Don't render if no dependents
  if (!hasDependents) {
    return null;
  }

  // Generate spouse visa breakdown
  const spouseVisa = hasSpouse ? generateGoldenVisaSpouseVisaBreakdown(goldenVisaData) : [];
  const spouseVisaItems: CostItem[] = spouseVisa.map(service => ({
    description: service.description,
    amount: service.amount,
    secondaryAmount: service.amount / exchangeRate,
    isReduction: false
  }));
  const spouseVisaTotal = spouseVisaItems.reduce((sum, item) => sum + item.amount, 0);

  // Generate children visa breakdown
  const childrenVisa = hasChildren ? generateGoldenVisaChildrenVisaBreakdown(goldenVisaData) : [];
  const childrenVisaItems: CostItem[] = childrenVisa.map(service => ({
    description: service.description,
    amount: service.amount,
    secondaryAmount: service.amount / exchangeRate,
    isReduction: false
  }));
  const childrenVisaTotal = childrenVisaItems.reduce((sum, item) => sum + item.amount, 0);

  // Generate individual child visa breakdowns for multiple children
  const individualChildBreakdowns = hasChildren ? generateGoldenVisaIndividualChildVisaBreakdowns(goldenVisaData) : [];
  const numberOfChildren = goldenVisaData?.dependents?.children?.count || 0;

  // Generate dynamic intro content with document requirements
  const generateIntroContent = () => {
    // Determine family member text
    let familyMemberText = '';
    if (hasSpouse && hasChildren) {
      familyMemberText = 'family members';
    } else if (hasSpouse) {
      familyMemberText = 'spouse';
    } else if (hasChildren) {
      familyMemberText = numberOfChildren === 1 ? 'child' : 'children';
    }

    // Base intro text
    let introText = `Below is a detailed breakdown of dependent visa costs for your ${familyMemberText}.`;

    // Add document requirements based on selections
    if (hasSpouse && hasChildren) {
      // Both selected - combine in one sentence
      const childText = numberOfChildren === 1 ? 'child birth certificate' : 'children birth certificates';
      introText += ` Please note that both the marriage certificate and ${childText} must be attested and legalized by the UAE Embassy in the country of origin.`;
    } else if (hasSpouse) {
      // Spouse only
      introText += ' Please note that the marriage certificate must be attested and legalized by the UAE Embassy in the country of origin.';
    } else if (hasChildren) {
      // Children only
      const childText = numberOfChildren === 1 ? 'child birth certificate' : 'children birth certificates';
      introText += ` Please note that the ${childText} must be attested and legalized by the UAE Embassy in the country of origin.`;
    }

    return introText;
  };

  // Generate explanations from all services
  const generateExplanations = () => {
    const allServices = [...spouseVisa, ...childrenVisa];
    
    // Group explanations by service type to avoid repetition
    const explanationGroups: { [key: string]: { contexts: string[]; explanation: string; } } = {};
    
    allServices.forEach(service => {
      if (!service.explanation) return;
      
      // Extract base service name (remove numbering and context)
      let baseServiceName = service.description.replace(/^\d+\.\s/, '');
      
      // Determine context and clean service name
      let context = '';
      if (baseServiceName.includes('(1 child)')) {
        context = 'child';
        baseServiceName = baseServiceName.replace(/\s*\(1 child\)/, '');
      } else if (baseServiceName.includes(`(${numberOfChildren} children)`)) {
        context = numberOfChildren === 1 ? 'child' : 'children';
        baseServiceName = baseServiceName.replace(/\s*\(\d+ children?\)/, '');
      } else if (service.id.includes('spouse')) {
        context = 'spouse';
      } else if (service.id.includes('child')) {
        context = numberOfChildren === 1 ? 'child' : 'children';
      }
      
      // Group by base service name
      if (!explanationGroups[baseServiceName]) {
        explanationGroups[baseServiceName] = {
          contexts: [],
          explanation: service.explanation
        };
      }
      
      // Add context if not already present
      if (context && !explanationGroups[baseServiceName].contexts.includes(context)) {
        explanationGroups[baseServiceName].contexts.push(context);
      }
    });
    
    // Generate combined explanations
    return Object.entries(explanationGroups).map(([serviceName, group]) => {
      let contextText = '';
      if (group.contexts.length > 1) {
        contextText = ` for ${group.contexts.join(' and ')} visa`;
      } else if (group.contexts.length === 1) {
        contextText = ` for ${group.contexts[0]} visa`;
      }
      
      // Modify explanation to include context
      let combinedExplanation = group.explanation;
      if (contextText) {
        // Replace specific context mentions with combined context
        combinedExplanation = combinedExplanation
          .replace(/for spouse visa/gi, contextText)
          .replace(/for child visa/gi, contextText)
          .replace(/for children visa/gi, contextText)
          .replace(/for \w+ visa processing/gi, `${contextText} processing`)
          .replace(/for \w+ visa documentation/gi, `${contextText} documentation`);
      }
      
      return {
        id: serviceName.toLowerCase().replace(/\s+/g, '-'),
        title: serviceName,
        explanation: combinedExplanation
      };
    });
  };

  const explanations = generateExplanations();

  // Count the number of table sections to determine styling
  const sectionCount = 
    (hasSpouse ? 1 : 0) + 
    (hasChildren && numberOfChildren === 1 ? 1 : 0) +
    (hasChildren && numberOfChildren > 1 ? numberOfChildren : 0); // individual child breakdowns only

  // Set spacing based on section count
  const introSpacing = sectionCount === 1 ? 8 : 1;
  const tableSpacing = sectionCount === 1 ? 12 : 3;
  const explanationMarginTop = sectionCount === 1 ? 8 : 1;
  const explanationMarginBottom = sectionCount === 1 ? 12 : 4;
  const explanationInnerMarginTop = sectionCount === 1 ? 6 : 1;
  const explanationTextMarginBottom = sectionCount === 1 ? 4 : 1;
  const explanationFontSize = sectionCount === 1 ? 10 : 8;

  // Create array of all tables to render
  const tables = [];

  // Add spouse table if applicable
  if (hasSpouse && spouseVisaItems.length > 0) {
    tables.push({
      key: 'spouse',
      title: 'Spouse Visa Breakdown',
      items: spouseVisaItems,
      total: spouseVisaTotal,
      secondaryTotal: spouseVisaTotal / exchangeRate
    });
  }

  // Add individual child tables
  if (hasChildren && numberOfChildren === 1 && childrenVisaItems.length > 0) {
    tables.push({
      key: 'child-1',
      title: 'Child Visa Breakdown',
      items: childrenVisaItems,
      total: childrenVisaTotal,
      secondaryTotal: childrenVisaTotal / exchangeRate
    });
  } else if (hasChildren && individualChildBreakdowns.length > 1) {
    individualChildBreakdowns.forEach((childBreakdown, index) => {
      const childNumber = index + 1;
      const childItems: CostItem[] = childBreakdown.map(service => ({
        description: service.description,
        amount: service.amount,
        secondaryAmount: service.amount / exchangeRate,
        isReduction: false
      }));
      const childTotal = childItems.reduce((sum, item) => sum + item.amount, 0);

      tables.push({
        key: `child-${childNumber}`,
        title: `Child ${childNumber} Visa Breakdown`,
        items: childItems,
        total: childTotal,
        secondaryTotal: childTotal / exchangeRate
      });
    });
  }

  // Always put explanations on the last page with tables (never separate page)

  // Split tables into pages (max 2 tables per page)
  const tablesPerPage = 2;
  const pageGroups = [];
  for (let i = 0; i < tables.length; i += tablesPerPage) {
    pageGroups.push(tables.slice(i, i + tablesPerPage));
  }

  return (
    <>
      {pageGroups.map((pageTable, pageIndex) => (
        <Page key={`page-${pageIndex}`} size="A4" style={styles.page}>
          <HeaderComponent data={data} />

          {/* Intro Section - only on first page */}
          {pageIndex === 0 && (
            <View style={{ marginBottom: introSpacing }}>
              <IntroSection
                headline="Dependent Visa Cost Breakdown"
                content={generateIntroContent()}
              />
            </View>
          )}

          {/* Render tables for this page */}
          {pageTable.map((table) => (
            <View key={table.key} style={{ marginBottom: tableSpacing }}>
              <CompactCostTable
                data={data}
                title={table.title}
                items={table.items}
                total={table.total}
                secondaryTotal={table.secondaryTotal}
              />
            </View>
          ))}

          {/* Explanations Section - always on last page with tables */}
          {pageIndex === pageGroups.length - 1 && explanations.length > 0 && (
            <View style={{ marginTop: explanationMarginTop, marginBottom: explanationMarginBottom }}>
              <Text style={styles.introHeadline}>Service Explanations</Text>
              <View style={{ marginTop: explanationInnerMarginTop }}>
                {explanations.map((explanation, index) => (
                  <Text key={`explanation-${explanation.id}-${index}`} style={[styles.introText, { marginBottom: explanationTextMarginBottom, fontSize: explanationFontSize }]}>
                    <Text style={{ fontWeight: 'bold' }}>{explanation.title}:</Text>{' '}
                    {explanation.explanation}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Spacer to push footer to bottom */}
          <View style={{ flex: 1 }} />

          <FooterComponent />
        </Page>
      ))}


    </>
  );
}; 