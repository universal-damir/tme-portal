import React from 'react';
import { Document } from '@react-pdf/renderer';
import { 
  CoverPage, 
  InitialSetupPage, 
  VisaCostsPage, 
  YearlyRunningPage, 
  AdditionalServicesPage,
  CompleteCostOverviewPage
} from './pages';
import { shouldShowInitialSetup, shouldShowVisaCosts } from '../../utils';
import type { PDFComponentProps } from '../../types';

// OfferDocument - Main document component that orchestrates all pages
// Replaces the 2,842-line monolithic component with clean modular structure
export const OfferDocument: React.FC<PDFComponentProps> = ({ data }) => {
  // Defensive check to prevent crashes when data is malformed
  if (!data || !data.authorityInformation || !data.clientDetails) {
    console.error('OfferDocument: Invalid data provided', data);
    throw new Error('Invalid data provided to PDF generator. Please ensure all required fields are filled.');
  }

  // Determine which pages should be shown based on authority and data
  const showInitialSetup = shouldShowInitialSetup(data.authorityInformation.responsibleAuthority);
  const showVisaCosts = shouldShowVisaCosts(data);
  const showYearlyRunning = shouldShowInitialSetup(data.authorityInformation.responsibleAuthority);

  return (
    <Document>
      {/* Cover Page - Always shown */}
      <CoverPage data={data} />

      {/* Initial Setup Page - Only for IFZA and DET */}
      {showInitialSetup && <InitialSetupPage data={data} />}

      {/* Visa Costs Page - Only when visas are configured */}
      {showVisaCosts && <VisaCostsPage data={data} />}

      {/* Yearly Running Costs Page - Only for IFZA and DET */}
      {showYearlyRunning && <YearlyRunningPage data={data} />}

      {/* Additional Services Page - Always shown (handles empty state internally) */}
      <AdditionalServicesPage data={data} />

      {/* Complete Cost Overview Page - Always shown as the last page */}
      <CompleteCostOverviewPage data={data} />
    </Document>
  );
}; 