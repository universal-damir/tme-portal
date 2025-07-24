#!/usr/bin/env node

const bcrypt = require('bcryptjs');

async function testHash(password, storedHash) {
  console.log(`Testing password: "${password}"`);
  console.log(`Against hash: ${storedHash}`);
  
  // Generate a new hash of the password
  const newHash = await bcrypt.hash(password, 12);
  console.log(`New hash: ${newHash}`);
  
  // Test comparison
  const isValid = await bcrypt.compare(password, storedHash);
  console.log(`Comparison result: ${isValid ? 'VALID' : 'INVALID'}`);
  
  // Test with new hash
  const isValidNew = await bcrypt.compare(password, newHash);
  console.log(`New hash comparison: ${isValidNew ? 'VALID' : 'INVALID'}`);
  
  return isValid;
}

async function main() {
  // Hash from database for Uwe (employee_code: 09 UH)
  const uweHash = '$2b$12$wqn4i6kHgR2gd1Wy.qXHGOhLQC/YvIJzHCaabC5M0VzfQPeGUQJCO';
  
  console.log('=== Testing various password combinations for Uwe ===');
  
  const passwordVariations = [
    'TME2024_00_UH',  // From seed.sql comment
    'TME2024_09_UH',  // Based on actual employee_code
    'TME2024_00UH',   // Without underscore in middle
    'TME2024_09UH',   // Without underscore in middle
    'TME2024_00 UH',  // With space
    'TME2024_09 UH',  // With space
  ];
  
  for (const password of passwordVariations) {
    console.log(`\n--- Testing: ${password} ---`);
    await testHash(password, uweHash);
  }
}

main().catch(console.error);