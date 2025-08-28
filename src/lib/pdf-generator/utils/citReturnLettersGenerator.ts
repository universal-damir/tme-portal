import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { CITReturnLettersDocument, CITReturnLettersCombinedDocument } from '../components/cit-return-letters/CITReturnLettersDocument';
import { CITReturnLettersData, LetterType } from '@/types/cit-return-letters';
import { SharedClientInfo } from '@/types/portal';
import { transformCITReturnLettersData, generateCITReturnLettersFilename } from './citReturnLettersDataTransformer';

export const generateCITReturnLettersPDF = async (
  citReturnLettersData: CITReturnLettersData,
  clientInfo?: SharedClientInfo
): Promise<Blob> => {
  // Validate that a letter type is selected
  if (!citReturnLettersData.letterType) {
    throw new Error('Letter type is required for CIT return letters PDF generation');
  }
  
  // Validate that a client is selected
  if (!citReturnLettersData.selectedClient) {
    throw new Error('Client selection is required for CIT return letters PDF generation');
  }

  // Transform CIT return letters data to standard PDF component format
  const transformedData = {
    ...transformCITReturnLettersData(citReturnLettersData, clientInfo),
    letterType: citReturnLettersData.letterType as LetterType
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = React.createElement(CITReturnLettersDocument, { data: transformedData as any }) as any;
  const asPdf = pdf(doc);
  return await asPdf.toBlob();
};

export const generateCITReturnLettersPDFWithFilename = async (
  citReturnLettersData: CITReturnLettersData,
  clientInfo?: SharedClientInfo
): Promise<{ blob: Blob; filename: string }> => {
  // Validate that a letter type is selected
  if (!citReturnLettersData.letterType) {
    throw new Error('Letter type is required for CIT return letters PDF generation');
  }
  
  // Validate that a client is selected
  if (!citReturnLettersData.selectedClient) {
    throw new Error('Client selection is required for CIT return letters PDF generation');
  }

  const blob = await generateCITReturnLettersPDF(citReturnLettersData, clientInfo);
  const filename = generateCITReturnLettersFilename(citReturnLettersData, clientInfo);
  
  return { blob, filename };
};

// Generate CIT Transfer Pricing PDF specifically
export const generateCITTransferPricingPDF = async (
  citReturnLettersData: CITReturnLettersData,
  clientInfo?: SharedClientInfo
): Promise<Blob> => {
  // Ensure the letter type is CIT TP
  const tpData = {
    ...citReturnLettersData,
    letterType: 'CIT TP' as LetterType
  };
  
  return generateCITReturnLettersPDF(tpData, clientInfo);
};

export const generateCITTransferPricingPDFWithFilename = async (
  citReturnLettersData: CITReturnLettersData,
  clientInfo?: SharedClientInfo
): Promise<{ blob: Blob; filename: string }> => {
  // Ensure the letter type is CIT TP
  const tpData = {
    ...citReturnLettersData,
    letterType: 'CIT TP' as LetterType
  };
  
  return generateCITReturnLettersPDFWithFilename(tpData, clientInfo);
};

// Generate combined preview PDF with all selected letters in one document
export const generateCITReturnLettersCombinedPreviewPDF = async (
  citReturnLettersData: CITReturnLettersData,
  clientInfo?: SharedClientInfo
): Promise<Blob> => {
  // Validate that letter types are selected
  if (!citReturnLettersData.selectedLetterTypes || citReturnLettersData.selectedLetterTypes.length === 0) {
    throw new Error('At least one letter type is required for CIT return letters preview generation');
  }
  
  // Validate that a client is selected
  if (!citReturnLettersData.selectedClient) {
    throw new Error('Client selection is required for CIT return letters preview generation');
  }

  // Transform CIT return letters data to standard PDF component format
  const transformedData = {
    ...transformCITReturnLettersData(citReturnLettersData, clientInfo),
    selectedLetterTypes: citReturnLettersData.selectedLetterTypes
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = React.createElement(CITReturnLettersCombinedDocument, { data: transformedData as any }) as any;
  const asPdf = pdf(doc);
  return await asPdf.toBlob();
};