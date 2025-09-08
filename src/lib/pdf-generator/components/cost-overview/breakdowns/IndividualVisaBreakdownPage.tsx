import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { HeaderComponent, FooterComponent, IntroSection, CompactCostTable } from '../../shared';
import { 
  calculateAllCosts, 
  calculateIndividualVisaCosts,
  formatNumber,
  formatSecondaryCurrency
} from '../../../utils';
import type { PDFComponentProps, CostItem } from '../../../types';
import { generateCompanyVisaExplanations } from '../../../utils/visaServiceDescriptions';

// IndividualVisaBreakdownPage - Shows detailed breakdown for each visa when multiple visas are selected
export const IndividualVisaBreakdownPage: React.FC<PDFComponentProps> = ({ data }) => {
  const { costs, authorityConfig } = calculateAllCosts(data);
  const exchangeRate = data.clientDetails.exchangeRate;
  
  // Get individual visa calculations
  const individualVisas = calculateIndividualVisaCosts(data, authorityConfig || null);
  
  // Don't render if no visas
  if (individualVisas.length <= 0) {
    return null;
  }
  
  const numberOfVisas = data.visaCosts?.numberOfVisas || 0;
  const visaText = (count: number) => count === 1 ? 'visa' : 'visas';
  
  // Type for individual visa
  interface IndividualVisa {
    visaNumber: number;
    isReduced: boolean;
    governmentFee: number;
    tmeServiceFee: number;
    healthInsurance: number;
    statusChangeFee: number;
    vipStampingFee: number;
    investorVisaFee: number;
    employmentVisaFee: number;
    total: number;
  }

  // Generate cost items for each individual visa
  const generateIndividualVisaCostItems = (visa: IndividualVisa): CostItem[] => {
    const items: CostItem[] = [];
    
    // Government fees
    if (visa.isReduced) {
      // For reduced visas, show both standard and reduced fees
      const standardFee = authorityConfig?.visaCosts.standardVisaFee || 0;
      const reductionAmount = authorityConfig?.visaCosts.reducedVisaFee || 0;
      
      // 1. Standard Authority Fee
      items.push({
        description: 'Standard authority costs',
        amount: standardFee,
        secondaryAmount: standardFee / exchangeRate,
        isReduction: false
      });
      
      // 2. Reduced Authority Fee (as discount)
      const actualReducedFee = standardFee - reductionAmount;
      items.push({
        description: 'Reduced authority costs',
        amount: actualReducedFee, // Positive value, isReduction will handle display
        secondaryAmount: actualReducedFee / exchangeRate,
        isReduction: true
      });
    } else {
      // For standard visas, show only standard fee
      items.push({
        description: 'Standard authority costs',
        amount: visa.governmentFee,
        secondaryAmount: visa.governmentFee / exchangeRate,
        isReduction: false
      });
    }
    
    // Health insurance (if selected)
    if (visa.healthInsurance > 0) {
      const visaDetail = data.visaCosts?.visaDetails?.[visa.visaNumber - 1];
      const insuranceType = visaDetail?.healthInsurance || 'Insurance';
      items.push({
        description: `Health insurance (${insuranceType.toLowerCase()})`,
        amount: visa.healthInsurance,
        secondaryAmount: visa.healthInsurance / exchangeRate,
        isReduction: false
      });
    }
    
    // Status change (if selected)
    if (visa.statusChangeFee > 0) {
      items.push({
        description: 'Authority cost for visa status change',
        amount: visa.statusChangeFee,
        secondaryAmount: visa.statusChangeFee / exchangeRate,
        isReduction: false
      });
    }
    
    // VIP stamping (if selected)
    if (visa.vipStampingFee > 0) {
      items.push({
        description: 'VIP authority stamping cost - express visa stamp',
        amount: visa.vipStampingFee,
        secondaryAmount: visa.vipStampingFee / exchangeRate,
        isReduction: false
      });
    }
    
    // Investor/Partner visa fee (if this is an investor/partner visa)
    if (visa.investorVisaFee > 0) {
      items.push({
        description: `${authorityConfig?.displayName || 'Authority'} investor/partner visa cost`,
        amount: visa.investorVisaFee,
        secondaryAmount: visa.investorVisaFee / exchangeRate,
        isReduction: false
      });
    }
    
    // Employment visa fees (DET specific)
    if (visa.employmentVisaFee > 0) {
      const employeeInsurance = authorityConfig?.visaCosts.employmentVisaEmployeeInsurance || 190;
      
      items.push({
        description: 'Employee insurance per employee per visa',
        amount: employeeInsurance,
        secondaryAmount: employeeInsurance / exchangeRate,
        isReduction: false
      });
    }
    
    // TME Services fee (always at the bottom)
    items.push({
      description: 'TME Services professional fee',
      amount: visa.tmeServiceFee,
      secondaryAmount: visa.tmeServiceFee / exchangeRate,
      isReduction: false
    });
    
    // Add numbering to all items
    return items.map((item, index) => ({
      ...item,
      description: `${index + 1}. ${item.description}`
    }));
  };
  
  // Introduction content
  const introContent = `Below is a detailed breakdown of each individual visa cost. This shows exactly what each visa includes and helps you understand the specific options selected for each visa holder. Each visa may have different options such as health insurance type, VIP stamping, status change, or promotional rates.`;

  // Group visas into chunks of 2 for page layout
  const visaGroups: any[][] = [];
  for (let i = 0; i < individualVisas.length; i += 2) {
    visaGroups.push(individualVisas.slice(i, i + 2));
  }

  // Calculate total for summary
  const grandTotal = individualVisas.reduce((sum: number, visa: any) => {
    const visaCostItems = generateIndividualVisaCostItems(visa as IndividualVisa);
    return sum + visaCostItems.reduce((itemSum, item) => {
      return itemSum + (item.isReduction ? -item.amount : item.amount);
    }, 0);
  }, 0);

  return (
    <>
      {visaGroups.map((visaGroup, groupIndex) => (
        <Page key={`visa-group-${groupIndex}`} size="A4" style={styles.page}>
          <HeaderComponent data={data} />

          {/* Show intro only on first page */}
          {groupIndex === 0 && (
            <IntroSection
              headline="Individual Visa Cost Breakdown"
              content={introContent}
            />
          )}

          {/* Render visas in this group (max 2) */}
          {visaGroup.map((visa) => {
            const visaCostItems = generateIndividualVisaCostItems(visa as IndividualVisa);
            
            // Calculate total from the actual display items (handle reductions)
            const actualTotal = visaCostItems.reduce((sum, item) => {
              return sum + (item.isReduction ? -item.amount : item.amount);
            }, 0);
            
            // Determine visa type for DET
            const visaDetail = data.visaCosts?.visaDetails?.[visa.visaNumber - 1];
            let visaTypeText = '';
            if (authorityConfig?.id === 'det' && visaDetail?.investorVisa) {
              if (visaDetail.investorVisa === "employment") {
                visaTypeText = ' (Employment Visa)';
              } else if (visaDetail.investorVisa === "true" || visaDetail.investorVisa === true) {
                visaTypeText = ' (Investor/Partner Visa)';
              }
            }
            
            // Dynamic title: "VISA BREAKDOWN" for single visa, "VISA X BREAKDOWN" for multiple
            const baseTitle = numberOfVisas === 1 ? 'Visa Breakdown' : `Visa ${visa.visaNumber} Breakdown`;
            const title = `${baseTitle}${visa.isReduced ? ' (Promotional Rate)' : ''}${visaTypeText}`;
            
            return (
              <View key={`individual-visa-${visa.visaNumber}`} style={{ marginBottom: 6 }}>
                <CompactCostTable
                  data={data}
                  title={title}
                  items={visaCostItems}
                  total={actualTotal}
                  secondaryTotal={actualTotal / exchangeRate}
                />
              </View>
            );
          })}

          {/* Summary only on the last page - light blue styling */}
          {groupIndex === visaGroups.length - 1 && numberOfVisas > 1 && (
            <View style={{
              flexDirection: 'row',
              backgroundColor: '#243F7B',
              padding: 8,
              marginTop: 8,
              borderRadius: 4
            }}>
              <Text style={{ 
                flex: 3, 
                paddingLeft: 6, 
                fontSize: 11, 
                fontWeight: 'bold', 
                color: 'white' 
              }}>
                Total for {numberOfVisas} {visaText(numberOfVisas)}
              </Text>
              <Text style={{ 
                flex: 1, 
                paddingRight: 6, 
                fontSize: 11, 
                fontWeight: 'bold', 
                textAlign: 'right', 
                color: 'white' 
              }}>
                {formatNumber(grandTotal)}
              </Text>
              <Text style={{ 
                flex: 1, 
                paddingRight: 6, 
                fontSize: 11, 
                fontWeight: 'bold', 
                textAlign: 'right', 
                color: 'white' 
              }}>
                {formatSecondaryCurrency(grandTotal / exchangeRate)}
              </Text>
            </View>
          )}

          {/* Show explanations inline if total items <= 8, otherwise they go to separate page */}
          {groupIndex === visaGroups.length - 1 && numberOfVisas >= 1 && (() => {
            // Calculate total number of items across all tables
            const totalItems = individualVisas.reduce((sum: number, visa: any) => {
              const visaCostItems = generateIndividualVisaCostItems(visa as IndividualVisa);
              return sum + visaCostItems.length;
            }, 0);

            // Only show inline explanations if total items <= 8
            if (totalItems > 8) return null;

            // Generate explanations using company-only explanations (excludes spouse/child since they have separate document)
            const explanationsToShow = generateCompanyVisaExplanations(data, costs?.visaCosts, authorityConfig);

            // Only show explanation if we have services to explain
            if (explanationsToShow.length === 0) return null;

            return (
              <View style={{ marginTop: 16, marginBottom: 24 }}>
                <Text style={styles.introHeadline}>Individual Visa Service Explanations</Text>
                <View style={{ marginTop: 8 }}>
                  {explanationsToShow.map((exp: any, index: number) => (
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
        // Calculate total number of items across all tables
        const totalItems = individualVisas.reduce((sum: number, visa: any) => {
          const visaCostItems = generateIndividualVisaCostItems(visa as IndividualVisa);
          return sum + visaCostItems.length;
        }, 0);

        // Only show separate page explanations if total items > 8
        if (totalItems <= 8) return null;

        // Generate explanations using company-only explanations (excludes spouse/child since they have separate document)
        const explanationsToShow = generateCompanyVisaExplanations(data, costs?.visaCosts, authorityConfig);

        // Only show explanations if we have services to explain
        if (explanationsToShow.length === 0) return null;

        return (
          <Page size="A4" style={styles.page}>
            <HeaderComponent data={data} />
            
            <View style={{ marginTop: 16, marginBottom: 24 }}>
              <Text style={styles.introHeadline}>Individual Visa Service Explanations</Text>
              <View style={{ marginTop: 8 }}>
                {explanationsToShow.map((exp: any, index: number) => (
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