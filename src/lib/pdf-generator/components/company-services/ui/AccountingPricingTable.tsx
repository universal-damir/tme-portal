import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { MONTHLY_PRICING, QUARTERLY_YEARLY_PRICING } from '../utils/accountingPricingData';

// Helper function to format currency with comma separators
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US');
};

// Component to render accounting pricing table
export const AccountingPricingTable: React.FC<{
  data: any;
  serviceType: string;
  transactionTier: number;
  exchangeRate: number;
  secondaryCurrency: string;
}> = ({ data, serviceType, transactionTier, exchangeRate, secondaryCurrency }) => {
  
  // Get display tiers based on service type - always show 3 tiers
  const getDisplayTiers = (): number[] => {
    if (serviceType === 'monthly') {
      const tiers = Object.keys(MONTHLY_PRICING).map(Number).sort((a, b) => a - b);
      const currentIndex = tiers.findIndex(tier => tier === transactionTier);
      if (currentIndex !== -1) {
        let startIndex = currentIndex;
        // If we're near the end, adjust start index to show 3 items
        if (currentIndex + 3 > tiers.length) {
          startIndex = Math.max(0, tiers.length - 3);
        }
        return tiers.slice(startIndex, startIndex + 3);
      }
      return [];
    } else {
      const tiers = Object.keys(QUARTERLY_YEARLY_PRICING).map(Number).sort((a, b) => a - b);
      const currentIndex = tiers.findIndex(tier => tier === transactionTier);
      if (currentIndex !== -1) {
        let startIndex = currentIndex;
        // If we're near the end, adjust start index to show 3 items
        if (currentIndex + 3 > tiers.length) {
          startIndex = Math.max(0, tiers.length - 3);
        }
        return tiers.slice(startIndex, startIndex + 3);
      }
      return [];
    }
  };

  const displayTiers = getDisplayTiers();

  // Group rows by transaction tier
  const groupedRows = displayTiers.map(tier => {
    const tierRows: any[] = [];
    
    if (serviceType === 'monthly') {
      // Monthly service - show only monthly pricing
      const monthlyPrice = MONTHLY_PRICING[tier as keyof typeof MONTHLY_PRICING];
      const annualTotal = monthlyPrice * 12;
      
      tierRows.push({
        paymentFrequency: 'Monthly (12 payments/year)',
        costPerPeriod: monthlyPrice,
        annualTotal: annualTotal,
        annualSavings: '-',
        annualSavingsAmount: 0
      });
    } else {
      // Quarterly/Yearly service - show all three options
      const pricing = QUARTERLY_YEARLY_PRICING[tier as keyof typeof QUARTERLY_YEARLY_PRICING];
      const monthlyAnnualTotal = pricing.monthly * 12;
      const quarterlySavings = monthlyAnnualTotal - pricing.quarterly * 4;
      const yearlySavings = monthlyAnnualTotal - pricing.yearly;
      
      tierRows.push({
        paymentFrequency: 'Monthly (12 payments/year)',
        costPerPeriod: pricing.monthly,
        annualTotal: monthlyAnnualTotal,
        annualSavings: '-',
        annualSavingsAmount: 0
      });
      
      tierRows.push({
        paymentFrequency: 'Quarterly (4 payments/year)',
        costPerPeriod: pricing.quarterly,
        annualTotal: pricing.quarterly * 4,
        annualSavings: formatCurrency(quarterlySavings),
        annualSavingsAmount: quarterlySavings
      });
      
      tierRows.push({
        paymentFrequency: 'Yearly (1 payment/year)',
        costPerPeriod: pricing.yearly,
        annualTotal: pricing.yearly,
        annualSavings: formatCurrency(yearlySavings),
        annualSavingsAmount: yearlySavings
      });
    }
    
    return {
      tier,
      transactionVolume: `Up to ${tier} Transactions per Month (${tier * 12} per Year)`,
      rows: tierRows
    };
  });

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Individual Tables for Each Tier */}
      {groupedRows.map((group, groupIndex) => (
        <View key={group.tier} style={{
          marginBottom: 8,
          border: '1px solid #e5e7eb',
          borderRadius: 4,
          backgroundColor: '#ffffff'
        }}>
          {/* Tier Header */}
          <View style={{
            backgroundColor: '#f3f4f6',
            padding: 6,
            borderBottom: '1px solid #e5e7eb'
          }}>
            <Text style={{
              fontSize: 9,
              fontWeight: 'bold',
              color: '#374151',
              textAlign: 'center',
              marginBottom: 8
            }}>
              {group.transactionVolume}
            </Text>
            
            {/* Column Headers */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: '#243F7B',
              padding: 6,
              borderRadius: 4
            }}>
              <Text style={{
                flex: 1.5,
                fontSize: 9,
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                borderRight: '1px solid #4b5563'
              }}>
                Payment Frequency
              </Text>
              <Text style={{
                flex: 2,
                fontSize: 9,
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                borderRight: '1px solid #4b5563'
              }}>
                Cost per Period
              </Text>
              <Text style={{
                flex: 2,
                fontSize: 9,
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                borderRight: '1px solid #4b5563'
              }}>
                Annual Total
              </Text>
              <Text style={{
                flex: 1.5,
                fontSize: 9,
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center'
              }}>
                Annual Savings
              </Text>
            </View>
          </View>
          
          {/* Tier Rows */}
          {group.rows.map((row, rowIndex) => (
            <View key={rowIndex} style={{
              flexDirection: 'row',
              padding: 4,
              borderBottom: rowIndex < group.rows.length - 1 ? '1px solid #f3f4f6' : 'none',
              backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb'
            }}>
              <Text style={{
                flex: 1.5,
                fontSize: 8,
                color: '#374151',
                textAlign: 'center',
                borderRight: '1px solid #e5e7eb',
                paddingVertical: 4
              }}>
                {row.paymentFrequency}
              </Text>
              <Text style={{
                flex: 2,
                fontSize: 8,
                color: '#374151',
                textAlign: 'right',
                borderRight: '1px solid #e5e7eb',
                paddingVertical: 4,
                paddingRight: 6
              }}>
                AED {formatCurrency(row.costPerPeriod)}<Text style={{ color: '#9ca3af', fontSize: 7 }}> ({secondaryCurrency} {Math.round(row.costPerPeriod / exchangeRate).toLocaleString()})</Text>
              </Text>
              <Text style={{
                flex: 2,
                fontSize: 8,
                color: '#374151',
                textAlign: 'right',
                borderRight: '1px solid #e5e7eb',
                paddingVertical: 4,
                paddingRight: 6
              }}>
                AED {formatCurrency(row.annualTotal)}<Text style={{ color: '#9ca3af', fontSize: 7 }}> ({secondaryCurrency} {Math.round(row.annualTotal / exchangeRate).toLocaleString()})</Text>
              </Text>
              <Text style={{
                flex: 1.5,
                fontSize: 8,
                color: row.annualSavings === '-' ? '#374151' : '#059669',
                textAlign: 'right',
                fontWeight: row.annualSavings === '-' ? 'normal' : 'bold',
                paddingVertical: 4,
                paddingRight: 6
              }}>
                {row.annualSavings === '-' ? '-' : <>AED {formatCurrency(row.annualSavingsAmount)}<Text style={{ color: '#9ca3af', fontSize: 7 }}> ({secondaryCurrency} {Math.round(row.annualSavingsAmount / exchangeRate).toLocaleString()})</Text></>}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}; 