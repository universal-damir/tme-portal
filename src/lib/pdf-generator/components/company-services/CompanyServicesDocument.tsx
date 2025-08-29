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

  // Find the first and last enabled services
  const firstServiceName = enabledServices.length > 0 ? enabledServices[0].name : null;
  const lastServiceName = enabledServices.length > 0 ? enabledServices[enabledServices.length - 1].name : null;

  // Add service position flags to transformedData
  const dataWithServiceFlags = {
    ...transformedData,
    firstServiceName,
    lastServiceName
  };

  return (
    <Document>
      {/* Cover Page - Always shown */}
      <CompanyServicesCoverPage data={dataWithServiceFlags} />

      {/* Service Pages - Only shown when services are enabled */}
      <TaxConsultingServicesPage data={dataWithServiceFlags} />
      <AccountingServicesPage data={dataWithServiceFlags} />
      <CommercialServicesPage data={dataWithServiceFlags} />
      <BackOfficeServicesPage data={dataWithServiceFlags} />
      <ComplianceServicesPage data={dataWithServiceFlags} />

      {/* Meet The Team Page - Always shown */}
      <MeetTheTeamPage data={dataWithServiceFlags} />

      {/* Service Portfolio Page - Always shown */}
      <ServicePortfolioPage data={dataWithServiceFlags} />
    </Document>
  );
}; 