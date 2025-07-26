import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { formatNumber } from '../../../utils';
import { 
  generateGoldenVisaSpouseVisaBreakdown,
  generateGoldenVisaChildrenVisaBreakdown 
} from '../../../utils/goldenVisaDataTransformer';
import type { PDFComponentProps, CostItem } from '../../../types';

// CostSummarySection - Overview table for cover page
// Similar to InitialCostSummarySection in cost overview
export const CostSummarySection: React.FC<PDFComponentProps> = ({ data }) => {
  const exchangeRate = data.clientDetails.exchangeRate;
  const secondaryCurrency = data.clientDetails.secondaryCurrency;

  // Access golden visa data from transformed data
  const goldenVisaData = (data as any).goldenVisaData;

  // Get visa type display name for dynamic title and descriptions
  const getVisaTypeDisplay = () => {
    switch (goldenVisaData?.visaType) {
      case 'property-investment':
        return 'Property Investment';
      case 'time-deposit':
        return 'Time Deposit';
      case 'skilled-employee':
        return 'Skilled Employee';
      default:
        return 'Golden Visa';
    }
  };

  // Generate cost summary items with actual golden visa calculations
  const generateCostSummaryItems = (): CostItem[] => {
    const items: CostItem[] = [];
    let itemNumber = 1;
    
    // Only include primary visa costs if primary visa is required
    if (goldenVisaData?.primaryVisaRequired) {
      // Calculate authority total from detailed breakdown
      let authorityTotal = 0;
      if (goldenVisaData?.visaType === 'property-investment' && goldenVisaData?.propertyAuthorityFees) {
        const fees = goldenVisaData.propertyAuthorityFees;
        authorityTotal = fees.professionalPassportPicture + fees.dldApprovalFee + fees.mandatoryUaeMedicalTest + 
                       fees.emiratesIdFee + fees.immigrationResidencyFee + fees.thirdPartyCosts;
        if (fees.visaCancelation) authorityTotal += fees.visaCancelationFee;
      } else if ((goldenVisaData?.visaType === 'time-deposit' || goldenVisaData?.visaType === 'skilled-employee') && goldenVisaData?.skilledEmployeeAuthorityFees) {
        const fees = goldenVisaData.skilledEmployeeAuthorityFees;
        authorityTotal = fees.professionalPassportPicture + fees.mandatoryUaeMedicalTest + 
                       fees.emiratesIdFee + fees.immigrationResidencyFee + fees.thirdPartyCosts;
        if (fees.visaCancelation) authorityTotal += fees.visaCancelationFee;
      } else {
        // Fallback to legacy calculation
        authorityTotal = goldenVisaData?.governmentFee || 0;
      }
      
      // 1. Authority Costs line
      items.push({
        description: `${itemNumber}. ${getVisaTypeDisplay()} Golden Visa Authority Fees`,
        amount: authorityTotal,
        secondaryAmount: authorityTotal / exchangeRate,
        isReduction: false
      });
      itemNumber++;
      
      // 2. NOC fee as separate line (only for skilled employee with NOC)
      if (goldenVisaData?.requiresNOC && goldenVisaData?.selectedFreezone && goldenVisaData?.freezoneNocFee) {
        const freezoneLabel = goldenVisaData.selectedFreezone.toUpperCase();
        items.push({
          description: `${itemNumber}. ${freezoneLabel} NOC (Non-Objection Certificate) Fee`,
          amount: goldenVisaData.freezoneNocFee,
          secondaryAmount: goldenVisaData.freezoneNocFee / exchangeRate,
          isReduction: false
        });
        itemNumber++;
      }
    }
    
    // 3. Spouse Visa (if selected)
    const hasSpouse = Boolean(goldenVisaData?.dependents?.spouse?.required);
    if (hasSpouse) {
      const spouseVisa = generateGoldenVisaSpouseVisaBreakdown(goldenVisaData);
      const spouseVisaTotal = spouseVisa.reduce((sum, service) => sum + service.amount, 0);
      
      items.push({
        description: `${itemNumber}. Dependent (Spouse) Visa Authority Fees`,
        amount: spouseVisaTotal,
        secondaryAmount: spouseVisaTotal / exchangeRate,
        isReduction: false
      });
      itemNumber++;
    }
    
    // 4. Children Visa (if selected)
    const hasChildren = Boolean((goldenVisaData?.dependents?.children?.count || 0) > 0);
    if (hasChildren) {
      const numberOfChildren = goldenVisaData?.dependents?.children?.count || 0;
      const childText = numberOfChildren === 1 ? 'Child' : 'Children';
      const childrenVisa = generateGoldenVisaChildrenVisaBreakdown(goldenVisaData);
      const childrenVisaTotal = childrenVisa.reduce((sum, service) => sum + service.amount, 0);
      
      items.push({
        description: `${itemNumber}. Dependent (${childText}) Visa  Authority Fees${numberOfChildren > 1 ? ` (${numberOfChildren} children)` : ''}`,
        amount: childrenVisaTotal,
        secondaryAmount: childrenVisaTotal / exchangeRate,
        isReduction: false
      });
      itemNumber++;
    }
    
    // Last item: TME Services (always at the bottom)
    const baseTmeServices = goldenVisaData?.primaryVisaRequired ? (goldenVisaData?.tmeServicesFee || 0) : 0;
    // Calculate dependent TME services
    let dependentTmeServices = 0;
    if (hasSpouse) {
      dependentTmeServices += goldenVisaData?.dependents?.spouse?.tmeServicesFee || 0;
    }
    if (hasChildren) {
      const numberOfChildren = goldenVisaData?.dependents?.children?.count || 0;
      dependentTmeServices += (goldenVisaData?.dependents?.children?.tmeServicesFee || 0) * numberOfChildren;
    }
    
    const totalTmeServices = baseTmeServices + dependentTmeServices;
    
    // Only add TME services if there are any services to include
    if (totalTmeServices > 0) {
      items.push({
        description: `${itemNumber}. TME Services Professional Fee`,
        amount: totalTmeServices,
        secondaryAmount: totalTmeServices / exchangeRate,
        isReduction: false
      });
    }
    
    return items;
  };

  const costItems = generateCostSummaryItems();
  const totalAmount = costItems.reduce((sum, item) => sum + item.amount, 0);

  // Dynamic title and description based on whether primary visa is required
  const getSummaryTitle = () => {
    if (!goldenVisaData?.primaryVisaRequired) {
      return 'Golden Visa Dependent Services Summary';
    }
    return `${getVisaTypeDisplay()} Golden Visa Summary`;
  };

  const getSummaryDescription = () => {
    if (!goldenVisaData?.primaryVisaRequired) {
      return 'This represents the overall cost for your Golden Visa dependent services only. A detailed cost breakdown is provided on the following pages for full transparency. All government cost will always be charged on cost basis.';
    }
    return 'This represents the overall cost for your Golden Visa application. A detailed cost breakdown is provided on the following pages for full transparency. All government cost will always be charged on cost basis.';
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{getSummaryTitle()}</Text>
      <Text style={styles.introText}>
        {getSummaryDescription()}
      </Text>
      
      <View style={styles.costTable}>
        {/* Table Header */}
        <View style={styles.tableHeaderYellow}>
          <Text style={styles.tableHeaderDescription}>DESCRIPTION</Text>
          <Text style={styles.tableHeaderCurrency}>AED</Text>
          <Text style={styles.tableHeaderCurrency}>{secondaryCurrency}</Text>
        </View>

        {/* Cost Items */}
        {costItems.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCellDescription}>{item.description}</Text>
            <Text style={styles.tableCellAmount}>{formatNumber(item.amount)}</Text>
            <Text style={styles.tableCellAmount}>{formatNumber(item.secondaryAmount)}</Text>
          </View>
        ))}

        {/* Total Row */}
        <View style={styles.totalRowYellow}>
          <Text style={[styles.totalLabel, { color: 'white' }]}>TOTAL</Text>
          <Text style={[styles.totalAmount, { color: 'white' }]}>{formatNumber(totalAmount)}</Text>
          <Text style={[styles.totalAmount, { color: 'white' }]}>{formatNumber(totalAmount / exchangeRate)}</Text>
        </View>
      </View>
    </View>
  );
}; 