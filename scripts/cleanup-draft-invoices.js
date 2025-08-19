#!/usr/bin/env node

/**
 * Cleanup Script: Remove Draft Invoices
 * This script removes all invoices with status 'draft' from the database
 * Run with: node scripts/cleanup-draft-invoices.js
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

async function cleanupDraftInvoices() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Starting cleanup of draft invoices...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // First, find all draft invoices
    const draftInvoicesResult = await client.query(
      'SELECT id, invoice_number, status, total_amount FROM invoices WHERE status = $1',
      ['draft']
    );
    
    const draftInvoices = draftInvoicesResult.rows;
    console.log(`📊 Found ${draftInvoices.length} draft invoices to delete`);
    
    if (draftInvoices.length > 0) {
      // Log the invoices that will be deleted
      console.log('📋 Draft invoices to be deleted:');
      draftInvoices.forEach(invoice => {
        console.log(`  - ${invoice.invoice_number} (ID: ${invoice.id}) - ${invoice.total_amount} AED`);
      });
      
      // Delete related records first to maintain referential integrity
      const invoiceIds = draftInvoices.map(invoice => invoice.id);
      
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
      
      // Finally, delete the invoices themselves
      const deletedInvoicesResult = await client.query(
        'DELETE FROM invoices WHERE status = $1 RETURNING id, invoice_number',
        ['draft']
      );
      console.log(`🗑️ Deleted ${deletedInvoicesResult.rows.length} draft invoices`);
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('✅ Cleanup completed successfully!');
      console.log(`📈 Summary: Removed ${deletedInvoicesResult.rows.length} draft invoices and their related data`);
    } else {
      await client.query('ROLLBACK');
      console.log('ℹ️ No draft invoices found to delete');
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
cleanupDraftInvoices()
  .then(() => {
    console.log('🎉 Draft invoice cleanup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });