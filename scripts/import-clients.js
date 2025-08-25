#!/usr/bin/env node

/**
 * TME Portal - Client Data Import Script
 * 
 * This script imports client data from client-details.json into the PostgreSQL database.
 * It includes data cleaning and validation to handle real-world data inconsistencies.
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

// Data cleaning functions
function cleanCompanyCode(code) {
  if (!code) return null;
  // Convert number to string, ensure it's a valid company code
  const codeStr = code.toString().trim();
  if (!/^\d+$/.test(codeStr)) {
    throw new Error(`Invalid company code format: ${code}`);
  }
  return codeStr;
}

function cleanVatTrn(vat) {
  if (!vat || vat === '-' || vat.toLowerCase() === 'null') {
    return null;
  }
  return vat.toString().trim();
}

function cleanPoBox(poBox) {
  if (!poBox || poBox.toLowerCase() === 'null') {
    return null;
  }
  const cleaned = poBox.toString().trim();
  // Keep "No registered PO Box" as instructed
  return cleaned;
}

function cleanString(str) {
  if (!str) return null;
  return str.toString().trim();
}

function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

async function importClients() {
  try {
    console.log('🚀 Starting client data import...');
    
    // Connect to database
    await dbClient.connect();
    console.log('✅ Connected to database');
    
    // Read JSON file
    const jsonPath = path.join(__dirname, '..', 'client-details.json');
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found: ${jsonPath}`);
    }
    
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const clients = JSON.parse(rawData);
    console.log(`📄 Loaded ${clients.length} client records from JSON`);
    
    // Get admin user ID for created_by/updated_by
    const adminResult = await dbClient.query(
      "SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1"
    );
    
    if (adminResult.rows.length === 0) {
      throw new Error('No admin user found. Please create an admin user first.');
    }
    
    const adminUserId = adminResult.rows[0].id;
    console.log(`👤 Using admin user ID: ${adminUserId}`);
    
    // Clear existing client data (optional - comment out if you want to keep existing)
    await dbClient.query('DELETE FROM clients');
    console.log('🗑️  Cleared existing client data');
    
    // Import statistics
    let imported = 0;
    let skipped = 0;
    let errors = [];
    
    // Process each client
    for (const [index, clientData] of clients.entries()) {
      try {
        const client = {
          company_code: cleanCompanyCode(clientData['Company code']),
          company_name: cleanString(clientData['Company Name']),
          company_name_short: cleanString(clientData['Company name short']),
          registered_authority: cleanString(clientData['Registered Authority']),
          management_name: cleanString(clientData['Management name']),
          management_email: cleanString(clientData['Management email']),
          city: cleanString(clientData['City']),
          po_box: cleanPoBox(clientData['P.O. box no.']),
          vat_trn: cleanVatTrn(clientData['VAT TRN/TIN (15)']),
        };
        
        // Validate required fields
        if (!client.company_code || !client.company_name || !client.company_name_short || 
            !client.registered_authority || !client.management_name || !client.management_email || 
            !client.city) {
          throw new Error('Missing required fields');
        }
        
        // Validate email format
        if (!validateEmail(client.management_email)) {
          throw new Error(`Invalid email format: ${client.management_email}`);
        }
        
        // Insert into database
        await dbClient.query(`
          INSERT INTO clients (
            company_code, company_name, company_name_short, registered_authority,
            management_name, management_email, city, po_box, vat_trn, 
            status, created_by, updated_by, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, NOW(), NOW())
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
          adminUserId
        ]);
        
        imported++;
        
        // Progress indicator
        if (imported % 50 === 0) {
          console.log(`📊 Processed ${imported} clients...`);
        }
        
      } catch (error) {
        skipped++;
        errors.push({
          index: index + 1,
          company_code: clientData['Company code'],
          company_name: clientData['Company Name'],
          error: error.message
        });
        
        console.warn(`⚠️  Skipped client ${index + 1}: ${error.message}`);
      }
    }
    
    // Final statistics
    console.log('\n📈 Import Summary:');
    console.log(`✅ Successfully imported: ${imported} clients`);
    console.log(`❌ Skipped due to errors: ${skipped} clients`);
    
    if (errors.length > 0) {
      console.log('\n🚨 Errors encountered:');
      errors.forEach(err => {
        console.log(`   - Row ${err.index}: ${err.company_name} (${err.company_code}) - ${err.error}`);
      });
    }
    
    // Verify final count
    const countResult = await dbClient.query('SELECT COUNT(*) FROM clients');
    console.log(`\n🎯 Total clients in database: ${countResult.rows[0].count}`);
    
    // Show sample of imported data
    const sampleResult = await dbClient.query(`
      SELECT company_code, company_name, registered_authority, city 
      FROM clients 
      ORDER BY company_code 
      LIMIT 5
    `);
    
    console.log('\n📋 Sample imported clients:');
    sampleResult.rows.forEach(client => {
      console.log(`   - ${client.company_code}: ${client.company_name} (${client.registered_authority}, ${client.city})`);
    });
    
    console.log('\n🎉 Client import completed successfully!');
    
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

// Run the import
importClients();