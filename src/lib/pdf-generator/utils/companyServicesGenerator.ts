import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { CompanyServicesDocument } from '../components/company-services/CompanyServicesDocument';
import { CompanyServicesData } from '@/types/company-services';
import { SharedClientInfo } from '@/types/portal';
import { generateCompanyServicesFilename } from './companyServicesDataTransformer';

export const generateCompanyServicesPDF = async (
  companyServicesData: CompanyServicesData,
  clientInfo: SharedClientInfo
): Promise<Blob> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = React.createElement(CompanyServicesDocument, { companyServicesData, clientInfo }) as any;
  const asPdf = pdf(doc);
  return await asPdf.toBlob();
};

export const generateCompanyServicesPDFWithFilename = async (
  companyServicesData: CompanyServicesData,
  clientInfo: SharedClientInfo
): Promise<{ blob: Blob; filename: string }> => {
  const blob = await generateCompanyServicesPDF(companyServicesData, clientInfo);
  const filename = generateCompanyServicesFilename(companyServicesData, clientInfo);
  
  return { blob, filename };
}; 