import React from 'react';
import { View, Text, Link } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { GOLDEN_VISA_TRANSLATIONS, Locale } from '../../../translations/golden-visa';
import type { PDFComponentProps } from '../../../types';

// VisaRequirementsSection - Visa-specific requirements and bullet points
// Displays the current bullet point requirements based on visa type
export const VisaRequirementsSection: React.FC<PDFComponentProps> = ({ data }) => {
  // Access golden visa data from transformed data
  const goldenVisaData = (data as any).goldenVisaData;
  const locale: Locale = (data as any).locale || 'en';
  const t = GOLDEN_VISA_TRANSLATIONS[locale];

  // Get visa type from actual data
  const getVisaType = () => {
    return goldenVisaData?.visaType || 'property-investment';
  };

  // Get freezone display name with full description
  const getFreezoneDisplayName = (freezone: string) => {
    // Import the helper function dynamically since we can't import at top level in PDF components
    const freezoneOptions = [
      { value: 'det', label: 'DET' },
      { value: 'difc', label: 'DIFC (Dubai International Financial Centre)' },
      { value: 'dmcc', label: 'DMCC (Dubai Multi Commodities Centre)' },
      { value: 'dso', label: 'DSO (Dubai Silicon Oasis)' },
      { value: 'dwc', label: 'DWC (Dubai World Central)' },
      { value: 'dwtc', label: 'DWTC (Dubai World Trade Centre)' },
      { value: 'ecda', label: 'ECDA (Expo City Dubai Authority)' },
      { value: 'ifza', label: 'IFZA (International Free Zone Authority)' },
      { value: 'jafza', label: 'JAFZA (Jebel Ali Free Zone Authority)' },
      { value: 'meydan', label: 'Meydan Free Zone' },
      { value: 'fujairah', label: 'Fujairah Free Zone' },
      { value: 'rakmc', label: 'RAKMC (Ras Al Khaimah Maritime City)' },
      { value: 'hamriyah', label: 'Hamriyah Free Zone' },
      { value: 'uaq', label: 'Umm Al Quwain Free Zone' },
    ];
    
    const foundFreezone = freezoneOptions.find(f => f.value === freezone?.toLowerCase());
    return foundFreezone?.label || freezone?.toUpperCase() || 'Free Zone Authority';
  };

  // Generate requirements based on visa type (keeping current content)
  const renderRequirements = () => {
    const visaType = getVisaType();

    switch (visaType) {
      case 'property-investment':
        return (
          <>
            <Text style={styles.introText}>
              1. <Text style={{ fontWeight: 'bold' }}>{t.requirements.propertyInvestment.minProperty}:</Text> {t.requirements.propertyInvestment.minPropertyText}
            </Text>
      
            <Text style={styles.introText}>
              2. <Text style={{ fontWeight: 'bold' }}>{t.requirements.propertyInvestment.propertyTypes}:</Text> {t.requirements.propertyInvestment.propertyTypesText}
            </Text>
            
            <Text style={styles.introText}>
              3. <Text style={{ fontWeight: 'bold' }}>{t.requirements.common.processingTime}:</Text> {t.requirements.common.processingTimeText}
            </Text>
            
            <Text style={styles.introText}>
              4. <Text style={{ fontWeight: 'bold' }}>{t.requirements.common.healthInsurance}:</Text> {t.requirements.common.healthInsuranceText}
            </Text>
            
            <Text style={styles.introText}>
              5. <Text style={{ fontWeight: 'bold' }}>{t.requirements.common.medicalEmirates}:</Text> {t.requirements.common.medicalEmiratesText}
            </Text>
          </>
        );

      case 'time-deposit':
        return (
          <>
            <Text style={styles.introText}>
              1. <Text style={{ fontWeight: 'bold' }}>{t.requirements.timeDeposit.minDeposit}:</Text> {t.requirements.timeDeposit.minDepositText}
            </Text>
            
            <Text style={styles.introText}>
              2. <Text style={{ fontWeight: 'bold' }}>{t.requirements.timeDeposit.residencyReq}:</Text> {t.requirements.timeDeposit.residencyReqText}
            </Text>
            <Text style={styles.introText}>   {t.requirements.timeDeposit.acceptableDocs}
            </Text>
            
            <Text style={styles.introText}>
              3. <Text style={{ fontWeight: 'bold' }}>{t.requirements.common.processingTime}:</Text> {t.requirements.common.processingTimeText}
            </Text>
            
            <Text style={styles.introText}>
              4. <Text style={{ fontWeight: 'bold' }}>{t.requirements.common.healthInsurance}:</Text> {t.requirements.common.healthInsuranceText}
            </Text>
            
            <Text style={styles.introText}>
              5. <Text style={{ fontWeight: 'bold' }}>{t.requirements.common.medicalEmirates}:</Text> {t.requirements.common.medicalEmiratesText}
            </Text>
          </>
        );

      case 'skilled-employee':
        // Check if NOC is required and get freezone name
        const requiresNOC = goldenVisaData?.requiresNOC;
        const selectedFreezone = goldenVisaData?.selectedFreezone;
        
        // Check if Salary Certificate is required and get freezone name
        const requiresSalaryCertificate = goldenVisaData?.requiresSalaryCertificate;
        const selectedSalaryCertificateFreezone = goldenVisaData?.selectedSalaryCertificateFreezone;
        
        return (
          <>
            <Text style={styles.introText}>
              1. <Text style={{ fontWeight: 'bold' }}>{t.requirements.skilledEmployee.education}:</Text> {t.requirements.skilledEmployee.educationText}
            </Text>

            <Text style={styles.introText}>
              2. <Text style={{ fontWeight: 'bold' }}>{t.requirements.skilledEmployee.equivalency}:</Text> {t.requirements.skilledEmployee.equivalencyText}{"\n"} 
              <Link 
              src="https://www.moe.gov.ae/En/EServices/ServiceCard/Pages/Pre-Assessment.aspx"
              style={[styles.introText, { color: '#2563eb', textDecoration: 'underline', marginLeft: 15, marginTop: 2 }]}
            >
               {t.requirements.skilledEmployee.equivalencyLink}
            </Link></Text>
           
            
            <Text style={styles.introText}>
              3. <Text style={{ fontWeight: 'bold' }}>{t.requirements.skilledEmployee.employment}:</Text> {t.requirements.skilledEmployee.employmentText}
            </Text>
            
            {requiresNOC && selectedFreezone && (
              <Text style={styles.introText}>
                4. <Text style={{ fontWeight: 'bold' }}>{t.requirements.skilledEmployee.freezoneNoc}:</Text> {t.requirements.skilledEmployee.freezoneNocText} <Text>{getFreezoneDisplayName(selectedFreezone)}</Text>.
              </Text>
            )}
            
            {requiresSalaryCertificate && selectedSalaryCertificateFreezone && (
              <Text style={styles.introText}>
                {requiresNOC && selectedFreezone ? '5.' : '4.'} <Text style={{ fontWeight: 'bold' }}>{t.requirements.skilledEmployee.freezoneSalary}:</Text> {t.requirements.skilledEmployee.freezoneSalaryText} <Text>{getFreezoneDisplayName(selectedSalaryCertificateFreezone)}</Text>.
              </Text>
            )}
            
            <Text style={styles.introText}>
              {(requiresNOC && selectedFreezone && requiresSalaryCertificate && selectedSalaryCertificateFreezone) ? '6.' : 
               (requiresNOC && selectedFreezone) || (requiresSalaryCertificate && selectedSalaryCertificateFreezone) ? '5.' : '4.'} <Text style={{ fontWeight: 'bold' }}>{t.requirements.skilledEmployee.companyNoc}:</Text> {t.requirements.skilledEmployee.companyNocText}
            </Text>
            
            <Text style={styles.introText}>
              {(requiresNOC && selectedFreezone && requiresSalaryCertificate && selectedSalaryCertificateFreezone) ? '7.' : 
               (requiresNOC && selectedFreezone) || (requiresSalaryCertificate && selectedSalaryCertificateFreezone) ? '6.' : '5.'} <Text style={{ fontWeight: 'bold' }}>{t.requirements.skilledEmployee.bankStatements}:</Text> {t.requirements.skilledEmployee.bankStatementsText}
            </Text>
            
            <Text style={styles.introText}>
              {(requiresNOC && selectedFreezone && requiresSalaryCertificate && selectedSalaryCertificateFreezone) ? '8.' : 
               (requiresNOC && selectedFreezone) || (requiresSalaryCertificate && selectedSalaryCertificateFreezone) ? '7.' : '6.'} <Text style={{ fontWeight: 'bold' }}>{t.requirements.skilledEmployee.residenceProof}:</Text> {t.requirements.skilledEmployee.residenceProofText}
            </Text>
            
            <Text style={styles.introText}>
              {(requiresNOC && selectedFreezone && requiresSalaryCertificate && selectedSalaryCertificateFreezone) ? '9.' : 
               (requiresNOC && selectedFreezone) || (requiresSalaryCertificate && selectedSalaryCertificateFreezone) ? '8.' : '7.'} <Text style={{ fontWeight: 'bold' }}>{t.requirements.common.processingTime}:</Text> {t.requirements.common.processingTimeText}
            </Text>
            
            <Text style={styles.introText}>
              {(requiresNOC && selectedFreezone && requiresSalaryCertificate && selectedSalaryCertificateFreezone) ? '10.' : 
               (requiresNOC && selectedFreezone) || (requiresSalaryCertificate && selectedSalaryCertificateFreezone) ? '9.' : '8.'} <Text style={{ fontWeight: 'bold' }}>{t.requirements.common.healthInsurance}:</Text> {t.requirements.common.healthInsuranceText}
            </Text>
            
            <Text style={styles.introText}>
              {(requiresNOC && selectedFreezone && requiresSalaryCertificate && selectedSalaryCertificateFreezone) ? '11.' : 
               (requiresNOC && selectedFreezone) || (requiresSalaryCertificate && selectedSalaryCertificateFreezone) ? '10.' : '9.'} <Text style={{ fontWeight: 'bold' }}>{t.requirements.common.medicalEmirates}:</Text> {t.requirements.common.medicalEmiratesText}
            </Text>
          </>
        );

      default:
        return null;
    }
  };

  // Get visa type for dynamic intro text
  const visaType = getVisaType();
  
  // Generate intro text based on visa type
  const getIntroText = () => {
    if (visaType === 'skilled-employee') {
      return t.requirements.introText.skilledEmployee;
    }
    return t.requirements.introText.standard;
  };

  // Generate dependent requirements when no primary visa is required
  const renderDependentRequirements = () => {
    const hasSpouse = Boolean(goldenVisaData?.dependents?.spouse?.required);
    const hasChildren = Boolean((goldenVisaData?.dependents?.children?.count || 0) > 0);
    const numberOfChildren = goldenVisaData?.dependents?.children?.count || 0;
    
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
    
    // Standard processing requirements (points 3, 4, 5 from main holder)
    const nextPoint = requirements.length + 1;
    
    requirements.push(
      <Text key="processing" style={styles.introText}>
        {nextPoint}. <Text style={{ fontWeight: 'bold' }}>{t.requirements.common.processingTime}:</Text> {t.requirements.common.processingTimeText}
      </Text>,
      <Text key="insurance" style={styles.introText}>
        {nextPoint + 1}. <Text style={{ fontWeight: 'bold' }}>{t.requirements.common.healthInsurance}:</Text> {t.requirements.common.healthInsuranceText}
      </Text>,
      <Text key="medical" style={styles.introText}>
        {nextPoint + 2}. <Text style={{ fontWeight: 'bold' }}>{t.requirements.common.medicalEmirates}:</Text> {t.requirements.common.medicalEmiratesText}
      </Text>
    );
    
    return requirements;
  };

  // Only render requirements section if primary visa is required
  if (!goldenVisaData?.primaryVisaRequired) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.requirements.sectionTitle}</Text>
        <Text style={styles.introText}>
          {t.requirements.introText.dependent}
        </Text>
        
        <View style={{ marginTop: 8 }}>
          {renderDependentRequirements()}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t.requirements.sectionTitle}</Text>
      <Text style={styles.introText}>
        {getIntroText()}
      </Text>
      
      <View style={{ marginTop: 8 }}>
        {renderRequirements()}
      </View>
    </View>
  );
}; 