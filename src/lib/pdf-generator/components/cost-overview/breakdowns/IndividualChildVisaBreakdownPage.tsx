import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { HeaderComponent, FooterComponent, IntroSection, CostTable } from '../../shared';
import { 
  calculateAllCosts, 
  calculateIndividualChildVisaCosts,
  formatNumber
} from '../../../utils';
import type { PDFComponentProps, CostItem } from '../../../types';

// Type for individual child visa
interface IndividualChildVisa {
  childNumber: number;
  standardFee: number;
  tmeServiceFee: number;
  healthInsurance: number;
  statusChangeFee: number;
  vipStampingFee: number;
  total: number;
}

// IndividualChildVisaBreakdownPage - Shows detailed breakdown for each child visa when multiple children are selected
export const IndividualChildVisaBreakdownPage: React.FC<PDFComponentProps> = ({ data }) => {
  const { costs, authorityConfig } = calculateAllCosts(data);
  const exchangeRate = data.clientDetails.exchangeRate;
  
  // Get individual child visa calculations
  const individualChildVisas = calculateIndividualChildVisaCosts(data, authorityConfig || null);
  
  // Don't render if only 1 child or no children
  if (individualChildVisas.length <= 0) {
    return null;
  }
  
  const numberOfChildVisas = data.visaCosts?.numberOfChildVisas || 0;
  const childText = numberOfChildVisas === 1 ? 'child' : 'children';

  // Generate cost items for each individual child visa
  const generateIndividualChildVisaCostItems = (childVisa: IndividualChildVisa): CostItem[] => {
    const items: CostItem[] = [];
    
    // Standard Authority Costs
    items.push({
      description: 'Standard Authority Costs',
      amount: childVisa.standardFee,
      secondaryAmount: childVisa.standardFee / exchangeRate,
      isReduction: false
    });
    
    // Health insurance (if selected)
    if (childVisa.healthInsurance > 0) {
      const childVisaDetail = data.visaCosts?.childVisaDetails?.[childVisa.childNumber - 1];
      const insuranceType = childVisaDetail?.healthInsurance || 'Insurance';
      items.push({
        description: `Health Insurance - ${insuranceType}`,
        amount: childVisa.healthInsurance,
        secondaryAmount: childVisa.healthInsurance / exchangeRate,
        isReduction: false
      });
    }
    
    // Status change (if selected)
    if (childVisa.statusChangeFee > 0) {
      items.push({
        description: 'Authority Cost for Status Change',
        amount: childVisa.statusChangeFee,
        secondaryAmount: childVisa.statusChangeFee / exchangeRate,
        isReduction: false
      });
    }
    
    // VIP stamping (if selected)
    if (childVisa.vipStampingFee > 0) {
      items.push({
        description: 'VIP Visa Stamping Service',
        amount: childVisa.vipStampingFee,
        secondaryAmount: childVisa.vipStampingFee / exchangeRate,
        isReduction: false
      });
    }
    
    // TME Services fee (always at the bottom)
    items.push({
      description: 'TME Services Professional Fee',
      amount: childVisa.tmeServiceFee,
      secondaryAmount: childVisa.tmeServiceFee / exchangeRate,
      isReduction: false
    });
    
    // Add numbering to all items
    return items.map((item, index) => ({
      ...item,
      description: `${index + 1}. ${item.description}`
    }));
  };
  
  // Introduction content
  const introContent = `Below is a detailed breakdown of each individual child visa cost. This shows exactly what each child visa includes and helps you understand the specific options selected for each child. Each child visa may have different options such as health insurance type, VIP stamping, or status change requirements.`;

  // Group child visas into chunks of 2 for page layout
  const childVisaGroups: IndividualChildVisa[][] = [];
  for (let i = 0; i < individualChildVisas.length; i += 2) {
    childVisaGroups.push(individualChildVisas.slice(i, i + 2));
  }

  // Calculate total for summary
  const grandTotal = individualChildVisas.reduce((sum: number, childVisa: IndividualChildVisa) => {
    const childVisaCostItems = generateIndividualChildVisaCostItems(childVisa);
    return sum + childVisaCostItems.reduce((itemSum, item) => itemSum + item.amount, 0);
  }, 0);

  return (
    <>
      {childVisaGroups.map((childVisaGroup, groupIndex) => (
        <Page key={`child-visa-group-${groupIndex}`} size="A4" style={styles.page}>
          <HeaderComponent data={data} />

          {/* Show intro only on first page */}
          {groupIndex === 0 && (
            <IntroSection
              headline="Individual Child Visa Cost Breakdown"
              content={introContent}
            />
          )}

          {/* Render child visas in this group (max 2) */}
          {childVisaGroup.map((childVisa: IndividualChildVisa) => {
            const childVisaCostItems = generateIndividualChildVisaCostItems(childVisa);
            
            // Calculate total from the actual display items
            const actualTotal = childVisaCostItems.reduce((sum, item) => sum + item.amount, 0);
            
            return (
              <View key={`individual-child-visa-${childVisa.childNumber}`} style={{ marginBottom: 16 }}>
                <CostTable
                  data={data}
                  title={`Child ${childVisa.childNumber} Visa Breakdown`}
                  items={childVisaCostItems}
                  total={actualTotal}
                  secondaryTotal={actualTotal / exchangeRate}
                  theme="blue"
                  showTotal={true}
                />
              </View>
            );
          })}

          {/* Summary only on the last page - styled to match lightblue table total row exactly */}
          {groupIndex === childVisaGroups.length - 1 && (
            <View style={{ 
              flexDirection: 'row',
              backgroundColor: '#0ea5e9',
              color: 'white',
              padding: 8,
              fontWeight: 'bold',
              fontSize: 10,
              marginTop: 4,
              borderRadius: 4,
              alignItems: 'center'
            }}>
              <Text style={{ 
                flex: 3, 
                paddingLeft: 8, 
                fontSize: 10, 
                fontWeight: 'bold', 
                color: 'white' 
              }}>
                Total for all {numberOfChildVisas} {childText}
              </Text>
              <Text style={{ 
                flex: 1, 
                paddingRight: 8, 
                fontSize: 10, 
                fontWeight: 'bold', 
                textAlign: 'right', 
                color: 'white' 
              }}>
                {formatNumber(grandTotal)}
              </Text>
              <Text style={{ 
                flex: 1, 
                paddingRight: 8, 
                fontSize: 10, 
                fontWeight: 'bold', 
                textAlign: 'right', 
                color: 'white' 
              }}>
                {formatNumber(grandTotal / exchangeRate)}
              </Text>
            </View>
          )}

          {/* Show explanations inline if total items <= 8, otherwise they go to separate page */}
          {groupIndex === childVisaGroups.length - 1 && (() => {
            // Calculate total number of items across all child visa tables
            const totalChildItems = individualChildVisas.reduce((sum: number, childVisa: IndividualChildVisa) => {
              const childVisaCostItems = generateIndividualChildVisaCostItems(childVisa);
              return sum + childVisaCostItems.length;
            }, 0);

            // Only show inline explanations if total items <= 8
            if (totalChildItems > 8) return null;

            // Get all unique service descriptions that appear in the child visa breakdown tables
            const allUsedChildDescriptions = new Set<string>();
            
            individualChildVisas.forEach((childVisa: IndividualChildVisa) => {
              const childVisaCostItems = generateIndividualChildVisaCostItems(childVisa);
              childVisaCostItems.forEach((item: any) => {
                // Remove numbering to get clean description
                const cleanDesc = item.description.replace(/^\d+\.\s*/, '');
                allUsedChildDescriptions.add(cleanDesc.toLowerCase());
              });
            });

            // Create mapping of child visa service descriptions to explanations
            const childVisaServiceExplanations: { [key: string]: string } = {
              'standard authority fees for child visa and emirates id application': 'For mandatory UAE medical test, Emirates ID, and immigration residency processing.',
              'child visa health insurance - low cost': 'Mandatory health insurance coverage for child visa holders as per UAE regulations.',
              'child visa health insurance - silver package': 'Mandatory health insurance coverage for child visa holders as per UAE regulations.',
              'child visa health insurance - no insurance': 'Mandatory health insurance coverage for child visa holders as per UAE regulations.',
              'authority cost for child visa status change': 'Authority fee for changing child visa status from tourist/visit visa to residence visa.',
              'child visa vip stamping service': 'Express visa stamping service for faster processing of child visa.',
              'tme services professional fee for child visa and emirates id': 'Our professional service fee for managing the child visa application process.'
            };

            // Find matching explanations for used services
            const childExplanationsToShow: Array<{ title: string; explanation: string }> = [];
            
            allUsedChildDescriptions.forEach(usedDesc => {
              // Try to find a matching explanation
              for (const [serviceKey, explanation] of Object.entries(childVisaServiceExplanations)) {
                if (usedDesc.includes(serviceKey)) {
                  // Extract the service title from the key
                  const title = serviceKey.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ').replace(/\b(Id|Uae|Visa|Tme|Vip)\b/g, match => match.toUpperCase());
                  
                  // Avoid duplicates
                  if (!childExplanationsToShow.some(exp => exp.title === title)) {
                    childExplanationsToShow.push({ title, explanation });
                  }
                  break;
                }
              }
            });

            // Only show explanation if we have services to explain
            if (childExplanationsToShow.length === 0) return null;

            return (
              <View style={{ marginTop: 16, marginBottom: 24 }}>
                <Text style={styles.introHeadline}>Child Visa Service Explanations</Text>
                <View style={{ marginTop: 8 }}>
                  {childExplanationsToShow.map((exp, index) => (
                    <Text key={index} style={[styles.introText, { marginBottom: 4 }]}>
                      <Text style={{ fontWeight: 'bold' }}>{exp.title}:</Text>{' '}
                      {exp.explanation}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })()}

          <FooterComponent />
        </Page>
      ))}
      
      {/* Explanations Page - Show on separate page if total items > 8 */}
      {(() => {
        // Calculate total number of items across all child visa tables
        const totalChildItems = individualChildVisas.reduce((sum: number, childVisa: IndividualChildVisa) => {
          const childVisaCostItems = generateIndividualChildVisaCostItems(childVisa);
          return sum + childVisaCostItems.length;
        }, 0);

        // Only show separate page explanations if total items > 8
        if (totalChildItems <= 8) return null;

        // Get all unique service descriptions that appear in the child visa breakdown tables
        const allUsedChildDescriptions = new Set<string>();
        
        individualChildVisas.forEach((childVisa: IndividualChildVisa) => {
          const childVisaCostItems = generateIndividualChildVisaCostItems(childVisa);
          childVisaCostItems.forEach((item: any) => {
            // Remove numbering to get clean description
            const cleanDesc = item.description.replace(/^\d+\.\s*/, '');
            allUsedChildDescriptions.add(cleanDesc.toLowerCase());
          });
        });

        // Create mapping of child visa service descriptions to explanations
        const childVisaServiceExplanations: { [key: string]: string } = {
          'standard authority fees for child visa and emirates id application': 'For mandatory UAE medical test, Emirates ID, and immigration residency processing.',
          'child visa health insurance - low cost': 'Mandatory health insurance coverage for child visa holders as per UAE regulations.',
          'child visa health insurance - silver package': 'Mandatory health insurance coverage for child visa holders as per UAE regulations.',
          'child visa health insurance - no insurance': 'Mandatory health insurance coverage for child visa holders as per UAE regulations.',
          'authority cost for child visa status change': 'Authority fee for changing child visa status from tourist/visit visa to residence visa.',
          'child visa vip stamping service': 'Express visa stamping service for faster processing of child visa.',
          'tme services professional fee for child visa and emirates id': 'Our professional service fee for managing the child visa application process.'
        };

        // Find matching explanations for used services
        const childExplanationsToShow: Array<{ title: string; explanation: string }> = [];
        
        allUsedChildDescriptions.forEach(usedDesc => {
          // Try to find a matching explanation
          for (const [serviceKey, explanation] of Object.entries(childVisaServiceExplanations)) {
            if (usedDesc.includes(serviceKey)) {
              // Extract the service title from the key
              const title = serviceKey.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ').replace(/\b(Id|Uae|Visa|Tme|Vip)\b/g, match => match.toUpperCase());
              
              // Avoid duplicates
              if (!childExplanationsToShow.some(exp => exp.title === title)) {
                childExplanationsToShow.push({ title, explanation });
              }
              break;
            }
          }
        });

        // Only show explanations if we have services to explain
        if (childExplanationsToShow.length === 0) return null;

        return (
          <Page size="A4" style={styles.page}>
            <HeaderComponent data={data} />
            
            <View style={{ marginTop: 16, marginBottom: 24 }}>
              <Text style={styles.introHeadline}>Child Visa Service Explanations</Text>
              <View style={{ marginTop: 8 }}>
                {childExplanationsToShow.map((exp, index) => (
                  <Text key={index} style={[styles.introText, { marginBottom: 4 }]}>
                    <Text style={{ fontWeight: 'bold' }}>{exp.title}:</Text>{' '}
                    {exp.explanation}
                  </Text>
                ))}
              </View>
            </View>
            
            <FooterComponent />
          </Page>
        );
      })()}
    </>
  );
}; 