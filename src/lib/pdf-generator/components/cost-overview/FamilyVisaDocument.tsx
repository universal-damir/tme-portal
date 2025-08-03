import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../styles';
import { HeaderComponent, FooterComponent, IntroSection, CompactCostTable } from '../shared';
import { 
  calculateAllCosts, 
  calculateIndividualChildVisaCosts,
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

  // Check if family visas are selected - use form data primarily
  const hasSpouseVisa = data.visaCosts?.spouseVisa === true;
  const hasChildVisa = data.visaCosts?.childVisa === true;
  
  // Don't render if no family visas are selected
  if (!hasSpouseVisa && !hasChildVisa) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <HeaderComponent data={data} />
          <IntroSection
            headline="Family Visa Information"
            content="No family visas have been selected for this proposal."
          />
          <FooterComponent />
        </Page>
      </Document>
    );
  }

  // Generate spouse visa cost items (including ALL services, with TME services as last item)
  const generateSpouseVisaAllCostItems = (): CostItem[] => {
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


  // Generate child visa authority cost items (excluding TME services)
  const generateChildVisaAuthorityCostItems = (): CostItem[] => {
    if (!costs?.visaCosts) return [];
    
    const childVisaServiceDescriptions = generateChildVisaServiceDescriptions(data, costs.visaCosts, authorityConfig);
    const authorityServices = childVisaServiceDescriptions.filter(service => 
      !service.id.includes('tme-services')
    );
    const numberedVisaServices = generateNumberedVisaServices(authorityServices);
    
    return numberedVisaServices.map(service => ({
      description: formatVisaServiceDescription(service),
      amount: service.amount,
      secondaryAmount: service.amount / exchangeRate,
      isReduction: service.isReduction
    }));
  };

  // Generate child visa TME services cost items
  const generateChildVisaTMECostItems = (): CostItem[] => {
    if (!costs?.visaCosts) return [];
    
    const childVisaServiceDescriptions = generateChildVisaServiceDescriptions(data, costs.visaCosts, authorityConfig);
    const tmeServices = childVisaServiceDescriptions.filter(service => 
      service.id.includes('tme-services')
    );
    
    return tmeServices.map(service => ({
      description: 'TME Services Professional Fee',
      amount: service.amount,
      secondaryAmount: service.amount / exchangeRate,
      isReduction: service.isReduction
    }));
  };

  // Generate individual child visa authority cost items (excluding TME services)
  const generateIndividualChildVisaAuthorityCostItems = (childNumber: number): CostItem[] => {
    if (!costs?.visaCosts || !authorityConfig) {
      return [
        {
          description: `1. Standard Authority Costs`,
          amount: 0,
          secondaryAmount: 0,
          isReduction: false
        }
      ];
    }
    
    const individualChildVisas = calculateIndividualChildVisaCosts(data, authorityConfig);
    const childVisa = individualChildVisas.find(cv => cv.childNumber === childNumber);
    
    if (!childVisa) {
      // Fallback for single child or when individual calculation fails
      // This should work for all authorities and child counts
      const standardFee = authorityConfig?.visaCosts?.childVisaStandardFee || 0;
      const tmeServiceFee = authorityConfig?.visaCosts?.childVisaTmeServiceFee || 0;
      
      const items: CostItem[] = [];
      let serviceNumber = 1;

      // Standard Authority Costs
      items.push({
        description: `${serviceNumber++}. Standard Authority Costs`,
        amount: standardFee,
        secondaryAmount: standardFee / exchangeRate,
        isReduction: false
      });

      // Check for additional services from the main data
      const numberOfChildVisas = data.visaCosts?.numberOfChildVisas || 0;
      const childVisaStatusChange = data.visaCosts?.childVisaStatusChange || 0;
      const childVisaVipStamping = data.visaCosts?.childVisaVipStamping || 0;

      // Status Change (if this child needs it)
      if (childNumber <= childVisaStatusChange && authorityConfig?.visaCosts?.statusChangeFee) {
        items.push({
          description: `${serviceNumber++}. Visa Status Change Authority Costs`,
          amount: authorityConfig.visaCosts.statusChangeFee,
          secondaryAmount: authorityConfig.visaCosts.statusChangeFee / exchangeRate,
          isReduction: false
        });
      }

      // Health Insurance (if this child has it)
      const childVisaDetail = data.visaCosts?.childVisaDetails?.[childNumber - 1];
      if (childVisaDetail?.healthInsurance && childVisaDetail.healthInsurance !== 'No Insurance') {
        const insuranceCost = childVisaDetail.healthInsurance === 'Low Cost' 
          ? (authorityConfig?.visaCosts?.healthInsurance?.lowCost || 1000)
          : (authorityConfig?.visaCosts?.healthInsurance?.silverPackage || 6000);
        items.push({
          description: `${serviceNumber++}. Health Insurance - ${childVisaDetail.healthInsurance}`,
          amount: insuranceCost,
          secondaryAmount: insuranceCost / exchangeRate,
          isReduction: false
        });
      }

      // VIP Stamping (if this child needs it)
      if (childNumber <= childVisaVipStamping && authorityConfig?.visaCosts?.vipStampingFee) {
        items.push({
          description: `${serviceNumber++}. VIP Visa Stamping Service`,
          amount: authorityConfig.visaCosts.vipStampingFee,
          secondaryAmount: authorityConfig.visaCosts.vipStampingFee / exchangeRate,
          isReduction: false
        });
      }

      return items;
    }

    const items: CostItem[] = [];
    let serviceNumber = 1;

    // Standard Authority Costs
    items.push({
      description: `${serviceNumber++}. Standard Authority Costs`,
      amount: childVisa.standardFee,
      secondaryAmount: childVisa.standardFee / exchangeRate,
      isReduction: false
    });

    // Status Change (if applicable)
    if (childVisa.statusChangeFee > 0) {
      items.push({
        description: `${serviceNumber++}. Visa Status Change Authority Costs`,
        amount: childVisa.statusChangeFee,
        secondaryAmount: childVisa.statusChangeFee / exchangeRate,
        isReduction: false
      });
    }

    // Health Insurance (if applicable)
    if (childVisa.healthInsurance > 0) {
      const childVisaDetail = data.visaCosts?.childVisaDetails?.[childNumber - 1];
      const insuranceType = childVisaDetail?.healthInsurance || 'Insurance';
      items.push({
        description: `${serviceNumber++}. Health Insurance - ${insuranceType}`,
        amount: childVisa.healthInsurance,
        secondaryAmount: childVisa.healthInsurance / exchangeRate,
        isReduction: false
      });
    }

    // VIP Stamping (if applicable)
    if (childVisa.vipStampingFee > 0) {
      items.push({
        description: `${serviceNumber++}. VIP Visa Stamping Service`,
        amount: childVisa.vipStampingFee,
        secondaryAmount: childVisa.vipStampingFee / exchangeRate,
        isReduction: false
      });
    }

    return items;
  };

  // Generate individual child visa TME cost items
  const generateIndividualChildVisaTMECostItems = (childNumber: number): CostItem[] => {
    if (!costs?.visaCosts || !authorityConfig) {
      return [
        {
          description: 'TME Services Professional Fee',
          amount: 0,
          secondaryAmount: 0,
          isReduction: false
        }
      ];
    }

    const individualChildVisas = calculateIndividualChildVisaCosts(data, authorityConfig);
    const childVisa = individualChildVisas.find(cv => cv.childNumber === childNumber);
    
    if (!childVisa) {
      // Fallback
      const tmeServiceFee = authorityConfig?.visaCosts?.childVisaTmeServiceFee || 0;
      return [
        {
          description: 'TME Services Professional Fee',
          amount: tmeServiceFee,
          secondaryAmount: tmeServiceFee / exchangeRate,
          isReduction: false
        }
      ];
    }

    return [
      {
        description: 'TME Services Professional Fee',
        amount: childVisa.tmeServiceFee,
        secondaryAmount: childVisa.tmeServiceFee / exchangeRate,
        isReduction: false
      }
    ];
  };

  // Generate explanations for spouse visa costs (without numbering)
  const generateSpouseVisaExplanations = () => {
    if (!costs?.visaCosts) return [];
    
    const spouseVisaDescriptions = generateSpouseVisaServiceDescriptions(data, costs.visaCosts);
    
    return spouseVisaDescriptions
      .filter(service => service.explanation)
      .map((service) => (
        <Text key={service.id} style={[styles.introText, { marginBottom: 4 }]}>
          <Text style={{ fontWeight: 'bold' }}>{service.description}:</Text>{' '}
          {service.explanation}
        </Text>
      ));
  };

  // Generate explanations for child visa costs (without numbering)
  const generateChildVisaExplanations = () => {
    if (!costs?.visaCosts) return [];
    
    const childVisaDescriptions = generateChildVisaServiceDescriptions(data, costs.visaCosts, authorityConfig);
    
    return childVisaDescriptions
      .filter(service => service.explanation)
      .map((service) => (
        <Text key={service.id} style={[styles.introText, { marginBottom: 4 }]}>
          <Text style={{ fontWeight: 'bold' }}>{service.description}:</Text>{' '}
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

  const spouseVisaAllCostItems = generateSpouseVisaAllCostItems();
  const childVisaAuthorityCostItems = generateChildVisaAuthorityCostItems();
  const childVisaTMECostItems = generateChildVisaTMECostItems();

  // Calculate totals - use actual computed values for accuracy
  const spouseVisaTotal = spouseVisaAllCostItems.reduce((sum, item) => sum + item.amount, 0);
  
  const childVisaAuthorityTotal = childVisaAuthorityCostItems.reduce((sum, item) => sum + item.amount, 0);
  const childVisaTMETotal = childVisaTMECostItems.reduce((sum, item) => sum + item.amount, 0);
  const childVisaTotal = childVisaAuthorityTotal + childVisaTMETotal;
  
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
            items={spouseVisaAllCostItems}
            total={spouseVisaTotal}
            secondaryTotal={spouseVisaTotal / exchangeRate}
          />
          {/* Add spouse visa explanations */}
          {(() => {
            const spouseExplanations = generateSpouseVisaExplanations();
            
            if (spouseExplanations.length === 0) return null;
            
            return (
              <View style={{ marginTop: 16, marginBottom: 24 }}>
                <Text style={styles.introHeadline}>Spouse Visa Service Explanations</Text>
                <View style={{ marginTop: 8 }}>
                  {spouseExplanations}
                </View>
              </View>
            );
          })()}
          <FooterComponent />
        </Page>
      )}

      {/* CASE 2: Only children - Max 2 children per page with explanations */}
      {hasChildVisa && !hasSpouseVisa && (() => {
        const pages = [];
        const childrenPerPage = 2;
        const totalPages = Math.ceil(numberOfChildren / childrenPerPage);
        
        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
          const startChild = pageIndex * childrenPerPage + 1;
          const endChild = Math.min(startChild + childrenPerPage - 1, numberOfChildren);
          const childrenOnThisPage = endChild - startChild + 1;
          
          pages.push(
            <Page key={`children-page-${pageIndex + 1}`} size="A4" style={styles.page}>
              <HeaderComponent data={data} />
              {pageIndex === 0 && (
                <IntroSection
                  headline={`${numberOfChildren === 1 ? 'Child' : 'Children'} Visa Cost Overview`}
                  content={`Below is a breakdown of the typical costs associated with obtaining ${childText} visa${numberOfChildren === 1 ? '' : 's'} for UAE residence visa. This visa is not directly connected to the company. These costs include all necessary services for your ${childText}'s residence visa${numberOfChildren === 1 ? '' : 's'}.`}
                />
              )}
              
              {Array.from({ length: childrenOnThisPage }, (_, index) => {
                const childNumber = startChild + index;
                const childAuthorityItems = generateIndividualChildVisaAuthorityCostItems(childNumber);
                const childTMEItems = generateIndividualChildVisaTMECostItems(childNumber);
                
                // Combine all items for this child into a single table with proper numbering
                const combinedItems = [...childAuthorityItems, ...childTMEItems];
                const allChildItems = combinedItems.map((item, index) => ({
                  ...item,
                  description: item.description.replace(/^(?:\d+\.\s*)?(.*)/, `${index + 1}. $1`)
                }));
                const childTotal = allChildItems.reduce((sum, item) => sum + item.amount, 0);
                
                return (
                  <View key={`child-${childNumber}`} style={{ marginBottom: 12 }}>
                    <CompactCostTable
                      data={data}
                      title={`Child ${childNumber} Visa Breakdown`}
                      items={allChildItems}
                      total={childTotal}
                      secondaryTotal={childTotal / exchangeRate}
                    />
                  </View>
                );
              })}

              {/* Show total only on last page */}
              {pageIndex === totalPages - 1 && numberOfChildren > 1 && (
                <View style={{
                  flexDirection: 'row',
                  backgroundColor: '#243F7B',
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

              {/* Add explanations on each page */}
              {(() => {
                const childExplanations = generateChildVisaExplanations();
                
                if (childExplanations.length === 0) return null;
                
                return (
                  <View style={{ marginTop: 16, marginBottom: 24 }}>
                    <Text style={styles.introHeadline}>Child Visa Service Explanations</Text>
                    <View style={{ marginTop: 8 }}>
                      {childExplanations}
                    </View>
                  </View>
                );
              })()}
              
              <FooterComponent />
            </Page>
          );
        }
        
        return pages;
      })()}

      {/* CASE 3: Spouse + Children - Spouse on page 1, children on page 2+ */}
      {hasSpouseVisa && hasChildVisa && (() => {
        const pages = [];
        
        // Page 1: Spouse only
        pages.push(
          <Page key="spouse-page" size="A4" style={styles.page}>
            <HeaderComponent data={data} />
            <IntroSection
              headline="Spouse Visa Cost Overview"
              content="Below is a detailed breakdown of the typical costs associated with obtaining spouse visa for UAE residence. This visa is not directly connected to the company. These costs include all necessary services for your spouse's residence visa."
            />
            <CompactCostTable
              data={data}
              title="Spouse Visa Breakdown"
              items={spouseVisaAllCostItems}
              total={spouseVisaTotal}
              secondaryTotal={spouseVisaTotal / exchangeRate}
            />
            {/* Add spouse visa explanations */}
            {(() => {
              const spouseExplanations = generateSpouseVisaExplanations();
              
              if (spouseExplanations.length === 0) return null;
              
              return (
                <View style={{ marginTop: 16, marginBottom: 24 }}>
                  <Text style={styles.introHeadline}>Spouse Visa Service Explanations</Text>
                  <View style={{ marginTop: 8 }}>
                    {spouseExplanations}
                  </View>
                </View>
              );
            })()}
            <FooterComponent />
          </Page>
        );
        
        // Page 2+: Children (max 2 per page)
        const childrenPerPage = 2;
        const totalChildPages = Math.ceil(numberOfChildren / childrenPerPage);
        
        for (let pageIndex = 0; pageIndex < totalChildPages; pageIndex++) {
          const startChild = pageIndex * childrenPerPage + 1;
          const endChild = Math.min(startChild + childrenPerPage - 1, numberOfChildren);
          const childrenOnThisPage = endChild - startChild + 1;
          
          pages.push(
            <Page key={`children-page-${pageIndex + 1}`} size="A4" style={styles.page}>
              <HeaderComponent data={data} />
              {pageIndex === 0 && (
                <IntroSection
                  headline={`${numberOfChildren === 1 ? 'Child' : 'Children'} Visa Cost Overview`}
                  content={`Below is a breakdown of the typical costs associated with obtaining ${numberOfChildren === 1 ? 'child' : 'children'} visa${numberOfChildren === 1 ? '' : 's'} for UAE residence visa. This visa is not directly connected to the company. These costs include all necessary services for your ${numberOfChildren === 1 ? 'child' : 'children'}'s residence visa${numberOfChildren === 1 ? '' : 's'}.`}
                />
              )}
              
              {Array.from({ length: childrenOnThisPage }, (_, index) => {
                const childNumber = startChild + index;
                const childAuthorityItems = generateIndividualChildVisaAuthorityCostItems(childNumber);
                const childTMEItems = generateIndividualChildVisaTMECostItems(childNumber);
                
                // Combine all items for this child into a single table with proper numbering
                const combinedItems = [...childAuthorityItems, ...childTMEItems];
                const allChildItems = combinedItems.map((item, index) => ({
                  ...item,
                  description: item.description.replace(/^(?:\d+\.\s*)?(.*)/, `${index + 1}. $1`)
                }));
                const childTotal = allChildItems.reduce((sum, item) => sum + item.amount, 0);
                
                return (
                  <View key={`child-${childNumber}`} style={{ marginBottom: 12 }}>
                    <CompactCostTable
                      data={data}
                      title={`Child ${childNumber} Visa Breakdown`}
                      items={allChildItems}
                      total={childTotal}
                      secondaryTotal={childTotal / exchangeRate}
                    />
                  </View>
                );
              })}

              {/* Show total only on last child page */}
              {pageIndex === totalChildPages - 1 && (
                <View style={{
                  flexDirection: 'row',
                  backgroundColor: '#243F7B',
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
              )}

              {/* Add child explanations on each page */}
              {(() => {
                const childExplanations = generateChildVisaExplanations();
                
                if (childExplanations.length === 0) return null;
                
                return (
                  <View style={{ marginTop: 16, marginBottom: 24 }}>
                    <Text style={styles.introHeadline}>Child Visa Service Explanations</Text>
                    <View style={{ marginTop: 8 }}>
                      {childExplanations}
                    </View>
                  </View>
                );
              })()}
              
              <FooterComponent />
            </Page>
          );
        }
        
        return pages;
      })()}
    </Document>
  );
}; 