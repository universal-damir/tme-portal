import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { HeaderComponent, FooterComponent } from '../../shared';
import { CustomPage as CustomPageType, ContentBlock } from '@/types/company-services';
import type { PDFComponentProps } from '../../../types';

interface CustomPageProps extends PDFComponentProps {
  customPage: CustomPageType;
}

export const CustomPageComponent: React.FC<CustomPageProps> = ({ data, customPage }) => {
  // Skip if page is disabled
  if (!customPage.enabled) return null;

  // Sort blocks by order
  const sortedBlocks = [...customPage.blocks].sort((a, b) => a.order - b.order);

  // Render individual content block
  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'heading':
        // Use standard sectionTitle style (fontSize: 12) for all headings
        return (
          <Text 
            key={block.id}
            style={[
              styles.sectionTitle,
              { 
                marginBottom: 12,
                marginTop: block.order === 0 ? 0 : 8
              }
            ]}
          >
            {block.content.text || ''}
          </Text>
        );

      case 'paragraph':
        return (
          <Text 
            key={block.id}
            style={[styles.introText, { marginBottom: 12 }]}
          >
            {block.content.text || ''}
          </Text>
        );

      case 'numberedList':
        return (
          <View key={block.id} style={{ marginBottom: 12 }}>
            {(block.content.items || []).map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' }}>
                <Text style={[styles.introText, { marginRight: 4, minWidth: 15 }]}>
                  {index + 1}.
                </Text>
                <Text style={[styles.introText, { flex: 1 }]}>{item}</Text>
              </View>
            ))}
          </View>
        );

      case 'table':
        if (!block.content.table) return null;
        const { rows, columnWidths } = block.content.table;
        
        return (
          <View key={block.id} style={{ marginBottom: 12 }}>
            {rows.map((row, rowIndex) => (
              <View 
                key={rowIndex} 
                style={{
                  flexDirection: 'row',
                  borderTopWidth: rowIndex === 0 ? 1 : 0,
                  borderBottomWidth: 1,
                  borderLeftWidth: 1,
                  borderRightWidth: 1,
                  borderColor: '#e0e0e0'
                }}
              >
                {row.map((cell, cellIndex) => {
                  const width = columnWidths?.[cellIndex] 
                    ? `${columnWidths[cellIndex]}%` 
                    : `${100 / row.length}%`;
                  
                  return (
                    <View 
                      key={cellIndex} 
                      style={{
                        width,
                        backgroundColor: cell.isHeader ? '#f3f4f6' : 'white',
                        borderRightWidth: cellIndex < row.length - 1 ? 1 : 0,
                        borderColor: '#e0e0e0',
                        padding: 8,
                        paddingVertical: 6,
                        alignItems: cell.align === 'center' ? 'center' : cell.align === 'right' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <Text style={{
                        fontSize: 10,
                        fontWeight: cell.isHeader ? 'bold' : 'normal',
                        color: cell.isHeader ? '#243F7B' : '#374151',
                        textAlign: cell.align || 'left'
                      }}>
                        {cell.value}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      {/* Main content area */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <View style={styles.section}>
          {/* Render all content blocks without page title */}
          {sortedBlocks.map(block => renderBlock(block))}
        </View>
      </View>

      <FooterComponent />
    </Page>
  );
};