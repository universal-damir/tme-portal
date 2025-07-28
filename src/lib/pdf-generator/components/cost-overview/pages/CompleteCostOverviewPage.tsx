import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { HeaderComponent, FooterComponent, IntroSection } from '../../shared';
import { 
  calculateAllCosts, 
  calculateTotals, 
  shouldShowInitialSetup,
  shouldShowVisaCosts,
  generateServiceDescriptions,
  generateNumberedServices,
  formatServiceDescription,
  generateCompanyVisaServiceDescriptions,
  generateNumberedVisaServices,
  formatVisaServiceDescription,
  generateYearlyRunningServiceDescriptions,
  generateNumberedYearlyRunningServices,
  formatYearlyRunningServiceDescription,
  generateAdditionalServiceDescriptions
} from '../../../utils';
import { formatNumber } from '../../../utils';
import type { PDFComponentProps, CostItem } from '../../../types';

// Type definitions
interface CompactCostTableProps {
  title: string;
  items: CostItem[];
  total: number;
  secondaryTotal: number;
  theme: string;
  showTotal?: boolean;
}

// CompleteCostOverviewPage - All cost tables in compact format
export const CompleteCostOverviewPage: React.FC<PDFComponentProps> = ({ data }) => {
  const { costs, authorityConfig } = calculateAllCosts(data);
  const { setupTotal, yearlyTotal } = calculateTotals(data, costs);
  const visaTotal = costs?.visaCosts?.total || 0;
  const exchangeRate = data.clientDetails.exchangeRate;
  const secondaryCurrency = data.clientDetails.secondaryCurrency;

  // Check if visas are selected
  const hasVisas = shouldShowVisaCosts(data);
  
  // Dynamic headline and paragraph based on visa selection
  const headline = hasVisas 
    ? "Complete Cost Overview for Company Setup, Visas, and Yearly Running Costs, and Additional Services"
    : "Complete Cost Overview for Company Setup, Yearly Running Costs, and Additional Services";
    
  const introText = hasVisas
    ? "For your convenience, here is an overview of all costs related to setting up your business and obtaining visas. It also includes annual expenses for maintaining your business after the first year, along with additional services we offer for your reference."
    : "For your convenience, here is an overview of all costs related to setting up your business. It also includes annual expenses for maintaining your business after the first year, along with additional services we offer for your reference.";

  // Generate dynamic titles to match individual pages
  const generateInitialSetupTitle = (): string => {
    // Check if deposits should be included (same logic as individual page)
    const depositsItems = generateDepositsItems();
    const shouldShowDeposits = depositsItems.length > 0;
    const titleSuffix = shouldShowDeposits ? ' (Including Deposits)' : '';
    return `One-Time Initial Setup Cost${titleSuffix}`;
  };

  const generateVisaTitle = (): string => {
    return 'Company Visa Cost';
  };

  const generateYearlyRunningTitle = (): string => {
    const licenseYears = data.ifzaLicense?.licenseYears || 1;
    const isIFZAMultiYear = data.authorityInformation.responsibleAuthority === 'IFZA (International Free Zone Authority)' && licenseYears > 1;
    
    return isIFZAMultiYear 
      ? `Yearly Running Cost (After ${licenseYears} Years)`
      : 'Yearly Running Cost';
  };

  // Helper function to generate deposits items (same logic as individual page)
  const generateDepositsItems = () => {
    const deposits = [];
    const exchangeRate = data.clientDetails.exchangeRate;

    // IFZA deposits
    if (data.ifzaLicense?.depositWithLandlord && (data.ifzaLicense?.depositAmount || 0) > 0) {
      deposits.push({
        description: 'Deposit with Landlord',
        amount: data.ifzaLicense.depositAmount || 0,
        secondaryAmount: (data.ifzaLicense.depositAmount || 0) / exchangeRate
      });
    }

    // DET deposits
    if (data.authorityInformation.responsibleAuthority === 'DET (Dubai Department of Economy and Tourism)' && 
        data.detLicense?.rentType && data.detLicense.rentType !== 'business-center') {
      if (data.detLicense?.officeRentAmount) {
        deposits.push({
          description: 'Landlord Deposit (5% of rent)',
          amount: data.detLicense.officeRentAmount * 0.05,
          secondaryAmount: (data.detLicense.officeRentAmount * 0.05) / exchangeRate
        });
      }
      
      if (data.detLicense?.rentType === 'office') {
        deposits.push({
          description: 'DEWA Deposit',
          amount: 2000,
          secondaryAmount: 2000 / exchangeRate
        });
      } else if (data.detLicense?.rentType === 'warehouse') {
        deposits.push({
          description: 'DEWA Deposit',
          amount: 4000,
          secondaryAmount: 4000 / exchangeRate
        });
      }
    }

    return deposits;
  };

  // Compact table styles (full width)
  const compactTableStyles = {
    tableContainer: {
      width: '100%',
      backgroundColor: '#ffffff',
      borderRadius: 4,
      border: '1px solid #e5e7eb',
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 8,
      fontWeight: 'bold',
      color: '#1f2937',
      padding: 2,
      marginBottom: 4,
    },
    tableHeader: {
      flexDirection: 'row' as const,
      backgroundColor: '#059669',
      padding: 4,
      fontSize: 6,
      fontWeight: 'bold' as const,
      color: 'white',
      borderRadius: 2,
    },
    tableHeaderBlue: {
      flexDirection: 'row' as const,
      backgroundColor: '#2563eb',
      padding: 4,
      fontSize: 6,
      fontWeight: 'bold' as const,
      color: 'white',
      borderRadius: 2,
    },
    tableHeaderYellow: {
      flexDirection: 'row' as const,
      backgroundColor: '#eab308',
      padding: 4,
      fontSize: 6,
      fontWeight: 'bold' as const,
      color: 'white',
      borderRadius: 2,
    },
    tableHeaderPurple: {
      flexDirection: 'row' as const,
      backgroundColor: '#7c3aed',
      padding: 4,
      fontSize: 6,
      fontWeight: 'bold' as const,
      color: 'white',
      borderRadius: 2,
    },
    tableHeaderOrange: {
      flexDirection: 'row' as const,
      backgroundColor: '#d97706',
      padding: 4,
      fontSize: 6,
      fontWeight: 'bold' as const,
      color: 'white',
      borderRadius: 2,
    },
    tableRow: {
      flexDirection: 'row' as const,
      padding: 3,
      borderBottom: '1px solid #f3f4f6',
    },
    tableCellDescription: {
      fontSize: 6,
      color: '#1f2937',
      flex: 4,
      paddingLeft: 4,
      textAlign: 'left' as const,
    },
    tableCellDescriptionRed: {
      fontSize: 6,
      color: '#dc2626',
      flex: 4,
      paddingLeft: 4,
      textAlign: 'left' as const,
    },
    tableCellAmount: {
      fontSize: 6,
      color: '#1f2937',
      flex: 0.8,
      paddingRight: 2,
      textAlign: 'right' as const,
    },
    tableCellAmountRed: {
      fontSize: 6,
      color: '#dc2626',
      flex: 0.8,
      paddingRight: 2,
      textAlign: 'right' as const,
    },
    totalRow: {
      flexDirection: 'row' as const,
      backgroundColor: '#059669',
      color: 'white',
      padding: 4,
      fontWeight: 'bold' as const,
      fontSize: 6,
      marginTop: 2,
      borderRadius: 2,
    },
    totalRowBlue: {
      flexDirection: 'row' as const,
      backgroundColor: '#2563eb',
      color: 'white',
      padding: 4,
      fontWeight: 'bold' as const,
      fontSize: 6,
      marginTop: 2,
      borderRadius: 2,
    },
    totalRowYellow: {
      flexDirection: 'row' as const,
      backgroundColor: '#eab308',
      color: 'white',
      padding: 4,
      fontWeight: 'bold' as const,
      fontSize: 6,
      marginTop: 2,
      borderRadius: 2,
    },
    totalRowPurple: {
      flexDirection: 'row' as const,
      backgroundColor: '#7c3aed',
      color: 'white',
      padding: 4,
      fontWeight: 'bold' as const,
      fontSize: 6,
      marginTop: 2,
      borderRadius: 2,
    },
    totalRowOrange: {
      flexDirection: 'row' as const,
      backgroundColor: '#d97706',
      color: 'white',
      padding: 4,
      fontWeight: 'bold' as const,
      fontSize: 6,
      marginTop: 2,
      borderRadius: 2,
    },
    totalLabel: {
      flex: 4,
      paddingLeft: 4,
    },
    totalAmount: {
      flex: 0.8,
      paddingRight: 2,
      textAlign: 'right' as const,
    },
    headerDescription: {
      flex: 4,
      paddingLeft: 4,
      textAlign: 'left' as const,
    },
    headerCurrency: {
      flex: 0.8,
      paddingRight: 2,
      textAlign: 'right' as const,
    },
  };

  // Generate Initial Setup items
  const generateInitialSetupItems = (): CostItem[] => {
    if (!costs?.initialSetup) return [];
    
    const serviceDescriptions = generateServiceDescriptions(data);
    const numberedServices = generateNumberedServices(serviceDescriptions);
    
    const mainItems = numberedServices.map(service => ({
      description: formatServiceDescription(service),
      amount: service.amount,
      secondaryAmount: service.amount / exchangeRate,
      isReduction: service.isReduction || false
    }));

    // Add deposits if they exist (same logic as individual page)
    const depositsItems = generateDepositsItems();
    if (depositsItems.length > 0) {
      // Add deposits as separate items in the table
      depositsItems.forEach(deposit => {
        mainItems.push({
          description: deposit.description,
          amount: deposit.amount,
          secondaryAmount: deposit.secondaryAmount,
          isReduction: false
        });
      });
    }
    
    return mainItems;
  };

  // Generate Company Visa items
  const generateVisaItems = (): CostItem[] => {
    if (!costs?.visaCosts || !hasVisas) return [];
    
    const companyVisaServiceDescriptions = generateCompanyVisaServiceDescriptions(data, costs.visaCosts, authorityConfig);
    const numberedVisaServices = generateNumberedVisaServices(companyVisaServiceDescriptions);
    
    return numberedVisaServices.map(service => ({
      description: formatVisaServiceDescription(service),
      amount: service.amount,
      secondaryAmount: service.amount / exchangeRate,
      isReduction: service.isReduction
    }));
  };

  // Generate Yearly Running items
  const generateYearlyRunningItems = (): CostItem[] => {
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

  // Generate Additional Services items
  const generateAdditionalServicesItems = (): CostItem[] => {
    if (!data.additionalServices) return [];
    
    const additionalServiceDescriptions = generateAdditionalServiceDescriptions(data);
    
    return additionalServiceDescriptions.map(service => ({
      description: service.description,
      amount: service.amount,
      secondaryAmount: service.amount / exchangeRate,
      isReduction: false
    }));
  };

  // Compact table renderer
  const CompactCostTable: React.FC<CompactCostTableProps> = ({ title, items, total, secondaryTotal, theme, showTotal = true }) => {
    const getThemeStyles = (theme: string) => {
      switch (theme) {
        case 'green':
          return {
            header: compactTableStyles.tableHeader,
            totalRow: compactTableStyles.totalRow,
          };
        case 'blue':
          return {
            header: compactTableStyles.tableHeaderBlue,
            totalRow: compactTableStyles.totalRowBlue,
          };
        case 'yellow':
          return {
            header: compactTableStyles.tableHeaderYellow,
            totalRow: compactTableStyles.totalRowYellow,
          };
        case 'purple':
          return {
            header: compactTableStyles.tableHeaderPurple,
            totalRow: compactTableStyles.totalRowPurple,
          };
        case 'orange':
          return {
            header: compactTableStyles.tableHeaderOrange,
            totalRow: compactTableStyles.totalRowOrange,
          };
        default:
          return {
            header: compactTableStyles.tableHeader,
            totalRow: compactTableStyles.totalRow,
          };
      }
    };

    const themeStyles = getThemeStyles(theme);

    return (
      <View style={compactTableStyles.tableContainer}>
        <Text style={compactTableStyles.sectionTitle}>{title}</Text>
        
        {/* Header */}
        <View style={themeStyles.header}>
          <Text style={compactTableStyles.headerDescription}>Description</Text>
          <Text style={compactTableStyles.headerCurrency}>AED</Text>
          <Text style={compactTableStyles.headerCurrency}>{secondaryCurrency}</Text>
        </View>

        {/* Rows */}
        {items.map((item, index) => (
          <View key={index} style={compactTableStyles.tableRow}>
            <Text style={
              item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction')
                ? compactTableStyles.tableCellDescriptionRed
                : compactTableStyles.tableCellDescription
            }>
              {item.description}
            </Text>
            <Text style={
              item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction')
                ? compactTableStyles.tableCellAmountRed
                : compactTableStyles.tableCellAmount
            }>
              {(item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction')) ? '-' : ''}{formatNumber(item.amount)}
            </Text>
            <Text style={
              item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction')
                ? compactTableStyles.tableCellAmountRed
                : compactTableStyles.tableCellAmount
            }>
              {(item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction')) ? '-' : ''}{formatNumber(item.secondaryAmount)}
            </Text>
          </View>
        ))}

        {/* Total */}
        {showTotal && (
          <View style={themeStyles.totalRow}>
            <Text style={compactTableStyles.totalLabel}>TOTAL</Text>
            <Text style={compactTableStyles.totalAmount}>{formatNumber(total)}</Text>
            <Text style={compactTableStyles.totalAmount}>{formatNumber(secondaryTotal)}</Text>
          </View>
        )}
      </View>
    );
  };

  // Get all the items
  const initialSetupItems = generateInitialSetupItems();
  const visaItems = generateVisaItems();
  const yearlyRunningItems = generateYearlyRunningItems();
  const additionalServicesItems = generateAdditionalServicesItems();

  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      <IntroSection
        headline={headline}
        content={introText}
      />

      {/* Initial Setup Table */}
      {shouldShowInitialSetup(data.authorityInformation.responsibleAuthority) && (
        <CompactCostTable
          title={generateInitialSetupTitle()}
          items={initialSetupItems}
          total={setupTotal}
          secondaryTotal={setupTotal / exchangeRate}
          theme="green"
        />
      )}

      {/* Company Visa Costs Table */}
      {hasVisas && (
        <CompactCostTable
          title={generateVisaTitle()}
          items={visaItems}
          total={visaTotal}
          secondaryTotal={visaTotal / exchangeRate}
          theme="blue"
        />
      )}

      {/* Yearly Running Costs Table */}
      {shouldShowInitialSetup(data.authorityInformation.responsibleAuthority) && (
        <CompactCostTable
          title={generateYearlyRunningTitle()}
          items={yearlyRunningItems}
          total={yearlyTotal}
          secondaryTotal={yearlyTotal / exchangeRate}
          theme="yellow"
        />
      )}

      {/* Additional Services Table */}
      {additionalServicesItems.length > 0 && (
        <CompactCostTable
          title="Additional Services"
          items={additionalServicesItems}
          total={additionalServicesItems.reduce((sum, item) => sum + item.amount, 0)}
          secondaryTotal={additionalServicesItems.reduce((sum, item) => sum + item.secondaryAmount, 0)}
          theme="orange"
          showTotal={false}
        />
      )}

      <FooterComponent />
    </Page>
  );
}; 