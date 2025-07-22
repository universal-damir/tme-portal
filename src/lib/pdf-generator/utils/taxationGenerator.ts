import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { TaxationDocument } from '../components/taxation/TaxationDocument';
import { TaxationData } from '@/types/taxation';
import { SharedClientInfo } from '@/types/portal';
import { transformTaxationData } from './taxationDataTransformer';

export const generateTaxationPDF = async (
  taxationData: TaxationData,
  clientInfo: SharedClientInfo
): Promise<Blob> => {
  // Transform taxation data to standard PDF component format
  const transformedData = transformTaxationData(taxationData, clientInfo);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = React.createElement(TaxationDocument, { data: transformedData as any }) as any;
  const asPdf = pdf(doc);
  return await asPdf.toBlob();
};

export const generateTaxationPDFWithFilename = async (
  taxationData: TaxationData,
  clientInfo: SharedClientInfo
): Promise<{ blob: Blob; filename: string }> => {
  const blob = await generateTaxationPDF(taxationData, clientInfo);
  
  // Generate filename: {YYMMDD} {offerby abbreviation} {company shortname} CIT Disclaimer {tax end period dd.mm.yyyy}
  
  // Format document date as YYMMDD  
  const date = new Date(taxationData.date || clientInfo.date);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const formattedDate = `${yy}${mm}${dd}`;
  
  // Get company abbreviation from company type
  const companyAbbreviation = taxationData.companyType === 'management-consultants' ? 'MGT' : 'FZCO';
  
  // Get company short name
  const companyShortName = taxationData.shortCompanyName || clientInfo.shortCompanyName || 'Company';
  
  // Format tax end period as dd.mm.yyyy
  const formatTaxEndPeriod = () => {
    const toDate = taxationData.citDisclaimer?.taxPeriodRange?.toDate;
    if (toDate) {
      const endDate = new Date(toDate);
      const day = endDate.getDate().toString().padStart(2, '0');
      const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
      const year = endDate.getFullYear();
      return `${day}.${month}.${year}`;
    }
    return '31.12.2025'; // Default fallback
  };
  
  // Build filename: {YYMMDD} {abbreviation} {shortname} CIT Disclaimer {tax end period}
  const filename = `${formattedDate} ${companyAbbreviation} ${companyShortName} CIT Disclaimer ${formatTaxEndPeriod()}.pdf`;
  
  return { blob, filename };
};

// Generate CIT Shareholder Declaration PDF
export const generateCITShareholderDeclarationPDF = async (
  taxationData: TaxationData,
  clientInfo: SharedClientInfo
): Promise<Blob> => {
  // Transform taxation data with document type for shareholder declaration
  const transformedData = { 
    ...transformTaxationData(taxationData, clientInfo),
    documentType: 'shareholder-declaration'
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = React.createElement(TaxationDocument, { data: transformedData as any }) as any;
  const asPdf = pdf(doc);
  return await asPdf.toBlob();
};

// Generate CIT Shareholder Declaration PDF with filename
export const generateCITShareholderDeclarationPDFWithFilename = async (
  taxationData: TaxationData,
  clientInfo: SharedClientInfo
): Promise<{ blob: Blob; filename: string }> => {
  const blob = await generateCITShareholderDeclarationPDF(taxationData, clientInfo);
  
  // Generate filename: {YYMMDD} {company short name} CIT SH Declaration {tax end period dd.mm.yyyy}
  
  // Format document date as YYMMDD  
  const date = new Date(taxationData.date || clientInfo.date);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const formattedDate = `${yy}${mm}${dd}`;
  
  // Get company short name
  const companyShortName = taxationData.shortCompanyName || clientInfo.shortCompanyName || 'Company';
  
  // Format tax end period as dd.mm.yyyy
  const formatTaxEndPeriod = () => {
    const toDate = taxationData.citDisclaimer?.taxPeriodRange?.toDate;
    if (toDate) {
      const endDate = new Date(toDate);
      const day = endDate.getDate().toString().padStart(2, '0');
      const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
      const year = endDate.getFullYear();
      return `${day}.${month}.${year}`;
    }
    return '31.12.2025'; // Default fallback
  };
  
  // Build filename: {YYMMDD} {company short name} CIT SH Declaration {tax end period}
  const filename = `${formattedDate} ${companyShortName} CIT SH Declaration ${formatTaxEndPeriod()}.pdf`;
  
  return { blob, filename };
};

 