#!/usr/bin/env node

/**
 * Cleanup Script: Remove ALL Invoices
 * This script removes ALL invoices from the database (regardless of status)
 * Run with: node scripts/cleanup-all-invoices.js
 */

require('dotenv').config({ path: ['.env.local', '.env'] });

const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5434,
  database: process.env.DB_NAME || 'tme_portal',
  user: process.env.DB_USER || 'tme_user',
  password: process.env.DB_PASSWORD || 'secure_password',
};

console.log('🔧 Connecting to database...');
console.log('🔧 Database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password
});

const pool = new Pool(dbConfig);

async function cleanupAllInvoices() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Starting cleanup of ALL invoices...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // First, find all invoices
    const allInvoicesResult = await client.query(
      'SELECT id, invoice_number, status, total_amount FROM invoices ORDER BY id'
    );
    
    const allInvoices = allInvoicesResult.rows;
    console.log(`📊 Found ${allInvoices.length} invoices to delete`);
    
    if (allInvoices.length > 0) {
      // Log the invoices that will be deleted
      console.log('📋 All invoices to be deleted:');
      allInvoices.forEach(invoice => {
        console.log(`  - ${invoice.invoice_number} (ID: ${invoice.id}) - Status: ${invoice.status} - ${invoice.total_amount} AED`);
      });
      
      // Delete related records first to maintain referential integrity
      const invoiceIds = allInvoices.map(invoice => invoice.id);
      
      // Delete invoice items
      const deletedItemsResult = await client.query(
        'DELETE FROM invoice_items WHERE invoice_id = ANY($1) RETURNING id',
        [invoiceIds]
      );
      console.log(`🗑️ Deleted ${deletedItemsResult.rows.length} invoice items`);
      
      // Delete invoice sections
      const deletedSectionsResult = await client.query(
        'DELETE FROM invoice_sections WHERE invoice_id = ANY($1) RETURNING id',
        [invoiceIds]
      );
      console.log(`🗑️ Deleted ${deletedSectionsResult.rows.length} invoice sections`);
      
      // Delete invoice payments (if any)
      const deletedPaymentsResult = await client.query(
        'DELETE FROM invoice_payments WHERE invoice_id = ANY($1) RETURNING id',
        [invoiceIds]
      );
      console.log(`🗑️ Deleted ${deletedPaymentsResult.rows.length} invoice payments`);
      
      // Delete invoice approvals (if any)
      const deletedApprovalsResult = await client.query(
        'DELETE FROM invoice_approvals WHERE invoice_id = ANY($1) RETURNING id',
        [invoiceIds]
      );
      console.log(`🗑️ Deleted ${deletedApprovalsResult.rows.length} invoice approvals`);
      
      // Delete invoice reminders (if any)
      try {
        const deletedRemindersResult = await client.query(
          'DELETE FROM invoice_reminders WHERE invoice_id = ANY($1) RETURNING id',
          [invoiceIds]
        );
        console.log(`🗑️ Deleted ${deletedRemindersResult.rows.length} invoice reminders`);
      } catch (error) {
        console.log('ℹ️ No invoice_reminders table found (skipping)');
      }
      
      // Delete any related applications (review system)
      try {
        const deletedAppsResult = await client.query(
          `DELETE FROM applications WHERE form_data->>'invoice_id' = ANY($1) RETURNING id`,
          [invoiceIds.map(id => id.toString())]
        );
        console.log(`🗑️ Deleted ${deletedAppsResult.rows.length} related applications`);
      } catch (error) {
        console.log('ℹ️ No applications found or table missing (skipping)');
      }
      
      // Finally, delete the invoices themselves
      const deletedInvoicesResult = await client.query(
        'DELETE FROM invoices RETURNING id, invoice_number'
      );
      console.log(`🗑️ Deleted ${deletedInvoicesResult.rows.length} invoices`);
      
      // Reset the invoice sequence (so next invoice starts from ID 1)
      try {
        await client.query('ALTER SEQUENCE invoices_id_seq RESTART WITH 1');
        console.log('🔄 Reset invoice ID sequence to start from 1');
      } catch (error) {
        console.log('⚠️ Could not reset sequence (this is okay)');
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('✅ Cleanup completed successfully!');
      console.log(`📈 Summary: Removed ${deletedInvoicesResult.rows.length} invoices and all their related data`);
      console.log('🎯 Next invoice created will start with a fresh ID');
    } else {
      await client.query('ROLLBACK');
      console.log('ℹ️ No invoices found to delete');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the cleanup
cleanupAllInvoices()
  .then(() => {
    console.log('🎉 All invoice cleanup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });