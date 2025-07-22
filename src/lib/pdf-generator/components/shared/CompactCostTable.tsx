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
    <View style={{ marginBottom: 8 }}>
      {/* Title - simple text, no background */}
      <Text style={{ 
        fontSize: 11, 
        fontWeight: 'bold', 
        marginBottom: 6,
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
          padding: 6,
          borderBottom: '1px solid #e5e7eb'
        }}>
          <Text style={{
            flex: 3,
            fontSize: 10,
            fontWeight: 'bold',
            color: 'white',
            paddingLeft: 6
          }}>
            Description
          </Text>
          <Text style={{
            flex: 1,
            fontSize: 10,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'right',
            paddingRight: 6
          }}>
            AED
          </Text>
          <Text style={{
            flex: 1,
            fontSize: 10,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'right',
            paddingRight: 6
          }}>
            {secondaryCurrency}
          </Text>
        </View>

        {/* Table Rows - compact spacing */}
        {items.map((item, index) => (
          <View key={`cost-item-${index}`} style={{
            flexDirection: 'row',
            padding: 4,
            borderBottom: index < items.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <Text style={{
              flex: 3,
              fontSize: 9,
              color: item.isReduction ? '#dc2626' : '#374151',
              paddingLeft: 6,
              lineHeight: 1.3
            }}>
              {item.description}
            </Text>
            <Text style={{
              flex: 1,
              fontSize: 9,
              color: item.isReduction ? '#dc2626' : '#374151',
              textAlign: 'right',
              paddingRight: 6
            }}>
              {item.isReduction ? '-' : ''}{formatNumber(item.amount)}
            </Text>
            <Text style={{
              flex: 1,
              fontSize: 9,
              color: item.isReduction ? '#dc2626' : '#374151',
              textAlign: 'right',
              paddingRight: 6
            }}>
              {item.isReduction ? '-' : ''}{formatNumber(item.secondaryAmount)}
            </Text>
          </View>
        ))}

        {/* Total Row - light blue highlight */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#0ea5e9',
          padding: 8,
          marginTop: 4,
          borderRadius: 4
        }}>
          <Text style={{
            flex: 3,
            fontSize: 10,
            fontWeight: 'bold',
            color: 'white',
            paddingLeft: 6
          }}>
            TOTAL
          </Text>
          <Text style={{
            flex: 1,
            fontSize: 10,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'right',
            paddingRight: 6
          }}>
            {formatNumber(total)}
          </Text>
          <Text style={{
            flex: 1,
            fontSize: 10,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'right',
            paddingRight: 6
          }}>
            {formatNumber(secondaryTotal)}
          </Text>
        </View>
      </View>
    </View>
  );
}; 