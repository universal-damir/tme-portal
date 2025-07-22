import React from 'react';
import { Document } from '@react-pdf/renderer';
import { DisclaimerPage, CITShareholderDeclarationPage } from './pages';
import type { PDFComponentProps } from '../../types';

interface TaxationDocumentProps {
  data: PDFComponentProps['data'] & { taxationData: any; documentType?: 'disclaimer' | 'shareholder-declaration' };
}

export const TaxationDocument: React.FC<TaxationDocumentProps> = ({ data }) => {
  // Determine which document to render based on documentType
  const documentType = (data as any).documentType || 'disclaimer';

  return (
    <Document>
      {documentType === 'disclaimer' && <DisclaimerPage data={data} />}
      {documentType === 'shareholder-declaration' && <CITShareholderDeclarationPage data={data} />}
    </Document>
  );
}; 