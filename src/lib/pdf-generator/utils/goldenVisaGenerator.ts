import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { GoldenVisaDocument } from '../components/golden-visa/GoldenVisaDocument';
import { GoldenVisaData } from '@/types/golden-visa';
import { SharedClientInfo } from '@/types/portal';
import { Locale } from '../translations/golden-visa';

export const generateGoldenVisaPDF = async (
  goldenVisaData: GoldenVisaData,
  clientInfo: SharedClientInfo,
  locale: Locale = 'en'
): Promise<Blob> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = React.createElement(GoldenVisaDocument, { goldenVisaData, clientInfo, locale }) as any;
  const asPdf = pdf(doc);
  return await asPdf.toBlob();
};

export const generateGoldenVisaPDFWithFilename = async (
  goldenVisaData: GoldenVisaData,
  clientInfo: SharedClientInfo,
  locale: Locale = 'en'
): Promise<{ blob: Blob; filename: string }> => {
  const blob = await generateGoldenVisaPDF(goldenVisaData, clientInfo, locale);
  
  // Use the new filename generation system for consistency
  try {
    const { generateGoldenVisaFilename } = await import('../integrations/FilenameIntegrations');
    const filename = generateGoldenVisaFilename(goldenVisaData, clientInfo);
    
    return { blob, filename };
  } catch (error) {
    console.error('🔧 GOLDEN-VISA-GENERATOR: Failed to generate filename with new system, using fallback:', error);
    
    // Enhanced fallback that matches new format
    const date = new Date(clientInfo.date);
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const formattedDate = `${yy}${mm}${dd}`;
    
    const nameForFilename = clientInfo.lastName && clientInfo.firstName 
      ? `${clientInfo.lastName} ${clientInfo.firstName}`
      : clientInfo.firstName || clientInfo.lastName || 'Client';
    
    // Determine visa type with new format
    const isDependentOnly = !goldenVisaData.primaryVisaRequired;
    let visaType: string;
    
    if (isDependentOnly) {
      visaType = 'Dependent';
    } else {
      // Simplified visa type mapping matching new format
      const visaTypeMap: { [key: string]: string } = {
        'property-investment': 'Property',
        'time-deposit': 'Deposit',
        'skilled-employee': 'Skilled'
      };
      visaType = visaTypeMap[goldenVisaData.visaType] || 'Property';
    }
    
    // New format: YYMMDD MGT {LastName} {FirstName} Golden {Property/Deposit/Skilled/Dependent}
    const filename = `${formattedDate} MGT ${nameForFilename} Golden ${visaType}.pdf`;
    
    return { blob, filename };
  }
}; 