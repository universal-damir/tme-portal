import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../styles';
import { formatNumber, formatSecondaryCurrency } from '../../utils';
import { getBrandingByAuthority } from '../../branding';
import type { PDFComponentProps } from '../../types';

export interface SimpleFormItem {
  label: string;
  value: string | number;
  isTotal?: boolean;
  isCurrency?: boolean;
}

export interface SimpleFormTableProps extends PDFComponentProps {
  title: string;
  items: SimpleFormItem[];
  theme?: 'blue' | 'green' | 'orange' | 'purple';
  showTotal?: boolean;
  totalLabel?: string;
  totalValue?: number;
}

// SimpleFormTable - Simplified table for basic form data
// Used by simple tabs that don't need complex cost calculations
export const SimpleFormTable: React.FC<SimpleFormTableProps> = ({ 
  data,
  title, 
  items, 
  theme = 'blue',
  showTotal = false,
  totalLabel = 'Total',
  totalValue = 0
}) => {
  const branding = getBrandingByAuthority(data.authorityInformation.responsibleAuthority);
  const exchangeRate = data.clientDetails?.exchangeRate || 3.67;
  const secondaryCurrency = data.clientDetails?.secondaryCurrency || 'USD';

  // Theme colors based on existing cost table themes
  const themeColors = {
    blue: { header: '#E0F2FE', border: '#0369A1' },
    green: { header: '#D1FAE5', border: '#047857' },
    orange: { header: '#FED7AA', border: '#EA580C' },
    purple: { header: '#E9D5FF', border: '#7C3AED' }
  };

  const colors = themeColors[theme];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      
      <View style={[styles.costTable, { marginTop: 12 }]}>
        {/* Table Header */}
        <View style={[styles.tableRow, { backgroundColor: colors.header }]}>
          <View style={[styles.tableCell, { flex: 2, borderRightWidth: 1, borderRightColor: colors.border }]}>
            <Text style={[styles.tableCellDescription, { fontWeight: 'bold', color: colors.border }]}>
              Description
            </Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text style={[styles.tableCellDescription, { fontWeight: 'bold', color: colors.border, textAlign: 'right' }]}>
              Value
            </Text>
          </View>
        </View>

        {/* Table Rows */}
        {items.map((item, index) => (
          <View key={index} style={[
            styles.tableRow,
            item.isTotal ? { backgroundColor: colors.header } : {},
            { borderBottomWidth: 1, borderBottomColor: colors.border }
          ]}>
            <View style={[styles.tableCell, { flex: 2, borderRightWidth: 1, borderRightColor: colors.border }]}>
              <Text style={[
                styles.tableCellDescription,
                item.isTotal ? { fontWeight: 'bold', color: colors.border } : {}
              ]}>
                {item.label}
              </Text>
            </View>
            <View style={[styles.tableCell, { flex: 1 }]}>
              <Text style={[
                styles.tableCellDescription,
                { textAlign: 'right' },
                item.isTotal ? { fontWeight: 'bold', color: colors.border } : {}
              ]}>
                {item.isCurrency 
                  ? `AED ${formatNumber(Number(item.value))} (${formatSecondaryCurrency(Number(item.value) / exchangeRate)} ${secondaryCurrency})`
                  : item.value
                }
              </Text>
            </View>
          </View>
        ))}

        {/* Total Row (if enabled) */}
        {showTotal && (
          <View style={[styles.tableRow, { backgroundColor: colors.header }]}>
            <View style={[styles.tableCell, { flex: 2, borderRightWidth: 1, borderRightColor: colors.border }]}>
              <Text style={[styles.tableCellDescription, { fontWeight: 'bold', color: colors.border }]}>
                {totalLabel}
              </Text>
            </View>
            <View style={[styles.tableCell, { flex: 1 }]}>
              <Text style={[styles.tableCellDescription, { textAlign: 'right', fontWeight: 'bold', color: colors.border }]}>
                AED {formatNumber(totalValue)} ({formatSecondaryCurrency(totalValue / exchangeRate)} ${secondaryCurrency})
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}; 