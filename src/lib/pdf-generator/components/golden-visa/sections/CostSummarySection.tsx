import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { formatNumber, formatSecondaryCurrency } from '../../../utils';
import { 
  generateGoldenVisaSpouseVisaBreakdown,
  generateGoldenVisaChildrenVisaBreakdown 
} from '../../../utils/goldenVisaDataTransformer';
import { getFreezonePdfLabel } from '@/components/golden-visa/utils/goldenVisaConfig';
import { GOLDEN_VISA_TRANSLATIONS, Locale } from '../../../translations/golden-visa';
import type { PDFComponentProps, CostItem } from '../../../types';

// CostSummarySection - Overview table for cover page
// Similar to InitialCostSummarySection in cost overview
export const CostSummarySection: React.FC<PDFComponentProps> = ({ data }) => {
  const exchangeRate = data.clientDetails.exchangeRate;
  const secondaryCurrency = data.clientDetails.secondaryCurrency;

  // Access golden visa data from transformed data
  const goldenVisaData = (data as any).goldenVisaData;
  const locale: Locale = (data as any).locale || 'en';
  const t = GOLDEN_VISA_TRANSLATIONS[locale];

  // Get visa type display name for dynamic title and descriptions (sentence case with exceptions)
  const getVisaTypeDisplay = () => {
    switch (goldenVisaData?.visaType) {
      case 'property-investment':
        return t.visaTypes['property-investment'];
      case 'time-deposit':
        return t.visaTypes['time-deposit'];
      case 'skilled-employee':
        return t.visaTypes['skilled-employee'];
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
                       fees.emiratesIdFee + fees.immigrationResidencyFee;
        if (fees.visaCancelation) authorityTotal += fees.visaCancelationFee;
      } else {
        // Fallback to legacy calculation
        authorityTotal = goldenVisaData?.governmentFee || 0;
      }
      
      // 1. Authority Costs line
      items.push({
        description: `${itemNumber}. ${t.costSummary.costItems.authorityCosts}`,
        amount: authorityTotal,
        secondaryAmount: authorityTotal / exchangeRate,
        isReduction: false
      });
      itemNumber++;
      
      // 2. NOC fee as separate line (only for skilled employee with NOC)
      if (goldenVisaData?.requiresNOC && goldenVisaData?.selectedFreezone && goldenVisaData?.freezoneNocFee) {
        const freezoneLabel = getFreezonePdfLabel(goldenVisaData.selectedFreezone);
        items.push({
          description: `${itemNumber}. ${freezoneLabel} ${t.costSummary.costItems.nocCost}`,
          amount: goldenVisaData.freezoneNocFee,
          secondaryAmount: goldenVisaData.freezoneNocFee / exchangeRate,
          isReduction: false
        });
        itemNumber++;
      }
      
      // 3. Salary Certificate fee as separate line (only for skilled employee with salary certificate)
      if (goldenVisaData?.requiresSalaryCertificate && goldenVisaData?.selectedSalaryCertificateFreezone && goldenVisaData?.salaryCertificateFee) {
        const freezoneLabel = getFreezonePdfLabel(goldenVisaData.selectedSalaryCertificateFreezone);
        items.push({
          description: `${itemNumber}. ${freezoneLabel} ${t.costSummary.costItems.salaryCertificate}`,
          amount: goldenVisaData.salaryCertificateFee,
          secondaryAmount: goldenVisaData.salaryCertificateFee / exchangeRate,
          isReduction: false
        });
        itemNumber++;
      }
    }
    
    // 4. Spouse Visa (if selected)
    const hasSpouse = Boolean(goldenVisaData?.dependents?.spouse?.required);
    if (hasSpouse) {
      const spouseVisa = generateGoldenVisaSpouseVisaBreakdown(goldenVisaData, locale);
      const spouseVisaTotal = spouseVisa.reduce((sum, service) => sum + service.amount, 0);
      
      items.push({
        description: `${itemNumber}. ${t.costSummary.costItems.spouseVisa}`,
        amount: spouseVisaTotal,
        secondaryAmount: spouseVisaTotal / exchangeRate,
        isReduction: false
      });
      itemNumber++;
    }
    
    // 5. Children Visa (if selected)
    const hasChildren = Boolean((goldenVisaData?.dependents?.children?.count || 0) > 0);
    if (hasChildren) {
      const numberOfChildren = goldenVisaData?.dependents?.children?.count || 0;
      const childText = numberOfChildren === 1 ? t.costSummary.costItems.childVisa : t.costSummary.costItems.childrenVisa;
      const childrenVisa = generateGoldenVisaChildrenVisaBreakdown(goldenVisaData, locale);
      const childrenVisaTotal = childrenVisa.reduce((sum, service) => sum + service.amount, 0);
      
      const description = numberOfChildren > 1 
        ? `${itemNumber}. ${childText} ${t.costSummary.costItems.childrenCount(numberOfChildren)}`
        : `${itemNumber}. ${childText}`;
      
      items.push({
        description,
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
        description: `${itemNumber}. ${t.costSummary.costItems.tmeServices}`,
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
      return t.costSummary.titles.dependent;
    }

    // Check for dependents
    const hasSpouse = Boolean(goldenVisaData?.dependents?.spouse?.required);
    const hasChildren = Boolean((goldenVisaData?.dependents?.children?.count || 0) > 0);
    
    if (hasSpouse || hasChildren) {
      // Generate dependent text
      let dependentText = '';
      if (hasSpouse && hasChildren) {
        dependentText = t.costSummary.titles.dependentPlural;
      } else if (hasSpouse) {
        dependentText = t.costSummary.titles.dependentSingle;
      } else if (hasChildren) {
        const numberOfChildren = goldenVisaData?.dependents?.children?.count || 0;
        dependentText = numberOfChildren === 1 ? t.costSummary.titles.dependentSingle : t.costSummary.titles.dependentPlural;
      }
      
      return t.costSummary.titles.withDependents(getVisaTypeDisplay(), dependentText);
    }
    
    // Return appropriate title based on visa type
    switch (goldenVisaData?.visaType) {
      case 'property-investment':
        return t.costSummary.titles.propertyInvestment;
      case 'time-deposit':
        return t.costSummary.titles.timeDeposit;
      case 'skilled-employee':
        return t.costSummary.titles.skilledEmployee;
      default:
        return `${getVisaTypeDisplay()} Golden Visa Summary`;
    }
  };

  const getSummaryDescription = () => {
    if (!goldenVisaData?.primaryVisaRequired) {
      return t.costSummary.descriptions.dependent;
    }
    return t.costSummary.descriptions.standard;
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
          <Text style={styles.tableHeaderDescription}>{t.costSummary.tableHeaders.description}</Text>
          <Text style={styles.tableHeaderCurrency}>{t.costSummary.tableHeaders.aed}</Text>
          <Text style={styles.tableHeaderCurrency}>{secondaryCurrency}</Text>
        </View>

        {/* Cost Items */}
        {costItems.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCellDescription}>{item.description}</Text>
            <Text style={styles.tableCellAmount}>{formatNumber(item.amount)}</Text>
            <Text style={styles.tableCellAmount}>{formatSecondaryCurrency(item.secondaryAmount)}</Text>
          </View>
        ))}

        {/* Total Row */}
        <View style={styles.totalRowYellow}>
          <Text style={[styles.totalLabel, { color: 'white', flex: 5, paddingLeft: 8 }]}>{t.costSummary.tableHeaders.total}</Text>
          <Text style={[styles.totalAmount, { color: 'white' }]}>{formatNumber(totalAmount)}</Text>
          <Text style={[styles.totalAmount, { color: 'white' }]}>{formatSecondaryCurrency(totalAmount / exchangeRate)}</Text>
        </View>
      </View>
    </View>
  );
}; 