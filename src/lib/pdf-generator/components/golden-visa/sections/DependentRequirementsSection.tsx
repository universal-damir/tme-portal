import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { GOLDEN_VISA_TRANSLATIONS, Locale } from '../../../translations/golden-visa';
import type { GoldenVisaData } from '@/types/golden-visa';

interface DependentRequirementsSectionProps {
  goldenVisaData: GoldenVisaData;
  locale?: Locale;
  showTitle?: boolean;
}

// Reusable component for dependent visa requirements
// Used both in VisaRequirementsSection (when no primary visa) and DependentVisasPage (when primary visa exists)
export const DependentRequirementsSection: React.FC<DependentRequirementsSectionProps> = ({ 
  goldenVisaData, 
  locale = 'en',
  showTitle = true 
}) => {
  const t = GOLDEN_VISA_TRANSLATIONS[locale];
  
  const hasSpouse = Boolean(goldenVisaData?.dependents?.spouse?.required);
  const hasChildren = Boolean((goldenVisaData?.dependents?.children?.count || 0) > 0);
  const numberOfChildren = goldenVisaData?.dependents?.children?.count || 0;
  
  // Don't render if no dependents are selected
  if (!hasSpouse && !hasChildren) {
    return null;
  }
  
  const requirements = [];
  
  // Dynamic document requirements based on selections
  if (hasSpouse && hasChildren) {
    // Both spouse and children
    const childText = numberOfChildren === 1 ? 'child birth certificate' : 'children birth certificates';
    requirements.push(
      <Text key="marriage" style={styles.introText}>
        1. <Text style={{ fontWeight: 'bold' }}>{t.requirements.dependent.marriageCert}:</Text> {t.requirements.dependent.marriageCertText}
      </Text>,
      <Text key="birth" style={styles.introText}>
        2. <Text style={{ fontWeight: 'bold' }}>{numberOfChildren === 1 ? t.requirements.dependent.birthCert : t.requirements.dependent.birthCertPlural}:</Text> {t.requirements.dependent.birthCertText}
      </Text>
    );
  } else if (hasSpouse) {
    // Spouse only
    requirements.push(
      <Text key="marriage" style={styles.introText}>
        1. <Text style={{ fontWeight: 'bold' }}>{t.requirements.dependent.marriageCert}:</Text> {t.requirements.dependent.marriageCertText}
      </Text>
    );
  } else if (hasChildren) {
    // Children only
    requirements.push(
      <Text key="birth" style={styles.introText}>
        1. <Text style={{ fontWeight: 'bold' }}>{numberOfChildren === 1 ? t.requirements.dependent.birthCert : t.requirements.dependent.birthCertPlural}:</Text> {t.requirements.dependent.birthCertText}
      </Text>
    );
  }

  // Always add common requirements for dependents
  requirements.push(
    <Text key="processing-time" style={styles.introText}>
      {requirements.length + 1}. <Text style={{ fontWeight: 'bold' }}>{t.requirements.common.processingTime}:</Text> {t.requirements.common.processingTimeText}
    </Text>,
    <Text key="health-insurance" style={styles.introText}>
      {requirements.length + 2}. <Text style={{ fontWeight: 'bold' }}>{t.requirements.common.healthInsurance}:</Text> {t.requirements.common.healthInsuranceText}
    </Text>,
    <Text key="medical-emirates" style={styles.introText}>
      {requirements.length + 3}. <Text style={{ fontWeight: 'bold' }}>{t.requirements.common.medicalEmirates}:</Text> {t.requirements.common.medicalEmiratesText}
    </Text>
  );

  return (
    <View style={showTitle ? styles.section : { marginBottom: 12 }}>
      {showTitle && (
        <Text style={styles.sectionTitle}>{t.requirements.sectionTitle}</Text>
      )}
      <Text style={styles.introText}>
        {t.requirements.introText.dependent}
      </Text>
      
      <View style={{ marginTop: 8 }}>
        {requirements}
      </View>
    </View>
  );
};