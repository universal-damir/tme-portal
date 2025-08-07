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
import { GOLDEN_VISA_TRANSLATIONS, Locale } from '../../../translations/golden-visa';
import type { PDFComponentProps, CostItem } from '../../../types';
import type { GoldenVisaData } from '@/types/golden-visa';

// DependentVisasPage - Family visa costs breakdown (conditional rendering)
// Only renders when spouse or children visas are selected
export const DependentVisasPage: React.FC<PDFComponentProps> = ({ data }) => {
  // Access golden visa data from transformed data
  const goldenVisaData = (data as PDFComponentProps['data'] & { goldenVisaData: GoldenVisaData }).goldenVisaData;
  const exchangeRate = data.clientDetails.exchangeRate;
  
  // Get language from data or default to English
  const locale: Locale = ((data as any).locale as Locale) || 'en';
  const t = GOLDEN_VISA_TRANSLATIONS[locale];

  // Check if dependents are selected using actual data
  const hasSpouse = Boolean(goldenVisaData?.dependents?.spouse?.required);
  const hasChildren = Boolean((goldenVisaData?.dependents?.children?.count || 0) > 0);
  const hasDependents = hasSpouse || hasChildren;
  
  // Don't render if no dependents
  if (!hasDependents) {
    return null;
  }

  // Generate spouse visa breakdown
  const spouseVisa = hasSpouse ? generateGoldenVisaSpouseVisaBreakdown(goldenVisaData, locale) : [];
  const spouseVisaItems: CostItem[] = spouseVisa.map(service => ({
    description: service.description,
    amount: service.amount,
    secondaryAmount: service.amount / exchangeRate,
    isReduction: false
  }));
  const spouseVisaTotal = spouseVisaItems.reduce((sum, item) => sum + item.amount, 0);

  // Generate children visa breakdown
  const childrenVisa = hasChildren ? generateGoldenVisaChildrenVisaBreakdown(goldenVisaData, locale) : [];
  const childrenVisaItems: CostItem[] = childrenVisa.map(service => ({
    description: service.description,
    amount: service.amount,
    secondaryAmount: service.amount / exchangeRate,
    isReduction: false
  }));
  const childrenVisaTotal = childrenVisaItems.reduce((sum, item) => sum + item.amount, 0);

  // Generate individual child visa breakdowns for multiple children
  const individualChildBreakdowns = hasChildren ? generateGoldenVisaIndividualChildVisaBreakdowns(goldenVisaData, locale) : [];
  const numberOfChildren = goldenVisaData?.dependents?.children?.count || 0;

  // Get translated intro content
  const introContent = t.dependentCosts.introText;

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

  // Spacing will be determined per page based on content

  // Create array of all tables to render
  const tables = [];

  // Add spouse table if applicable
  if (hasSpouse && spouseVisaItems.length > 0) {
    tables.push({
      key: 'spouse',
      title: t.dependentCosts.spouseVisaBreakdown,
      items: spouseVisaItems,
      total: spouseVisaTotal,
      secondaryTotal: spouseVisaTotal / exchangeRate
    });
  }

  // Add individual child tables
  if (hasChildren && numberOfChildren === 1 && childrenVisaItems.length > 0) {
    tables.push({
      key: 'child-1',
      title: t.dependentCosts.childVisaBreakdown,
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
        title: `${t.dependentCosts.childVisaBreakdown} ${childNumber}`,
        items: childItems,
        total: childTotal,
        secondaryTotal: childTotal / exchangeRate
      });
    });
  }

  // Always put explanations on the last page with tables (never separate page)

  // Check if visa cancellation is enabled (affects content length and pagination)
  const hasVisaCancellation = Boolean(
    goldenVisaData.dependentAuthorityFees?.visaCancelation ||
    goldenVisaData.dependents?.spouse?.visaCancelation ||
    goldenVisaData.dependents?.children?.visaCancelation
  );

  // Smart pagination based on content:
  // - Spouse + 1 child: all on one page (unless visa cancellation with 2+ children)
  // - Spouse + 2+ children with visa cancellation: spouse on page 1, children on separate pages (max 3 per page)
  // - Spouse + 2+ children without visa cancellation: spouse + 2 children on page 1, rest on page 2
  // - Just children: 1-2 children on one page, 3+ children split (max 3 per page if visa cancellation)
  const pageGroups = [];
  
  if (hasSpouse && hasChildren) {
    if (hasVisaCancellation && numberOfChildren >= 2) {
      // Special case: visa cancellation with 2+ children - spouse on page 1, children on separate pages (max 3 per page)
      const spouseTable = tables.find(t => t.key === 'spouse');
      const childrenTables = tables.filter(t => t.key !== 'spouse');
      
      if (spouseTable) {
        pageGroups.push([spouseTable]);
        
        // Split children into groups of 3 per page
        for (let i = 0; i < childrenTables.length; i += 3) {
          pageGroups.push(childrenTables.slice(i, i + 3));
        }
      } else {
        pageGroups.push(tables);
      }
    } else if (numberOfChildren <= 2) {
      // Spouse + 1-2 children: all on one page (when no visa cancellation or only 1 child)
      pageGroups.push(tables);
    } else {
      // Spouse + 3+ children without visa cancellation: spouse on first page, children on second page
      const spouseTable = tables.find(t => t.key === 'spouse');
      const childrenTables = tables.filter(t => t.key !== 'spouse');
      
      if (spouseTable) {
        pageGroups.push([spouseTable]);
        pageGroups.push(childrenTables);
      } else {
        pageGroups.push(tables);
      }
    }
  } else if (hasChildren && !hasSpouse) {
    if (hasVisaCancellation && numberOfChildren >= 3) {
      // Children only with visa cancellation: max 3 children per page
      for (let i = 0; i < tables.length; i += 3) {
        pageGroups.push(tables.slice(i, i + 3));
      }
    } else if (numberOfChildren <= 2) {
      // 1-2 children: all on one page
      pageGroups.push(tables);  
    } else {
      // 3+ children without visa cancellation: split into groups of 2
      for (let i = 0; i < tables.length; i += 2) {
        pageGroups.push(tables.slice(i, i + 2));
      }
    }
  } else {
    // Just spouse or fallback: use tables as is
    pageGroups.push(tables);
  }

  return (
    <>
      {pageGroups.map((pageTable, pageIndex) => {
        // Calculate spacing based on content of this specific page
        const tablesOnThisPage = pageTable.length;
        const hasExplanationsOnThisPage = pageIndex === pageGroups.length - 1 && explanations.length > 0;
        
        // Use consistent spacing like main visa holder
        const introSpacing = 8;
        const tableSpacing = 12;
        const explanationMarginTop = 8;
        const explanationMarginBottom = 16;
        const explanationInnerMarginTop = 6;
        const explanationTextMarginBottom = 6;
        
        return (
          <Page key={`page-${pageIndex}`} size="A4" style={styles.page}>
            <HeaderComponent data={data} />

            {/* Intro Section - only on first page */}
            {pageIndex === 0 && (
              <View style={{ marginBottom: introSpacing }}>
                <IntroSection
                  headline={t.dependentCosts.pageTitle}
                  content={introContent}
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
            {hasExplanationsOnThisPage && (
              <View style={{ marginTop: explanationMarginTop, marginBottom: explanationMarginBottom }}>
                <Text style={styles.introHeadline}>{t.dependentCosts.serviceExplanations}</Text>
                <View style={{ marginTop: explanationInnerMarginTop }}>
                  {explanations.map((explanation, index) => (
                    <Text key={`explanation-${explanation.id}-${index}`} style={[styles.introText, { marginBottom: explanationTextMarginBottom }]}>
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
        );
      })}


    </>
  );
}; 