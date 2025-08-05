import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { CITShareholderHeaderComponent } from '../ui/CITShareholderHeaderComponent';
import { CITShareholderFooterComponent } from '../ui/CITShareholderFooterComponent';
import type { PDFComponentProps } from '../../../types';

interface CITShareholderDeclarationPageProps {
  data: PDFComponentProps['data'] & { taxationData: any };
}

export const CITShareholderDeclarationPage: React.FC<CITShareholderDeclarationPageProps> = ({ data }) => {
  // Access taxation data from transformed data
  const taxationData = data.taxationData;
  const citShareholderData = taxationData?.citShareholderDeclaration;
  const citDisclaimerData = taxationData?.citDisclaimer;
  
  // Format the tax period from the CIT disclaimer data
  const formatTaxPeriod = () => {
    const fromDate = citDisclaimerData?.taxPeriodRange?.fromDate;
    const toDate = citDisclaimerData?.taxPeriodRange?.toDate;
    
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

  // Get revenue information
  const getRevenueInfo = () => {
    if (citDisclaimerData?.noRevenueGenerated) {
      return 'no revenue';
    }
    const revenue = citDisclaimerData?.generatedRevenue || 0;
    return `AED ${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get books accounts status text
  const getBooksAccountsStatus = () => {
    const status = citShareholderData?.booksAccountsDeductibleExpenses;
    if (status === 'contain') {
      return 'does';
    } else if (status === 'do-not-contain') {
      return 'does NOT';
    }
    return 'does NOT OR does';
  };

  // Get dynamic points for relief types
  const getReliefTypePoints = () => {
    const points = [];
    const sbr = citShareholderData?.smallBusinessRelief;
    const liquidation = citShareholderData?.companyLiquidation;
    
    // Helper function to get proper liquidation text
    const getLiquidationText = () => {
      if (citDisclaimerData?.noRevenueGenerated) {
        return `The company did not generate any revenue during the stated tax period from ${formatTaxPeriod()}`;
      } else {
        return `The company generated revenue of ${getRevenueInfo()} during the stated tax period from ${formatTaxPeriod()}`;
      }
    };
    
    if (sbr && liquidation) {
      // Both selected - show as separate points
      points.push({
        number: 12,
        text: "The company will opt for Small Business Relief since the company's revenues for the stated tax period are below AED 3,000,000."
      });
      points.push({
        number: 13,
        text: getLiquidationText()
      });
    } else if (sbr) {
      // Only SBR selected
      points.push({
        number: 12,
        text: "The company will opt for Small Business Relief since the company's revenues for the stated tax period are below AED 3,000,000."
      });
    } else if (liquidation) {
      // Only liquidation selected
      points.push({
        number: 12,
        text: getLiquidationText()
      });
    } else {
      // Default fallback if nothing selected
      points.push({
        number: 12,
        text: "The company will opt for Small Business Relief since the company's revenues for the stated tax period are below AED 3,000,000."
      });
    }
    
    return points;
  };

  // Get offer by company type
  const getOfferBy = () => {
    const companyType = taxationData.companyType;
    if (companyType === 'management-consultants') {
      return 'TME Management Consultants LLC';
    }
    return 'TME Services FZCO';
  };

  // Format date as dd.mm.yyyy (consistent with disclaimer)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Format phone number as +971 XX X XX XX XX
  const formatPhoneNumber = (phone: string) => {
    if (!phone || phone.length < 9) return '+971 58 5 36 53 44';
    return `+971 ${phone.slice(0, 2)} ${phone.slice(2, 3)} ${phone.slice(3, 5)} ${phone.slice(5, 7)} ${phone.slice(7, 9)}`;
  };

  // Get client name and designation
  const clientName = `${data.clientDetails.firstName} ${data.clientDetails.lastName}`.trim() || 'Client Name';
  const designation = citShareholderData?.designation || 'Designation';
  const companyName = data.clientDetails.companyName || '--';
  const clientPhone = citShareholderData?.clientContactNumber || 'Contact Number';

  return (
    <Page size="A4" style={styles.page}>
      {/* Header area - always reserve space */}
      {citShareholderData?.hasOwnHeaderFooter ? (
        <View style={[styles.header, { alignItems: 'center', justifyContent: 'center', paddingVertical: 25, borderBottom: 'none' }]}>
          {/* Empty space for client's own header */}
        </View>
      ) : (
        <CITShareholderHeaderComponent data={data} />
      )}

      {/* Main content area */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        {/* Offer Company Name */}
        <View style={{ marginBottom: 3 }}>
          <Text style={{ fontSize: 10, color: '#374151' }}>
            {getOfferBy()}
          </Text>
        </View>

        {/* Uwe Hohmann */}
        <View style={{ marginBottom: 3 }}>
          <Text style={{ fontSize: 10, color: '#374151' }}>Uwe Hohmann</Text>
        </View>

        {/* Dubai, UAE and Date Row */}
        <View style={{ marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#374151' }}>Dubai, UAE</Text>
          <Text style={{ fontSize: 10, color: '#374151' }}>{formatDate(data.clientDetails.date)}</Text>
        </View>

        {/* Subject Line */}
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { borderLeft: 'none', paddingLeft: 0, fontSize: 12, fontWeight: 'bold', color: '#000000' }]}>
          Management declaration letter on non-deductible expenses for the purpose of the computation of taxable income for UAE corporate tax return filing for the tax period {formatTaxPeriod()}
          </Text>
        </View>

        {/* Dear Uwe */}
        <View style={{ marginBottom: 8 }}>
          <Text style={styles.value}>Dear Uwe,</Text>
        </View>

        {/* Main content paragraph */}
        <View style={{ marginBottom: 10 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.2 }]}>
            As part of the Federal Decree Law No. 47 of 2017 and review of the books of accounts provided to you for the period {formatTaxPeriod()}, for the purpose of computation of taxable income of the company, we are aware that the following expenses are considered non-deductible as per the UAE corporate tax law.
          </Text>
        </View>

        {/* Non-deductible expenses list */}
        <View style={{ marginBottom: 10, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={[styles.introText, { width: 20, textAlign: 'right', marginRight: 5 }]}>1.</Text>
            <Text style={[styles.introText, { flex: 1, textAlign: 'justify', lineHeight: 1.2 }]}>
              Any payments made towards donations, grants, or gifts to a Non-Qualifying Public Benefit Entity.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={[styles.introText, { width: 20, textAlign: 'right', marginRight: 5 }]}>2.</Text>
            <Text style={[styles.introText, { flex: 1, textAlign: 'justify', lineHeight: 1.2 }]}>
              Any expenses incurred as fines or penalties (except compensations made towards breach of contract)
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={[styles.introText, { width: 20, textAlign: 'right', marginRight: 5 }]}>3.</Text>
            <Text style={[styles.introText, { flex: 1, textAlign: 'justify', lineHeight: 1.2 }]}>
              Any bribes or illicit payments
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={[styles.introText, { width: 20, textAlign: 'right', marginRight: 5 }]}>4.</Text>
            <Text style={[styles.introText, { flex: 1, textAlign: 'justify', lineHeight: 1.2 }]}>
              Any dividends, profit distributions, or similar benefits paid to the owner of the company.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={[styles.introText, { width: 20, textAlign: 'right', marginRight: 5 }]}>5.</Text>
            <Text style={[styles.introText, { flex: 1, textAlign: 'justify', lineHeight: 1.2 }]}>
              Amounts withdrawn from the business by a natural person who is a taxable person conducting a business or business activity, or a partner in an Unincorporated Partnership.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={[styles.introText, { width: 20, textAlign: 'right', marginRight: 5 }]}>6.</Text>
            <Text style={[styles.introText, { flex: 1, textAlign: 'justify', lineHeight: 1.2 }]}>
              Corporate tax imposed on the company under this Decree-Law.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={[styles.introText, { width: 20, textAlign: 'right', marginRight: 5 }]}>7.</Text>
            <Text style={[styles.introText, { flex: 1, textAlign: 'justify', lineHeight: 1.2 }]}>
              Input VAT incurred by the company that is recoverable under the UAE VAT Law
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={[styles.introText, { width: 20, textAlign: 'right', marginRight: 5 }]}>8.</Text>
            <Text style={[styles.introText, { flex: 1, textAlign: 'justify', lineHeight: 1.2 }]}>
              Any taxes on income imposed on the company outside the UAE.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={[styles.introText, { width: 20, textAlign: 'right', marginRight: 5 }]}>9.</Text>
            <Text style={[styles.introText, { flex: 1, textAlign: 'justify', lineHeight: 1.2 }]}>
              50% of entertainment expenses incurred to entertain non-employees.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={[styles.introText, { width: 20, textAlign: 'right', marginRight: 5 }]}>10.</Text>
            <Text style={[styles.introText, { flex: 1, textAlign: 'justify', lineHeight: 1.2 }]}>
              Such other expenditure as specified in a decision issued by the Cabinet at the suggestion of the Minister.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={[styles.introText, { width: 20, textAlign: 'right', marginRight: 5 }]}>11.</Text>
            <Text style={[styles.introText, { flex: 1, textAlign: 'justify', lineHeight: 1.2 }]}>
              Expenses which are NOT in the nature of business expenses and are incurred by or for non-business purposes
            </Text>
          </View>
          {getReliefTypePoints().map((point, index) => (
            <View key={`relief-point-${index}`} style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={[styles.introText, { width: 20, textAlign: 'right', marginRight: 5 }]}>{point.number}.</Text>
              <Text style={[styles.introText, { flex: 1, textAlign: 'justify', lineHeight: 1.2 }]}>
                {point.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Confirmation paragraph */}
        <View style={{ marginBottom: 8 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.2 }]}>
            I, {clientName}, on behalf of {companyName} hereby confirm that the books of accounts for the tax period {formatTaxPeriod()} {getBooksAccountsStatus()} contain the above mentioned expenses.
          </Text>
        </View>

        {/* Detailed expenses paragraph */}
        <View style={{ marginBottom: 8 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.2 }]}>
            Detailed expenses in the nature of the above mentioned have been explicitly disclosed by us to you for appropriate adjustment to the taxable income computation, as per the attached annexures.
          </Text>
        </View>

        {/* Contact paragraph */}
        <View style={{ marginBottom: 8 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.2 }]}>
            Should you have any questions, don't hesitate to get in touch with me at {formatPhoneNumber(clientPhone)}.
          </Text>
        </View>

        {/* Closing */}
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.value}>Regards,</Text>
        </View>

        {/* Signature Section */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.value}>{clientName}</Text>
          <Text style={styles.value}>{designation}</Text>
        </View>

        {/* Spacer to push footer to bottom */}
        <View style={{ flex: 1 }} />
      </View>

      {/* Footer area - always reserve space */}
      {citShareholderData?.hasOwnHeaderFooter ? (
        <View style={[styles.footer, { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderTop: 'none' }]}>
          {/* Empty space for client's own footer */}
        </View>
      ) : (
        <CITShareholderFooterComponent data={data} />
      )}
    </Page>
  );
}; 