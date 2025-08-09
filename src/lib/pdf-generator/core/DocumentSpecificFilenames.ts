/**
 * DOCUMENT-SPECIFIC FILENAME GENERATION SYSTEM
 * 
 * Each document type has its own standardized format with specific rules.
 * Standardization occurs WITHIN each document type, not between them.
 */

import { formatDateForFilename } from '../utils/formatting';

// ===========================
// SHARED UTILITIES
// ===========================

class FilenameUtils {
  /**
   * Get company type abbreviation (MGT/FZCO)
   */
  static getCompanyTypeAbbreviation(companyType: string): string {
    return companyType === 'management-consultants' ? 'MGT' : 'FZCO';
  }

  /**
   * Format date as YYMMDD
   */
  static formatDate(dateString: string): string {
    return formatDateForFilename(new Date(dateString));
  }

  /**
   * Clean text for filename (remove special chars, limit length)
   */
  static cleanText(text: string, maxLength?: number): string {
    let cleaned = text
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
    
    if (maxLength && cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength).trim();
    }
    
    return cleaned;
  }

  /**
   * Build name component: LastName FirstName or just available name
   */
  static buildNameComponent(firstName?: string, lastName?: string): string {
    const cleanFirst = firstName ? this.cleanText(firstName, 15) : '';
    const cleanLast = lastName ? this.cleanText(lastName, 15) : '';
    
    if (cleanLast && cleanFirst) {
      return `${cleanLast} ${cleanFirst}`;
    } else if (cleanLast) {
      return cleanLast;
    } else if (cleanFirst) {
      return cleanFirst;
    }
    
    return 'Client';
  }

  /**
   * Build company short name component
   */
  static buildCompanyShortName(shortCompanyName?: string): string {
    return shortCompanyName ? this.cleanText(shortCompanyName, 20) : '';
  }
}

// ===========================
// COMPANY SERVICES FILENAME GENERATOR
// ===========================

class CompanyServicesFilenameGenerator {
  
  /**
   * Format: YYMMDD {MGT/FZCO} {LastName} {FirstName} {CompanyShortName} TME Services {CIT VAT ACC PRO COMPL}.pdf
   */
  static generate(data: {
    date: string;
    companyType: string;
    firstName?: string;
    lastName?: string;
    shortCompanyName?: string;
    taxConsultingServices?: {
      enabled?: boolean;
      citEnabled?: boolean;
      vatEnabled?: boolean;
    };
    accountingServices?: {
      enabled?: boolean;
    };
    backOfficeServices?: {
      enabled?: boolean;
    };
    complianceServices?: {
      enabled?: boolean;
    };
  }): string {
    
    const components = [];
    
    // Date component: YYMMDD
    components.push(FilenameUtils.formatDate(data.date));
    
    // Company type: MGT/FZCO
    components.push(FilenameUtils.getCompanyTypeAbbreviation(data.companyType));
    
    // Name components: LastName FirstName
    components.push(FilenameUtils.buildNameComponent(data.firstName, data.lastName));
    
    // Company short name (if provided)
    const shortName = FilenameUtils.buildCompanyShortName(data.shortCompanyName);
    if (shortName) {
      components.push(shortName);
    }
    
    // Static "TME Services" identifier
    components.push('TME Services');
    
    // Services component: CIT VAT ACC PRO COMPL
    const services = this.buildServicesComponent(data);
    if (services) {
      components.push(services);
    }
    
    return components.join(' ') + '.pdf';
  }

  /**
   * Build services component based on selected services
   */
  private static buildServicesComponent(data: any): string {
    const services = [];
    
    // Tax Consulting Services: CIT and/or VAT
    if (data.taxConsultingServices?.enabled) {
      if (data.taxConsultingServices.citEnabled) {
        services.push('CIT');
      }
      if (data.taxConsultingServices.vatEnabled) {
        services.push('VAT');
      }
    }
    
    // Accounting Services
    if (data.accountingServices?.enabled) {
      services.push('ACC');
    }
    
    // Back Office (PRO) Services
    if (data.backOfficeServices?.enabled) {
      services.push('PRO');
    }
    
    // Compliance Services
    if (data.complianceServices?.enabled) {
      services.push('COMPL');
    }
    
    return services.length > 0 ? services.join(' ') : '';
  }
}

// ===========================
// COST OVERVIEW FILENAME GENERATOR
// ===========================

class CostOverviewFilenameGenerator {
  
  /**
   * IFZA Format: YYMMDD FZCO {LastName} {FirstName} {CompanyShortName} Setup IFZA {years} {visaQuota} {companyVisas} {spouseVisas} {childrenVisas} AED EUR
   * DET Format: YYMMDD MGT {LastName} {FirstName} {CompanyShortName} Setup DET {INDIV/CORP} AED EUR
   * 
   * Note: Use {LastName} {FirstName} as default unless "Address to company" is selected, 
   * in which case use only {CompanyShortName}. If no last name, use only {FirstName}
   */
  static generate(data: {
    clientDetails: {
      date: string;
      firstName?: string;
      lastName?: string;
      companyName?: string;
      addressToCompany?: boolean;
      companySetupType?: string;
      secondaryCurrency?: string;
    };
    authorityInformation: {
      responsibleAuthority: string;
    };
    ifzaLicense?: {
      licenseYears?: number;
      visaQuota?: number;
    };
    visaCosts?: {
      numberOfVisas?: number;
      spouseVisa?: boolean;
      numberOfChildVisas?: number;
    };
    // Add companyType to determine MGT/FZCO
    companyType?: string;
  }): string {
    
    const components = [];
    
    // Date component: YYMMDD
    components.push(FilenameUtils.formatDate(data.clientDetails.date));
    
    // Authority-specific format determines company type prefix
    const authority = data.authorityInformation.responsibleAuthority;
    const isDET = authority === 'DET (Dubai Department of Economy and Tourism)';
    
    // Company type: MGT for DET, FZCO for IFZA
    if (isDET) {
      components.push('MGT');
    } else {
      components.push('FZCO');
    }
    
    // Name components based on addressToCompany setting and requirements
    if (data.clientDetails.addressToCompany && data.clientDetails.companyName) {
      // Use only CompanyShortName when "Address to company" is selected
      components.push(FilenameUtils.cleanText(data.clientDetails.companyName, 30));
    } else {
      // Use name logic: LastName FirstName as default, or only FirstName if no LastName
      const cleanFirst = data.clientDetails.firstName ? FilenameUtils.cleanText(data.clientDetails.firstName, 15) : '';
      const cleanLast = data.clientDetails.lastName ? FilenameUtils.cleanText(data.clientDetails.lastName, 15) : '';
      
      if (cleanLast && cleanFirst) {
        components.push(cleanLast, cleanFirst);
      } else if (cleanFirst) {
        components.push(cleanFirst);
      } else {
        components.push('Client');
      }
      
      // Add CompanyShortName after the name (if available and not using "Address to company")
      const shortName = data.clientDetails.companyName ? FilenameUtils.cleanText(data.clientDetails.companyName, 20) : '';
      if (shortName) {
        components.push(shortName);
      }
    }
    
    // Static "Setup" identifier
    components.push('Setup');
    
    if (isDET) {
      // DET format: DET {INDIV/CORP} AED {CURRENCY}
      const setupType = data.clientDetails.companySetupType === 'Corporate Setup' ? 'CORP' : 'INDIV';
      components.push('DET', setupType, 'AED');
      
      if (data.clientDetails.secondaryCurrency) {
        components.push(data.clientDetails.secondaryCurrency);
      }
    } else {
      // IFZA format: IFZA {years} {visaQuota} {companyVisas} {spouseVisas} {childrenVisas} AED {currency}
      const years = data.ifzaLicense?.licenseYears || 1;
      const visaQuota = data.ifzaLicense?.visaQuota || 0;
      const companyVisas = data.visaCosts?.numberOfVisas || 0;
      const spouseVisas = data.visaCosts?.spouseVisa ? 1 : 0;
      const childrenVisas = data.visaCosts?.numberOfChildVisas || 0;
      
      components.push('IFZA', years.toString(), visaQuota.toString(), 
                     companyVisas.toString(), spouseVisas.toString(), 
                     childrenVisas.toString(), 'AED');
      
      if (data.clientDetails.secondaryCurrency) {
        components.push(data.clientDetails.secondaryCurrency);
      }
    }
    
    return components.join(' ') + '.pdf';
  }
}

// ===========================
// GOLDEN VISA FILENAME GENERATOR
// ===========================

class GoldenVisaFilenameGenerator {
  
  /**
   * Format: YYMMDD MGT {LastName} {FirstName} Golden {Property/Deposit/Skilled/Dependent}.pdf
   */
  static generate(data: {
    date: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    visaType: string;
    mainApplicant?: boolean;
    spouseVisa?: boolean;
    childrenVisas?: any[];
  }): string {
    
    const components = [];
    
    // Date component: YYMMDD
    components.push(FilenameUtils.formatDate(data.date));
    
    // MGT prefix (always MGT for Golden Visa)
    components.push('MGT');
    
    // Name components: LastName FirstName
    if (data.lastName) {
      components.push(FilenameUtils.cleanText(data.lastName, 20));
    }
    if (data.firstName) {
      components.push(FilenameUtils.cleanText(data.firstName, 20));
    }
    
    // Handle case where no name is provided
    if (!data.lastName && !data.firstName) {
      components.push('Client');
    }
    
    // Static "Golden" identifier (removed "Visa" as requested)
    components.push('Golden');
    
    // Visa type component - simplified names
    const visaType = this.buildVisaTypeComponent(data);
    components.push(visaType);
    
    return components.join(' ') + '.pdf';
  }

  /**
   * Build visa type component with simplified names
   */
  private static buildVisaTypeComponent(data: any): string {
    // Check if only dependents are getting visas
    const isDependentOnly = data.mainApplicant === false && 
      (data.spouseVisa || (data.childrenVisas && data.childrenVisas.length > 0));
    
    if (isDependentOnly) {
      return 'Dependent';
    }
    
    // Simplified visa type mapping as requested
    const visaTypeMap: Record<string, string> = {
      'property-investment': 'Property',
      'time-deposit': 'Deposit',
      'skilled-employee': 'Skilled'
    };
    
    return visaTypeMap[data.visaType] || data.visaType;
  }
}

// ===========================
// TAXATION FILENAME GENERATOR
// ===========================

class TaxationFilenameGenerator {
  
  /**
   * Format: YYMMDD {MGT/FZCO} {CompanyShortName} CIT Disclaimer {dd.mm.yyyy}.pdf
   */
  static generate(data: {
    date: string;
    companyType: string;
    shortCompanyName?: string;
    citDisclaimer?: {
      taxPeriodRange?: {
        toDate?: string;
      };
    };
  }): string {
    
    const components = [];
    
    // Date component: YYMMDD
    components.push(FilenameUtils.formatDate(data.date));
    
    // Company type: MGT/FZCO
    components.push(FilenameUtils.getCompanyTypeAbbreviation(data.companyType));
    
    // Company short name
    const shortName = data.shortCompanyName || 'Company';
    components.push(FilenameUtils.cleanText(shortName, 20));
    
    // Static "CIT Disclaimer" identifier
    components.push('CIT Disclaimer');
    
    // Tax end date
    const taxEndDate = this.formatTaxEndDate(data.citDisclaimer?.taxPeriodRange?.toDate);
    components.push(taxEndDate);
    
    return components.join(' ') + '.pdf';
  }

  /**
   * Format tax end date as dd.mm.yyyy
   */
  private static formatTaxEndDate(toDate?: string): string {
    if (toDate) {
      const date = new Date(toDate);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }
    return '31.12.2025'; // Default fallback
  }
}

// ===========================
// MAIN DOCUMENT FILENAME SERVICE
// ===========================

class DocumentFilenameService {
  
  /**
   * Generate filename based on document type
   */
  static generate(documentType: string, data: any): string {
    switch (documentType) {
      case 'company-services':
      case 'company_services':
        return CompanyServicesFilenameGenerator.generate(data);
        
      case 'cost-overview':
      case 'cost_overview':
        return CostOverviewFilenameGenerator.generate(data);
        
      case 'golden-visa':
      case 'golden_visa':
        return GoldenVisaFilenameGenerator.generate(data);
        
      case 'taxation':
        return TaxationFilenameGenerator.generate(data);
        
      default:
        throw new Error(`Unknown document type: ${documentType}`);
    }
  }

  /**
   * Get display title (filename without .pdf extension)
   */
  static getDisplayTitle(documentType: string, data: any): string {
    const filename = this.generate(documentType, data);
    return filename.replace('.pdf', '');
  }
}

// ===========================
// EXPORT CONVENIENCE FUNCTIONS
// ===========================

export {
  CompanyServicesFilenameGenerator,
  CostOverviewFilenameGenerator, 
  GoldenVisaFilenameGenerator,
  TaxationFilenameGenerator,
  DocumentFilenameService
};