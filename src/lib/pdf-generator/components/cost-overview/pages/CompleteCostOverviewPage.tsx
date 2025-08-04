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
  totalLabel?: string;
  tableIndex: number;
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

  // Pre-calculate items to determine dynamic spacing (before using in styles)
  const preCalculateItems = () => {
    const setupItems = costs?.initialSetup ? Object.keys(costs.initialSetup).length : 0;
    const visaItems = hasVisas && costs?.visaCosts ? 5 : 0; // Approximate visa items
    const yearlyItems = costs?.yearlyRunning ? Object.keys(costs.yearlyRunning).length : 0;
    const additionalItems = data.additionalServices ? 
      Object.entries(data.additionalServices).filter(([_, value]) => value && value > 0).length : 0;
    
    return setupItems + visaItems + yearlyItems + additionalItems;
  };

  const estimatedTotalItems = preCalculateItems();
  
  // SIMPLE BULLETPROOF SOLUTION - Your requirements, simple math
  const getSpacingConfig = (totalItems: number, numberOfTables: number) => {
    const pageHeight = 842;
    const fixedSpace = 160; // Header (~80) + Footer (~20) + Intro (~60)
    const availableSpace = pageHeight - fixedSpace; // 682pt for tables
    
    // YOUR REQUIREMENTS:
    // - Average: 32 rows, font 10pt
    // - Extreme: never below font 8pt
    // - Equal distribution, fits on one page
    
    // Calculate font size based on content density
    let fontSize;
    if (totalItems <= 35) {
      fontSize = 10; // Your preferred size for average content (≤35 items)
    } else {
      // Scale down from 10pt to 8pt as items increase from 35 to 43
      const scaleFactor = Math.max(0.8, 1 - ((totalItems - 35) * 0.025));
      fontSize = Math.max(7.5, 10 * scaleFactor - 0.5); // Half point smaller for extreme
    }
    
    // Calculate row height: font + minimal padding (2pt top + 2pt bottom) + borders
    const minRowHeight = fontSize + 4 + 2; // font + padding + border space
    const totalContentHeight = totalItems * minRowHeight;
    
    // Remaining space for table margins - only between tables (not after last one)
    const remainingSpace = availableSpace - totalContentHeight;
    let tableMargin = remainingSpace / (numberOfTables - 1); // Divide by N-1 (gaps between tables)
    
    // For extreme cases (>35 items), reduce margins much more
    if (totalItems > 35) {
      tableMargin = tableMargin * 0.3; // 70% LESS margin for extreme cases only
    }
    
    // Apply minimum after reduction
    tableMargin = Math.max(4, tableMargin); // Lower minimum for extreme cases
    
    // Row padding: normal for average, smaller for extreme
    const rowPadding = totalItems > 35 ? 1.5 : 2; // Half point smaller for extreme cases
    
    return {
      rowPadding: rowPadding,
      tableMargin: tableMargin,
      sectionSpacing: 8,
      fontSize: fontSize
    };
  };

  // Calculate table count first
  const getEstimatedTableCount = () => {
    let count = 0;
    if (shouldShowInitialSetup(data.authorityInformation.responsibleAuthority)) count++;
    if (hasVisas) count++;
    if (shouldShowInitialSetup(data.authorityInformation.responsibleAuthority)) count++; // yearly running
    // Approximate additional services (we'll get exact count later)
    if (data.additionalServices && Object.entries(data.additionalServices).some(([_, value]) => value && value > 0)) count++;
    return count;
  };

  const estimatedTableCount = getEstimatedTableCount();
  const spacingConfig = getSpacingConfig(estimatedTotalItems, estimatedTableCount);
  
  // Dynamic headline and paragraph based on visa selection
  const numberOfVisas = data.visaCosts?.numberOfVisas || 0;
  const visaText = numberOfVisas === 1 ? 'visa' : 'visas';
  const headline = hasVisas 
    ? `Complete Cost Overview for Company Setup, ${visaText.charAt(0).toUpperCase() + visaText.slice(1)}, and Yearly Running Costs, and Additional Services`
    : "Complete Cost Overview for Company Setup, Yearly Running Costs, and Additional Services";
    
  const introText = hasVisas
    ? `For your convenience, here is an overview of all costs related to setting up your business and obtaining ${visaText}. It also includes annual expenses for maintaining your business after the first year, along with additional services we offer for your reference.`
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

  // Compact table styles (full width) - Dynamic based on content
  const getCompactTableStyles = (optimalMargin: number) => ({
    tableContainer: {
      width: '100%',
      backgroundColor: '#ffffff',
      borderRadius: 4,
      border: '1px solid #e5e7eb',
      marginBottom: optimalMargin,
    },
    sectionTitle: {
      fontSize: Math.max(8, spacingConfig.fontSize + 1),
      fontWeight: 'bold',
      color: '#1f2937',
      padding: spacingConfig.sectionSpacing / 4,
      marginBottom: spacingConfig.sectionSpacing / 2,
    },
    tableHeader: {
      flexDirection: 'row' as const,
      backgroundColor: '#059669',
      padding: spacingConfig.rowPadding,
      fontSize: spacingConfig.fontSize,
      fontWeight: 'bold' as const,
      color: 'white',
      borderRadius: 2,
    },
    tableHeaderBlue: {
      flexDirection: 'row' as const,
      backgroundColor: '#2563eb',
      padding: spacingConfig.rowPadding,
      fontSize: spacingConfig.fontSize,
      fontWeight: 'bold' as const,
      color: 'white',
      borderRadius: 2,
    },
    tableHeaderYellow: {
      flexDirection: 'row' as const,
      backgroundColor: '#eab308',
      padding: spacingConfig.rowPadding,
      fontSize: spacingConfig.fontSize,
      fontWeight: 'bold' as const,
      color: 'white',
      borderRadius: 2,
    },
    tableHeaderPurple: {
      flexDirection: 'row' as const,
      backgroundColor: '#7c3aed',
      padding: spacingConfig.rowPadding,
      fontSize: spacingConfig.fontSize,
      fontWeight: 'bold' as const,
      color: 'white',
      borderRadius: 2,
    },
    tableHeaderOrange: {
      flexDirection: 'row' as const,
      backgroundColor: '#d97706',
      padding: spacingConfig.rowPadding,
      fontSize: spacingConfig.fontSize,
      fontWeight: 'bold' as const,
      color: 'white',
      borderRadius: 2,
    },
    tableRow: {
      flexDirection: 'row' as const,
      padding: spacingConfig.rowPadding,
      borderBottom: '1px solid #f3f4f6',
    },
    tableCellDescription: {
      fontSize: spacingConfig.fontSize,
      color: '#1f2937',
      flex: 4,
      paddingLeft: 4,
      textAlign: 'left' as const,
    },
    tableCellDescriptionRed: {
      fontSize: spacingConfig.fontSize,
      color: '#dc2626',
      flex: 4,
      paddingLeft: 4,
      textAlign: 'left' as const,
    },
    tableCellAmount: {
      fontSize: spacingConfig.fontSize,
      color: '#1f2937',
      flex: 0.8,
      paddingRight: 2,
      textAlign: 'right' as const,
    },
    tableCellAmountRed: {
      fontSize: spacingConfig.fontSize,
      color: '#dc2626',
      flex: 0.8,
      paddingRight: 2,
      textAlign: 'right' as const,
    },
    totalRow: {
      flexDirection: 'row' as const,
      backgroundColor: '#059669',
      color: 'white',
      padding: spacingConfig.rowPadding,
      fontWeight: 'bold' as const,
      fontSize: spacingConfig.fontSize,
      marginTop: spacingConfig.sectionSpacing / 4,
      borderRadius: 2,
    },
    totalRowBlue: {
      flexDirection: 'row' as const,
      backgroundColor: '#2563eb',
      color: 'white',
      padding: spacingConfig.rowPadding,
      fontWeight: 'bold' as const,
      fontSize: spacingConfig.fontSize,
      marginTop: spacingConfig.sectionSpacing / 4,
      borderRadius: 2,
    },
    totalRowYellow: {
      flexDirection: 'row' as const,
      backgroundColor: '#eab308',
      color: 'white',
      padding: spacingConfig.rowPadding,
      fontWeight: 'bold' as const,
      fontSize: spacingConfig.fontSize,
      marginTop: spacingConfig.sectionSpacing / 4,
      borderRadius: 2,
    },
    totalRowPurple: {
      flexDirection: 'row' as const,
      backgroundColor: '#7c3aed',
      color: 'white',
      padding: spacingConfig.rowPadding,
      fontWeight: 'bold' as const,
      fontSize: spacingConfig.fontSize,
      marginTop: spacingConfig.sectionSpacing / 4,
      borderRadius: 2,
    },
    totalRowOrange: {
      flexDirection: 'row' as const,
      backgroundColor: '#d97706',
      color: 'white',
      padding: spacingConfig.rowPadding,
      fontWeight: 'bold' as const,
      fontSize: spacingConfig.fontSize,
      marginTop: spacingConfig.sectionSpacing / 4,
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
  });

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

  // Compact table renderer with dynamic styles
  const CompactCostTable: React.FC<CompactCostTableProps> = ({ title, items, total, secondaryTotal, theme, showTotal = true, totalLabel = "Total", tableIndex }) => {
    const dynamicTableStyles = getTableStyles(tableIndex);
    const getThemeStyles = (theme: string) => {
      switch (theme) {
        case 'green':
          return {
            header: dynamicTableStyles.tableHeader,
            totalRow: dynamicTableStyles.totalRow,
          };
        case 'blue':
          return {
            header: dynamicTableStyles.tableHeaderBlue,
            totalRow: dynamicTableStyles.totalRowBlue,
          };
        case 'yellow':
          return {
            header: dynamicTableStyles.tableHeaderYellow,
            totalRow: dynamicTableStyles.totalRowYellow,
          };
        case 'purple':
          return {
            header: dynamicTableStyles.tableHeaderPurple,
            totalRow: dynamicTableStyles.totalRowPurple,
          };
        case 'orange':
          return {
            header: dynamicTableStyles.tableHeaderOrange,
            totalRow: dynamicTableStyles.totalRowOrange,
          };
        default:
          return {
            header: dynamicTableStyles.tableHeader,
            totalRow: dynamicTableStyles.totalRow,
          };
      }
    };

    const themeStyles = getThemeStyles(theme);

    return (
      <View style={dynamicTableStyles.tableContainer}>
        <Text style={dynamicTableStyles.sectionTitle}>{title}</Text>
        
        {/* Header */}
        <View style={themeStyles.header}>
          <Text style={dynamicTableStyles.headerDescription}>Description</Text>
          <Text style={dynamicTableStyles.headerCurrency}>AED</Text>
          <Text style={dynamicTableStyles.headerCurrency}>{secondaryCurrency}</Text>
        </View>

        {/* Rows */}
        {items.map((item, index) => (
          <View key={index} style={dynamicTableStyles.tableRow}>
            <Text style={
              item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction')
                ? dynamicTableStyles.tableCellDescriptionRed
                : dynamicTableStyles.tableCellDescription
            }>
              {item.description}
            </Text>
            <Text style={
              item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction')
                ? dynamicTableStyles.tableCellAmountRed
                : dynamicTableStyles.tableCellAmount
            }>
              {(item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction')) ? '-' : ''}{formatNumber(item.amount)}
            </Text>
            <Text style={
              item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction')
                ? dynamicTableStyles.tableCellAmountRed
                : dynamicTableStyles.tableCellAmount
            }>
              {(item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction')) ? '-' : ''}{formatNumber(item.secondaryAmount)}
            </Text>
          </View>
        ))}

        {/* Total */}
        {showTotal && (
          <View style={themeStyles.totalRow}>
            <Text style={dynamicTableStyles.totalLabel}>{totalLabel}</Text>
            <Text style={dynamicTableStyles.totalAmount}>{formatNumber(total)}</Text>
            <Text style={dynamicTableStyles.totalAmount}>{formatNumber(secondaryTotal)}</Text>
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

  // Calculate how many tables will be shown to distribute spacing better
  const getTableCount = () => {
    let count = 0;
    if (shouldShowInitialSetup(data.authorityInformation.responsibleAuthority)) count++;
    if (hasVisas) count++;
    if (shouldShowInitialSetup(data.authorityInformation.responsibleAuthority)) count++; // yearly running
    if (additionalServicesItems.length > 0) count++;
    return count;
  };
  
  const tableCount = getTableCount();
  
  // Dynamic margin - different for each table position
  const getOptimalTableMargin = (tableIndex: number, totalTables: number) => {
    // Last table gets no margin, others get the calculated margin
    return tableIndex === totalTables - 1 ? 0 : spacingConfig.tableMargin;
  };
  
  // Get styles function that takes table index
  const getTableStyles = (tableIndex: number) => {
    const margin = getOptimalTableMargin(tableIndex, tableCount);
    return getCompactTableStyles(margin);
  };

  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      {/* Custom intro section with normal spacing */}
      <View style={styles.introSection}>
        {/* Main headline */}
        <Text style={[styles.introHeadline, { marginBottom: 8 }]}>Complete Cost Overview</Text>
        
        {/* Content paragraph */}
        <Text style={styles.introText}>{introText}</Text>
      </View>

      {/* Dynamic table rendering with correct indexes */}
      {(() => {
        let currentTableIndex = 0;
        const tables = [];

        // Initial Setup Table
        if (shouldShowInitialSetup(data.authorityInformation.responsibleAuthority)) {
          tables.push(
            <CompactCostTable
              key="initial-setup"
              title={generateInitialSetupTitle()}
              items={initialSetupItems}
              total={setupTotal}
              secondaryTotal={setupTotal / exchangeRate}
              theme="green"
              totalLabel="Total One-Time Initial Setup Cost"
              tableIndex={currentTableIndex++}
            />
          );
        }

        // Company Visa Costs Table
        if (hasVisas) {
          tables.push(
            <CompactCostTable
              key="visa-costs"
              title={generateVisaTitle()}
              items={visaItems}
              total={visaTotal}
              secondaryTotal={visaTotal / exchangeRate}
              theme="blue"
              totalLabel="Total Visa Cost"
              tableIndex={currentTableIndex++}
            />
          );
        }

        // Yearly Running Costs Table
        if (shouldShowInitialSetup(data.authorityInformation.responsibleAuthority)) {
          tables.push(
            <CompactCostTable
              key="yearly-running"
              title={generateYearlyRunningTitle()}
              items={yearlyRunningItems}
              total={yearlyTotal}
              secondaryTotal={yearlyTotal / exchangeRate}
              theme="yellow"
              totalLabel="Total Yearly Running Cost"
              tableIndex={currentTableIndex++}
            />
          );
        }

        // Additional Services Table
        if (additionalServicesItems.length > 0) {
          tables.push(
            <CompactCostTable
              key="additional-services"
              title="Additional Services"
              items={additionalServicesItems}
              total={additionalServicesItems.reduce((sum, item) => sum + item.amount, 0)}
              secondaryTotal={additionalServicesItems.reduce((sum, item) => sum + item.secondaryAmount, 0)}
              theme="orange"
              showTotal={false}
              tableIndex={currentTableIndex++}
            />
          );
        }

        return tables;
      })()}

      <FooterComponent />
    </Page>
  );
}; 