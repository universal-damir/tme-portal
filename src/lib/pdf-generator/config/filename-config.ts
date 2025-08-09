/**
 * FILENAME CONFIGURATION SYSTEM
 * 
 * Centralized configuration for filename generation patterns,
 * allowing easy customization and future expansion.
 */

import { DocumentType } from '../core/FilenameGenerator';

// ===========================
// CONFIGURATION INTERFACES
// ===========================

export interface FilenameFormatConfig {
  pattern: string; // Template pattern with placeholders
  separator: string;
  maxLength: number;
  caseSensitive: boolean;
  dateFormat: 'YYMMDD' | 'YYYYMMDD' | 'YYMMDD-HHMM';
  clientFormat: 'LASTNAME-FIRSTNAME' | 'FIRSTNAME-LASTNAME' | 'COMPANY-FIRST' | 'SHORT-FIRST';
  includeTime?: boolean;
  customFields?: string[];
}

export interface DocumentTypeConfig {
  enabled: boolean;
  format: FilenameFormatConfig;
  legacySupport: boolean;
  migrationDate?: string;
  validation?: {
    requiredFields: string[];
    maxComponentLength: Record<string, number>;
  };
}

export interface GlobalFilenameConfig {
  version: string;
  defaultFormat: FilenameFormatConfig;
  documentTypes: Record<DocumentType, DocumentTypeConfig>;
  featureFlags: {
    enableNewFormat: boolean;
    allowLegacyFallback: boolean;
    strictValidation: boolean;
  };
  migration: {
    batchSize: number;
    preserveLegacy: boolean;
    logChanges: boolean;
  };
}

// ===========================
// DEFAULT CONFIGURATIONS
// ===========================

const DEFAULT_FORMAT: FilenameFormatConfig = {
  pattern: '{DATE}_{DOCTYPE}_{CLIENT}_{DETAILS}_{CURRENCY}',
  separator: '_',
  maxLength: 200,
  caseSensitive: false,
  dateFormat: 'YYMMDD',
  clientFormat: 'LASTNAME-FIRSTNAME'
};

const COST_OVERVIEW_CONFIG: DocumentTypeConfig = {
  enabled: true,
  legacySupport: true,
  format: {
    ...DEFAULT_FORMAT,
    pattern: '{DATE}_{DOCTYPE}_{CLIENT}_{AUTHORITY}-{YEARS}Y-{VISAS}V_{CURRENCY}',
    customFields: ['authority', 'years', 'visaQuota', 'visaUsed', 'spouseVisas', 'childrenVisas']
  },
  validation: {
    requiredFields: ['date', 'authority', 'clientName'],
    maxComponentLength: {
      authority: 15,
      client: 30
    }
  }
};

const GOLDEN_VISA_CONFIG: DocumentTypeConfig = {
  enabled: true,
  legacySupport: true,
  format: {
    ...DEFAULT_FORMAT,
    pattern: '{DATE}_{DOCTYPE}_{CLIENT}_{VISATYPE}_{CURRENCY}',
    customFields: ['visaType', 'dependentOnly']
  },
  validation: {
    requiredFields: ['date', 'visaType', 'clientName'],
    maxComponentLength: {
      visaType: 20,
      client: 30
    }
  }
};

const COMPANY_SERVICES_CONFIG: DocumentTypeConfig = {
  enabled: true,
  legacySupport: true,
  format: {
    ...DEFAULT_FORMAT,
    pattern: '{DATE}_{DOCTYPE}_{CLIENT}_{SERVICES}_{CURRENCY}',
    customFields: ['services', 'taxServices', 'accountingServices']
  },
  validation: {
    requiredFields: ['date', 'clientName'],
    maxComponentLength: {
      services: 25,
      client: 30
    }
  }
};

const TAXATION_CONFIG: DocumentTypeConfig = {
  enabled: true,
  legacySupport: true,
  format: {
    ...DEFAULT_FORMAT,
    pattern: '{DATE}_{DOCTYPE}_{COMPANY_TYPE}-{SHORT_NAME}_CIT-DISCLAIMER-{TAX_END}_{CURRENCY}',
    customFields: ['companyType', 'shortName', 'taxEndDate']
  },
  validation: {
    requiredFields: ['date', 'companyType', 'shortCompanyName', 'taxEndDate'],
    maxComponentLength: {
      shortName: 20,
      companyType: 10
    }
  }
};

// ===========================
// MAIN CONFIGURATION
// ===========================

export const FILENAME_CONFIG: GlobalFilenameConfig = {
  version: '2.0.0',
  defaultFormat: DEFAULT_FORMAT,
  
  documentTypes: {
    [DocumentType.COST_OVERVIEW]: COST_OVERVIEW_CONFIG,
    [DocumentType.GOLDEN_VISA]: GOLDEN_VISA_CONFIG,
    [DocumentType.COMPANY_SERVICES]: COMPANY_SERVICES_CONFIG,
    [DocumentType.TAXATION]: TAXATION_CONFIG,
    [DocumentType.FAMILY_VISA]: {
      enabled: true,
      legacySupport: true,
      format: {
        ...DEFAULT_FORMAT,
        pattern: '{DATE}_{DOCTYPE}_{CLIENT}_DEPENDENT_{CURRENCY}'
      }
    },
    [DocumentType.COMPLIANCE]: {
      enabled: false, // Future document type
      legacySupport: false,
      format: DEFAULT_FORMAT
    },
    [DocumentType.ACCOUNTING]: {
      enabled: false, // Future document type  
      legacySupport: false,
      format: DEFAULT_FORMAT
    },
    [DocumentType.LICENSING]: {
      enabled: false, // Future document type
      legacySupport: false,
      format: DEFAULT_FORMAT
    }
  },

  featureFlags: {
    enableNewFormat: true, // Set to true when ready to switch - ENABLED for Company Services testing
    allowLegacyFallback: true, // Fallback to old system if new fails
    strictValidation: false // Enable strict field validation
  },

  migration: {
    batchSize: 100, // Number of records to migrate at once
    preserveLegacy: true, // Keep old filenames as backup
    logChanges: true // Log all filename changes
  }
};

// ===========================
// CONFIGURATION HELPERS
// ===========================

export class FilenameConfigManager {
  
  /**
   * Get configuration for specific document type
   */
  static getDocumentConfig(docType: DocumentType): DocumentTypeConfig {
    return FILENAME_CONFIG.documentTypes[docType];
  }

  /**
   * Check if document type supports new filename format
   */
  static isNewFormatEnabled(docType: DocumentType): boolean {
    const config = this.getDocumentConfig(docType);
    return config.enabled && FILENAME_CONFIG.featureFlags.enableNewFormat;
  }

  /**
   * Check if legacy fallback is allowed
   */
  static canUseLegacyFallback(docType: DocumentType): boolean {
    const config = this.getDocumentConfig(docType);
    return config.legacySupport && FILENAME_CONFIG.featureFlags.allowLegacyFallback;
  }

  /**
   * Validate filename components against configuration
   */
  static validateComponents(docType: DocumentType, components: Record<string, any>): {
    isValid: boolean;
    errors: string[];
  } {
    const config = this.getDocumentConfig(docType);
    const errors: string[] = [];

    if (!config.validation) {
      return { isValid: true, errors: [] };
    }

    // Check required fields
    for (const field of config.validation.requiredFields) {
      if (!components[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check field length limits
    if (config.validation.maxComponentLength) {
      for (const [field, maxLength] of Object.entries(config.validation.maxComponentLength)) {
        const value = components[field];
        if (value && typeof value === 'string' && value.length > maxLength) {
          errors.push(`Field '${field}' exceeds maximum length of ${maxLength} characters`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Update configuration at runtime (for admin panel)
   */
  static updateDocumentConfig(docType: DocumentType, updates: Partial<DocumentTypeConfig>): void {
    FILENAME_CONFIG.documentTypes[docType] = {
      ...FILENAME_CONFIG.documentTypes[docType],
      ...updates
    };
  }

  /**
   * Enable new format for specific document type
   */
  static enableNewFormat(docType: DocumentType): void {
    this.updateDocumentConfig(docType, { enabled: true });
    FILENAME_CONFIG.featureFlags.enableNewFormat = true;
  }

  /**
   * Get migration status for document type
   */
  static getMigrationStatus(docType: DocumentType): {
    canMigrate: boolean;
    requiresLegacySupport: boolean;
    migrationDate?: string;
  } {
    const config = this.getDocumentConfig(docType);
    return {
      canMigrate: config.enabled,
      requiresLegacySupport: config.legacySupport,
      migrationDate: config.migrationDate
    };
  }
}

// ===========================
// ENVIRONMENT-SPECIFIC CONFIGS
// ===========================

export const ENVIRONMENT_CONFIGS = {
  development: {
    ...FILENAME_CONFIG,
    featureFlags: {
      ...FILENAME_CONFIG.featureFlags,
      enableNewFormat: true, // Enable in dev for testing
      strictValidation: true
    }
  },
  
  staging: {
    ...FILENAME_CONFIG,
    featureFlags: {
      ...FILENAME_CONFIG.featureFlags,
      enableNewFormat: true, // Test in staging
      allowLegacyFallback: true
    }
  },
  
  production: {
    ...FILENAME_CONFIG,
    featureFlags: {
      ...FILENAME_CONFIG.featureFlags,
      enableNewFormat: false, // Keep disabled until ready
      allowLegacyFallback: true,
      strictValidation: false
    }
  }
};

/**
 * Get configuration for current environment
 */
export function getEnvironmentConfig(): GlobalFilenameConfig {
  const env = process.env.NODE_ENV || 'development';
  return ENVIRONMENT_CONFIGS[env as keyof typeof ENVIRONMENT_CONFIGS] || FILENAME_CONFIG;
}