import React from 'react';
import { Document } from '@react-pdf/renderer';
import { 
  GoldenVisaCoverPage,
  AuthorityCostsPage,
  DependentVisasPage
} from './pages';
import { transformGoldenVisaData, hasDependentVisas } from '../../utils/goldenVisaDataTransformer';
import { GoldenVisaData } from '@/types/golden-visa';
import { SharedClientInfo } from '@/types/portal';

// Props interface maintaining backward compatibility
interface GoldenVisaDocumentProps {
  goldenVisaData: GoldenVisaData;
  clientInfo: SharedClientInfo;
}

// GoldenVisaDocument - Main orchestrator component  
// Replaces the monolithic 545-line component with clean modular structure
// Maintains backward compatibility while using new modular components internally
export const GoldenVisaDocument: React.FC<GoldenVisaDocumentProps> = ({ 
  goldenVisaData, 
  clientInfo 
}) => {
  // Defensive check to prevent crashes when data is malformed
  if (!goldenVisaData || !clientInfo) {
    console.error('GoldenVisaDocument: Invalid data provided', { goldenVisaData, clientInfo });
    throw new Error('Invalid data provided to Golden Visa PDF generator. Please ensure all required fields are filled.');
  }

  // Transform golden visa data to standard PDF component format
  const transformedData = transformGoldenVisaData(goldenVisaData, clientInfo);

  // Determine which pages should be shown based on actual data
  const showDependentVisas = hasDependentVisas(goldenVisaData);

  return (
    <Document>
      {/* Cover Page - Always shown */}
      <GoldenVisaCoverPage data={transformedData} />

      {/* Authority Costs Page - Always shown */}
      <AuthorityCostsPage data={transformedData} />

      {/* Dependent Visas Page - Only when dependents are selected */}
      {showDependentVisas && <DependentVisasPage data={transformedData} />}
    </Document>
  );
}; 