import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles, getTableTheme } from '../../styles';
import { formatNumber, formatSecondaryCurrency } from '../../utils';
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
            // Handle bold formatting for banking account descriptions
            if (item.description.includes('one personal bank account') || item.description.includes('one company bank account') || item.description.includes('one company account') || item.description.includes('1 personal bank account') || item.description.includes('1 personal bank') || item.description.includes('1 company account') || item.description.includes('1 company bank account') || item.description.includes('personal bank account') || item.description.includes('company account')) {
              return (
                <Text style={
                  (item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction'))
                    ? (theme === 'blue' ? styles.tableCellDescriptionWideRed : styles.tableCellDescriptionRed)
                    : (theme === 'blue' 
                        ? styles.tableCellDescriptionWide 
                        : styles.tableCellDescription)
                }>
                  {item.description.includes('one personal bank account') ? (
                    <>
                      {item.description.split('one personal bank account')[0]}
                      <Text style={{ fontWeight: 'bold' }}>one personal bank account</Text>
                      {item.description.split('one personal bank account')[1]}
                    </>
                  ) : item.description.includes('one company bank account') ? (
                    <>
                      {item.description.split('one company bank account')[0]}
                      <Text style={{ fontWeight: 'bold' }}>one company bank account</Text>
                      {item.description.split('one company bank account')[1]}
                    </>
                  ) : item.description.includes('one company bank account') ? (
                    <>
                      {item.description.split('one company account')[0]}
                      <Text style={{ fontWeight: 'bold' }}>one company account</Text>
                      {item.description.split('one company bank account')[1]}
                    </>
                  ) : item.description.includes('1 personal bank account') ? (
                    <>
                      {item.description.split('1 personal bank account')[0]}
                      <Text style={{ fontWeight: 'bold' }}>1 personal bank account</Text>
                      {item.description.split('1 personal bank account')[1]}
                    </>
                  ) : item.description.includes('1 company bank account') ? (
                    <>
                      {item.description.split('1 company bank account')[0]}
                      <Text style={{ fontWeight: 'bold' }}>1 company bank account</Text>
                      {item.description.split('1 company bank account')[1]}
                    </>
                  ) : item.description.includes('1 company bank account') ? (
                    <>
                      {item.description.split('1 company account')[0]}
                      <Text style={{ fontWeight: 'bold' }}>1 company account</Text>
                      {item.description.split('1 company account')[1]}
                    </>
                  ) : item.description.includes('1 personal bank') ? (
                    <>
                      {item.description.split('1 personal bank')[0]}
                      <Text style={{ fontWeight: 'bold' }}>1 personal bank</Text>
                      {item.description.split('1 personal bank')[1]}
                    </>
                  ) : item.description.includes('personal bank account') ? (
                    <>
                      {item.description.split('personal bank account')[0]}
                      <Text style={{ fontWeight: 'bold' }}>personal bank account</Text>
                      {item.description.split('personal bank account')[1]}
                    </>
                  ) : item.description.includes('company account') ? (
                    <>
                      {item.description.split('company account')[0]}
                      <Text style={{ fontWeight: 'bold' }}>company account</Text>
                      {item.description.split('company account')[1]}
                    </>
                  ) : (
                    item.description
                  )}
                </Text>
              );
            }
            
            // Handle multi-line descriptions for IFZA License Cost with Unit Lease Agreement
            if (item.description.includes('\n- Unit Lease Agreement')) {
              const parts = item.description.split('\n');
              return (
                <View style={
                  theme === 'blue' 
                    ? styles.tableCellDescriptionWide 
                    : styles.tableCellDescription
                }>
                  <Text style={{ fontSize: 9, color: '#374151' }}>{parts[0]}</Text>
                  <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>{parts[1].replace(/\s+0\.00$/, '')}</Text>
                </View>
              );
            }
            
            return (
              <Text style={
                (item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction'))
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
                (item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction'))
                  ? styles.tableCellAmountRed
                  : styles.tableCellAmount
              }>
                {(item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction')) ? '-' : ''}{formatNumber(item.amount)}
              </Text>
              <Text style={
                (item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction'))
                  ? styles.tableCellAmountRed
                  : styles.tableCellAmount
              }>
                {(item.isReduction || item.description.startsWith('TME Services Professional Fee Reduction')) ? '-' : ''}{formatSecondaryCurrency(item.secondaryAmount)}
              </Text>
            </View>
          );
        })}

        {/* Deposits Section */}
        {showDeposits && depositsItems.length > 0 && (
          <>
            {/* Total without deposits (only show when deposits exist) */}
            <View style={styles.totalRowCompact}>
              <Text style={[
                styles.totalLabel, 
                theme === 'blue' ? { flex: 6, paddingLeft: 8 } : { flex: 5, paddingLeft: 8 }
              ]}>
                Total (Without Deposits)
              </Text>
              <Text style={styles.totalAmount}>{formatNumber(total)}</Text>
              <Text style={styles.totalAmount}>{formatSecondaryCurrency(secondaryTotal)}</Text>
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
                <Text style={styles.tableCellAmount}>{formatSecondaryCurrency(deposit.secondaryAmount)}</Text>
              </View>
            ))}
          </>
        )}

        {/* Total Row - Only show when showTotal is true */}
        {showTotal && (
          <View style={tableTheme.totalRow}>
            <Text style={[
              styles.totalLabel, 
              theme === 'blue' ? { flex: 6, paddingLeft: 8 } : { flex: 5, paddingLeft: 8 }
            ]}>
              {showDeposits && depositsItems.length > 0 ? 'Total (Including Deposits)' : 'Total'}
            </Text>
            <Text style={styles.totalAmount}>
              {formatNumber(showDeposits && depositsItems.length > 0 ? total + depositsTotal : total)}
            </Text>
            <Text style={styles.totalAmount}>
              {formatSecondaryCurrency(showDeposits && depositsItems.length > 0 ? secondaryTotal + depositsSecondaryTotal : secondaryTotal)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}; 