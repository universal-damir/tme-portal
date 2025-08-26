import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { CITLetterHeaderComponent } from '../ui/CITLetterHeaderComponent';
import { FooterComponent } from '../../shared/FooterComponent';
import { getCompanyDetailsByAuthority } from '../../../utils/citAuthorityMapping';
import type { PDFComponentProps } from '../../../types';
import type { CITReturnLettersData } from '@/types/cit-return-letters';

interface CITTransferPricingPageProps {
  data: PDFComponentProps['data'] & { 
    citReturnLettersData: CITReturnLettersData;
  };
}

export const CITTransferPricingPage: React.FC<CITTransferPricingPageProps> = ({ data }) => {
  const { clientDetails, citReturnLettersData } = data;
  const selectedClient = citReturnLettersData.selectedClient;
  
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

  // Format the letter date as dd.mm.yyyy
  const formatLetterDate = () => {
    const letterDateToUse = citReturnLettersData.letterDate || new Date().toISOString().split('T')[0];
    const date = new Date(letterDateToUse);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };


  // Get company details for stamp
  const companyDetails = getCompanyDetailsByAuthority(
    selectedClient?.registered_authority || 'DXB IFZA FZ' // Default fallback
  );

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
            Transfer Pricing to meet the Arm's Length Principle as per UAE CIT Law
          </Text>
        </View>

        {/* Dear Client */}
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.value}>Dear {managerFirstName},</Text>
        </View>

        {/* Main content paragraphs */}
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
            With the implementation of the UAE Corporate Tax law, referred to as the Federal Decree Law No. 47 of 2022, hereinafter called FDL No. 47 of 2022, effective 01.06.2023, all Taxable Persons (those registered and required to file the Corporate Income Tax returns) are required to ensure that transactions and opening balances at the beginning of its first tax period, entered into with its Related Parties and Connected Persons, as defined in the law, must comply with relevant articles in this law with respect to the Arm's Length Principle.
          </Text>
        </View>
        
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
            For this purpose, the Taxable Person is required to identify all such relevant transactions and opening balances with its Related Parties and Connected Persons, as defined in the FDL No. 47 of 2022, and consult with a Transfer Pricing expert who can undertake a detailed study and analysis of the transactions, known as Benchmarking, to determine if such transactions or opening balances meet the Arm's Length requirements for the purposes of compliance with the law. The tax period is from {formatTaxPeriod()}.
          </Text>
        </View>
        
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
            We would like to highlight that non-compliance with Transfer Pricing could result in disallowance or such transactions being challenged by the FTA (Federal Tax Authority) in the future. Consequently, this could result in higher tax liabilities and penalties for non-compliance.
          </Text>
        </View>
        
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
            Please note that our company, based on licensed activity limitations, does not provide services in relation to Transfer Pricing and related studies as part of its Corporate Tax services. We can support you with obtaining the necessary quotations for such Transfer Pricing work, but we do not take responsibility for the conclusions and/or sufficiency of the Transfer Pricing documentation. The Taxable Person's management would be responsible for handling such matters directly with a Transfer Pricing expert who is engaged in such services.
          </Text>
        </View>
        
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
            We look forward to receiving the signed acknowledgment.
          </Text>
        </View>

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