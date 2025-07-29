#!/usr/bin/env node

/**
 * Add Test Users Script for TME Portal Review System
 * Creates test users for reviewers in Management department and other departments
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  database: 'tme_portal',
  user: 'tme_user',
  password: 'secure_password',
  port: 5434,
};

const testUsers = [
  {
    id: 1,
    employee_code: 'TME001',
    email: 'testuser@TME-Services.com',
    full_name: 'Test User',
    department: 'IT',
    designation: 'Software Developer',
    role: 'employee'
  },
  {
    id: 2,
    employee_code: 'UH001',
    email: 'uwe@TME-Services.com',
    full_name: 'Uwe Hohmann',
    department: 'Management',
    designation: 'CEO',
    role: 'admin'
  },
  {
    id: 3,
    employee_code: 'MGT001',
    email: 'manager1@TME-Services.com',  
    full_name: 'Manager One',
    department: 'Management',
    designation: 'Operations Manager',
    role: 'manager'
  },
  {
    id: 4,
    employee_code: 'MGT002',
    email: 'manager2@TME-Services.com',
    full_name: 'Manager Two', 
    department: 'Management',
    designation: 'Finance Manager',
    role: 'manager'
  },
  {
    id: 5,
    employee_code: 'IT001',
    email: 'itlead@TME-Services.com',
    full_name: 'IT Lead',
    department: 'IT',
    designation: 'IT Team Lead',
    role: 'manager'
  }
];

async function addTestUsers() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    console.log('✅ Password hashed');

    // Upsert test users (insert or update if exists)
    console.log('👥 Upserting test users...');
    for (const user of testUsers) {
      // First try to update existing user by ID or email
      let result = await client.query(`
        SELECT id FROM users WHERE id = $1 OR email = $2
      `, [user.id, user.email]);

      if (result.rows.length > 0) {
        // Update existing user
        result = await client.query(`
          UPDATE users SET
            employee_code = $2,
            email = $3,
            full_name = $4,
            department = $5,
            designation = $6,
            hashed_password = $7,
            role = $8,
            status = $9,
            must_change_password = $10
          WHERE id = $1 OR email = $3
          RETURNING id, full_name, department
        `, [
          user.id,
          user.employee_code,
          user.email,
          user.full_name,
          user.department,
          user.designation,
          hashedPassword,
          user.role,
          'active',
          false // Don't require password change for test users
        ]);
        
        console.log(`   ✅ Updated: ${result.rows[0].full_name} (ID: ${result.rows[0].id}, ${result.rows[0].department})`);
      } else {
        // Insert new user
        result = await client.query(`
          INSERT INTO users (
            employee_code, email, full_name, department, designation, 
            hashed_password, role, status, must_change_password
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id, full_name, department
        `, [
          user.employee_code,
          user.email,
          user.full_name,
          user.department,
          user.designation,
          hashedPassword,
          user.role,
          'active',
          false // Don't require password change for test users
        ]);
        
        console.log(`   ✅ Added: ${result.rows[0].full_name} (ID: ${result.rows[0].id}, ${result.rows[0].department})`);
      }
    }

    // Reset sequence to start from next available ID
    await client.query('SELECT setval(\'users_id_seq\', (SELECT MAX(id) FROM users))');

    // Verify the users were added
    console.log('\n📊 Verification - Users by department:');
    const departments = await client.query(`
      SELECT department, COUNT(*) as count, 
             array_agg(full_name ORDER BY full_name) as users
      FROM users 
      WHERE status = 'active'
      GROUP BY department 
      ORDER BY department
    `);

    for (const dept of departments.rows) {
      console.log(`   ${dept.department}: ${dept.count} users`);
      for (const userName of dept.users) {
        console.log(`     - ${userName}`);
      }
    }

    console.log('\n🔐 Test Login Credentials:');
    console.log('   Email: Any of the emails above');
    console.log('   Password: TestPassword123!');
    
    console.log('\n✅ Test users added successfully!');

  } catch (error) {
    console.error('❌ Error adding test users:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
if (require.main === module) {
  addTestUsers();
}

module.exports = { addTestUsers };