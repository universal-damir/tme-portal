import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles, getTableTheme } from '../../styles';
import { formatNumber } from '../../utils';
import type { CostTableProps, CostItem } from '../../types';

// CostTable - the most reusable component in the PDF
// Used for: Initial Setup, Visa Costs, Yearly Running, Additional Services
export const CostTable: React.FC<CostTableProps> = ({ 
  data, 
  title, 
  items, 
  total = 0, 
  secondaryTotal = 0, 
  theme, 
  showDeposits = false,
  depositsItems = [],
  depositsTotal = 0,
  depositsSecondaryTotal = 0,
  showTotal = true
}) => {
  const tableTheme = getTableTheme(theme);
  const secondaryCurrency = data.clientDetails.secondaryCurrency;
  const exchangeRate = data.clientDetails.exchangeRate;

  return (
    <View style={tableTheme.sectionBackground}>
      <Text style={tableTheme.sectionTitle}>{title}</Text>
      <View style={styles.costTable}>
        {/* Table Header */}
        <View style={tableTheme.header}>
          <Text style={theme === 'blue' ? styles.tableHeaderDescriptionWide : styles.tableHeaderDescription}>
            Description
          </Text>
          <Text style={styles.tableHeaderCurrency}>AED</Text>
          <Text style={styles.tableHeaderCurrency}>{secondaryCurrency}</Text>
        </View>

        {/* Table Rows */}
        {items.map((item, index) => {
          // Handle bold formatting for banking services
          const renderDescription = () => {
            // Handle bold formatting for "1 personal" or "1 company" in single line
            if (item.description.includes('1 personal') || item.description.includes('1 company')) {
              return (
                <Text style={
                  (item.isReduction || item.description.startsWith('TME Services Price Reduction'))
                    ? (theme === 'blue' ? styles.tableCellDescriptionWideRed : styles.tableCellDescriptionRed)
                    : (theme === 'blue' 
                        ? styles.tableCellDescriptionWide 
                        : styles.tableCellDescription)
                }>
                  {item.description.includes('1 personal') ? (
                    <>
                      {item.description.split('1 personal')[0]}
                      <Text style={{ fontWeight: 'bold' }}>1 personal</Text>
                      {item.description.split('1 personal')[1]}
                    </>
                  ) : item.description.includes('1 company') ? (
                    <>
                      {item.description.split('1 company')[0]}
                      <Text style={{ fontWeight: 'bold' }}>1 company</Text>
                      {item.description.split('1 company')[1]}
                    </>
                  ) : (
                    item.description
                  )}
                </Text>
              );
            }
            
            return (
              <Text style={
                (item.isReduction || item.description.startsWith('TME Services Price Reduction'))
                  ? (theme === 'blue' ? styles.tableCellDescriptionWideRed : styles.tableCellDescriptionRed)
                  : (theme === 'blue' 
                      ? styles.tableCellDescriptionWide 
                      : styles.tableCellDescription)
              }>
                {item.description}
              </Text>
            );
          };

          return (
            <View key={`cost-item-${index}`} style={styles.tableRow}>
              {renderDescription()}
              <Text style={
                (item.isReduction || item.description.startsWith('TME Services Price Reduction'))
                  ? styles.tableCellAmountRed
                  : styles.tableCellAmount
              }>
                {(item.isReduction || item.description.startsWith('TME Services Price Reduction')) ? '-' : ''}{formatNumber(item.amount)}
              </Text>
              <Text style={
                (item.isReduction || item.description.startsWith('TME Services Price Reduction'))
                  ? styles.tableCellAmountRed
                  : styles.tableCellAmount
              }>
                {(item.isReduction || item.description.startsWith('TME Services Price Reduction')) ? '-' : ''}{formatNumber(item.secondaryAmount)}
              </Text>
            </View>
          );
        })}

        {/* Deposits Section */}
        {showDeposits && depositsItems.length > 0 && (
          <>
            {/* Total without deposits (only show when deposits exist) */}
            <View style={styles.totalRowCompact}>
              <Text style={styles.totalLabel}>Total (without deposits)</Text>
              <Text style={styles.totalAmount}>{formatNumber(total)}</Text>
              <Text style={styles.totalAmount}>{formatNumber(secondaryTotal)}</Text>
            </View>

            {/* Deposits header */}
            <View style={[
              tableTheme.header, 
              { 
                backgroundColor: '#6b7280', 
                marginTop: 2,
                borderRadius: 4 
              }
            ]}>
              <Text style={[
                styles.tableHeaderDescription, 
                { fontWeight: 'bold', color: 'white' }
              ]}>
                Deposits
              </Text>
              <Text style={styles.tableHeaderCurrency}></Text>
              <Text style={styles.tableHeaderCurrency}></Text>
            </View>

            {/* Deposits items */}
            {depositsItems.map((deposit, index) => (
              <View key={`deposit-item-${index}`} style={styles.tableRow}>
                <Text style={styles.tableCellDescription}>{deposit.description}</Text>
                <Text style={styles.tableCellAmount}>{formatNumber(deposit.amount)}</Text>
                <Text style={styles.tableCellAmount}>{formatNumber(deposit.secondaryAmount)}</Text>
              </View>
            ))}
          </>
        )}

        {/* Total Row - Only show when showTotal is true */}
        {showTotal && (
          <View style={tableTheme.totalRow}>
            <Text style={[
              styles.totalLabel, 
              theme === 'blue' ? { flex: 4, paddingLeft: 8 } : { flex: 3, paddingLeft: 8 }
            ]}>
              {showDeposits && depositsItems.length > 0 ? 'Total (including deposits)' : 'TOTAL'}
            </Text>
            <Text style={styles.totalAmount}>
              {formatNumber(showDeposits && depositsItems.length > 0 ? total + depositsTotal : total)}
            </Text>
            <Text style={styles.totalAmount}>
              {formatNumber(showDeposits && depositsItems.length > 0 ? secondaryTotal + depositsSecondaryTotal : secondaryTotal)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}; 