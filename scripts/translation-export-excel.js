#!/usr/bin/env node

/**
 * Translation Export to Excel for Golden Visa
 * Creates an Excel file with all translations for human review/correction
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

// Main export function
async function exportTranslations() {
  console.log('📊 Starting Golden Visa translation export to Excel...\n');
  
  // Read the full translation file
  const translationPath = path.join(__dirname, '../src/lib/pdf-generator/translations/golden-visa.ts');
  const fileContent = fs.readFileSync(translationPath, 'utf8');
  
  // Extract the translation object from the TypeScript file
  // Since we can't directly require TypeScript, we'll parse it
  const translationMatch = fileContent.match(/export const GOLDEN_VISA_TRANSLATIONS = ({[\s\S]*});/);
  if (!translationMatch) {
    console.error('Could not find GOLDEN_VISA_TRANSLATIONS in file');
    process.exit(1);
  }
  
  // Evaluate the object (safe since it's our own code)
  const TRANSLATIONS = eval('(' + translationMatch[1] + ')');
  
  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Golden Visa Translations');
  
  // Define columns
  worksheet.columns = [
    { header: 'Key', key: 'key', width: 40 },
    { header: 'English', key: 'english', width: 60 },
    { header: 'Current German (AI)', key: 'germanCurrent', width: 60 },
    { header: 'New German (Human)', key: 'germanNew', width: 60 },
    { header: 'Context', key: 'context', width: 30 },
    { header: 'Notes', key: 'notes', width: 30 }
  ];
  
  // Style the header row
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  // Helper function to flatten nested objects
  function flattenTranslations(obj, prefix = '') {
    const result = [];
    
    for (const key in obj) {
      const value = obj[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string') {
        result.push({ key: fullKey, value: value });
      } else if (typeof value === 'function') {
        // For functions, we'll store a placeholder
        result.push({ 
          key: fullKey, 
          value: '[DYNAMIC_TEXT]',
          isFunction: true 
        });
      } else if (typeof value === 'object' && value !== null) {
        result.push(...flattenTranslations(value, fullKey));
      }
    }
    
    return result;
  }
  
  // Flatten both language versions
  const englishFlat = flattenTranslations(TRANSLATIONS.en);
  const germanFlat = flattenTranslations(TRANSLATIONS.de);
  
  // Create a map of German translations for easy lookup
  const germanMap = {};
  germanFlat.forEach(item => {
    germanMap[item.key] = item.value;
  });
  
  // Add rows to worksheet
  let rowCount = 0;
  englishFlat.forEach((enItem, index) => {
    const germanText = germanMap[enItem.key] || '[MISSING]';
    
    // Determine context based on key path
    let context = '';
    if (enItem.key.includes('headlines')) context = 'PDF Header';
    else if (enItem.key.includes('intro')) context = 'Introduction Text';
    else if (enItem.key.includes('requirements')) context = 'Requirements Section';
    else if (enItem.key.includes('costSummary')) context = 'Cost Summary';
    else if (enItem.key.includes('signature')) context = 'Signature Section';
    else if (enItem.key.includes('costsBreakdown')) context = 'Cost Breakdown Page';
    else if (enItem.key.includes('dependentCosts')) context = 'Dependent Costs Page';
    else if (enItem.key.includes('visaTypes')) context = 'Visa Type Labels';
    
    // Add helpful notes
    let notes = '';
    if (enItem.value.includes('Golden Visa')) notes = 'Keep "Golden Visa" in English';
    if (enItem.value.includes('AED')) notes = 'Keep "AED" unchanged';
    if (enItem.value.includes('UAE') || enItem.value.includes('Emirates ID')) notes = 'Keep official terms';
    if (enItem.value.includes('TME')) notes = 'Keep "TME" as company name';
    if (enItem.isFunction) notes = 'Dynamic text - check format';
    if (germanText === '[MISSING]') notes = 'NEW - Needs translation';
    
    const row = worksheet.addRow({
      key: enItem.key,
      english: enItem.value,
      germanCurrent: germanText,
      germanNew: '', // Empty for translator to fill
      context: context,
      notes: notes
    });
    
    rowCount++;
    
    // Style rows for better readability
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F5F5' }
      };
    }
    
    // Highlight missing translations
    if (germanText === '[MISSING]') {
      row.getCell('germanCurrent').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFE0E0' }
      };
    }
    
    // Set text wrapping for long content
    row.getCell('english').alignment = { wrapText: true, vertical: 'top' };
    row.getCell('germanCurrent').alignment = { wrapText: true, vertical: 'top' };
    row.getCell('germanNew').alignment = { wrapText: true, vertical: 'top' };
  });
  
  // Add instructions sheet
  const instructionSheet = workbook.addWorksheet('Instructions');
  instructionSheet.columns = [
    { header: 'Instructions for Translator', key: 'instruction', width: 100 }
  ];
  
  const instructions = [
    '1. Review the "Current German (AI)" column',
    '2. If translation needs correction, enter the correct translation in "New German (Human)" column',
    '3. If current translation is correct, leave "New German" empty',
    '4. Pay attention to the "Notes" column for special instructions',
    '5. Keep the following terms in English: Golden Visa, UAE, Emirates ID, TME, DLD, AED',
    '6. For dynamic text marked as [DYNAMIC_TEXT], maintain the same format structure',
    '7. Save the file when complete and return for import',
    '',
    'Color coding:',
    '- Light red background: Missing translation that needs to be added',
    '- Regular: Existing translation to review',
    '',
    'Questions? Add comments in the Notes column and we will review together.'
  ];
  
  instructions.forEach((instruction, index) => {
    const row = instructionSheet.addRow({ instruction });
    if (index === 0) {
      row.font = { bold: true, size: 14 };
    }
  });
  
  // Auto-fit columns in instruction sheet
  instructionSheet.columns.forEach(column => {
    column.width = 100;
  });
  
  // Save the workbook
  const outputPath = path.join(__dirname, '../golden-visa-translations.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  
  console.log('✅ Export complete!\n');
  console.log(`📁 Excel file saved to: ${outputPath}`);
  console.log(`📊 Total translation entries: ${rowCount}`);
  console.log('\n📋 Next steps:');
  console.log('1. Send "golden-visa-translations.xlsx" to your translator');
  console.log('2. Translator fills the "New German (Human)" column');
  console.log('3. Save the file and run: npm run import-translations');
  console.log('\n💡 The translator only needs to fill translations that need changes.');
  console.log('   Empty cells in "New German" column mean keep current translation.\n');
}

// Check if ExcelJS is installed
try {
  require('exceljs');
} catch (error) {
  console.log('📦 Installing required Excel package...');
  const { execSync } = require('child_process');
  execSync('npm install exceljs', { stdio: 'inherit' });
}

// Run the export
exportTranslations().catch(error => {
  console.error('❌ Export failed:', error);
  process.exit(1);
});