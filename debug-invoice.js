#!/usr/bin/env node

/**
 * Debug Script: Check Invoice Data
 * This script checks the actual invoice data in the database
 */

require('dotenv').config({ path: ['.env.local', '.env'] });

const { Pool } = require('pg');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5434,
  database: process.env.DB_NAME || 'tme_portal',
  user: process.env.DB_USER || 'tme_user',
  password: process.env.DB_PASSWORD || 'secure_password',
};

const pool = new Pool(dbConfig);

async function debugInvoice() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking invoice data...');
    
    // Get all invoices
    const invoicesResult = await client.query('SELECT * FROM invoices ORDER BY id');
    console.log(`📊 Found ${invoicesResult.rows.length} invoices`);
    
    for (const invoice of invoicesResult.rows) {
      console.log('\n📋 Invoice:', {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        status: invoice.status,
        subtotal: invoice.subtotal,
        vat_amount: invoice.vat_amount,
        total_amount: invoice.total_amount,
        subtotal_type: typeof invoice.subtotal,
        vat_amount_type: typeof invoice.vat_amount,
        total_amount_type: typeof invoice.total_amount,
      });
      
      // Check sections
      const sectionsResult = await client.query('SELECT * FROM invoice_sections WHERE invoice_id = $1', [invoice.id]);
      console.log(`  📄 Sections: ${sectionsResult.rows.length}`);
      
      // Check items
      const itemsResult = await client.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoice.id]);
      console.log(`  📝 Items: ${itemsResult.rows.length}`);
      
      if (itemsResult.rows.length > 0) {
        console.log('  📋 Sample item:', {
          description: itemsResult.rows[0].description,
          quantity: itemsResult.rows[0].quantity,
          unit_price: itemsResult.rows[0].unit_price,
          net_amount: itemsResult.rows[0].net_amount
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugInvoice();