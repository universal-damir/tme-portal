import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../styles';
import { HeaderComponent, FooterComponent, IntroSection, CompactCostTable } from '../shared';
import { 
  calculateAllCosts, 
  generateSpouseVisaServiceDescriptions,
  generateChildVisaServiceDescriptions,
  generateNumberedVisaServices,
  formatVisaServiceDescription,
  formatNumber
} from '../../utils';
import type { PDFComponentProps, CostItem } from '../../types';

// FamilyVisaDocument - Simple and clean like employment visa
export const FamilyVisaDocument: React.FC<PDFComponentProps> = ({ data }) => {
  const { costs, authorityConfig } = calculateAllCosts(data);
  const exchangeRate = data.clientDetails.exchangeRate;

  // Check if family visas are selected
  const hasSpouseVisa = data.visaCosts?.spouseVisa && costs?.visaCosts && costs.visaCosts.spouseVisaTotal > 0;
  const hasChildVisa = data.visaCosts?.childVisa && costs?.visaCosts && costs.visaCosts.childVisaTotal > 0;
  
  // Don't render if no family visas are selected
  if (!hasSpouseVisa && !hasChildVisa) {
    return null;
  }

  // Generate spouse visa cost items
  const generateSpouseVisaCostItems = (): CostItem[] => {
    if (!costs?.visaCosts) return [];
    
    const spouseVisaServiceDescriptions = generateSpouseVisaServiceDescriptions(data, costs.visaCosts);
    const numberedVisaServices = generateNumberedVisaServices(spouseVisaServiceDescriptions);
    
    return numberedVisaServices.map(service => ({
      description: formatVisaServiceDescription(service),
      amount: service.amount,
      secondaryAmount: service.amount / exchangeRate,
      isReduction: service.isReduction
    }));
  };

  // Generate child visa cost items
  const generateChildVisaCostItems = (): CostItem[] => {
    if (!costs?.visaCosts) return [];
    
    const childVisaServiceDescriptions = generateChildVisaServiceDescriptions(data, costs.visaCosts, authorityConfig);
    const numberedVisaServices = generateNumberedVisaServices(childVisaServiceDescriptions);
    
    return numberedVisaServices.map(service => ({
      description: formatVisaServiceDescription(service),
      amount: service.amount,
      secondaryAmount: service.amount / exchangeRate,
      isReduction: service.isReduction
    }));
  };

  // Generate explanations for spouse visa costs (numbered for separate pages)
  const generateSpouseVisaExplanations = () => {
    if (!costs?.visaCosts) return [];
    
    const spouseVisaDescriptions = generateSpouseVisaServiceDescriptions(data, costs.visaCosts);
    const numberedSpouseServices = generateNumberedVisaServices(spouseVisaDescriptions);
    
    return numberedSpouseServices
      .filter(service => service.explanation)
      .map((service) => (
        <Text key={service.id} style={[styles.introText, { marginBottom: 4 }]}>
          <Text style={{ fontWeight: 'bold' }}>{service.number}. {service.description}:</Text>{' '}
          {service.explanation}
        </Text>
      ));
  };

  // Generate explanations for child visa costs (numbered for separate pages)
  const generateChildVisaExplanations = () => {
    if (!costs?.visaCosts) return [];
    
    const childVisaDescriptions = generateChildVisaServiceDescriptions(data, costs.visaCosts, authorityConfig);
    const numberedChildServices = generateNumberedVisaServices(childVisaDescriptions);
    
    return numberedChildServices
      .filter(service => service.explanation)
      .map((service) => (
        <Text key={service.id} style={[styles.introText, { marginBottom: 4 }]}>
          <Text style={{ fontWeight: 'bold' }}>{service.number}. {service.description}:</Text>{' '}
          {service.explanation}
        </Text>
      ));
  };

  // Generate unnumbered explanations for inline display
  const generateUnnumberedSpouseExplanations = () => {
    if (!costs?.visaCosts) return [];
    
    const spouseVisaDescriptions = generateSpouseVisaServiceDescriptions(data, costs.visaCosts);
    
    return spouseVisaDescriptions
      .filter(service => service.explanation)
      .map((service) => (
        <Text key={service.id} style={[styles.introText, { marginBottom: 4 }]}>
          <Text style={{ fontWeight: 'bold' }}>{service.description.replace(/^\d+\.\s/, '').replace(/\s*\([^)]*\s*visas?\s*[^)]*\)/gi, '')}:</Text>{' '}
          {service.explanation}
        </Text>
      ));
  };

  // Generate unnumbered explanations for child visas for inline display
  const generateUnnumberedChildExplanations = () => {
    if (!costs?.visaCosts) return [];
    
    const childVisaDescriptions = generateChildVisaServiceDescriptions(data, costs.visaCosts, authorityConfig);
    
    return childVisaDescriptions
      .filter(service => service.explanation)
      .map((service) => (
        <Text key={service.id} style={[styles.introText, { marginBottom: 4 }]}>
          <Text style={{ fontWeight: 'bold' }}>{service.description.replace(/^\d+\.\s/, '').replace(/\s*\([^)]*\s*visas?\s*[^)]*\)/gi, '')}:</Text>{' '}
          {service.explanation}
        </Text>
      ));
  };

  const spouseVisaCostItems = generateSpouseVisaCostItems();
  const childVisaCostItems = generateChildVisaCostItems();

  // Calculate totals
  const spouseVisaTotal = costs?.visaCosts.spouseVisaTotal || 0;
  const childVisaTotal = costs?.visaCosts.childVisaTotal || 0;
  const familyVisaTotal = spouseVisaTotal + childVisaTotal;

  const numberOfChildren = data.visaCosts?.numberOfChildVisas || 0;
  const childText = numberOfChildren === 1 ? 'child' : 'children';
  
  // Generate intro content
  const getDependentVisaIntroContent = () => {
    const content = `We are pleased to share a detailed breakdown of dependent visa costs for your family members. This comprehensive overview covers both spouse and ${childText} visa${numberOfChildren === 1 ? '' : 's'} requirements. These costs include all necessary services for your family members' residence visa. Each section provides transparent pricing to help you plan your family's visa requirements accordingly.`;
    
    return data.clientDetails.addressToCompany ? 
      content :
      `Dear ${data.clientDetails.firstName},

${content}`;
  };

  return (
    <Document>
      {/* CASE 1: Only spouse - ONE page */}
      {hasSpouseVisa && !hasChildVisa && (
        <Page size="A4" style={styles.page}>
          <HeaderComponent data={data} />
          <IntroSection
            headline="Spouse Visa Cost Overview"
            content="Below is a detailed breakdown of the typical costs associated with obtaining spouse visa for UAE residence. This visa is not directly connected to the company. These costs include all necessary services for your spouse's residence visa."
          />
          <CompactCostTable
            data={data}
            title="Spouse Visa Breakdown"
            items={spouseVisaCostItems}
            total={spouseVisaTotal}
            secondaryTotal={spouseVisaTotal / exchangeRate}
          />
          <FooterComponent />
        </Page>
      )}

      {/* CASE 2: Only children - ONE page */}
      {hasChildVisa && !hasSpouseVisa && (
        <Page size="A4" style={styles.page}>
          <HeaderComponent data={data} />
          <IntroSection
            headline={`${numberOfChildren === 1 ? 'Child' : 'Children'} Visa Cost Overview`}
            content={`Below is a breakdown of the typical costs associated with obtaining ${childText} visa${numberOfChildren === 1 ? '' : 's'} for UAE residence visa. This visa is not directly connected to the company. These costs include all necessary services for your ${childText}'s residence visa${numberOfChildren === 1 ? '' : 's'}.`}
          />
          
          {Array.from({ length: numberOfChildren }, (_, index) => {
            const childNumber = index + 1;
            const standardFee = authorityConfig?.visaCosts?.childVisaStandardFee || 0;
            const tmeServiceFee = authorityConfig?.visaCosts?.childVisaTmeServiceFee || 0;
            const childItems: CostItem[] = [
              {
                description: `1. Standard Authority Costs for Child ${childNumber} Visa and Emirates ID Application`,
                amount: standardFee,
                secondaryAmount: standardFee / exchangeRate,
                isReduction: false
              },
              {
                description: `2. TME Services Professional Fee for Child ${childNumber} Visa and Emirates ID`,
                amount: tmeServiceFee,
                secondaryAmount: tmeServiceFee / exchangeRate,
                isReduction: false
              }
            ];
            const childTotal = standardFee + tmeServiceFee;
            
            return (
              <CompactCostTable
                key={`child-${childNumber}`}
                data={data}
                title={numberOfChildren === 1 ? "Child Visa Breakdown" : `Child ${childNumber} Visa Breakdown`}
                items={childItems}
                total={childTotal}
                secondaryTotal={childTotal / exchangeRate}
              />
            );
          })}

          {numberOfChildren > 1 && (
            <View style={{
              flexDirection: 'row',
              backgroundColor: '#0ea5e9',
              padding: 8,
              marginTop: 8,
              borderRadius: 4
            }}>
              <Text style={{ flex: 3, paddingLeft: 6, fontSize: 11, fontWeight: 'bold', color: 'white' }}>
                Total for all {numberOfChildren} children
              </Text>
              <Text style={{ flex: 1, paddingRight: 6, fontSize: 11, fontWeight: 'bold', textAlign: 'right', color: 'white' }}>
                {formatNumber(childVisaTotal)}
              </Text>
              <Text style={{ flex: 1, paddingRight: 6, fontSize: 11, fontWeight: 'bold', textAlign: 'right', color: 'white' }}>
                {formatNumber(childVisaTotal / exchangeRate)}
              </Text>
            </View>
          )}
          
          <FooterComponent />
        </Page>
      )}

      {/* CASE 3: Spouse + 1-2 children - EVERYTHING ON ONE PAGE ONLY */}
      {hasSpouseVisa && hasChildVisa && numberOfChildren <= 2 && (
        <Page size="A4" style={styles.page}>
          <HeaderComponent data={data} />
          <IntroSection
            headline="Dependent Visa Cost Overview"
            content={getDependentVisaIntroContent()}
          />

          <CompactCostTable
            data={data}
            title="Spouse Visa Breakdown"
            items={spouseVisaCostItems}
            total={spouseVisaTotal}
            secondaryTotal={spouseVisaTotal / exchangeRate}
          />

          {Array.from({ length: numberOfChildren }, (_, index) => {
            const childNumber = index + 1;
            const standardFee = authorityConfig?.visaCosts?.childVisaStandardFee || 0;
            const tmeServiceFee = authorityConfig?.visaCosts?.childVisaTmeServiceFee || 0;
            const childItems: CostItem[] = [
              {
                description: `1. Standard Authority Costs for Child ${childNumber} Visa and Emirates ID Application`,
                amount: standardFee,
                secondaryAmount: standardFee / exchangeRate,
                isReduction: false
              },
              {
                description: `2. TME Services Professional Fee for Child ${childNumber} Visa and Emirates ID`,
                amount: tmeServiceFee,
                secondaryAmount: tmeServiceFee / exchangeRate,
                isReduction: false
              }
            ];
            const childTotal = standardFee + tmeServiceFee;
            
            return (
              <CompactCostTable
                key={`child-${childNumber}`}
                data={data}
                title={`Child ${childNumber} Visa Breakdown`}
                items={childItems}
                total={childTotal}
                secondaryTotal={childTotal / exchangeRate}
              />
            );
          })}

          <View style={{
            flexDirection: 'row',
            backgroundColor: '#0ea5e9',
            padding: 8,
            marginTop: 8,
            borderRadius: 4
          }}>
            <Text style={{ flex: 3, paddingLeft: 6, fontSize: 11, fontWeight: 'bold', color: 'white' }}>
              Total for all dependent visas
            </Text>
            <Text style={{ flex: 1, paddingRight: 6, fontSize: 11, fontWeight: 'bold', textAlign: 'right', color: 'white' }}>
              {formatNumber(familyVisaTotal)}
            </Text>
            <Text style={{ flex: 1, paddingRight: 6, fontSize: 11, fontWeight: 'bold', textAlign: 'right', color: 'white' }}>
              {formatNumber(familyVisaTotal / exchangeRate)}
            </Text>
          </View>

          {/* Add explanations on the same page for spouse + 1-2 children */}
          {(() => {
            const spouseExplanations = generateUnnumberedSpouseExplanations();
            const childExplanations = generateUnnumberedChildExplanations();
            const hasExplanations = spouseExplanations.length > 0 || childExplanations.length > 0;
            
            if (!hasExplanations) return null;
            
            return (
              <View style={{ marginTop: 16, marginBottom: 24 }}>
                <Text style={styles.introHeadline}>Dependent Visa Service Explanations</Text>
                <View style={{ marginTop: 8 }}>
                  {spouseExplanations}
                  {childExplanations}
                </View>
              </View>
            );
          })()}

          <FooterComponent />
        </Page>
      )}



      {/* CASE 4: Spouse + 3+ children - Summary page */}
      {hasSpouseVisa && hasChildVisa && numberOfChildren > 2 && (
        <Page size="A4" style={styles.page}>
          <HeaderComponent data={data} />
          <IntroSection
            headline="Dependent Visa Cost Overview"
            content={getDependentVisaIntroContent()}
          />
          <CompactCostTable
            data={data}
            title="Dependent Visa Cost Summary"
            items={[
              {
                description: "Total Spouse Visa Cost",
                amount: spouseVisaTotal,
                secondaryAmount: spouseVisaTotal / exchangeRate,
                isReduction: false
              },
              {
                description: `Total ${numberOfChildren} Children Visa Cost`,
                amount: childVisaTotal,
                secondaryAmount: childVisaTotal / exchangeRate,
                isReduction: false
              }
            ]}
            total={familyVisaTotal}
            secondaryTotal={familyVisaTotal / exchangeRate}
          />
          <FooterComponent />
        </Page>
      )}
    </Document>
  );
}; 