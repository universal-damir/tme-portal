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

  // Determine which services are enabled and their order
  const enabledServices = [
    { name: 'taxConsulting', enabled: companyServicesData.taxConsultingServices?.enabled },
    { name: 'accounting', enabled: companyServicesData.accountingServices?.enabled },
    { name: 'commercial', enabled: companyServicesData.accountingServices?.commercialServices },
    { name: 'backOffice', enabled: companyServicesData.backOfficeServices?.enabled },
    { name: 'compliance', enabled: companyServicesData.complianceServices?.enabled }
  ].filter(service => service.enabled);

  // Find the last enabled service
  const lastServiceName = enabledServices.length > 0 ? enabledServices[enabledServices.length - 1].name : null;

  // Add isLastService flag to transformedData
  const dataWithLastService = {
    ...transformedData,
    lastServiceName
  };

  return (
    <Document>
      {/* Cover Page - Always shown */}
      <CompanyServicesCoverPage data={dataWithLastService} />

      {/* Service Pages - Only shown when services are enabled */}
      <TaxConsultingServicesPage data={dataWithLastService} />
      <AccountingServicesPage data={dataWithLastService} />
      <CommercialServicesPage data={dataWithLastService} />
      <BackOfficeServicesPage data={dataWithLastService} />
      <ComplianceServicesPage data={dataWithLastService} />

      {/* Meet The Team Page - Always shown */}
      <MeetTheTeamPage data={dataWithLastService} />

      {/* Service Portfolio Page - Always shown */}
      <ServicePortfolioPage data={dataWithLastService} />
    </Document>
  );
}; 