import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { CITLetterHeaderComponent } from '../ui/CITLetterHeaderComponent';
import { FooterComponent } from '../../shared/FooterComponent';
import { getCompanyDetailsByAuthority } from '../../../utils/citAuthorityMapping';
import type { PDFComponentProps } from '../../../types';
import type { CITReturnLettersData } from '@/types/cit-return-letters';

interface ConfAccDocsPageProps {
  data: PDFComponentProps['data'] & { 
    citReturnLettersData: CITReturnLettersData;
  };
}

export const ConfAccDocsPage: React.FC<ConfAccDocsPageProps> = ({ data }) => {
  const { clientDetails, citReturnLettersData } = data;
  const selectedClient = citReturnLettersData.selectedClient;
  const selections = citReturnLettersData.confAccDocsSelections;
  
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

  // Calculate CIT return filing date (end date plus 9 months minus 1 day)
  const calculateCITFilingDate = () => {
    if (taxPeriodEnd) {
      const endDate = new Date(taxPeriodEnd);
      endDate.setMonth(endDate.getMonth() + 9);
      endDate.setDate(endDate.getDate() - 1); // Subtract 1 day
      const day = endDate.getDate().toString().padStart(2, '0');
      const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
      const year = endDate.getFullYear();
      return `${day}.${month}.${year}`;
    }
    return '30.09.2025'; // Default fallback
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

  // Create array of selected points with their content for dynamic numbering
  const selectedPoints = [
    selections.revenuesAndExpenses && {
      title: 'Revenues and expenses',
      content: 'The accuracy and completeness of the revenues and expenses recorded and reported in the financial statements.'
    },
    selections.nonDeductibleExpenses && {
      title: 'Non-deductible expenses',
      content: 'You have reviewed and approved the treatment of non-deductible expenses presented in the financial statements and confirm their accuracy for CIT return filing purposes.'
    },
    selections.waiverSalaryGratuity && {
      title: 'Waiver of salary and gratuity expenses',
      content: 'You have instructed us to waive salary and gratuity expenses from the accounts.'
    },
    selections.assetsAndLiabilities && {
      title: 'Assets and liabilities',
      content: 'The valuation and accuracy of assets and liabilities recorded in the books are based on the details provided by you and your team.'
    },
    selections.ifrs9FinancialInstruments && {
      title: 'IFRS 9 Financial instruments',
      content: 'You have instructed us that no provision for expected credit losses have to be accounted for.'
    },
    selections.ifrs16Leases && {
      title: 'IFRS 16 Leases',
      content: 'You have instructed us that rental contracts with a term exceeding 12 months have been accounted for using the straight-line method, rather than recognizing a right of use asset, corresponding lease liability, and related depreciation as per IFRS 16.'
    },
    selections.otherPointSelected && {
      title: selections.otherPointName || 'Open point',
      content: selections.otherPointText || 'Individual text'
    }
  ].filter(Boolean) as Array<{ title: string; content: string }>; // Remove false entries

  return (
    <>
      {/* First Page */}
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
              Confirmation of bookkeeping services and financial statements based on documents and{"\n"}information provided
            </Text>
          </View>

          {/* Dear Client */}
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.value}>Dear {managerFirstName},</Text>
          </View>

          {/* Main content paragraphs */}
          <View style={{ marginBottom: 15 }}>
            <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
              We confirm that we completed the bookkeeping services and the preparation of the financial statements for the period from {formatTaxPeriod()} for your company based on the accounting documents and information provided (sales and supplier invoices, bank and petty cash statements etc.) by you and your team.
            </Text>
          </View>
          
          <View style={{ marginBottom: 15 }}>
            <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
              We have provided you with these financial statements for review, and you confirmed the accuracy of all balances, including assets, liabilities, equity, revenues, and expenses. These approved financial statements are the basis for the preparation of the CIT return filing on {calculateCITFilingDate()}.
            </Text>
          </View>
          
          <View style={{ marginBottom: 15 }}>
            <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
              In particular you acknowledge and confirm the following:
            </Text>
          </View>

          {/* Dynamic confirmation points based on selections */}
          {selectedPoints.map((point, index) => (
            <View key={index} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={[styles.introText, { width: 25, textAlign: 'left' }]}>{index + 1}.</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.introText, { fontWeight: 'bold', marginBottom: 3 }]}>
                  {point.title}
                </Text>
                <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
                  {point.content}
                </Text>
              </View>
            </View>
          ))}

        </View>
        
        <FooterComponent />
      </Page>

      {/* Second Page */}
      <Page size="A4" style={styles.page}>
        <CITLetterHeaderComponent data={data} />
        
        {/* Main content area */}
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {/* Final paragraphs */}
          <View style={{ marginBottom: 15, marginTop: 15 }}>
            <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
              You have formally engaged us to proceed with the preparation and CIT return filing in accordance with applicable laws and regulations. Our scope of services is limited to compiling and recording transactions based on the documents and information provided by you and your team. The accuracy, completeness, and legality of all documents and information provided remain your responsibility.
            </Text>
          </View>
          
          <View style={{ marginBottom: 15 }}>
            <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
              We shall not be held liable for any penalties, fines, interest payments, or consequences arising from errors, omissions, or misstatements in the records provided by you and your team. This includes the confirmation of revenues and expenses, treatment of non-deductible expenses, waiver of salary and gratuity expenses, assets and liabilities, and transfer pricing compliance.
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
    </>
  );
};