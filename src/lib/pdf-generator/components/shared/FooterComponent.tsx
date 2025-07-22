import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../styles';

interface FooterComponentProps {
  // Footer now only shows page number - no data needed
}

// FooterComponent simplified to only show page number
// Company information moved to HeaderComponent
export const FooterComponent: React.FC<FooterComponentProps> = () => {
  return (
    <View style={styles.footer}>
      <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </View>
  );
}; 