import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { 
  HeaderComponent, 
  FooterComponent
} from '../../shared';
import type { PDFComponentProps } from '../../../types';

interface DisclaimerPageProps {
  data: PDFComponentProps['data'] & { taxationData: any };
}

export const DisclaimerPage: React.FC<DisclaimerPageProps> = ({ data }) => {
  // Access taxation data from transformed data
  const taxationData = data.taxationData;
  
  // Format the tax period from the data
  const formatTaxPeriod = () => {
    const fromDate = taxationData.citDisclaimer?.taxPeriodRange?.fromDate;
    const toDate = taxationData.citDisclaimer?.taxPeriodRange?.toDate;
    
    if (fromDate && toDate) {
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      };
      
      return `${formatDate(fromDate)} to ${formatDate(toDate)}`;
    }
    
    return '[tax period from dd.mm.yyyy] to [tax period to dd.mm.yyyy]';
  };

  // Format the current date
  const formatCurrentDate = () => {
    const date = new Date(data.clientDetails.date);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Select stamp image based on company type
  const getStampImage = () => {
    const companyType = taxationData.companyType;
    if (companyType === 'management-consultants') {
      return '/mgt-stamp.JPG';
    }
    return '/fzco-stamp.JPG'; // Default to FZCO stamp
  };

  return (
    <Page size="A4" style={styles.page}>
      <HeaderComponent data={data} />

      {/* Main content area */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        {/* Company Name */}
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 10, color: '#374151' }}>{data.clientDetails.companyName || '--'}</Text>
          <Text style={{ fontSize: 10, color: '#374151' }}>{data.clientDetails.firstName} {data.clientDetails.lastName}</Text>
        </View>

        {/* Location and Date */}
        <View style={{ marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#374151' }}>Dubai, UAE</Text>
          <Text style={{ fontSize: 10, color: '#374151' }}>{formatCurrentDate()}</Text>
        </View>

        {/* Document Title */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, { borderLeft: 'none', paddingLeft: 0, fontSize: 12, fontWeight: 'bold' }]}>
            Disclaimer on our Corporate Tax Services with regards to Transfer Pricing to meet the Arm's Length Principle as per UAE Corporate Tax Law for the tax period {formatTaxPeriod()}
          </Text>
        </View>

        {/* Dear Client */}
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.value}>Dear {data.clientDetails.firstName},</Text>
        </View>

        {/* Main content paragraphs */}
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
            With the implementation of the UAE Corporate Tax law, referred to as The Federal Decree Law No. 47 of 2023, hereinafter called FDL No. 47 of 2023, effective 01.06.2023, all Taxable Persons (those registered and required to file the Corporate Tax returns) are required to ensure that transactions and opening balances at the beginning of its first tax period, entered into with its Related Parties and Connected Persons, as defined in the law, MUST comply with relevant articles in this law with respect to the Arm's Length Principle.
          </Text>
        </View>

        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
            For this purpose, the Taxable Person is required to identify all such relevant transactions and opening balances with its Related Parties and Connected Persons, as defined in the FDL No. 47 of 2023, and consult with a Transfer Pricing expert who can undertake a detailed study and analysis of the transactions, known as Benchmarking, to determine if such transactions or opening balances meet the Arm's Length requirements for the purposes of compliance with the law.
          </Text>
        </View>

        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
            We would like to highlight that non-compliance with Transfer Pricing could result in disallowance or such transactions being challenged by the Federal Tax Authority in future. Consequently, this could result in higher tax liabilities and penalties for non-compliance.
          </Text>
        </View>

        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
            Please note that TME Services, based on licensed activity limitations, does not provide any services in relation to Transfer Pricing and related studies as part of its Corporate Tax services. TME Services can support with obtaining the necessary quotations for such Transfer Pricing work but does not take responsibility on the conclusions and/ or sufficiency of the Transfer Pricing documentation. The Taxable Person's management would be responsible to handle such matters directly with a Transfer Pricing expert who is engaged for such services.
          </Text>
        </View>

        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
            Please do not hesitate to contact us if you have questions. We look forward to hearing from you.
          </Text>
        </View>

        {/* Closing */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.value}>Best regards,</Text>
        </View>

        {/* Signature Section */}
        <View style={{ marginBottom: 20 }}>
          {/* Stamp Image */}
          <View style={{ marginBottom: 5 }}>
            <Image 
              src={getStampImage()} 
              style={{ 
                width: 132, 
                height: 88, 
                objectFit: 'contain',
                marginLeft: -20
              }} 
            />
          </View>

          {/* Signature Text Row */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginTop: 5
          }}>
            {/* Left Side - Uwe Hohmann */}
            <View style={{ flex: 1 }}>
              <Text style={[styles.value, { marginBottom: 2 }]}>Uwe Hohmann</Text>
              <Text style={styles.value}>Managing Partner</Text>
            </View>

            {/* Right Side - Agreement */}
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[styles.value, { marginBottom: 2 }]}>Agreed to the above-mentioned offer</Text>
              <Text style={styles.value}>Name and signature</Text>
            </View>
          </View>
        </View>

        {/* Spacer to push footer to bottom */}
        <View style={{ flex: 1 }} />
      </View>

      <FooterComponent />
    </Page>
  );
}; 