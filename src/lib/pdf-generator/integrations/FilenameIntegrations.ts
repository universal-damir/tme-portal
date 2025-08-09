/**
 * FILENAME SYSTEM INTEGRATIONS
 * 
 * Updated integration points for review system, email generation,
 * and application management to use the new centralized filename system.
 */

import { DocumentType } from '../core/FilenameGenerator';
import { HybridFilenameGenerator } from '../migration/FilenameMigration';
import { CompanyServicesData } from '@/types/company-services';
import { GoldenVisaData } from '@/types/golden-visa';
import { OfferData } from '@/types/offer';
import { SharedClientInfo } from '@/types/portal';

// ===========================
// INTEGRATION INTERFACES
// ===========================

export interface FilenameGenerationResult {
  filename: string;
  displayTitle: string; // For UI display (without .pdf extension)
  format: 'new' | 'legacy';
  warnings?: string[];
  errors?: string[];
}

export interface DocumentMetadata {
  documentType: DocumentType;
  clientData: any;
  formData: any;
  generatedAt: Date;
  format: 'new' | 'legacy';
}

// ===========================
// UNIFIED FILENAME SERVICE
// ===========================

export class UnifiedFilenameService {
  
  /**
   * Generate filename for any document type with proper integration
   */
  static generateForDocument(
    documentType: DocumentType,
    clientData: any,
    formData: any
  ): FilenameGenerationResult {
    
    const result = HybridFilenameGenerator.generate(documentType, clientData, formData);
    
    return {
      filename: result.filename,
      displayTitle: result.filename.replace('.pdf', ''),
      format: result.format,
      warnings: result.errors?.filter(e => !e.toLowerCase().includes('failed')) || [],
      errors: result.errors?.filter(e => e.toLowerCase().includes('failed')) || []
    };
  }

  /**
   * Generate filename with PDF blob for complete PDF generation workflow
   */
  static async generateWithPDF(
    documentType: DocumentType,
    clientData: any,
    formData: any,
    generatePDFFunction: () => Promise<Blob>
  ): Promise<{ blob: Blob; filename: string; metadata: DocumentMetadata }> {
    
    const filenameResult = this.generateForDocument(documentType, clientData, formData);
    const blob = await generatePDFFunction();
    
    const metadata: DocumentMetadata = {
      documentType,
      clientData,
      formData,
      generatedAt: new Date(),
      format: filenameResult.format
    };
    
    return {
      blob,
      filename: filenameResult.filename,
      metadata
    };
  }

  /**
   * Get display title for review system and UI
   */
  static getDisplayTitle(
    documentType: DocumentType,
    clientData: any,
    formData: any
  ): string {
    const result = this.generateForDocument(documentType, clientData, formData);
    return result.displayTitle;
  }
}

// ===========================
// DOCUMENT-SPECIFIC ADAPTERS
// ===========================

export class DocumentTypeAdapters {
  
  /**
   * Company Services filename generation
   */
  static companyServices(
    companyServicesData: CompanyServicesData,
    clientInfo: SharedClientInfo
  ): FilenameGenerationResult {
    
    const clientData = {
      firstName: companyServicesData.firstName || clientInfo.firstName || '',
      lastName: companyServicesData.lastName || clientInfo.lastName || '',
      companyName: companyServicesData.companyName || clientInfo.companyName || '',
      shortCompanyName: companyServicesData.shortCompanyName || clientInfo.shortCompanyName || '',
      date: companyServicesData.date || clientInfo.date,
      secondaryCurrency: companyServicesData.secondaryCurrency,
      exchangeRate: companyServicesData.exchangeRate
    };
    
    return UnifiedFilenameService.generateForDocument(
      DocumentType.COMPANY_SERVICES,
      clientData,
      companyServicesData
    );
  }

  /**
   * Golden Visa filename generation
   */
  static goldenVisa(
    goldenVisaData: GoldenVisaData,
    clientInfo: SharedClientInfo
  ): FilenameGenerationResult {
    
    const clientData = {
      firstName: goldenVisaData.firstName || clientInfo.firstName || '',
      lastName: goldenVisaData.lastName || clientInfo.lastName || '',
      companyName: goldenVisaData.companyName || clientInfo.companyName || '',
      date: goldenVisaData.date || clientInfo.date,
      secondaryCurrency: goldenVisaData.secondaryCurrency,
      exchangeRate: goldenVisaData.exchangeRate
    };
    
    return UnifiedFilenameService.generateForDocument(
      DocumentType.GOLDEN_VISA,
      clientData,
      goldenVisaData
    );
  }

  /**
   * Cost Overview filename generation
   */
  static costOverview(offerData: OfferData): FilenameGenerationResult {
    try {
      // Use the working filename generation from utils/filename.ts
      const { generateDynamicFilename } = require('@/lib/pdf-generator/utils/filename');
      const filename = generateDynamicFilename(offerData);
      
      return {
        filename,
        displayTitle: filename.replace('.pdf', ''),
        format: 'current',
        warnings: [],
        errors: []
      };
    } catch (error) {
      console.error('🔧 Failed to generate cost overview filename:', error);
      
      // Fallback to basic filename
      const date = new Date(offerData.clientDetails?.date || new Date());
      const yy = date.getFullYear().toString().slice(-2);
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      const formattedDate = `${yy}${mm}${dd}`;
      
      const clientName = offerData.clientDetails?.firstName || 'Client';
      const filename = `${formattedDate} ${clientName} Cost Overview.pdf`;
      
      return {
        filename,
        displayTitle: filename.replace('.pdf', ''),
        format: 'fallback',
        warnings: ['Using fallback filename format'],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Taxation filename generation
   */
  static taxation(
    taxationData: any, // TaxationData type
    clientInfo: SharedClientInfo
  ): FilenameGenerationResult {
    
    const clientData = {
      firstName: taxationData.firstName || clientInfo.firstName || '',
      lastName: taxationData.lastName || clientInfo.lastName || '',
      companyName: taxationData.companyName || clientInfo.companyName || '',
      shortCompanyName: taxationData.shortCompanyName || clientInfo.shortCompanyName || '',
      date: taxationData.date || clientInfo.date,
      secondaryCurrency: 'EUR', // Taxation doesn't use secondary currency
      exchangeRate: 3.67
    };
    
    return UnifiedFilenameService.generateForDocument(
      DocumentType.TAXATION,
      clientData,
      taxationData
    );
  }
}

// ===========================
// UPDATED INTEGRATION FUNCTIONS
// ===========================

/**
 * Updated generateCompanyServicesFilename function
 * This replaces the one in companyServicesDataTransformer.ts
 */
export function generateCompanyServicesFilename(
  companyServicesData: CompanyServicesData,
  clientInfo: SharedClientInfo
): string {
  const result = DocumentTypeAdapters.companyServices(companyServicesData, clientInfo);
  
  // Log warnings if using legacy format
  if (result.format === 'legacy' && result.warnings?.length) {
    console.warn('🔄 Using legacy filename format for company services:', result.warnings);
  }
  
  return result.filename;
}

/**
 * Updated generateGoldenVisaFilename function
 * This replaces the one in goldenVisaDataTransformer.ts
 */
export function generateGoldenVisaFilename(
  goldenVisaData: GoldenVisaData,
  clientInfo: SharedClientInfo
): string {
  const result = DocumentTypeAdapters.goldenVisa(goldenVisaData, clientInfo);
  
  if (result.format === 'legacy' && result.warnings?.length) {
    console.warn('🔄 Using legacy filename format for golden visa:', result.warnings);
  }
  
  return result.filename;
}

/**
 * Updated generateTaxationFilename function
 * This replaces the one in taxationDataTransformer.ts
 */
export function generateTaxationFilename(
  taxationData: any,
  clientInfo: SharedClientInfo
): string {
  const result = DocumentTypeAdapters.taxation(taxationData, clientInfo);
  
  if (result.format === 'legacy' && result.warnings?.length) {
    console.warn('🔄 Using legacy filename format for taxation:', result.warnings);
  }
  
  return result.filename;
}

/**
 * Updated generateDynamicFilename function for cost overview
 * This replaces the one in filename.ts
 */
export function generateDynamicFilename(offerData: OfferData): string {
  const result = DocumentTypeAdapters.costOverview(offerData);
  
  if (result.format === 'legacy' && result.warnings?.length) {
    console.warn('🔄 Using legacy filename format for cost overview:', result.warnings);
  }
  
  return result.filename;
}

/**
 * Updated generateCostOverviewFilename function
 * This provides the same interface as generateDynamicFilename for consistency
 */
export function generateCostOverviewFilename(offerData: OfferData): string {
  return generateDynamicFilename(offerData);
}

// ===========================
// REVIEW SYSTEM INTEGRATION
// ===========================

/**
 * Generate application title for review system
 * This replaces the getFormTitle function in FeedbackModal.tsx
 */
export function generateApplicationTitle(
  applicationType: string,
  formData: any
): string {
  
  // Map application type to DocumentType
  const documentTypeMap: Record<string, DocumentType> = {
    'golden-visa': DocumentType.GOLDEN_VISA,
    'golden_visa': DocumentType.GOLDEN_VISA,
    'cost-overview': DocumentType.COST_OVERVIEW,
    'cost_overview': DocumentType.COST_OVERVIEW,
    'company-services': DocumentType.COMPANY_SERVICES,
    'company_services': DocumentType.COMPANY_SERVICES,
    'taxation': DocumentType.TAXATION
  };
  
  const documentType = documentTypeMap[applicationType];
  if (!documentType) {
    return `${applicationType} Application`;
  }
  
  try {
    // Extract client data based on form structure
    let clientData;
    if (formData.clientDetails) {
      // Cost overview format
      clientData = {
        firstName: formData.clientDetails.firstName || '',
        lastName: formData.clientDetails.lastName || '',
        companyName: formData.clientDetails.companyName || '',
        date: formData.clientDetails.date || new Date().toISOString().split('T')[0],
        secondaryCurrency: formData.clientDetails.secondaryCurrency
      };
    } else {
      // Direct format (golden visa, company services, taxation)
      clientData = {
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        companyName: formData.companyName || '',
        shortCompanyName: formData.shortCompanyName || '',
        date: formData.date || new Date().toISOString().split('T')[0],
        secondaryCurrency: formData.secondaryCurrency
      };
    }
    
    const result = UnifiedFilenameService.generateForDocument(
      documentType,
      clientData,
      formData
    );
    
    return result.displayTitle;
    
  } catch (error) {
    console.error('Error generating application title:', error);
    return `${applicationType.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Application`;
  }
}

// ===========================
// EMAIL SYSTEM INTEGRATION
// ===========================

/**
 * Create email subject from filename
 * This is used by EmailDraftGenerator
 */
export function createEmailSubject(filename: string): string {
  // Remove .pdf extension and clean up for email subject
  return filename
    .replace('.pdf', '')
    .replace(/_/g, ' ') // Replace underscores with spaces for readability
    .replace(/-/g, ' '); // Replace hyphens with spaces for readability
}

// ===========================
// ACTIVITY LOGGING INTEGRATION
// ===========================

/**
 * Extract activity logging data from filename
 */
export function extractActivityData(
  filename: string,
  documentType: DocumentType,
  clientData: any
): {
  resource: string;
  client_name: string;
  document_type: string;
  filename: string;
} {
  
  const documentTypeNames: Record<DocumentType, string> = {
    [DocumentType.COST_OVERVIEW]: 'Cost Overview',
    [DocumentType.GOLDEN_VISA]: 'Golden Visa',
    [DocumentType.COMPANY_SERVICES]: 'Company Services',
    [DocumentType.TAXATION]: 'Taxation',
    [DocumentType.FAMILY_VISA]: 'Family Visa',
    [DocumentType.COMPLIANCE]: 'Compliance',
    [DocumentType.ACCOUNTING]: 'Accounting',
    [DocumentType.LICENSING]: 'Licensing'
  };
  
  const clientName = clientData.companyName || 
    `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() ||
    'Unknown Client';
  
  return {
    resource: documentType.toLowerCase(),
    client_name: clientName,
    document_type: documentTypeNames[documentType] || documentType,
    filename
  };
}