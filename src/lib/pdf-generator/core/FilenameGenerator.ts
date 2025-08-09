/**
 * CENTRALIZED FILENAME GENERATION SYSTEM
 * 
 * This system provides consistent, maintainable filename generation
 * for all PDF document types in the TME Portal.
 * 
 * Universal Format: {DATE}_{DOCTYPE}_{CLIENT}_{DETAILS}_{CURRENCY}.pdf
 */

import { formatDateForFilename, cleanAuthorityName } from '../utils/formatting';

// ===========================
// CORE TYPES & INTERFACES
// ===========================

export interface BaseClientData {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  shortCompanyName?: string;
  date: string;
  secondaryCurrency?: string;
  exchangeRate?: number;
}

export interface FilenameConfig {
  documentType: DocumentType;
  clientData: BaseClientData;
  details?: Record<string, any>;
  options?: FilenameOptions;
}

export interface FilenameOptions {
  useShortFormat?: boolean;
  includeTime?: boolean;
  maxLength?: number;
  customSeparator?: string;
}

// Document type registry - expandable for future forms
export enum DocumentType {
  COST_OVERVIEW = 'COSTOVER',
  GOLDEN_VISA = 'GOLDVISA', 
  COMPANY_SERVICES = 'COMPSERV',
  TAXATION = 'TAXATION',
  FAMILY_VISA = 'FAMVISA',
  // Future document types can be added here
  COMPLIANCE = 'COMPLIAN',
  ACCOUNTING = 'ACCOUNTG',
  LICENSING = 'LICENSNG'
}

// ===========================
// FILENAME COMPONENT BUILDERS
// ===========================

class FilenameComponentBuilder {
  
  /**
   * Generate date component: YYMMDD or YYMMDD-HHMM
   */
  static buildDateComponent(dateString: string, includeTime = false): string {
    const date = new Date(dateString);
    const formatted = formatDateForFilename(date);
    
    if (includeTime) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${formatted}-${hours}${minutes}`;
    }
    
    return formatted;
  }

  /**
   * Generate client component: LASTNAME-FIRSTNAME or COMPANY-NAME
   */
  static buildClientComponent(clientData: BaseClientData): string {
    const { firstName, lastName, companyName, shortCompanyName } = clientData;
    
    // Priority order: shortCompanyName > companyName > lastName+firstName > firstName > lastName
    if (shortCompanyName) {
      return this.sanitizeForFilename(shortCompanyName);
    }
    
    if (companyName) {
      return this.sanitizeForFilename(companyName);
    }
    
    if (lastName && firstName) {
      return `${this.sanitizeForFilename(lastName)}-${this.sanitizeForFilename(firstName)}`;
    }
    
    if (firstName) {
      return this.sanitizeForFilename(firstName);
    }
    
    if (lastName) {
      return this.sanitizeForFilename(lastName);
    }
    
    return 'CLIENT';
  }

  /**
   * Generate currency component: AED-EUR or AED
   */
  static buildCurrencyComponent(clientData: BaseClientData): string {
    if (clientData.secondaryCurrency) {
      return `AED-${clientData.secondaryCurrency}`;
    }
    return 'AED';
  }

  /**
   * Sanitize text for filename use
   */
  static sanitizeForFilename(text: string): string {
    return text
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
}

// ===========================
// DOCUMENT-SPECIFIC DETAIL BUILDERS
// ===========================

class DocumentDetailBuilders {
  
  static buildCostOverviewDetails(details: any): string {
    const authority = details.authorityInformation?.responsibleAuthority || '';
    const cleanedAuthority = cleanAuthorityName(authority);
    const years = details.ifzaLicense?.licenseYears || details.numberOfYears || 1;
    const visaQuota = details.ifzaLicense?.visaQuota || 0;
    const visaUsed = details.visaCosts?.numberOfVisas || 0;
    const spouseVisas = details.visaCosts?.spouseVisa ? 1 : 0;
    const childrenVisas = details.visaCosts?.numberOfChildVisas || 0;
    
    // Format: AUTHORITY-YEARS-QUOTA-USED-SPOUSE-CHILDREN
    return `${cleanedAuthority}-${years}Y-${visaQuota}Q-${visaUsed}U-${spouseVisas}S-${childrenVisas}C`;
  }

  static buildGoldenVisaDetails(details: any): string {
    const visaType = details.visaType || 'unknown';
    const visaTypeMap: Record<string, string> = {
      'property-investment': 'PROPERTY',
      'time-deposit': 'DEPOSIT', 
      'skilled-employee': 'SKILLED'
    };
    
    const formattedType = visaTypeMap[visaType] || visaType.toUpperCase();
    
    // Check if dependents only
    const isDependentOnly = details.mainApplicant === false && 
      (details.spouseVisa || details.childrenVisas?.length > 0);
    
    return isDependentOnly ? 'DEPENDENT' : formattedType;
  }

  static buildCompanyServicesDetails(details: any): string {
    const services = [];
    
    if (details.taxConsultingServices?.enabled) {
      if (details.taxConsultingServices?.citEnabled) services.push('CIT');
      if (details.taxConsultingServices?.vatEnabled) services.push('VAT');
    }
    
    if (details.accountingServices?.enabled) {
      services.push('ACCOUNTING');
    }
    
    if (details.backOfficeServices?.enabled) {
      services.push('BACKOFFICE');
    }
    
    if (details.complianceServices?.enabled) {
      services.push('COMPLIANCE');
    }
    
    return services.length > 0 ? services.join('-') : 'SERVICES';
  }

  static buildTaxationDetails(details: any): string {
    const companyType = details.companyType || 'tme-fzco';
    const abbreviation = companyType === 'management-consultants' ? 'MGT' : 'FZCO';
    
    const shortName = details.shortCompanyName || 'COMPANY';
    const sanitizedShortName = FilenameComponentBuilder.sanitizeForFilename(shortName);
    
    // Format tax end period
    const formatTaxEndPeriod = (): string => {
      const toDate = details.citDisclaimer?.taxPeriodRange?.toDate;
      if (toDate) {
        const endDate = new Date(toDate);
        const day = endDate.getDate().toString().padStart(2, '0');
        const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
        const year = endDate.getFullYear();
        return `${day}-${month}-${year}`;
      }
      return '31-12-2025';
    };
    
    return `${abbreviation}-${sanitizedShortName}-CIT-DISCLAIMER-${formatTaxEndPeriod()}`;
  }
}

// ===========================
// MAIN FILENAME GENERATOR
// ===========================

export class FilenameGenerator {
  
  /**
   * Generate standardized filename for any document type
   */
  static generate(config: FilenameConfig): string {
    const {
      documentType,
      clientData,
      details = {},
      options = {}
    } = config;

    // Use document-specific generators for better format control
    try {
      const specificGenerator = this.getDocumentSpecificGenerator(documentType);
      if (specificGenerator) {
        return specificGenerator.generate({
          ...clientData,
          ...details
        });
      }
    } catch (error) {
      console.warn(`Document-specific generator failed for ${documentType}, falling back to universal format:`, error);
    }

    // Fallback to universal format
    const dateComponent = FilenameComponentBuilder.buildDateComponent(
      clientData.date,
      options.includeTime
    );
    
    const clientComponent = FilenameComponentBuilder.buildClientComponent(clientData);
    
    const currencyComponent = FilenameComponentBuilder.buildCurrencyComponent(clientData);
    
    const detailsComponent = this.buildDetailsComponent(documentType, details);
    
    const separator = options.customSeparator || '_';
    
    // Assemble filename
    const filename = [
      dateComponent,
      documentType,
      clientComponent,
      detailsComponent,
      currencyComponent
    ].filter(Boolean).join(separator) + '.pdf';
    
    // Apply length limits if specified
    if (options.maxLength && filename.length > options.maxLength) {
      return this.truncateFilename(filename, options.maxLength);
    }
    
    return filename;
  }

  /**
   * Get document-specific generator for enhanced format control
   */
  private static getDocumentSpecificGenerator(documentType: DocumentType): any {
    const { 
      CompanyServicesFilenameGenerator,
      CostOverviewFilenameGenerator,
      GoldenVisaFilenameGenerator,
      TaxationFilenameGenerator
    } = require('./DocumentSpecificFilenames');

    switch (documentType) {
      case DocumentType.COMPANY_SERVICES:
        return CompanyServicesFilenameGenerator;
      case DocumentType.COST_OVERVIEW:
        return CostOverviewFilenameGenerator;
      case DocumentType.GOLDEN_VISA:
        return GoldenVisaFilenameGenerator;
      case DocumentType.TAXATION:
        return TaxationFilenameGenerator;
      default:
        return null;
    }
  }

  /**
   * Build document-specific details component
   */
  private static buildDetailsComponent(documentType: DocumentType, details: any): string {
    switch (documentType) {
      case DocumentType.COST_OVERVIEW:
        return DocumentDetailBuilders.buildCostOverviewDetails(details);
      
      case DocumentType.GOLDEN_VISA:
        return DocumentDetailBuilders.buildGoldenVisaDetails(details);
      
      case DocumentType.COMPANY_SERVICES:
        return DocumentDetailBuilders.buildCompanyServicesDetails(details);
      
      case DocumentType.TAXATION:
        return DocumentDetailBuilders.buildTaxationDetails(details);
      
      case DocumentType.FAMILY_VISA:
        return 'FAMILY-DEPENDENT';
      
      default:
        return 'DOCUMENT';
    }
  }

  /**
   * Truncate filename while preserving extension
   */
  private static truncateFilename(filename: string, maxLength: number): string {
    if (filename.length <= maxLength) return filename;
    
    const extension = '.pdf';
    const nameWithoutExt = filename.slice(0, -4);
    const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 3) + '...';
    
    return truncatedName + extension;
  }

  /**
   * Generate legacy format filename for backward compatibility
   */
  static generateLegacyFormat(documentType: DocumentType, data: any): string {
    // Fallback to existing format generators during transition period
    switch (documentType) {
      case DocumentType.COST_OVERVIEW:
        const { generateDynamicFilename } = require('../integrations/FilenameIntegrations');
        return generateDynamicFilename(data);
      
      case DocumentType.GOLDEN_VISA:
        const { generateGoldenVisaFilename } = require('../integrations/FilenameIntegrations');
        return generateGoldenVisaFilename(data.goldenVisaData, data.clientInfo);
      
      case DocumentType.COMPANY_SERVICES:
        const { generateCompanyServicesFilename } = require('../utils/companyServicesDataTransformer');
        return generateCompanyServicesFilename(data.companyServicesData, data.clientInfo);
      
      case DocumentType.TAXATION:
        const { generateTaxationFilename } = require('../utils/taxationDataTransformer');
        return generateTaxationFilename(data.taxationData, data.clientInfo);
      
      default:
        return 'document.pdf';
    }
  }
}

// ===========================
// CONVENIENCE FUNCTIONS
// ===========================

/**
 * Quick filename generation for common use cases
 */
export const generateFilename = {
  costOverview: (clientData: BaseClientData, offerData: any) => 
    FilenameGenerator.generate({
      documentType: DocumentType.COST_OVERVIEW,
      clientData,
      details: offerData
    }),

  goldenVisa: (clientData: BaseClientData, goldenVisaData: any) =>
    FilenameGenerator.generate({
      documentType: DocumentType.GOLDEN_VISA,
      clientData,
      details: goldenVisaData
    }),

  companyServices: (clientData: BaseClientData, servicesData: any) =>
    FilenameGenerator.generate({
      documentType: DocumentType.COMPANY_SERVICES,
      clientData,
      details: servicesData
    }),

  taxation: (clientData: BaseClientData, taxationData: any) =>
    FilenameGenerator.generate({
      documentType: DocumentType.TAXATION,
      clientData,
      details: taxationData
    })
};

// ===========================
// MIGRATION HELPERS
// ===========================

export class FilenameMigrationHelper {
  
  /**
   * Convert legacy filename to new format
   */
  static migrateFromLegacy(legacyFilename: string, documentType: DocumentType): string {
    // Implementation for converting existing filenames during migration
    // This helps maintain consistency during the transition period
    
    // For now, return as-is during development
    return legacyFilename;
  }

  /**
   * Batch migrate multiple filenames
   */
  static batchMigrate(filenames: Array<{filename: string, type: DocumentType}>): Array<string> {
    return filenames.map(item => this.migrateFromLegacy(item.filename, item.type));
  }
}