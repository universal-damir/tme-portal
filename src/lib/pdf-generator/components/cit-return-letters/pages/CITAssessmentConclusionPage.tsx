import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { CITLetterHeaderComponent } from '../ui/CITLetterHeaderComponent';
import { FooterComponent } from '../../shared/FooterComponent';
import { getCompanyDetailsByAuthority, getCompanyTypeByAuthority } from '../../../utils/citAuthorityMapping';
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

  // Check if client is managed by FZCO (same logic as UI component)
  const isFZCOManaged = selectedClient && getCompanyTypeByAuthority(selectedClient.registered_authority) === 'FZCO';

  // Dynamic numbering based on QFZP visibility
  const sbrNumber = isFZCOManaged ? 2 : 1;
  const standardRulesNumber = isFZCOManaged ? 3 : 2;

  // Check if SBR amount exceeds threshold
  const sbrAmountExceedsThreshold = assessmentData.smallBusinessReliefAmount && 
    assessmentData.smallBusinessReliefAmount > 3000000;

  // QFZP eligibility logic - based on freezone vs non-freezone
  const isNonFreeZone = selectedClient?.registered_authority && 
    (selectedClient.registered_authority.includes('mainland') || 
     selectedClient.registered_authority.includes('Mainland'));
  
  const qfzpNotApplicable = isNonFreeZone;
  const qfzpNotQualified = isFZCOManaged && !allQFZPFulfilled;

  // Render Section B - Non-deductible expenses
  const SectionB = () => (
    <View style={{ marginBottom: 20 }}>
      {/* Section B Title */}
      <View style={{ marginBottom: 15 }}>
        <Text style={[styles.sectionTitle, { borderLeft: 'none', paddingLeft: 0, fontSize: 12, fontWeight: 'bold' }]}>
          B. Non-deductible expenses
        </Text>
      </View>

      {/* Section B Introduction */}
      <View style={{ marginBottom: 15 }}>
        <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
          As part of the Federal Decree Law No. 47 of 2022 ("Decree Law") and review of the books of accounts for the tax period {formatTaxPeriod()}, for the purpose of computation of taxable income of the company, the following expenses are considered non-deductible as per the UAE corporate tax law. This means that these expenses must be adjusted in the computation of the taxable income.
        </Text>
      </View>

      {/* Table Header */}
      <View style={{ flexDirection: 'row', marginBottom: 10, paddingBottom: 5, borderBottom: '1 solid #000000' }}>
        <Text style={[styles.introText, { fontWeight: 'bold', width: 50, textAlign: 'center' }]}>No.</Text>
        <Text style={[styles.introText, { fontWeight: 'bold', flex: 1, paddingLeft: 10 }]}>Particulars</Text>
        <Text style={[styles.introText, { fontWeight: 'bold', width: 120, textAlign: 'center' }]}>Non deductible</Text>
      </View>

      {/* Predefined Non-deductible Expenses */}
      <View style={{ marginBottom: 15 }}>
        {[
          { particulars: "Any payments made towards donations, grants or gifts to a Non-Qualifying Public Benefit Entity", percentage: "100%" },
          { particulars: "Any expenses incurred as fines or penalties", percentage: "100%" },
          { particulars: "Any bribes or illicit payments", percentage: "100%" },
          { particulars: "Any dividends, profit distributions or similar benefits paid to the owner of the company.", percentage: "100%" },
          { particulars: "Amounts withdrawn from the business by a natural person who is a taxable person conducting a business or business activity or a partner in an Unincorporated Partnership.", percentage: "100%" },
          { particulars: "Corporate income tax imposed on the company under this Decree-Law.", percentage: "100%" },
          { particulars: "Input VAT incurred by the company that is recoverable under the UAE VAT Law", percentage: "100%" },
          { particulars: "Any taxes on income imposed on the company outside the UAE.", percentage: "100%" },
          { particulars: "Expenses which are NOT incurred by or for taxable person's business purposes and are not recharged", percentage: "100%" },
          { particulars: "Expenses with missing receipts", percentage: "100%" },
          { particulars: "Expenses qualified by the auditors for IFRS non compliance", percentage: "100%" },
          { particulars: "Entertainment expenses for business purpose incurred for shareholders and business partners", percentage: "50%" }
        ].map((item, index) => (
          <View key={index} style={{ flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' }}>
            <Text style={[styles.introText, { width: 50, textAlign: 'center', lineHeight: 1.4 }]}>
              {index + 1}.
            </Text>
            <Text style={[styles.introText, { flex: 1, paddingLeft: 10, textAlign: 'justify', lineHeight: 1.4 }]}>
              {item.particulars}
            </Text>
            <Text style={[styles.introText, { width: 120, textAlign: 'center', lineHeight: 1.4 }]}>
              {item.percentage}
            </Text>
          </View>
        ))}

        {/* Dynamic entries from UI form */}
        {assessmentData.nonDeductibleExpenses
          .filter(expense => expense.particulars.trim() || expense.nonDeductiblePercentage > 0)
          .map((expense, index) => (
            <View key={`dynamic-${index}`} style={{ flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' }}>
              <Text style={[styles.introText, { width: 50, textAlign: 'center', lineHeight: 1.4 }]}>
                {13 + index}.
              </Text>
              <Text style={[styles.introText, { flex: 1, paddingLeft: 10, textAlign: 'justify', lineHeight: 1.4 }]}>
                {expense.particulars}
              </Text>
              <Text style={[styles.introText, { width: 120, textAlign: 'center', lineHeight: 1.4 }]}>
                {expense.nonDeductiblePercentage}%
              </Text>
            </View>
          ))
        }
      </View>
    </View>
  );

  // Render selection section component
  const SelectionSection = () => (
    <View style={{ marginBottom: 20 }}>
      <Text style={[styles.sectionTitle, { borderLeft: 'none', paddingLeft: 0, fontSize: 11, fontWeight: 'bold', marginBottom: 15 }]}>
        Kindly select the option for your CIT return filing:
      </Text>
      
      {/* Checkbox Option 1 - QFZP - Always show but grey out if not applicable */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        marginBottom: 12,
        opacity: !isFZCOManaged || qfzpNotQualified ? 0.5 : 1 
      }}>
        <View style={{
          width: 12,
          height: 12,
          border: '1 solid #000000',
          marginRight: 8,
          marginTop: 1
        }} />
        <View style={{ flex: 1 }}>
          <Text style={[
            styles.introText, 
            { 
              lineHeight: 1.4,
              color: !isFZCOManaged || qfzpNotQualified ? '#9CA3AF' : undefined
            }
          ]}>
            Option 1: QFZP (Qualified Free Zone Person)
          </Text>
          
          {!isFZCOManaged && (
            <Text style={[styles.introText, { 
              lineHeight: 1.4, 
              color: '#9CA3AF', 
              fontSize: 9,
              fontStyle: 'italic',
              marginTop: 3
            }]}>
              This option does not apply to non Freezone companies
            </Text>
          )}
          
          {isFZCOManaged && qfzpNotQualified && (
            <Text style={[styles.introText, { 
              lineHeight: 1.4, 
              color: '#9CA3AF', 
              fontSize: 9,
              fontStyle: 'italic',
              marginTop: 3
            }]}>
              Your company does not qualify for this option
            </Text>
          )}
        </View>
      </View>

      {/* Checkbox Option 2 - SBR */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        marginBottom: 12,
        opacity: sbrAmountExceedsThreshold ? 0.5 : 1 
      }}>
        <View style={{
          width: 12,
          height: 12,
          border: '1 solid #000000',
          marginRight: 8,
          marginTop: 1
        }} />
        <View style={{ flex: 1 }}>
          <Text style={[
            styles.introText, 
            { 
              lineHeight: 1.4,
              color: sbrAmountExceedsThreshold ? '#9CA3AF' : undefined
            }
          ]}>
            Option 2: SBR (Small Business Relief)
          </Text>
          
          {sbrAmountExceedsThreshold && (
            <Text style={[styles.introText, { 
              lineHeight: 1.4, 
              color: '#9CA3AF', 
              fontSize: 9,
              fontStyle: 'italic',
              marginTop: 3
            }]}>
              The company crossed AED 3,000,000 revenue threshold
            </Text>
          )}
        </View>
      </View>

      {/* Checkbox Option 3 - Standard Rules */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        marginBottom: 12
      }}>
        <View style={{
          width: 12,
          height: 12,
          border: '1 solid #000000',
          marginRight: 8,
          marginTop: 1
        }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.introText, { lineHeight: 1.4 }]}>
            Option 3: Standard rules
          </Text>
        </View>
      </View>
      
      {/* Explanatory text */}
      <View style={{ marginTop: 15 }}>
        <Text style={[styles.introText, { lineHeight: 1.4, textAlign: 'justify' }]}>
          You can select only one option. The CIT returns file will be prepared based on the selected option. All options must comply with TP (Transfer Pricing) regulations. The CIT returns will be filed assuming that the amounts as seen in the financial statements comply with such TP regulations.
        </Text>
      </View>
    </View>
  );

  // Conditional rendering: if QFZP section exists, render selection on new page
  if (isFZCOManaged) {
    return (
      <>
        {/* First Page - Main content with QFZP */}
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

            {/* Main intro paragraph */}
            <View style={{ marginBottom: 15 }}>
              <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
                {assessmentData.citImpactAssessmentPerformed
                  ? `Based on our service offer dated ${formatAssessmentDate()} for the CIT impact assessment for your company, we have made the following observations for the tax period from ${formatTaxPeriod()}. Kindly read the options below carefully and confirm your selection at the end of section A so that we can proceed with the CIT return filing on the FTA (Federal Tax Authority) portal.`
                  : `Based on our bird's eye review of the financial statements, we have made the following observations for the tax period from ${formatTaxPeriod()}. Kindly read the options below carefully and confirm your selection at the end of section A, for us to proceed with the CIT return filing on the FTA (Federal Tax Authority) portal.`
                }
              </Text>
            </View>

            {/* QFZP Benefit Section */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { borderLeft: 'none', paddingLeft: 0, fontSize: 11, fontWeight: 'bold', marginBottom: 10 }]}>
                1. QFZP (Qualifying Free Zone Person) benefit
              </Text>
              
              {allQFZPFulfilled ? (
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

            {/* Small Business Relief (SBR) Section */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { borderLeft: 'none', paddingLeft: 0, fontSize: 11, fontWeight: 'bold', marginBottom: 10 }]}>
                2. Small Business Relief (SBR)
              </Text>
              
              <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4, marginBottom: 10 }]}>
                A company having an annual turnover of less than AED 3,000,000 may opt for this relief. The implications of this relief are as follows:
              </Text>
              
              <View style={{ marginBottom: 10, paddingLeft: 20 }}>
                <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 3 }]}>
                  a. Simplified filing obligations (declaring only revenues to FTA)
                </Text>
                <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 3 }]}>
                  b. No other reliefs / benefits / carry forward of losses as per the UAE CIT law are available
                </Text>
                <Text style={[styles.introText, { lineHeight: 1.4 }]}>
                  c. SBR is currently available only until 31.12.2026
                </Text>
              </View>

              {assessmentData.smallBusinessReliefAmount && assessmentData.smallBusinessReliefAmount > 0 && (
                <Text style={[styles.introText, { lineHeight: 1.4 }]}>
                  Company Revenue: AED {assessmentData.smallBusinessReliefAmount.toLocaleString('en-US')}
                </Text>
              )}
            </View>

            {/* Standard rules Section */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { borderLeft: 'none', paddingLeft: 0, fontSize: 11, fontWeight: 'bold', marginBottom: 10 }]}>
                3. Standard rules
              </Text>
              
              <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4, marginBottom: 10 }]}>
                The standard corporate income tax rules are applicable as per the Federal Decree Law No. 47 of 2022 ("Decree Law"). This standard rule requires detailed filing of financial statements and applying all relevant sections of the Decree Law, and attracts the following tax rates.
              </Text>
              
              <View style={{ marginBottom: 10, paddingLeft: 10 }}>
                <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 3 }]}>
                  • If the taxable income is less than or equal to AED 375,000, the CIT tax rate is 0%.
                </Text>
                <Text style={[styles.introText, { lineHeight: 1.4 }]}>
                  • If the taxable income is more than AED 375,000, the CIT tax rate is 9% for amounts above AED 375,000.
                </Text>
              </View>
            </View>
          </View>
          
          <FooterComponent />
        </Page>

        {/* Second Page - Selection Options */}
        <Page size="A4" style={styles.page}>
          <CITLetterHeaderComponent data={data} />
          
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <SelectionSection />
          </View>

          <FooterComponent />
        </Page>

        {/* Third Page - Section B */}
        <Page size="A4" style={styles.page}>
          <CITLetterHeaderComponent data={data} />
          
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <SectionB />
          </View>
          
          <FooterComponent />
        </Page>

        {/* Second Page - Elections and Signature section */}
        <Page size="A4" style={styles.page}>
          <CITLetterHeaderComponent data={data} />
          
          <View style={{ flex: 1, flexDirection: 'column' }}>

            {/* Elections Section */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { borderLeft: 'none', paddingLeft: 0, fontSize: 12, fontWeight: 'bold', marginBottom: 15 }]}>
                C. Elections
              </Text>
              
              <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4, marginBottom: 15 }]}>
                The Decree Law provides for certain elections that could apply to you. We have opted to make the following elections as explained below. The details on such elections are available as seen in the tax computation workings:
              </Text>

              <View style={{ paddingLeft: 20, marginBottom: 15 }}>
                <Text style={[styles.introText, { fontWeight: 'bold', lineHeight: 1.4, marginBottom: 10 }]}>
                  1. Realization basis of accounting:
                </Text>
                <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4, marginBottom: 15, paddingLeft: 10 }]}>
                  The company may adjust its taxable income for unrealized gains or losses on all assets and liabilities, which are recorded as per fair value or impairment accounting, or only capital assets and liabilities, and no adjustments to be made for unrealized gains or losses on revenue account.
                </Text>

                <Text style={[styles.introText, { fontWeight: 'bold', lineHeight: 1.4, marginBottom: 10 }]}>
                  2. Transitional rules:
                </Text>
                <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4, marginBottom: 15, paddingLeft: 10 }]}>
                  The company is required to make adjustments to the opening balances of its first tax period for the arm's length principle for transactions with Related Parties or Connected Persons. Please refer to the TP disclaimer letter. Further, an election has been made on account of assets and liabilities to benefit from excluding any gain or loss, as applicable per law, on the realization of such assets / liabilities after the first tax period, which were owned prior to the first tax period.
                </Text>

                <Text style={[styles.introText, { fontWeight: 'bold', lineHeight: 1.4, marginBottom: 10 }]}>
                  3. Carry forward of losses:
                </Text>
                <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4, marginBottom: 15, paddingLeft: 10 }]}>
                  The company may carry forward the tax losses to the subsequent years to be set off against the taxable income of such subsequent years, where small business relief and QFZP benefit are not elected.
                </Text>
              </View>

              <Text style={[styles.introText, { lineHeight: 1.4 }]}>
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
  }

  // No QFZP section - render everything on single page
  return (
    <>
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

        {/* Main intro paragraph */}
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4 }]}>
            {assessmentData.citImpactAssessmentPerformed
              ? `Based on our service offer dated ${formatAssessmentDate()} for the CIT impact assessment for your company, we have made the following observations for the tax period from ${formatTaxPeriod()}. Kindly read the options below carefully and confirm your selection at the end of section A so that we can proceed with the CIT return filing on the FTA (Federal Tax Authority) portal.`
              : `Based on our bird's eye review of the financial statements, we have made the following observations for the tax period from ${formatTaxPeriod()}. Kindly read the options below carefully and confirm your selection at the end of section A, for us to proceed with the CIT return filing on the FTA (Federal Tax Authority) portal.`
            }
          </Text>
        </View>

        {/* QFZP Section - Non-freezone companies */}
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { borderLeft: 'none', paddingLeft: 0, fontSize: 11, fontWeight: 'bold', marginBottom: 8.5 }]}>
            1. QFZP (Qualifying Free Zone Person) benefit
          </Text>
          
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4, marginBottom: 10 }]}>
            This option is not applicable for non-Freezone companies.
          </Text>
        </View>

        {/* Small Business Relief (SBR) Section */}
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { borderLeft: 'none', paddingLeft: 0, fontSize: 11, fontWeight: 'bold', marginBottom: 8.5 }]}>
            2. Small Business Relief (SBR)
          </Text>
          
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4, marginBottom: 10 }]}>
            A company having an annual turnover of less than AED 3,000,000 may opt for this relief. The implications of this relief are as follows:
          </Text>
          
          <View style={{ marginBottom: 10, paddingLeft: 20 }}>
            <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 3 }]}>
              a. Simplified filing obligations (declaring only revenues to FTA)
            </Text>
            <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 3 }]}>
              b. No other reliefs / benefits / carry forward of losses as per the UAE CIT law are available
            </Text>
            <Text style={[styles.introText, { lineHeight: 1.4 }]}>
              c. SBR is currently available only until 31.12.2026
            </Text>
          </View>

          {assessmentData.smallBusinessReliefAmount && assessmentData.smallBusinessReliefAmount > 0 && (
            <Text style={[styles.introText, { lineHeight: 1.4 }]}>
              Company Revenue: AED {assessmentData.smallBusinessReliefAmount.toLocaleString('en-US')}
            </Text>
          )}
        </View>

        {/* Standard rules Section */}
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { borderLeft: 'none', paddingLeft: 0, fontSize: 11, fontWeight: 'bold', marginBottom: 8.5 }]}>
            3. Standard rules
          </Text>
          
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4, marginBottom: 10 }]}>
            The standard corporate income tax rules are applicable as per the Federal Decree Law No. 47 of 2022 ("Decree Law"). This standard rule requires detailed filing of financial statements and applying all relevant sections of the Decree Law, and attracts the following tax rates.
          </Text>
          
          <View style={{ marginBottom: 10, paddingLeft: 10 }}>
            <Text style={[styles.introText, { lineHeight: 1.4, marginBottom: 3 }]}>
              • If the taxable income is less than or equal to AED 375,000, the CIT tax rate is 0%.
            </Text>
            <Text style={[styles.introText, { lineHeight: 1.4 }]}>
              • If the taxable income is more than AED 375,000, the CIT tax rate is 9% for amounts above AED 375,000.
            </Text>
          </View>
        </View>

        <SelectionSection />
      </View>
      
      <FooterComponent />
    </Page>

    {/* Second Page - Section B */}
    <Page size="A4" style={styles.page}>
      <CITLetterHeaderComponent data={data} />
      
      {/* Main content area */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <SectionB />
      </View>
      
      <FooterComponent />
    </Page>

    {/* Second Page - Elections and Signature section */}
    <Page size="A4" style={styles.page}>
      <CITLetterHeaderComponent data={data} />
      
      {/* Main content area */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        {/* Elections Section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, { borderLeft: 'none', paddingLeft: 0, fontSize: 12, fontWeight: 'bold', marginBottom: 15 }]}>
            C. Elections
          </Text>
          
          <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4, marginBottom: 15 }]}>
            The Decree Law provides for certain elections that could apply to you. We have opted to make the following elections as explained below. The details on such elections are available as seen in the tax computation workings:
          </Text>

          <View style={{ paddingLeft: 20, marginBottom: 15 }}>
            <Text style={[styles.introText, { fontWeight: 'bold', lineHeight: 1.4, marginBottom: 10 }]}>
              1. Realization basis of accounting:
            </Text>
            <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4, marginBottom: 15, paddingLeft: 10 }]}>
              The company may adjust its taxable income for unrealized gains or losses on all assets and liabilities, which are recorded as per fair value or impairment accounting, or only capital assets and liabilities, and no adjustments to be made for unrealized gains or losses on revenue account.
            </Text>

            <Text style={[styles.introText, { fontWeight: 'bold', lineHeight: 1.4, marginBottom: 10 }]}>
              2. Transitional rules:
            </Text>
            <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4, marginBottom: 15, paddingLeft: 10 }]}>
              The company is required to make adjustments to the opening balances of its first tax period for the arm's length principle for transactions with Related Parties or Connected Persons. Please refer to the TP disclaimer letter. Further, an election has been made on account of assets and liabilities to benefit from excluding any gain or loss, as applicable per law, on the realization of such assets / liabilities after the first tax period, which were owned prior to the first tax period.
            </Text>

            <Text style={[styles.introText, { fontWeight: 'bold', lineHeight: 1.4, marginBottom: 10 }]}>
              3. Carry forward of losses:
            </Text>
            <Text style={[styles.introText, { textAlign: 'justify', lineHeight: 1.4, marginBottom: 15, paddingLeft: 10 }]}>
              The company may carry forward the tax losses to the subsequent years to be set off against the taxable income of such subsequent years, where small business relief and QFZP benefit are not elected.
            </Text>
          </View>

          <Text style={[styles.introText, { lineHeight: 1.4 }]}>
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