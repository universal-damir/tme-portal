import React from 'react';
import { Document } from '@react-pdf/renderer';
import { 
  CompanyServicesCoverPage,
  TaxConsultingServicesPage,
  AccountingServicesPage,
  CommercialServicesPage,
  BackOfficeServicesPage,
  ComplianceServicesPage,
  MeetTheTeamPage,
  ServicePortfolioPage
} from './pages';
import { transformCompanyServicesData } from '../../utils';
import { CompanyServicesData } from '@/types/company-services';
import { SharedClientInfo } from '@/types/portal';

// Props interface maintaining backward compatibility
interface CompanyServicesDocumentProps {
  companyServicesData: CompanyServicesData;
  clientInfo: SharedClientInfo;
}

// CompanyServicesDocument - Main orchestrator component  
// Following the established pattern from GoldenVisaDocument and OfferDocument
// Maintains clean modular structure while being extensible for future pages
export const CompanyServicesDocument: React.FC<CompanyServicesDocumentProps> = ({ 
  companyServicesData, 
  clientInfo 
}) => {
  // Defensive check to prevent crashes when data is malformed
  if (!companyServicesData || !clientInfo) {
    console.error('CompanyServicesDocument: Invalid data provided', { companyServicesData, clientInfo });
    throw new Error('Invalid data provided to Company Services PDF generator. Please ensure all required fields are filled.');
  }

  // Transform company services data to standard PDF component format
  const transformedData = transformCompanyServicesData(companyServicesData, clientInfo);

  return (
    <Document>
      {/* Cover Page - Always shown */}
      <CompanyServicesCoverPage data={transformedData} />

      {/* Service Pages - Only shown when services are enabled */}
      <TaxConsultingServicesPage data={transformedData} />
      <AccountingServicesPage data={transformedData} />
      <CommercialServicesPage data={transformedData} />
      <BackOfficeServicesPage data={transformedData} />
      <ComplianceServicesPage data={transformedData} />

      {/* Meet The Team Page - Always shown */}
      <MeetTheTeamPage data={transformedData} />

      {/* Service Portfolio Page - Always shown */}
      <ServicePortfolioPage data={transformedData} />
    </Document>
  );
}; 