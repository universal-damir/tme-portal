import React from 'react';
import { View } from '@react-pdf/renderer';
import { CompactCostTable } from '../../shared';
import { generateGoldenVisaAuthorityFeesBreakdown } from '../../../utils/goldenVisaDataTransformer';
import type { PDFComponentProps, CostItem } from '../../../types';
import type { GoldenVisaData } from '@/types/golden-visa';

// AuthorityFeesSection - Authority cost breakdown table with compact styling
// Uses shared CompactCostTable component for clean, compact appearance without section backgrounds
export const AuthorityFeesSection: React.FC<PDFComponentProps> = ({ data }) => {
  const exchangeRate = data.clientDetails.exchangeRate;

  // Access golden visa data from transformed data
  const goldenVisaData = (data as PDFComponentProps['data'] & { goldenVisaData: GoldenVisaData }).goldenVisaData;

  // Generate authority fees breakdown using utility function
  const authorityFees = generateGoldenVisaAuthorityFeesBreakdown(goldenVisaData);

  // Convert to CostItem format for CompactCostTable
  const authorityItems: CostItem[] = authorityFees.map(fee => ({
    description: fee.description,
    amount: fee.amount,
    secondaryAmount: fee.amount / exchangeRate,
    isReduction: false
  }));

  // Calculate total from items
  const authorityTotal = authorityItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={{ marginBottom: 16 }}>
      <CompactCostTable
        data={data}
        title="Authority Fees Breakdown"
        items={authorityItems}
        total={authorityTotal}
        secondaryTotal={authorityTotal / exchangeRate}
      />
    </View>
  );
}; 