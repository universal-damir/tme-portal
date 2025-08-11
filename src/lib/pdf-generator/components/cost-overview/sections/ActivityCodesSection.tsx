import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import type { PDFComponentProps } from '../../../types';

// ActivityCodesSection - Full width section for business activity codes
export const ActivityCodesSection: React.FC<PDFComponentProps> = ({ data }) => {
  // Check if TBC is enabled - only check authorityInformation (the main source)
  const isIfzaSelected = data.authorityInformation.responsibleAuthority === 'IFZA (International Free Zone Authority)';
  const isDetSelected = data.authorityInformation.responsibleAuthority === 'DET (Dubai Department of Economy and Tourism)';
  
  // Simplified check - only use the authorityInformation field which is the source of truth
  const isTbcEnabled = data.authorityInformation?.activitiesToBeConfirmed === true;

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
            Business activities will be confirmed at a later stage.
          </Text>
          {isIfzaSelected && (
            <Text style={[styles.introText, { textAlign: 'center', color: '#243F7B', marginTop: 4 }]}>
              Visit this link to browse IFZA's business activities: <Text style={{ fontWeight: 'bold' }}>https://activities.ifza.com/</Text>
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.activityTable}>
          <View style={compactStyles.activityHeader}>
            <Text style={[styles.activityHeaderText, styles.activityCodeColumn]}>Code</Text>
            <Text style={[styles.activityHeaderText, styles.activityDescColumn]}>Description</Text>
          </View>
          
          {(data.activityCodes || [])
            .filter(activity => activity.code && activity.code.trim() !== '' && activity.description && activity.description.trim() !== '') // Only show complete activities with non-empty values
            .map((activity, index) => {
              const filteredActivities = (data.activityCodes || []).filter(a => a.code && a.code.trim() !== '' && a.description && a.description.trim() !== '');
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
          
          {/* If no activities after filtering, show a message */}
          {(!data.activityCodes || data.activityCodes.filter(a => a.code && a.code.trim() !== '' && a.description && a.description.trim() !== '').length === 0) && (
            <View style={compactStyles.activityRow}>
              <Text style={[styles.introText, { textAlign: 'center', fontStyle: 'italic', color: '#6b7280' }]}>
                No business activities have been specified.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};