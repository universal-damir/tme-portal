/**
 * FILENAME MIGRATION SYSTEM
 * 
 * Handles gradual migration from legacy filename formats
 * to the new centralized system with zero downtime.
 */

import { DocumentType, FilenameGenerator } from '../core/FilenameGenerator';
import { FilenameConfigManager, getEnvironmentConfig } from '../config/filename-config';

// ===========================
// MIGRATION INTERFACES
// ===========================

export interface MigrationRecord {
  id: string;
  documentType: DocumentType;
  legacyFilename: string;
  newFilename: string;
  migrationDate: Date;
  status: 'pending' | 'completed' | 'failed' | 'rolled_back';
  formData: any;
  errors?: string[];
}

export interface MigrationStats {
  totalRecords: number;
  migrated: number;
  failed: number;
  pending: number;
  rollbacks: number;
  successRate: number;
}

export interface MigrationOptions {
  dryRun: boolean;
  batchSize: number;
  documentTypes: DocumentType[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  preserveLegacy: boolean;
  validateOnly: boolean;
}

// ===========================
// HYBRID FILENAME GENERATOR
// ===========================

export class HybridFilenameGenerator {
  
  /**
   * Generate filename using new or legacy format based on configuration
   */
  static generate(
    documentType: DocumentType, 
    clientData: any, 
    formData: any
  ): { filename: string; format: 'new' | 'legacy'; errors?: string[] } {
    
    const config = getEnvironmentConfig();
    
    // Check if new format is enabled for this document type
    if (FilenameConfigManager.isNewFormatEnabled(documentType)) {
      try {
        const filename = FilenameGenerator.generate({
          documentType,
          clientData,
          details: formData
        });
        
        // Validate the generated filename
        const validation = FilenameConfigManager.validateComponents(documentType, {
          date: clientData.date,
          clientName: clientData.lastName || clientData.companyName,
          ...formData
        });
        
        if (validation.isValid || !config.featureFlags.strictValidation) {
          return { 
            filename, 
            format: 'new',
            errors: validation.errors.length > 0 ? validation.errors : undefined
          };
        }
        
        // If validation fails and strict mode is on, fall back to legacy
        if (FilenameConfigManager.canUseLegacyFallback(documentType)) {
          const legacyFilename = FilenameGenerator.generateLegacyFormat(documentType, formData);
          return { 
            filename: legacyFilename, 
            format: 'legacy',
            errors: ['Validation failed, using legacy format', ...validation.errors]
          };
        }
        
        // If no fallback allowed, return with errors
        return { 
          filename, 
          format: 'new',
          errors: validation.errors
        };
        
      } catch (error) {
        // If new format generation fails, fall back to legacy
        if (FilenameConfigManager.canUseLegacyFallback(documentType)) {
          const legacyFilename = FilenameGenerator.generateLegacyFormat(documentType, formData);
          return { 
            filename: legacyFilename, 
            format: 'legacy',
            errors: [`New format failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
          };
        }
        
        throw error;
      }
    }
    
    // Use legacy format
    const legacyFilename = FilenameGenerator.generateLegacyFormat(documentType, formData);
    return { filename: legacyFilename, format: 'legacy' };
  }
  
  /**
   * Batch generate filenames for migration
   */
  static batchGenerate(
    records: Array<{
      documentType: DocumentType;
      clientData: any;
      formData: any;
    }>
  ): Array<{ record: any; result: ReturnType<typeof this.generate> }> {
    return records.map(record => ({
      record,
      result: this.generate(record.documentType, record.clientData, record.formData)
    }));
  }
}

// ===========================
// MIGRATION MANAGER
// ===========================

export class FilenamesMigrationManager {
  private static migrationLogs: MigrationRecord[] = [];
  
  /**
   * Preview migration changes without applying them
   */
  static async previewMigration(options: MigrationOptions): Promise<{
    changes: Array<{
      documentType: DocumentType;
      legacyFilename: string;
      newFilename: string;
      status: 'success' | 'error';
      errors?: string[];
    }>;
    stats: MigrationStats;
  }> {
    
    // In a real implementation, this would:
    // 1. Query database for applications with legacy filenames
    // 2. Generate new filenames for each
    // 3. Return preview of changes
    
    // Mock implementation for demonstration
    const mockData = await this.getMockMigrationData(options);
    const changes = [];
    
    for (const item of mockData) {
      try {
        const result = HybridFilenameGenerator.generate(
          item.documentType,
          item.clientData,
          item.formData
        );
        
        changes.push({
          documentType: item.documentType,
          legacyFilename: item.legacyFilename,
          newFilename: result.filename,
          status: result.errors ? 'error' : 'success',
          errors: result.errors
        });
        
      } catch (error) {
        changes.push({
          documentType: item.documentType,
          legacyFilename: item.legacyFilename,
          newFilename: 'FAILED',
          status: 'error',
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }
    
    const stats = this.calculateStats(changes);
    return { changes, stats };
  }
  
  /**
   * Execute migration with rollback capability
   */
  static async executeMigration(options: MigrationOptions): Promise<{
    results: MigrationRecord[];
    stats: MigrationStats;
    rollbackPlan?: () => Promise<void>;
  }> {
    
    if (options.dryRun) {
      const preview = await this.previewMigration(options);
      return {
        results: [],
        stats: preview.stats,
        rollbackPlan: undefined
      };
    }
    
    const results: MigrationRecord[] = [];
    const backupData: any[] = [];
    
    // Mock implementation - in real system would:
    // 1. Begin database transaction
    // 2. Update application records with new filenames
    // 3. Update email templates and activity logs
    // 4. Create rollback plan
    
    const mockData = await this.getMockMigrationData(options);
    
    for (const item of mockData) {
      const migrationRecord: MigrationRecord = {
        id: `migration_${Date.now()}_${Math.random()}`,
        documentType: item.documentType,
        legacyFilename: item.legacyFilename,
        newFilename: '',
        migrationDate: new Date(),
        status: 'pending',
        formData: item.formData
      };
      
      try {
        const result = HybridFilenameGenerator.generate(
          item.documentType,
          item.clientData,
          item.formData
        );
        
        migrationRecord.newFilename = result.filename;
        migrationRecord.status = result.errors ? 'failed' : 'completed';
        migrationRecord.errors = result.errors;
        
        // Store backup data for rollback
        backupData.push({
          id: migrationRecord.id,
          originalData: item
        });
        
      } catch (error) {
        migrationRecord.status = 'failed';
        migrationRecord.errors = [error instanceof Error ? error.message : 'Unknown error'];
      }
      
      results.push(migrationRecord);
      this.migrationLogs.push(migrationRecord);
    }
    
    const stats = this.calculateMigrationStats(results);
    
    // Create rollback plan
    const rollbackPlan = async () => {
      await this.rollbackMigration(results.map(r => r.id));
    };
    
    return { results, stats, rollbackPlan };
  }
  
  /**
   * Rollback migration by restoring original filenames
   */
  static async rollbackMigration(migrationIds: string[]): Promise<void> {
    // In real implementation:
    // 1. Find migration records
    // 2. Restore original filenames in database
    // 3. Update application statuses
    // 4. Log rollback actions
    
    for (const id of migrationIds) {
      const record = this.migrationLogs.find(r => r.id === id);
      if (record) {
        record.status = 'rolled_back';
      }
    }
  }
  
  /**
   * Get migration status and statistics
   */
  static getMigrationStatus(): {
    overall: MigrationStats;
    byDocumentType: Record<DocumentType, MigrationStats>;
    recentActivity: MigrationRecord[];
  } {
    const overall = this.calculateMigrationStats(this.migrationLogs);
    
    const byDocumentType = {} as Record<DocumentType, MigrationStats>;
    for (const docType of Object.values(DocumentType)) {
      const records = this.migrationLogs.filter(r => r.documentType === docType);
      byDocumentType[docType] = this.calculateMigrationStats(records);
    }
    
    const recentActivity = this.migrationLogs
      .sort((a, b) => b.migrationDate.getTime() - a.migrationDate.getTime())
      .slice(0, 50);
    
    return {
      overall,
      byDocumentType,
      recentActivity
    };
  }
  
  /**
   * Clean up migration logs (for maintenance)
   */
  static cleanupMigrationLogs(olderThanDays: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    this.migrationLogs = this.migrationLogs.filter(
      record => record.migrationDate > cutoffDate
    );
  }
  
  // ===========================
  // PRIVATE HELPER METHODS
  // ===========================
  
  private static async getMockMigrationData(options: MigrationOptions): Promise<Array<{
    documentType: DocumentType;
    legacyFilename: string;
    clientData: any;
    formData: any;
  }>> {
    // Mock data - in real implementation, this would query the database
    return [
      {
        documentType: DocumentType.COMPANY_SERVICES,
        legacyFilename: '250809 TME Services ACME Smith.pdf',
        clientData: {
          firstName: 'John',
          lastName: 'Smith',
          companyName: 'ACME Corp',
          shortCompanyName: 'ACME',
          date: '2025-08-09',
          secondaryCurrency: 'EUR'
        },
        formData: {
          taxConsultingServices: { enabled: true, citEnabled: true, vatEnabled: true },
          accountingServices: { enabled: false }
        }
      }
      // Add more mock data as needed
    ];
  }
  
  private static calculateStats(changes: any[]): MigrationStats {
    const total = changes.length;
    const successful = changes.filter(c => c.status === 'success').length;
    const failed = changes.filter(c => c.status === 'error').length;
    
    return {
      totalRecords: total,
      migrated: successful,
      failed: failed,
      pending: 0,
      rollbacks: 0,
      successRate: total > 0 ? (successful / total) * 100 : 0
    };
  }
  
  private static calculateMigrationStats(records: MigrationRecord[]): MigrationStats {
    const total = records.length;
    const migrated = records.filter(r => r.status === 'completed').length;
    const failed = records.filter(r => r.status === 'failed').length;
    const pending = records.filter(r => r.status === 'pending').length;
    const rollbacks = records.filter(r => r.status === 'rolled_back').length;
    
    return {
      totalRecords: total,
      migrated,
      failed,
      pending,
      rollbacks,
      successRate: total > 0 ? (migrated / total) * 100 : 0
    };
  }
}

// ===========================
// MIGRATION CLI INTERFACE
// ===========================

export class MigrationCLI {
  
  /**
   * Run migration from command line
   */
  static async run(args: {
    command: 'preview' | 'migrate' | 'rollback' | 'status';
    documentType?: DocumentType;
    dryRun?: boolean;
    batchSize?: number;
  }): Promise<void> {
    
    switch (args.command) {
      case 'preview':
        const preview = await FilenamesMigrationManager.previewMigration({
          dryRun: true,
          batchSize: args.batchSize || 100,
          documentTypes: args.documentType ? [args.documentType] : Object.values(DocumentType),
          preserveLegacy: true,
          validateOnly: false
        });
        
        console.log('📋 Migration Preview:');
        console.log(`Total records: ${preview.stats.totalRecords}`);
        console.log(`Success rate: ${preview.stats.successRate.toFixed(1)}%`);
        console.log(`Failed: ${preview.stats.failed}`);
        break;
        
      case 'migrate':
        const migration = await FilenamesMigrationManager.executeMigration({
          dryRun: args.dryRun || false,
          batchSize: args.batchSize || 100,
          documentTypes: args.documentType ? [args.documentType] : Object.values(DocumentType),
          preserveLegacy: true,
          validateOnly: false
        });
        
        console.log('✅ Migration completed:');
        console.log(`Migrated: ${migration.stats.migrated}`);
        console.log(`Failed: ${migration.stats.failed}`);
        break;
        
      case 'status':
        const status = FilenamesMigrationManager.getMigrationStatus();
        console.log('📊 Migration Status:');
        console.log(`Overall success rate: ${status.overall.successRate.toFixed(1)}%`);
        console.log(`Total migrated: ${status.overall.migrated}`);
        break;
    }
  }
}