#!/usr/bin/env node

/**
 * Debug Authentication Script
 * 
 * This script helps debug the TME Portal authentication system by:
 * 1. Testing password hashing and comparison with bcryptjs
 * 2. Testing database connection and user queries
 * 3. Verifying actual password hashes in the database
 * 4. Testing the authenticateUser function directly
 */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Create database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testBcryptBasic() {
  console.log('\n🔐 Testing Basic Bcrypt Functionality');
  console.log('=====================================');
  
  try {
    const testPassword = 'TME2024_00_UH';
    console.log(`Test password: ${testPassword}`);
    
    // Hash the password
    const hash = await bcrypt.hash(testPassword, 12);
    console.log(`Generated hash: ${hash}`);
    
    // Verify the password
    const isValid = await bcrypt.compare(testPassword, hash);
    console.log(`Password verification: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test with wrong password
    const wrongPassword = 'wrong_password';
    const isWrong = await bcrypt.compare(wrongPassword, hash);
    console.log(`Wrong password test: ${isWrong ? '❌ FAIL (should be false)' : '✅ PASS (correctly false)'}`);
    
    return { success: true, hash };
  } catch (error) {
    console.error('❌ Bcrypt test failed:', error);
    return { success: false, error };
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️  Testing Database Connection');
  console.log('===============================');
  
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    console.log(`Current time: ${result.rows[0].now}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return { success: false, error };
  }
}

async function testUserQuery(email) {
  console.log(`\n👤 Testing User Query for: ${email}`);
  console.log('===================================');
  
  try {
    const result = await pool.query(
      'SELECT id, employee_code, email, full_name, hashed_password, status, failed_login_attempts, locked_until FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found in database');
      return { success: false, message: 'User not found' };
    }
    
    const user = result.rows[0];
    console.log('✅ User found:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Employee Code: ${user.employee_code}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Full Name: ${user.full_name}`);
    console.log(`  Status: ${user.status}`);
    console.log(`  Failed Attempts: ${user.failed_login_attempts}`);
    console.log(`  Locked Until: ${user.locked_until || 'Not locked'}`);
    console.log(`  Hash starts with: ${user.hashed_password.substring(0, 20)}...`);
    console.log(`  Hash length: ${user.hashed_password.length}`);
    
    return { success: true, user };
  } catch (error) {
    console.error('❌ User query failed:', error);
    return { success: false, error };
  }
}

async function testPasswordComparison(email, password) {
  console.log(`\n🔍 Testing Password Comparison for: ${email}`);
  console.log('=============================================');
  
  try {
    // Get user from database
    const userResult = await testUserQuery(email);
    if (!userResult.success) {
      return userResult;
    }
    
    const user = userResult.user;
    const storedHash = user.hashed_password;
    
    console.log(`\nTesting password: "${password}"`);
    console.log(`Against hash: ${storedHash.substring(0, 30)}...`);
    
    // Test password comparison
    const isValid = await bcrypt.compare(password, storedHash);
    console.log(`Password comparison result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    // Additional debug info
    console.log(`\nDebug Information:`);
    console.log(`Password length: ${password.length}`);
    console.log(`Hash algorithm: ${storedHash.substring(0, 4)}`);
    console.log(`Hash rounds: ${storedHash.substring(4, 6)}`);
    
    return { success: true, isValid, user };
  } catch (error) {
    console.error('❌ Password comparison failed:', error);
    return { success: false, error };
  }
}

async function testAuthenticateUserFunction(email, password) {
  console.log(`\n🔓 Testing authenticateUser Function`);
  console.log('===================================');
  
  try {
    // Import the authenticateUser function
    const { authenticateUser } = require('./src/lib/auth.ts');
    
    console.log(`Attempting to authenticate: ${email}`);
    const user = await authenticateUser(email, password);
    
    if (user) {
      console.log('✅ Authentication successful');
      console.log(`User ID: ${user.id}`);
      console.log(`Full Name: ${user.full_name}`);
      console.log(`Role: ${user.role}`);
    } else {
      console.log('❌ Authentication failed');
    }
    
    return { success: true, authenticated: !!user, user };
  } catch (error) {
    console.error('❌ authenticateUser function test failed:', error);
    return { success: false, error };
  }
}

async function testDefaultPasswords() {
  console.log('\n🔑 Testing Default Passwords');
  console.log('============================');
  
  // Test with a few known users
  const testUsers = [
    { email: 'uwe@TME-Services.com', expectedPassword: 'TME2024_00_UH' },
    { email: 'damir@TME-Services.com', expectedPassword: 'TME2024_70_DN' },
    { email: 'hafees@TME-Services.com', expectedPassword: 'TME2024_14_HH' },
  ];
  
  for (const testUser of testUsers) {
    console.log(`\n--- Testing ${testUser.email} ---`);
    await testPasswordComparison(testUser.email, testUser.expectedPassword);
  }
}

async function runAllTests() {
  console.log('🧪 TME Portal Authentication Debug Tool');
  console.log('=======================================');
  
  try {
    // Test bcrypt basic functionality
    const bcryptTest = await testBcryptBasic();
    if (!bcryptTest.success) {
      console.error('Basic bcrypt test failed, stopping here.');
      return;
    }
    
    // Test database connection
    const dbTest = await testDatabaseConnection();
    if (!dbTest.success) {
      console.error('Database connection failed, stopping here.');
      return;
    }
    
    // Test default passwords
    await testDefaultPasswords();
    
    // Test authenticateUser function
    await testAuthenticateUserFunction('uwe@TME-Services.com', 'TME2024_00_UH');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    // Close database connection
    await pool.end();
    console.log('\n✅ Debug session completed');
  }
}

// Handle command line arguments
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    await runAllTests();
  } else if (args.length === 2) {
    const [email, password] = args;
    try {
      await testDatabaseConnection();
      await testPasswordComparison(email, password);
      await testAuthenticateUserFunction(email, password);
    } finally {
      await pool.end();
    }
  } else {
    console.log('Usage:');
    console.log('  node debug-auth.js                    # Run all tests');
    console.log('  node debug-auth.js <email> <password> # Test specific credentials');
    console.log('');
    console.log('Examples:');
    console.log('  node debug-auth.js uwe@TME-Services.com TME2024_00_UH');
    console.log('  node debug-auth.js damir@TME-Services.com TME2024_70_DN');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testBcryptBasic,
  testDatabaseConnection,
  testUserQuery,
  testPasswordComparison,
  testAuthenticateUserFunction,
};