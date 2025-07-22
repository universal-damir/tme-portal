import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../styles';

interface IntroSectionProps {
  headline: string;
  content: string;
  clientName?: string;
  filename?: string;
}

// IntroSection - reusable component for page introductions
// Used across multiple pages with different content
export const IntroSection: React.FC<IntroSectionProps> = ({ headline, content, clientName, filename }) => {
  // Replace placeholder in content if clientName is provided
  const processedContent = clientName ? content.replace('{clientName}', clientName) : content;

  return (
    <View style={styles.introSection}>
      {/* Headline with optional filename on the right */}
      {filename ? (
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: styles.introHeadline.marginBottom 
        }}>
          <Text style={[styles.introHeadline, { marginBottom: 0 }]}>{headline}</Text>
          <Text style={[
            styles.introText, 
            { 
              marginBottom: 0,
              fontWeight: 'normal' as const,
              color: '#6B7280'
            }
          ]}>
            {filename?.replace('.pdf', '')}
          </Text>
        </View>
      ) : (
        <Text style={styles.introHeadline}>{headline}</Text>
      )}
      <Text style={styles.introText}>{processedContent}</Text>
    </View>
  );
}; 