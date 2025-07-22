#!/usr/bin/env node

/**
 * Employee Data Seeder Script for TME Portal
 * 
 * This script:
 * 1. Reads employee data from employee_details.json
 * 2. Generates properly hashed passwords for each employee
 * 3. Updates the database seed file with real password hashes
 * 4. Can also directly seed the database if DATABASE_URL is provided
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

// File paths
const EMPLOYEE_DATA_PATH = path.join(__dirname, '..', 'employee_details.json');
const SEED_FILE_PATH = path.join(__dirname, '..', 'database', 'seed.sql');

// Default password pattern: TME2024_[EMPLOYEE_CODE]
const generateDefaultPassword = (employeeCode) => {
  return `TME2024_${employeeCode.replace(/\s+/g, '_').toUpperCase()}`;
};

// Determine user role based on designation and department
const determineRole = (designation, department) => {
  const designationLower = designation.toLowerCase();
  const departmentLower = department.toLowerCase();
  
  // Admin roles
  if (designationLower.includes('managing director') || 
      designationLower.includes('ceo') ||
      departmentLower === 'ceo') {
    return 'admin';
  }
  
  // Manager roles
  if (designationLower.includes('manager') ||
      designationLower.includes('director') ||
      designationLower.includes('supervisor') ||
      designationLower.includes('cfo') ||
      designationLower.includes('head')) {
    return 'manager';
  }
  
  // Default to employee
  return 'employee';
};

// Clean department name
const cleanDepartment = (department) => {
  const mapping = {
    'CEO': 'Management',
    'Client Support': 'Client Support',
    'Tax & Compliance': 'Tax & Compliance',
    'Company Setup': 'Company Setup',
  };
  
  return mapping[department] || department;
};

async function hashPasswords() {
  console.log('🔐 Generating password hashes for all employees...');
  
  try {
    // Load employee data
    const employeeData = JSON.parse(fs.readFileSync(EMPLOYEE_DATA_PATH, 'utf8'));
    console.log(`📊 Found ${employeeData.length} employees in data file`);
    
    // Generate hashes for all employees
    const hashedEmployees = [];
    
    for (const employee of employeeData) {
      const employeeCode = employee['Employee Code'];
      const fullName = employee['Full Name'];
      const department = cleanDepartment(employee['Department']);
      const designation = employee['Designation'];
      const email = employee['Company email address'];
      
      // Generate default password and hash it
      const defaultPassword = generateDefaultPassword(employeeCode);
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      // Determine role
      const role = determineRole(designation, department);
      
      hashedEmployees.push({
        employeeCode,
        fullName,
        department,
        designation,
        email,
        hashedPassword,
        role,
        defaultPassword, // Keep for reference
      });
      
      console.log(`✅ ${employeeCode} - ${fullName} (${role})`);
    }
    
    return hashedEmployees;
  } catch (error) {
    console.error('❌ Error generating password hashes:', error);
    throw error;
  }
}

function generateSQLInserts(employees) {
  console.log('📝 Generating SQL insert statements...');
  
  const sqlInserts = employees.map(emp => {
    const escapedName = emp.fullName.replace(/'/g, "''");
    const escapedDesignation = emp.designation.replace(/'/g, "''");
    
    return `('${emp.employeeCode}', '${emp.email}', '${escapedName}', '${emp.department}', '${escapedDesignation}', '${emp.hashedPassword}', '${emp.role}', 'active', true)`;
  }).join(',\n');
  
  return `INSERT INTO users (
    employee_code, 
    email, 
    full_name, 
    department, 
    designation, 
    hashed_password,
    role,
    status,
    must_change_password
) VALUES
${sqlInserts};`;
}

function generatePasswordReference(employees) {
  console.log('📋 Generating password reference...');
  
  let reference = '\n-- Default Password Reference:\n';
  reference += '-- ============================\n';
  
  employees.forEach(emp => {
    reference += `-- ${emp.employeeCode.padEnd(8)} | ${emp.email.padEnd(35)} | ${emp.defaultPassword}\n`;
  });
  
  reference += '-- ============================\n';
  reference += '-- All users must change their password on first login\n\n';
  
  return reference;
}

async function updateSeedFile(employees) {
  console.log('📄 Updating seed.sql file...');
  
  try {
    // Generate new SQL content
    const sqlInserts = generateSQLInserts(employees);
    const passwordReference = generatePasswordReference(employees);
    
    // Read current seed file
    let seedContent = fs.readFileSync(SEED_FILE_PATH, 'utf8');
    
    // Replace the INSERT INTO users section
    const insertPattern = /INSERT INTO users \([^;]+\);/s;
    
    if (insertPattern.test(seedContent)) {
      seedContent = seedContent.replace(insertPattern, sqlInserts);
      console.log('✅ Updated existing INSERT INTO users statement');
    } else {
      // If pattern not found, append at the end of file
      seedContent += '\n\n' + sqlInserts;
      console.log('✅ Added new INSERT INTO users statement');
    }
    
    // Add password reference at the top
    if (!seedContent.includes('-- Default Password Reference:')) {
      seedContent = passwordReference + seedContent;
    }
    
    // Write updated content
    fs.writeFileSync(SEED_FILE_PATH, seedContent);
    console.log('✅ seed.sql file updated successfully');
    
    return seedContent;
    
  } catch (error) {
    console.error('❌ Error updating seed file:', error);
    throw error;
  }
}

async function seedDatabase(employees) {
  console.log('🗄️  Seeding database directly...');
  
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not found, skipping direct database seeding');
    return;
  }
  
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Clear existing users (be careful in production!)
    await pool.query('DELETE FROM users WHERE id > 0');
    console.log('🗑️  Cleared existing users');
    
    // Insert new users
    for (const emp of employees) {
      await pool.query(`
        INSERT INTO users (
          employee_code, email, full_name, department, designation, 
          hashed_password, role, status, must_change_password
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        emp.employeeCode, emp.email, emp.fullName, emp.department, 
        emp.designation, emp.hashedPassword, emp.role, 'active', true
      ]);
    }
    
    console.log(`✅ Successfully seeded ${employees.length} users to database`);
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

function generatePasswordList(employees) {
  console.log('\n📋 Employee Login Credentials:');
  console.log('================================');
  
  employees.forEach(emp => {
    console.log(`${emp.employeeCode.padEnd(10)} | ${emp.email.padEnd(35)} | ${emp.defaultPassword}`);
  });
  
  console.log('================================');
  console.log('⚠️  All users must change their password on first login');
  console.log('👤 Admin users can access user management features');
  console.log('📧 For support, contact: uwe@TME-Services.com\n');
}

// Main execution
async function main() {
  console.log('🚀 TME Portal Employee Data Seeder');
  console.log('===================================\n');
  
  try {
    // Generate password hashes
    const employees = await hashPasswords();
    
    // Update seed file
    await updateSeedFile(employees);
    
    // Seed database if URL provided
    await seedDatabase(employees);
    
    // Show password reference
    generatePasswordList(employees);
    
    console.log('🎉 Employee data seeding completed successfully!');
    console.log(`📊 Total employees processed: ${employees.length}`);
    console.log(`👤 Admins: ${employees.filter(e => e.role === 'admin').length}`);
    console.log(`👨‍💼 Managers: ${employees.filter(e => e.role === 'manager').length}`);
    console.log(`👥 Employees: ${employees.filter(e => e.role === 'employee').length}`);
    
  } catch (error) {
    console.error('💥 Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  hashPasswords,
  updateSeedFile,
  seedDatabase,
  generateDefaultPassword,
  determineRole,
};