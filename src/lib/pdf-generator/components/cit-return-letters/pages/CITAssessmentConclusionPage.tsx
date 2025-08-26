import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { CITLetterHeaderComponent } from '../ui/CITLetterHeaderComponent';
import { FooterComponent } from '../../shared/FooterComponent';
import { getCompanyDetailsByAuthority } from '../../../utils/citAuthorityMapping';
import type { PDFComponentProps } from '../../../types';
import type { CITReturnLettersData } from '@/types/cit-return-letters';

interface CITAssessmentConclusionPageProps {
  data: PDFComponentProps['data'] & { 
    citReturnLettersData: CITReturnLettersData;
  };
}

export const CITAssessmentConclusionPage: React.FC<CITAssessmentConclusionPageProps> = ({ data }) => {
  const { clientDetails, citReturnLettersData } = data;
  const selectedClient = citReturnLettersData.selectedClient;
  const assessmentData = citReturnLettersData.citAssessmentConclusion;
  
  // Get manager name from client data or fallback to clientDetails
  const managerFirstName = selectedClient?.management_name?.split(' ')[0] || clientDetails.firstName || 'Manager';
  const managerFullName = selectedClient?.management_name || `${clientDetails.firstName} ${clientDetails.lastName}` || 'Manager';
  
  // Get tax period formatted as dd.mm.yyyy
  const { taxPeriodStart, taxPeriodEnd } = citReturnLettersData;
  
  const formatTaxPeriod = () => {
    if (taxPeriodStart && taxPeriodEnd) {
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      };
      return `${formatDate(taxPeriodStart)} to ${formatDate(taxPeriodEnd)}`;
    }
    return '01.01.2024 to 31.12.2024'; // Default fallback
  };

  // Format assessment date if available
  const formatAssessmentDate = () => {
    if (assessmentData.citImpactAssessmentDate) {
      const date = new Date(assessmentData.citImpactAssessmentDate);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }
    return formatLetterDate(); // Fallback to letter date
  };

  // Format the letter date as dd.mm.yyyy
  const formatLetterDate = () => {
    const letterDateToUse = citReturnLettersData.letterDate || new Date().toISOString().split('T')[0];
    const date = new Date(letterDateToUse);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Calculate disqualification date (tax period end plus 4 years)
  const calculateDisqualificationDate = () => {
    if (taxPeriodEnd) {
      const endDate = new Date(taxPeriodEnd);
      endDate.setFullYear(endDate.getFullYear() + 4);
      const day = endDate.getDate().toString().padStart(2, '0');
      const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
      const year = endDate.getFullYear();
      return `${day}.${month}.${year}`;
    }
    return '31.12.2028'; // Default fallback
  };

  // Check if all QFZP conditions are fulfilled
  const qfzpSelections = assessmentData.qfzpBenefitSelections;
  const allQFZPFulfilled = Object.values(qfzpSelections).every(value => value === true);

  // Get company details for stamp
  const companyDetails = getCompanyDetailsByAuthority(
    selectedClient?.registered_authority || 'DXB IFZA FZ' // Default fallback
  );

  // Check if company is in free zone (for QFZP section)
  const isInFreeZone = selectedClient?.registered_authority && 
    !selectedClient.registered_authority.includes('mainland') &&
    !selectedClient.registered_authority.includes('Mainland');

  return (
    <Page size="A4" style={styles.page}>
      <CITLetterHeaderComponent data={data} />
      
      {/* Main content area */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        {/* Company Name */}
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 10, color: '#374151' }}>{selectedClient?.company_name || data.clientDetails.companyName || '--'}</Text>
          <Text style={{ fontSize: 10, color: '#374151' }}>{managerFullName}</Text>
        </View>

        {/* Location and Date */}
        <View style={{ marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#374151' }}>{selectedClient?.city || 'Dubai'}, {selectedClient?.country || 'UAE'}</Text>
          <Text style={{ fontSize: 10, color: '#374151' }}>{formatLetterDate()}</Text>
        </View>

        {/* Document Title/Headline */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, { borderLeft: 'none', paddingLeft: 0, fontSize: 12, fontWeight: 'bold' }]}>
            A.   CIT assessment and conclusion
          </Text>
        </View>

        {/* Dear Client */}
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.value}>Dear {managerFirstName},</Text>
        </View>

        {/* Main intro paragraph - dynamic based on CIT impact assessment */}
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
            {assessmentData.citImpactAssessmentPerformed
              ? `Based on our service offer dated ${formatAssessmentDate()} for the CIT impact assessment for your company, we have made the following observations for the tax period from ${formatTaxPeriod()}. Kindly read the options below carefully and confirm your selection at the end of section A so that we can proceed with the CIT return filing on the FTA (Federal Tax Authority) portal.`
              : `Based on our bird's eye review of the financial statements, we have made the following observations for the tax period from ${formatTaxPeriod()}. Kindly read the options below carefully and confirm your selection at the end of section A, for us to proceed with the CIT return filing on the FTA (Federal Tax Authority) portal.`
            }
          </Text>
        </View>

        {/* QFZP Benefit Section - Only show for free zones */}
        {isInFreeZone && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { borderLeft: 'none', paddingLeft: 0, fontSize: 11, fontWeight: 'bold', marginBottom: 10 }]}>
              QFZP (Qualifying Free Zone Person) benefit
            </Text>
            
            {allQFZPFulfilled ? (
              // All conditions fulfilled
              <View>
                <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4, marginBottom: 10 }]}>
                  The company is entitled to a tax rate of 0% on the Total Qualifying Revenues and a tax rate of 9% on the non-qualifying revenues. The following is the conclusion on the conditions for the QFZP benefit:
                </Text>
                
                <View style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                    <Text style={[styles.introText, { lineHeight: 1.4, width: 400 }]}>a.     Adequate substance</Text>
                    <Text style={[styles.introText, { lineHeight: 1.4 }]}>Fulfilled</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                    <Text style={[styles.introText, { lineHeight: 1.4, width: 400 }]}>b.     Derives qualifying income</Text>
                    <Text style={[styles.introText, { lineHeight: 1.4 }]}>Fulfilled</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                    <Text style={[styles.introText, { lineHeight: 1.4, width: 400 }]}>c.     Within de minimis</Text>
                    <Text style={[styles.introText, { lineHeight: 1.4 }]}>Fulfilled</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                    <Text style={[styles.introText, { lineHeight: 1.4, width: 400 }]}>d.     Prepares and maintains TP documentation</Text>
                    <Text style={[styles.introText, { lineHeight: 1.4 }]}>Fulfilled</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                    <Text style={[styles.introText, { lineHeight: 1.4, width: 400 }]}>e.     Performs an audit of financial statements</Text>
                    <Text style={[styles.introText, { lineHeight: 1.4 }]}>Fulfilled</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                    <Text style={[styles.introText, { lineHeight: 1.4, width: 400 }]}>f.      Does not elect standard rules</Text>
                    <Text style={[styles.introText, { lineHeight: 1.4 }]}>Fulfilled</Text>
                  </View>
                </View>
                
                <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
                  If you prefer not to opt for the QFZP benefit in this tax period, the company will be disqualified automatically from opting for this benefit for the next 4 years until {calculateDisqualificationDate()}.
                </Text>
              </View>
            ) : (
              // Not all conditions fulfilled
              <View>
                <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4, marginBottom: 10 }]}>
                  The company does not fulfill all the conditions of a QFZP benefit as seen below. The company is further disqualified from availing of this benefit for the next 4 years until {calculateDisqualificationDate()}.
                </Text>
                
                <View style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                    <Text style={[styles.introText, { lineHeight: 1.4, width: 400 }]}>a.     Adequate substance</Text>
                    <Text style={[styles.introText, { lineHeight: 1.4 }]}>{qfzpSelections.adequateSubstance ? 'Fulfilled' : 'Not fulfilled'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                    <Text style={[styles.introText, { lineHeight: 1.4, width: 400 }]}>b.     Derives qualifying income</Text>
                    <Text style={[styles.introText, { lineHeight: 1.4 }]}>{qfzpSelections.derivesQualifyingIncome ? 'Fulfilled' : 'Not fulfilled'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                    <Text style={[styles.introText, { lineHeight: 1.4, width: 400 }]}>c.     Within de minimis</Text>
                    <Text style={[styles.introText, { lineHeight: 1.4 }]}>{qfzpSelections.withinDeMinimis ? 'Fulfilled' : 'Not fulfilled'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                    <Text style={[styles.introText, { lineHeight: 1.4, width: 400 }]}>d.     Prepares and maintains TP documentation</Text>
                    <Text style={[styles.introText, { lineHeight: 1.4 }]}>{qfzpSelections.preparesTPDocumentation ? 'Fulfilled' : 'Not fulfilled'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                    <Text style={[styles.introText, { lineHeight: 1.4, width: 400 }]}>e.     Performs an audit of financial statements</Text>
                    <Text style={[styles.introText, { lineHeight: 1.4 }]}>{qfzpSelections.performsAuditFinancialStatements ? 'Fulfilled' : 'Not fulfilled'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                    <Text style={[styles.introText, { lineHeight: 1.4, width: 400 }]}>f.      Does not elect standard rules</Text>
                    <Text style={[styles.introText, { lineHeight: 1.4 }]}>{qfzpSelections.doesNotElectStandardRules ? 'Fulfilled' : 'Not fulfilled'}</Text>
                  </View>
                </View>
                
                <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
                  The company will be disqualified automatically from opting for this benefit for the next 4 years until {calculateDisqualificationDate()}.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Signature Section */}
        <View style={{ marginTop: 15 }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between'
          }}>
            {/* Left Column - Regards */}
            <View style={{ width: '45%' }}>
              <Text style={[styles.value, { marginBottom: 5 }]}>Regards,</Text>
              
              {/* Stamp Image */}
              <View style={{ marginBottom: 5 }}>
                <Image 
                  src={companyDetails.stampPath} 
                  style={{ 
                    width: 156, 
                    height: 104, 
                    objectFit: 'contain',
                    marginLeft: -10
                  }} 
                />
              </View>
              
              <Text style={[styles.value, { marginTop: 0 }]}>
                Uwe Hohmann
              </Text>
            </View>
            
            {/* Right Column - Acknowledged */}
            <View style={{ width: '45%', alignItems: 'flex-end', marginRight: 220 }}>
              <Text style={[styles.value, { marginBottom: 5, textAlign: 'right' }]}>Acknowledged,</Text>
              
              <Text style={[styles.value, { marginTop: 109, textAlign: 'right' }]}>
                {managerFullName}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <FooterComponent />
    </Page>
  );
};