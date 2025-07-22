import React from 'react';
import { View, Text, Link } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import type { PDFComponentProps } from '../../../types';

// VisaRequirementsSection - Visa-specific requirements and bullet points
// Displays the current bullet point requirements based on visa type
export const VisaRequirementsSection: React.FC<PDFComponentProps> = ({ data }) => {
  // Access golden visa data from transformed data
  const goldenVisaData = (data as any).goldenVisaData;

  // Get visa type from actual data
  const getVisaType = () => {
    return goldenVisaData?.visaType || 'property-investment';
  };

  // Get freezone display name with full description
  const getFreezoneDisplayName = (freezone: string) => {
    switch (freezone?.toLowerCase()) {
      case 'dmcc':
        return 'DMCC (Dubai Multi Commodities Centre)';
      case 'ifza':
        return 'IFZA (International Freezone Authority)';
      case 'difc':
        return 'DIFC (Dubai International Financial Centre)';
      case 'dafza':
        return 'DAFZA (Dubai Airport Free Zone Authority)';
      case 'jafza':
        return 'JAFZA (Jebel Ali Free Zone Authority)';
      default:
        return freezone?.toUpperCase() || 'Free Zone Authority';
    }
  };

  // Generate requirements based on visa type (keeping current content)
  const renderRequirements = () => {
    const visaType = getVisaType();

    switch (visaType) {
      case 'property-investment':
        return (
          <>
            <Text style={styles.introText}>
              1. <Text style={{ fontWeight: 'bold' }}>Minimum Property Value:</Text> AED 2,000,000 per person. Joint ownership is allowed.{"\n"}Off-plan properties require NOC (Non-Objection Certificate) and statement of payment status from the developer.
            </Text>
      
            <Text style={styles.introText}>
              2. <Text style={{ fontWeight: 'bold' }}>Eligible Property Types:</Text> Only villas and apartments qualify.
            </Text>
            
            <Text style={styles.introText}>
              3. <Text style={{ fontWeight: 'bold' }}>Processing Time:</Text> Approximately 10 - 15 working days. The applicant must be inside the UAE to begin the visa process.
            </Text>
            
            <Text style={styles.introText}>
              4. <Text style={{ fontWeight: 'bold' }}>Health Insurance:</Text> Required. Must be either UAE-registered or international health insurance.
            </Text>
            
            <Text style={styles.introText}>
              5. <Text style={{ fontWeight: 'bold' }}>Medical & Emirates ID:</Text> Your physical presence is required for both the medical test and Emirates ID appointment.{"\n"} You will receive your appointment details in advance for both appointments. Original passport is required for both appointments.
            </Text>
          </>
        );

      case 'time-deposit':
        return (
          <>
            <Text style={styles.introText}>
              1. <Text style={{ fontWeight: 'bold' }}>Minimum Deposit:</Text> A fixed deposit of AED 2,000,000 with a UAE-based bank is required, held for a minimum of 2 years.
            </Text>
            
            <Text style={styles.introText}>
              2. <Text style={{ fontWeight: 'bold' }}>Residency Requirement:</Text> You must already hold a valid UAE residence visa and provide proof of Dubai residency.
            </Text>
            <Text style={styles.introText}>   Acceptable documents include a valid Ejari or a title deed issued by the DLD (Dubai Land Department).
            </Text>
            
            <Text style={styles.introText}>
              3. <Text style={{ fontWeight: 'bold' }}>Processing Time:</Text> Approximately 10 - 15 working days.
            </Text>
            
            <Text style={styles.introText}>
              4. <Text style={{ fontWeight: 'bold' }}>Health Insurance:</Text> Required. Must be either UAE-registered or international health insurance.
            </Text>
            
            <Text style={styles.introText}>
              5. <Text style={{ fontWeight: 'bold' }}>Medical & Emirates ID:</Text> Your physical presence is required for both the medical test and Emirates ID appointment.{"\n"} You will receive your appointment details in advance for both appointments. Original passport is required for both appointments.
            </Text>
          </>
        );

      case 'skilled-employee':
        // Check if NOC is required and get freezone name
        const requiresNOC = goldenVisaData?.requiresNOC;
        const selectedFreezone = goldenVisaData?.selectedFreezone;
        
        return (
          <>
            <Text style={styles.introText}>
              1. <Text style={{ fontWeight: 'bold' }}>Educational Qualification:</Text> Bachelor's or Master's certificate with transcript. Must be attested and legalized by the UAE Embassy in the country of origin.
            </Text>
            
            <Text style={styles.introText}>
              2. <Text style={{ fontWeight: 'bold' }}>Equivalency Certificate:</Text> Issued by the Ministry of Education Dubai.
              <Link 
              src="https://www.moe.gov.ae/En/EServices/ServiceCard/Pages/Pre-Assessment.aspx"
              style={[styles.introText, { color: '#2563eb', textDecoration: 'underline', marginLeft: 15, marginTop: 2 }]}
            >
               Link to the Ministry of Education website.
            </Link></Text>
           
            
            <Text style={styles.introText}>
              3. <Text style={{ fontWeight: 'bold' }}>Employment Documents:</Text> Employment contract and salary certificate showing a minimum monthly salary of AED 30,000.
            </Text>
            
            {requiresNOC && selectedFreezone && (
              <Text style={styles.introText}>
                4. <Text style={{ fontWeight: 'bold' }}>Freezone NOC:</Text> A No Objection Certificate from <Text>{getFreezoneDisplayName(selectedFreezone)}</Text>.
              </Text>
            )}
            
            <Text style={styles.introText}>
              {requiresNOC && selectedFreezone ? '5.' : '4.'} <Text style={{ fontWeight: 'bold' }}>Company NOC:</Text> A No Objection Certificate from your current employer, in <Text>English and Arabic</Text>.
            </Text>
            
            <Text style={styles.introText}>
              {requiresNOC && selectedFreezone ? '6.' : '5.'} <Text style={{ fontWeight: 'bold' }}>Bank Statements:</Text> 6 months of personal bank statements reflecting a <Text>monthly salary of AED 30,000 or more</Text>.
            </Text>
            
            <Text style={styles.introText}>
              {requiresNOC && selectedFreezone ? '7.' : '6.'} <Text style={{ fontWeight: 'bold' }}>Residence Proof:</Text> Valid Ejari or title deed.
            </Text>
            
            <Text style={styles.introText}>
              {requiresNOC && selectedFreezone ? '8.' : '7.'} <Text style={{ fontWeight: 'bold' }}>Processing Time:</Text> Approximately 10 - 15 working days.
            </Text>
            
            <Text style={styles.introText}>
              {requiresNOC && selectedFreezone ? '9.' : '8.'} <Text style={{ fontWeight: 'bold' }}>Health Insurance:</Text> Required. Must be either UAE-registered or international health insurance.
            </Text>
            
            <Text style={styles.introText}>
              {requiresNOC && selectedFreezone ? '10.' : '9.'} <Text style={{ fontWeight: 'bold' }}>Medical & Emirates ID:</Text> Your physical presence is required for both the medical test and Emirates ID appointment.{"\n"} You will receive your appointment details in advance for both appointments. Original passport is required for both appointments.
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
      return 'Please review the following requirements to determine eligibility:';
    }
    return 'Please review the following requirements that must be met to be eligible for this Golden Visa:';
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Visa Requirements & Eligibility Criteria</Text>
      <Text style={styles.introText}>
        {getIntroText()}
      </Text>
      
      <View style={{ marginTop: 8 }}>
        {renderRequirements()}
      </View>
    </View>
  );
}; 