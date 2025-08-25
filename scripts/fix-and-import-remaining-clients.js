#!/usr/bin/env node

/**
 * TME Portal - Fix and Import Remaining Clients Script
 * 
 * This script fixes data issues for the 15 skipped clients and imports them
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

// Database connection
const dbClient = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'tme_portal',
  user: process.env.POSTGRES_USER || 'tme_user',
  password: process.env.POSTGRES_PASSWORD || 'tme_password',
});

// Data fixes mapping
const CLIENT_FIXES = {
  '10322': { // Row 25: Bittner Richard
    registered_authority: 'X Not registered',
    management_email: 'richard.bittner@qazzar.com'
  },
  '10333': { // Row 27: Boeing UAE 10 companies
    registered_authority: 'X Not registered',
    management_email: null // Allow "-" to be NULL
  },
  '11203': { // Row 82: ESME Entertainment Services LLC
    registered_authority: 'DXB DET',
    management_email: 'alex@es-me.net'
  },
  '11211': { // Row 85: Evangelische Gemeinde VAE
    registered_authority: 'X Not registered',
    management_email: null // Allow "-" to be NULL
  },
  '11817': { // Row 111: Golden Visa
    registered_authority: 'X Not registered',
    management_email: null // Allow "-" to be NULL
  },
  '11823': { // Row 116: Green Future FZE
    registered_authority: 'UMM Umm Al Quwain FZ',
    management_email: 'mario.schoene12@googlemail.com'
  },
  '12414': { // Row 134: ITSC FZ-LLC
    registered_authority: 'DXB DDA FZ',
    management_email: 'bs@itsc-me.com',
    po_box: '53816'
  },
  '13618': { // Row 176: Migua Building Products Trading LLC
    registered_authority: 'DXB DET',
    management_email: 'Aamer@migua.com' // Remove extra text
  },
  '15116': { // Row 232: Renger Steffen+Tanja
    registered_authority: 'X Not registered',
    management_email: null // Allow "-" to be NULL
  },
  '15434': { // Row 249: SAN Biotech General Trading LLC
    registered_authority: 'DXB DET',
    management_email: null // Allow "-" to be NULL
  },
  '15719': { // Row 276: TM Global Invest Ltd
    registered_authority: 'RAK RAKICC Offshore',
    management_email: 'gittahertz@gmail.com'
  },
  '16014': { // Row 306: UFO Lighting Trading LLC
    registered_authority: 'DXB DET',
    management_email: 'uwe@TME-Services.com' // Remove space
  },
  '16309': { // Row 308: Various clients
    registered_authority: 'X Not registered',
    management_email: null // Allow "-" to be NULL
  },
  '16603': { // Row 314: WWBG Global FZ-LLC - need to add this authority
    registered_authority: 'FUJ Fujairah FZ', // Map to closest match
    management_email: 'WWBG-Global-FZ-LLC@protonmail.com'
  },
  '20001': { // Row 323: Mazz Trading Limited
    registered_authority: 'DXB JAFZA Offshore',
    management_email: null // Allow "-" to be NULL
  }
};

function cleanString(str) {
  if (!str) return null;
  return str.toString().trim();
}

function cleanPoBox(poBox) {
  if (!poBox || poBox.toLowerCase() === 'null' || poBox === '-') {
    return null;
  }
  const cleaned = poBox.toString().trim();
  return cleaned;
}

function cleanVatTrn(vat) {
  if (!vat || vat === '-' || vat.toLowerCase() === 'null') {
    return null;
  }
  return vat.toString().trim();
}

async function fixAndImportClients() {
  try {
    console.log('🔧 Starting fix and import of remaining clients...');
    
    // Connect to database
    await dbClient.connect();
    console.log('✅ Connected to database');
    
    // Get admin user ID
    const adminResult = await dbClient.query(
      "SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1"
    );
    
    if (adminResult.rows.length === 0) {
      throw new Error('No admin user found.');
    }
    
    const adminUserId = adminResult.rows[0].id;
    console.log(`👤 Using admin user ID: ${adminUserId}`);
    
    // Get current imported company codes
    const importedResult = await dbClient.query('SELECT company_code FROM clients');
    const importedCodes = new Set(importedResult.rows.map(row => row.company_code));
    
    // Read JSON file
    const jsonPath = path.join(__dirname, '..', 'client-details.json');
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const clients = JSON.parse(rawData);
    console.log(`📄 Loaded ${clients.length} client records from JSON`);
    
    let imported = 0;
    let skipped = 0;
    let errors = [];
    
    // Process only the clients that need fixing
    for (const [index, clientData] of clients.entries()) {
      const companyCode = clientData['Company code'].toString();
      
      // Skip if already imported
      if (importedCodes.has(companyCode)) {
        continue;
      }
      
      // Only process clients we have fixes for
      if (!CLIENT_FIXES[companyCode]) {
        continue;
      }
      
      try {
        const fixes = CLIENT_FIXES[companyCode];
        
        const client = {
          company_code: companyCode,
          company_name: cleanString(clientData['Company Name']),
          company_name_short: cleanString(clientData['Company name short']),
          registered_authority: fixes.registered_authority,
          management_name: cleanString(clientData['Management name']),
          management_email: fixes.management_email || 'placeholder@tme-services.com', // Use placeholder for null emails
          city: cleanString(clientData['City']),
          po_box: fixes.po_box || cleanPoBox(clientData['P.O. box no.']),
          vat_trn: cleanVatTrn(clientData['VAT TRN/TIN (15)']),
          needs_email_attention: fixes.management_email === null // Flag for missing emails
        };
        
        // Validate required fields
        if (!client.company_code || !client.company_name || !client.company_name_short || 
            !client.registered_authority || !client.management_name || !client.management_email || 
            !client.city) {
          throw new Error('Missing required fields after fixes');
        }
        
        // Insert into database
        await dbClient.query(`
          INSERT INTO clients (
            company_code, company_name, company_name_short, registered_authority,
            management_name, management_email, city, po_box, vat_trn, 
            status, notes, created_by, updated_by, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12, NOW(), NOW())
        `, [
          client.company_code,
          client.company_name,
          client.company_name_short,
          client.registered_authority,
          client.management_name,
          client.management_email,
          client.city,
          client.po_box,
          client.vat_trn,
          'active',
          client.needs_email_attention ? 'ATTENTION: Missing valid email address' : null,
          adminUserId
        ]);
        
        imported++;
        console.log(`✅ Fixed and imported: ${client.company_name} (${client.company_code})`);
        
      } catch (error) {
        skipped++;
        errors.push({
          index: index + 1,
          company_code: companyCode,
          company_name: clientData['Company Name'],
          error: error.message
        });
        
        console.warn(`⚠️  Still skipped client ${index + 1}: ${error.message}`);
      }
    }
    
    // Final statistics
    console.log('\n📈 Fix and Import Summary:');
    console.log(`✅ Successfully fixed and imported: ${imported} clients`);
    console.log(`❌ Still skipped: ${skipped} clients`);
    
    if (errors.length > 0) {
      console.log('\n🚨 Errors encountered:');
      errors.forEach(err => {
        console.log(`   - Row ${err.index}: ${err.company_name} (${err.company_code}) - ${err.error}`);
      });
    }
    
    // Verify final count
    const countResult = await dbClient.query('SELECT COUNT(*) FROM clients');
    console.log(`\n🎯 Total clients in database: ${countResult.rows[0].count}`);
    
    // Show clients needing email attention
    const attentionResult = await dbClient.query(`
      SELECT company_code, company_name, management_email 
      FROM clients 
      WHERE management_email = 'placeholder@tme-services.com'
      ORDER BY company_code
    `);
    
    if (attentionResult.rows.length > 0) {
      console.log('\n⚠️  Clients needing email attention:');
      attentionResult.rows.forEach(client => {
        console.log(`   - ${client.company_code}: ${client.company_name}`);
      });
    }
    
    console.log('\n🎉 Fix and import completed successfully!');
    
  } catch (error) {
    console.error('💥 Fix and import failed:', error);
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

// Run the fix and import
fixAndImportClients();