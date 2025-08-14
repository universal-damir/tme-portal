#!/usr/bin/env node

/**
 * Translation Import from Excel for Golden Visa
 * Reads the Excel file with human translations and updates the code
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

async function importTranslations() {
  console.log('📥 Starting Golden Visa translation import from Excel...\n');
  
  // Check if Excel file exists
  const inputPath = path.join(__dirname, '../golden-visa-translations.xlsx');
  if (!fs.existsSync(inputPath)) {
    console.error('❌ Excel file not found: golden-visa-translations.xlsx');
    console.error('   Please make sure the translator returned the file with the same name.');
    process.exit(1);
  }
  
  // Load the workbook
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(inputPath);
  
  const worksheet = workbook.getWorksheet('Golden Visa Translations');
  if (!worksheet) {
    console.error('❌ Could not find "Golden Visa Translations" worksheet');
    process.exit(1);
  }
  
  // Read all translations from Excel
  const updates = {};
  let updateCount = 0;
  let skipCount = 0;
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header
    
    const key = row.getCell('key').value;
    const newGerman = row.getCell('germanNew').value;
    
    if (newGerman && newGerman.toString().trim()) {
      updates[key] = newGerman.toString().trim();
      updateCount++;
    } else {
      skipCount++;
    }
  });
  
  console.log(`📊 Found ${updateCount} translations to update`);
  console.log(`⏭️  Skipping ${skipCount} unchanged entries\n`);
  
  if (updateCount === 0) {
    console.log('ℹ️  No updates found. Make sure translator filled "New German (Human)" column.');
    return;
  }
  
  // Read the current translation file
  const translationPath = path.join(__dirname, '../src/lib/pdf-generator/translations/golden-visa.ts');
  let fileContent = fs.readFileSync(translationPath, 'utf8');
  
  // Create backup
  const backupPath = translationPath + '.backup-' + new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(backupPath, fileContent);
  console.log(`💾 Backup created: ${path.basename(backupPath)}\n`);
  
  // Function to update nested object values in the file content
  function applyUpdates() {
    let updatedCount = 0;
    
    // Sort keys by length (longest first) to avoid partial replacements
    const sortedKeys = Object.keys(updates).sort((a, b) => b.length - a.length);
    
    for (const fullKey of sortedKeys) {
      const keyParts = fullKey.split('.');
      const newValue = updates[fullKey];
      
      // Build a regex pattern to find the value in the German section
      // We need to be careful to match the exact structure
      
      // For simple string values
      const simplePattern = new RegExp(
        `(de:[^}]*${keyParts[keyParts.length - 1]}:\\s*)'([^']*)'`,
        'g'
      );
      
      const doubleQuotePattern = new RegExp(
        `(de:[^}]*${keyParts[keyParts.length - 1]}:\\s*)"([^"]*)"`,
        'g'
      );
      
      // Try single quotes first
      if (fileContent.match(simplePattern)) {
        fileContent = fileContent.replace(simplePattern, (match, prefix) => {
          updatedCount++;
          console.log(`✏️  Updated: ${fullKey}`);
          return `${prefix}'${newValue.replace(/'/g, "\\'")}'`;
        });
      } 
      // Try double quotes
      else if (fileContent.match(doubleQuotePattern)) {
        fileContent = fileContent.replace(doubleQuotePattern, (match, prefix) => {
          updatedCount++;
          console.log(`✏️  Updated: ${fullKey}`);
          return `${prefix}"${newValue.replace(/"/g, '\\"')}"`;
        });
      }
    }
    
    return updatedCount;
  }
  
  // Apply all updates
  const actualUpdates = applyUpdates();
  
  if (actualUpdates > 0) {
    // Write the updated file
    fs.writeFileSync(translationPath, fileContent);
    console.log(`\n✅ Successfully updated ${actualUpdates} translations!`);
    console.log('📁 File updated: src/lib/pdf-generator/translations/golden-visa.ts');
    
    // Create a change log
    const changeLogPath = path.join(__dirname, '../translation-changes.log');
    const changeLog = `Translation Update - ${new Date().toISOString()}\n` +
                     `Updated: ${actualUpdates} translations\n` +
                     `Backup: ${path.basename(backupPath)}\n` +
                     '---\n' +
                     Object.entries(updates).map(([key, value]) => 
                       `${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`
                     ).join('\n') + '\n\n';
    
    fs.appendFileSync(changeLogPath, changeLog);
    console.log('📝 Change log updated: translation-changes.log');
    
    console.log('\n🎉 Import complete! Next steps:');
    console.log('1. Test by generating a German PDF in Golden Visa tab');
    console.log('2. Long-press the Preview button to see German version');
    console.log('3. If corrections needed, repeat the process');
  } else {
    console.log('\n⚠️  Warning: Could not apply updates. Please check the Excel file format.');
  }
}

// Check if ExcelJS is installed
try {
  require('exceljs');
} catch (error) {
  console.log('📦 Installing required Excel package...');
  const { execSync } = require('child_process');
  execSync('npm install exceljs', { stdio: 'inherit' });
}

// Run the import
importTranslations().catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});