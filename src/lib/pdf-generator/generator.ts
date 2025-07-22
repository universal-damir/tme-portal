import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { OfferData } from '@/types/offer';
import { OfferDocument, FamilyVisaDocument } from './components';
import { generateDynamicFilename, generateFamilyVisaFilename } from './utils';

// New modular PDF generator using component-based architecture
// Replaces the original 2,842-line monolithic approach
export const generatePDF = async (data: OfferData): Promise<Blob> => {
  try {
    // Validate data before creating the document
    if (!data) {
      throw new Error('No data provided to PDF generator');
    }
    
    if (!data.clientDetails) {
      throw new Error('Client details are required for PDF generation');
    }
    
    if (!data.authorityInformation) {
      throw new Error('Authority information is required for PDF generation');
    }

    const doc = React.createElement(OfferDocument, { data }) as any;
    const asPdf = pdf(doc);
    return await asPdf.toBlob();
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};

export const generatePDFWithFilename = async (data: OfferData): Promise<{ blob: Blob; filename: string }> => {
  try {
    // Validate data before creating the document
    if (!data) {
      throw new Error('No data provided to PDF generator');
    }
    
    if (!data.clientDetails) {
      throw new Error('Client details are required for PDF generation');
    }
    
    if (!data.authorityInformation) {
      throw new Error('Authority information is required for PDF generation');
    }

    const doc = React.createElement(OfferDocument, { data }) as any;
    const asPdf = pdf(doc);
    const blob = await asPdf.toBlob();
    const filename = generateDynamicFilename(data);
    
    return { blob, filename };
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};

// Generate family visa PDF separately
export const generateFamilyVisaPDF = async (data: OfferData): Promise<Blob> => {
  try {
    // Validate data before creating the document
    if (!data) {
      throw new Error('No data provided to PDF generator');
    }
    
    if (!data.clientDetails) {
      throw new Error('Client details are required for PDF generation');
    }
    
    if (!data.authorityInformation) {
      throw new Error('Authority information is required for PDF generation');
    }

    const doc = React.createElement(FamilyVisaDocument, { data }) as any;
    const asPdf = pdf(doc);
    return await asPdf.toBlob();
  } catch (error) {
    console.error('Family Visa PDF Generation Error:', error);
    throw error;
  }
};

// Generate family visa PDF with filename
export const generateFamilyVisaPDFWithFilename = async (data: OfferData): Promise<{ blob: Blob; filename: string }> => {
  try {
    // Validate data before creating the document
    if (!data) {
      throw new Error('No data provided to PDF generator');
    }
    
    if (!data.clientDetails) {
      throw new Error('Client details are required for PDF generation');
    }
    
    if (!data.authorityInformation) {
      throw new Error('Authority information is required for PDF generation');
    }

    const doc = React.createElement(FamilyVisaDocument, { data }) as any;
    const asPdf = pdf(doc);
    const blob = await asPdf.toBlob();
    const filename = generateFamilyVisaFilename(data);
    
    return { blob, filename };
  } catch (error) {
    console.error('Family Visa PDF Generation Error:', error);
    throw error;
  }
};

// Helper function to check if family visas are selected
export const hasFamilyVisas = (data: OfferData): boolean => {
  const hasSpouseVisa = data.visaCosts?.spouseVisa || false;
  const hasChildVisa = data.visaCosts?.childVisa || false;
  return hasSpouseVisa || hasChildVisa;
}; 