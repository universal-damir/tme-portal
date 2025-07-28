import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import type { PDFComponentProps } from '../../../types';

// ActivityCodesSection - Full width section for business activity codes
export const ActivityCodesSection: React.FC<PDFComponentProps> = ({ data }) => {
  // Check if TBC is enabled - can be stored in different locations depending on form state
  const isIfzaSelected = data.authorityInformation.responsibleAuthority === 'IFZA (International Free Zone Authority)';
  const isDetSelected = data.authorityInformation.responsibleAuthority === 'DET (Dubai Department of Economy and Tourism)';
  const isTbcEnabled = data.authorityInformation?.activitiesToBeConfirmed || 
                       (isIfzaSelected && data.ifzaLicense?.activitiesToBeConfirmed) || 
                       (isDetSelected && data.detLicense?.activitiesToBeConfirmed);

  // Compact styles - reduced padding for smaller table height
  const compactStyles = {
    activityHeader: {
      ...styles.activityHeader,
      padding: 4, // Reduced from 8 to 4
    },
    activityRow: {
      ...styles.activityRow,
      padding: 4, // Reduced from 8 to 4
    },
    activityRowLast: {
      ...styles.activityRowLast,
      padding: 4, // Reduced from 8 to 4
    },
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Business Activity Codes</Text>
      
      {isTbcEnabled ? (
        <View style={styles.contentArea}>
          <Text style={[styles.introText, { textAlign: 'center', fontStyle: 'italic', color: '#d97706' }]}>
            Activities will be confirmed at a later stage.
          </Text>
        </View>
      ) : (
        <View style={styles.activityTable}>
          <View style={compactStyles.activityHeader}>
            <Text style={[styles.activityHeaderText, styles.activityCodeColumn]}>Code</Text>
            <Text style={[styles.activityHeaderText, styles.activityDescColumn]}>Description</Text>
          </View>
          
          {(data.activityCodes || [])
            .filter(activity => activity.code && activity.description) // Only show complete activities
            .map((activity, index) => {
              const filteredActivities = (data.activityCodes || []).filter(a => a.code && a.description);
              const isLast = index === filteredActivities.length - 1;
              
              return (
                <View 
                  key={`activity-${activity.code}-${index}`} 
                  style={isLast ? compactStyles.activityRowLast : compactStyles.activityRow}
                >
                  <Text style={styles.activityCode}>{activity.code}</Text>
                  <Text style={styles.activityDesc}>{activity.description}</Text>
                </View>
              );
            })}
        </View>
      )}
    </View>
  );
};