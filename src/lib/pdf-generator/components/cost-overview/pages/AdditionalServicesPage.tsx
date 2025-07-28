import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { styles } from '../../../styles';
import { HeaderComponent, FooterComponent, IntroSection, CostTable } from '../../shared';
import { 
  generateAdditionalServiceDescriptions,
  generateNumberedAdditionalServices,
  formatAdditionalServiceDescription
} from '../../../utils';
import type { PDFComponentProps, CostItem } from '../../../types';

// AdditionalServicesPage - Optional services that complement the setup
export const AdditionalServicesPage: React.FC<PDFComponentProps> = ({ data }) => {
  const exchangeRate = data.clientDetails.exchangeRate;

  // Check if there are any additional services selected
  const hasAdditionalServices = data.additionalServices && 
    Object.values(data.additionalServices).some(value => (value || 0) > 0);

  // Generate additional services items without numbering
  const generateAdditionalServicesItems = (): CostItem[] => {
    if (!data.additionalServices) return [];
    
    const additionalServiceDescriptions = generateAdditionalServiceDescriptions(data);
    
    return additionalServiceDescriptions.map(service => ({
      description: service.description, // No numbering, just the description
      amount: service.amount,
      secondaryAmount: service.amount / exchangeRate,
      isReduction: false
    }));
  };

  // Generate explanations for additional services (no numbering) - COMMENTED OUT
  // const generateAdditionalServiceExplanations = () => {
  //   if (!data.additionalServices) return [];
  //   
  //   const additionalServiceDescriptions = generateAdditionalServiceDescriptions(data);
  //   
  //   return additionalServiceDescriptions
  //     .filter(service => service.explanation)
  //     .map((service) => (
  //       <Text key={service.id} style={[styles.introText, { marginBottom: 8 }]}>
  //         <Text style={{ fontWeight: 'bold' }}>{service.description}:</Text>{' '}
  //         {service.explanation}
  //       </Text>
  //     ));
  // };

  const additionalServicesItems = generateAdditionalServicesItems();
  // const additionalServicesTotal = additionalServicesItems.reduce((sum, item) => sum + item.amount, 0);
  // const additionalServiceExplanationElements = generateAdditionalServiceExplanations();

  // Determine if explanations should be on same page or new page (Rule: 4 or fewer items) - COMMENTED OUT
  // const shouldShowExplanationsOnSamePage = additionalServicesItems.length <= 4;

  const introContent = `Below are optional services that complement your company setup. These services can be added based on your specific business requirements. Each service is designed to support your business operations and compliance needs in the UAE.`;

  return (
    <>
      {/* Page 1: Additional Services Table */}
      <Page size="A4" style={styles.page}>
        <HeaderComponent data={data} />

        <IntroSection
          headline="Additional Services"
          content={introContent}
        />

        {!hasAdditionalServices ? (
          <View style={styles.section}>
            <Text style={[styles.introText, { textAlign: 'center', fontStyle: 'italic', color: '#6b7280' }]}>
              No additional services selected for this proposal.
            </Text>
          </View>
        ) : (
          <>
            <CostTable
              data={data}
              title="Additional Services"
              items={additionalServicesItems}
              theme="orange"
              showTotal={false}
            />

            {/* Additional Service Explanations - COMMENTED OUT */}
            {/* {shouldShowExplanationsOnSamePage && additionalServiceExplanationElements.length > 0 && (
              <View style={{ marginTop: 24, marginBottom: 24 }}>
                <Text style={styles.introHeadline}>Additional Services Explanation</Text>
                <View style={{ marginTop: 16 }}>
                  {additionalServiceExplanationElements}
                </View>
              </View>
            )} */}
          </>
        )}

        {/* Summary Section - Added to the same page */}
        <View style={[styles.section, { marginTop: 32 }]}>
          <Text style={styles.introHeadline}>Summary</Text>
          
          <Text style={[styles.introText, { marginBottom: 8 }]}>
            Thank you for considering this cost overview.
          </Text>
          
          <Text style={[styles.introText, { marginBottom: 8 }]}>
            We appreciate the opportunity to support your business setup and ongoing operations.
          </Text>
          
          <Text style={[styles.introText, { marginBottom: 8 }]}>
            Should you have any questions or need further clarification on any of the listed items, please don't hesitate to reach out.
          </Text>
          
          <Text style={[styles.introText, { marginBottom: 8 }]}>
            The basis of our service fee and costs are in AED. All government cost will ALWAYS be charged on cost basis.
          </Text>

          <Text style={[styles.introText, { marginBottom: 8 }]}>
            The above mentioned cost amounts in AED are estimated costs at the time of the application.
          </Text>

          <Text style={[styles.introText, { marginBottom: 8 }]}>
            At the time of invoicing we will charge the actual costs based on invoices and receipts.
          </Text>

          <Text style={styles.introText}>
            We look forward to assisting you through each step of the process and ensuring a smooth and compliant setup tailored to your goals.
          </Text>
        </View>

        <FooterComponent />
      </Page>

      {/* Page 2: Additional Service Explanations (if more than 4 items) - COMMENTED OUT */}
      {/* {hasAdditionalServices && !shouldShowExplanationsOnSamePage && additionalServiceExplanationElements.length > 0 && (
        <Page size="A4" style={styles.page}>
          <HeaderComponent data={data} />

          <IntroSection
            headline="Additional Services Explanation"
            content=""
          />

          <View style={{ marginTop: 0, marginBottom: 24 }}>
            {additionalServiceExplanationElements}
          </View>

          <FooterComponent />
        </Page>
      )} */}
    </>
  );
}; 