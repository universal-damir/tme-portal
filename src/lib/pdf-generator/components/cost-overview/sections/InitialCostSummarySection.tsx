import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { formatNumber, calculateAllCosts, calculateTotals } from '../../../utils';
import type { PDFComponentProps } from '../../../types';

// InitialCostSummarySection - Summary table for first page
// Shows: Initial Company Setup Cost, Company Visa Cost, Total Initial Cost
export const InitialCostSummarySection: React.FC<PDFComponentProps> = ({ data }) => {
  const { costs } = calculateAllCosts(data);
  const { setupTotal } = calculateTotals(data, costs);
  const exchangeRate = data.clientDetails.exchangeRate;
  const secondaryCurrency = data.clientDetails.secondaryCurrency;

  // Calculate visa costs total (company visa only for initial summary)
  const companyVisaTotal = costs?.visaCosts.total || 0;
  
  // Calculate total initial cost
  const totalInitialCost = setupTotal + companyVisaTotal;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Initial Cost Summary</Text>
      <Text style={styles.introText}>
      This represents the overall cost for the initial company setup and company visas. A detailed cost breakdown is provided later in the offer for full transparency.
      </Text>
      <View style={styles.costTable}>
        {/* Table Header */}
        <View style={styles.tableHeaderGrey}>
          <Text style={styles.tableHeaderDescription}>DESCRIPTION</Text>
          <Text style={styles.tableHeaderCurrency}>AED</Text>
          <Text style={styles.tableHeaderCurrency}>{secondaryCurrency}</Text>
        </View>

        {/* Company Setup Cost Row */}
        <View style={styles.tableRow}>
          <Text style={styles.tableCellDescription}>
            {(() => {
              const licenseYears = data.ifzaLicense?.licenseYears || 1;
              const isIFZAMultiYear = data.authorityInformation.responsibleAuthority === 'IFZA (International Free Zone Authority)' && licenseYears > 1;
              return isIFZAMultiYear ? `Company Setup Cost (For ${licenseYears} years)` : 'Company Setup Cost';
            })()}
          </Text>
          <Text style={styles.tableCellAmount}>{formatNumber(setupTotal)}</Text>
          <Text style={styles.tableCellAmount}>{formatNumber(setupTotal / exchangeRate)}</Text>
        </View>

        {/* Company Visa Cost Row - Only show if visa cost > 0 */}
        {companyVisaTotal > 0 && (
          <View style={styles.tableRow}>
            <Text style={styles.tableCellDescription}>Company Visa Cost</Text>
            <Text style={styles.tableCellAmount}>{formatNumber(companyVisaTotal)}</Text>
            <Text style={styles.tableCellAmount}>{formatNumber(companyVisaTotal / exchangeRate)}</Text>
          </View>
        )}

        {/* Total Row */}
        <View style={styles.totalRowGrey}>
          <Text style={[styles.totalLabel, { flex: 5, paddingLeft: 8 }]}>TOTAL INITIAL COST</Text>
          <Text style={styles.totalAmount}>{formatNumber(totalInitialCost)}</Text>
          <Text style={styles.totalAmount}>{formatNumber(totalInitialCost / exchangeRate)}</Text>
        </View>
      </View>
    </View>
  );
}; 