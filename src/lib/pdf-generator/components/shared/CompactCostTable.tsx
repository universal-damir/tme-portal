import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { formatNumber } from '../../utils';
import type { CostItem } from '../../types';

// CompactCostTable - Shared component for visa breakdown tables
// Used by FamilyVisaDocument and IndividualVisaBreakdownPage
export const CompactCostTable: React.FC<{
  data: any;
  title: string;
  items: CostItem[];
  total: number;
  secondaryTotal: number;
}> = ({ data, title, items, total, secondaryTotal }) => {
  const secondaryCurrency = data.clientDetails.secondaryCurrency;

  return (
    <View style={{ marginBottom: 6 }}>
      {/* Title - simple text, no background */}
      <Text style={{ 
        fontSize: 11, 
        fontWeight: 'bold', 
        marginBottom: 4,
        color: '#374151',
        textAlign: 'left'
      }}>
        {title}
      </Text>
      
      {/* Table with minimal styling */}
      <View style={{ 
        border: '1px solid #e5e7eb',
        borderRadius: 4,
        backgroundColor: '#ffffff'
      }}>
        {/* Header - light blue background */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#0ea5e9',
          paddingTop: 4,
          paddingBottom: 4,
          paddingLeft: 6,
          paddingRight: 6,
          borderBottom: '1px solid #e5e7eb',
          minHeight: 20
        }}>
          <Text style={{
            flex: 3,
            fontSize: 10,
            fontWeight: 'bold',
            color: 'white',
            paddingLeft: 2
          }}>
            Description
          </Text>
          <Text style={{
            flex: 1,
            fontSize: 10,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'right',
            paddingRight: 2
          }}>
            AED
          </Text>
          <Text style={{
            flex: 1,
            fontSize: 10,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'right',
            paddingRight: 2
          }}>
            {secondaryCurrency}
          </Text>
        </View>

        {/* Table Rows - compact spacing with consistent heights */}
        {items.map((item, index) => (
          <View key={`cost-item-${index}`} style={{
            flexDirection: 'row',
            paddingTop: 3,
            paddingBottom: 3,
            paddingLeft: 6,
            paddingRight: 6,
            borderBottom: index < items.length - 1 ? '1px solid #f3f4f6' : 'none',
            minHeight: 16,
            alignItems: 'center'
          }}>
            <Text style={{
              flex: 3,
              fontSize: 9,
              color: item.isReduction ? '#dc2626' : '#374151',
              paddingLeft: 2,
              lineHeight: 1.2
            }}>
              {item.description}
            </Text>
            <Text style={{
              flex: 1,
              fontSize: 9,
              color: item.isReduction ? '#dc2626' : '#374151',
              textAlign: 'right',
              paddingRight: 2
            }}>
              {item.isReduction ? '-' : ''}{formatNumber(item.amount)}
            </Text>
            <Text style={{
              flex: 1,
              fontSize: 9,
              color: item.isReduction ? '#dc2626' : '#374151',
              textAlign: 'right',
              paddingRight: 2
            }}>
              {item.isReduction ? '-' : ''}{formatNumber(item.secondaryAmount)}
            </Text>
          </View>
        ))}

        {/* Total Row - light blue highlight */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#0ea5e9',
          paddingTop: 6,
          paddingBottom: 6,
          paddingLeft: 6,
          paddingRight: 6,
          marginTop: 2,
          borderRadius: 4,
          minHeight: 22,
          alignItems: 'center'
        }}>
          <Text style={{
            flex: 3,
            fontSize: 10,
            fontWeight: 'bold',
            color: 'white',
            paddingLeft: 2
          }}>
            TOTAL
          </Text>
          <Text style={{
            flex: 1,
            fontSize: 10,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'right',
            paddingRight: 2
          }}>
            {formatNumber(total)}
          </Text>
          <Text style={{
            flex: 1,
            fontSize: 10,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'right',
            paddingRight: 2
          }}>
            {formatNumber(secondaryTotal)}
          </Text>
        </View>
      </View>
    </View>
  );
}; 