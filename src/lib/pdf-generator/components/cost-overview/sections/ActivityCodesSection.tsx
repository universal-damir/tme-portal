import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import type { PDFComponentProps } from '../../../types';

// ActivityCodesSection extracted from the original PDF generator cover page
export const ActivityCodesSection: React.FC<PDFComponentProps> = ({ data }) => {
  // Check if TBC is enabled for IFZA or DET
  const isIfzaSelected = data.authorityInformation.responsibleAuthority === 'IFZA (International Free Zone Authority)';
  const isDetSelected = data.authorityInformation.responsibleAuthority === 'DET (Dubai Department of Economy and Tourism)';
  const isTbcEnabled = (isIfzaSelected && data.ifzaLicense?.activitiesToBeConfirmed) || 
                       (isDetSelected && data.detLicense?.activitiesToBeConfirmed);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Business Activity Codes</Text>
      
      {isTbcEnabled ? (
        <View style={styles.contentArea}>
          <Text style={[styles.introText, { textAlign: 'center', fontStyle: 'italic', color: '#d97706' }]}>
            Activities will be confirmed at a later stage (TBC)
          </Text>
        </View>
      ) : (
        <View style={styles.activityTable}>
          <View style={styles.activityHeader}>
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
                  style={isLast ? styles.activityRowLast : styles.activityRow}
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