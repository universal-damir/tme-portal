import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { GoldenVisaDocument } from '../components/golden-visa/GoldenVisaDocument';
import { GoldenVisaData } from '@/types/golden-visa';
import { SharedClientInfo } from '@/types/portal';

export const generateGoldenVisaPDF = async (
  goldenVisaData: GoldenVisaData,
  clientInfo: SharedClientInfo
): Promise<Blob> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = React.createElement(GoldenVisaDocument, { goldenVisaData, clientInfo }) as any;
  const asPdf = pdf(doc);
  return await asPdf.toBlob();
};

export const generateGoldenVisaPDFWithFilename = async (
  goldenVisaData: GoldenVisaData,
  clientInfo: SharedClientInfo
): Promise<{ blob: Blob; filename: string }> => {
  const blob = await generateGoldenVisaPDF(goldenVisaData, clientInfo);
  
  // Generate filename: yymmdd Slast name first name offer visa 10y golden <type>
  
  // Format date as YYMMDD
  const date = new Date(clientInfo.date);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const formattedDate = `${yy}${mm}${dd}`;
  
  // Get client names
  const lastName = clientInfo.lastName || '';
  const firstName = clientInfo.firstName || '';
  
  // Handle company name or individual name
  let nameForFilename = '';
  if (clientInfo.companyName) {
    nameForFilename = clientInfo.companyName;
  } else if (lastName && firstName) {
    nameForFilename = `${lastName} ${firstName}`;
  } else if (firstName) {
    nameForFilename = firstName;
  } else if (lastName) {
    nameForFilename = lastName;
  } else {
    nameForFilename = 'Client';
  }
  
  // Determine if this is a dependent-only visa (no primary holder)
  const isDependentOnly = !goldenVisaData.primaryVisaRequired;
  
  let visaTypeFormatted: string;
  
  if (isDependentOnly) {
    // If only dependents are getting visas, use "dependent" suffix
    visaTypeFormatted = 'dependent';
  } else {
    // Format visa type for filename (shortened versions)
    const visaTypeMap: { [key: string]: string } = {
      'property-investment': 'property',
      'time-deposit': 'deposit',
      'skilled-employee': 'skilled'
    };
    
    visaTypeFormatted = visaTypeMap[goldenVisaData.visaType] || goldenVisaData.visaType;
  }
  
  // Build filename: yymmdd {name} offer golden visa {type}
  const filename = `${formattedDate} ${nameForFilename} offer golden visa ${visaTypeFormatted}.pdf`;
  
  return { blob, filename };
}; 