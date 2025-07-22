import React from 'react';
import { View } from '@react-pdf/renderer';
import { CompactCostTable } from '../../shared';
import { generateGoldenVisaTMEServicesBreakdown } from '../../../utils/goldenVisaDataTransformer';
import type { PDFComponentProps, CostItem } from '../../../types';
import type { GoldenVisaData } from '@/types/golden-visa';

// TMEServicesSection - TME services cost breakdown table with compact styling
// Uses shared CompactCostTable component for clean, compact appearance without section backgrounds
export const TMEServicesSection: React.FC<PDFComponentProps> = ({ data }) => {
  const exchangeRate = data.clientDetails.exchangeRate;

  // Access golden visa data from transformed data
  const goldenVisaData = (data as PDFComponentProps['data'] & { goldenVisaData: GoldenVisaData }).goldenVisaData;

  // Generate TME services breakdown using utility function
  const tmeServices = generateGoldenVisaTMEServicesBreakdown(goldenVisaData);

  // Convert to CostItem format for CompactCostTable
  const tmeServicesItems: CostItem[] = tmeServices.map(service => ({
    description: service.description,
    amount: service.amount,
    secondaryAmount: service.amount / exchangeRate,
    isReduction: false
  }));

  // Calculate total from items
  const tmeServicesTotal = tmeServicesItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={{ marginBottom: 16 }}>
      <CompactCostTable
        data={data}
        title="TME Services Fee Breakdown"
        items={tmeServicesItems}
        total={tmeServicesTotal}
        secondaryTotal={tmeServicesTotal / exchangeRate}
      />
    </View>
  );
}; 