import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { formatNumber, calculateAllCosts } from '../../../utils';
import type { PDFComponentProps } from '../../../types';

// AuthorityInfoSection extracted from the original PDF generator cover page
export const AuthorityInfoSection: React.FC<PDFComponentProps> = ({ data }) => {
  const { authorityConfig } = calculateAllCosts(data);

  // For all authorities, show the full name stored in the data
  const getAuthorityDisplayText = () => {
    const authority = data.authorityInformation.responsibleAuthority;
    // Return the full authority name as stored in the form data
    return authority;
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Authority Information</Text>
      <View style={styles.contentArea}>
        <View style={styles.row}>
          <Text style={styles.authorityLabel}>Authority:</Text>
          <Text style={styles.authorityValue}>
            {getAuthorityDisplayText()}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.authorityLabel}>Area:</Text>
          <Text style={styles.authorityValue}>
            {data.authorityInformation.areaInUAE}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.authorityLabel}>Legal Entity:</Text>
          <Text style={styles.authorityValue}>
            {data.authorityInformation.legalEntity}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.authorityLabel}>Share Capital:</Text>
          <Text style={styles.authorityValue}>
            AED {formatNumber(data.authorityInformation.shareCapitalAED)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.authorityLabel}>Shares:</Text>
          <Text style={styles.authorityValue}>
            {data.authorityInformation.numberOfShares.toLocaleString()} at AED {formatNumber(data.authorityInformation.valuePerShareAED)} per share
          </Text>
        </View>
      </View>
    </View>
  );
}; 