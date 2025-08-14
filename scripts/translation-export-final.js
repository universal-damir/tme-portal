#!/usr/bin/env node

/**
 * FINAL Translation Export to Excel for Golden Visa
 * Uses manual parsing to correctly extract all translations
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

// Main export function
async function exportTranslations() {
  console.log('📊 Starting FINAL Golden Visa translation export to Excel...\n');
  
  // Read the translation file
  const translationPath = path.join(__dirname, '../src/lib/pdf-generator/translations/golden-visa.ts');
  const fileContent = fs.readFileSync(translationPath, 'utf8');
  
  // Split into lines for parsing
  const lines = fileContent.split('\n');
  
  // Storage for translations
  const translations = {
    en: {},
    de: {}
  };
  
  // Parse the file line by line
  let currentLang = null;
  let currentPath = [];
  let bracketCount = 0;
  let captureValue = false;
  let currentKey = '';
  let currentValue = '';
  let inFunction = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//')) continue;
    
    // Detect language section
    if (trimmed === 'en: {') {
      currentLang = 'en';
      currentPath = [];
      continue;
    } else if (trimmed === 'de: {') {
      currentLang = 'de';
      currentPath = [];
      continue;
    }
    
    // Skip if not in a language section
    if (!currentLang) continue;
    
    // Handle closing braces
    if (trimmed === '}' || trimmed === '},') {
      if (currentPath.length > 0) {
        currentPath.pop();
      }
      if (currentPath.length === 0 && trimmed === '},') {
        currentLang = null;
      }
      continue;
    }
    
    // Parse key-value pairs
    // Pattern 1: Simple string - key: 'value'
    const simpleMatch = trimmed.match(/^([a-zA-Z0-9_\-']+):\s*'(.*)'/);
    if (simpleMatch) {
      const key = simpleMatch[1];
      let value = simpleMatch[2];
      
      // Check if value continues on next lines (multiline string)
      if (!trimmed.endsWith(',') && !trimmed.endsWith("',")) {
        // Multiline string - need to capture rest
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          value += '\n' + nextLine.trim().replace(/',$/, '').replace(/'$/, '');
          if (nextLine.includes("',") || nextLine.includes("'")) {
            i = j; // Skip these lines in main loop
            break;
          }
        }
      }
      
      // Clean up the value
      value = value.replace(/',$/, '').replace(/'$/, '');
      
      const fullKey = [...currentPath, key].join('.');
      translations[currentLang][fullKey] = value;
      continue;
    }
    
    // Pattern 2: Function - key: (params) => 
    if (trimmed.includes('=>') || trimmed.includes('function')) {
      const funcMatch = trimmed.match(/^([a-zA-Z0-9_\-]+):/);
      if (funcMatch) {
        const key = funcMatch[1];
        const fullKey = [...currentPath, key].join('.');
        translations[currentLang][fullKey] = '[FUNCTION]';
        continue;
      }
    }
    
    // Pattern 3: Object opening - key: {
    const objectMatch = trimmed.match(/^([a-zA-Z0-9_\-]+):\s*\{/);
    if (objectMatch) {
      currentPath.push(objectMatch[1]);
      continue;
    }
  }
  
  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Golden Visa Translations');
  
  // Define columns
  worksheet.columns = [
    { header: 'Key', key: 'key', width: 55 },
    { header: 'English', key: 'english', width: 75 },
    { header: 'Current German (AI)', key: 'germanCurrent', width: 75 },
    { header: 'New German (Human)', key: 'germanNew', width: 75 },
    { header: 'Context', key: 'context', width: 35 },
    { header: 'Notes', key: 'notes', width: 40 }
  ];
  
  // Style header
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF243F7B' }
  };
  worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
  worksheet.getRow(1).height = 25;
  
  // Freeze panes
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  
  // Add all English entries with German matches
  let rowCount = 0;
  let matchedCount = 0;
  let missingCount = 0;
  
  const englishKeys = Object.keys(translations.en).sort();
  
  console.log(`Found ${englishKeys.length} English entries`);
  console.log(`Found ${Object.keys(translations.de).length} German entries\n`);
  
  englishKeys.forEach((key, index) => {
    const englishText = translations.en[key];
    const germanText = translations.de[key];
    const hasGerman = germanText !== undefined;
    
    if (hasGerman && germanText !== '[FUNCTION]') {
      matchedCount++;
    } else if (!hasGerman && englishText !== '[FUNCTION]') {
      missingCount++;
    }
    
    // Determine context
    let context = '';
    const keyParts = key.split('.');
    
    if (key.includes('headlines')) context = 'PDF Header';
    else if (key.includes('intro')) context = 'Introduction';
    else if (key.includes('visaTypes')) context = 'Visa Type';
    else if (key.includes('requirements.sectionTitle')) context = 'Section Title';
    else if (key.includes('requirements.common')) context = 'Common Requirements';
    else if (key.includes('requirements.property')) context = 'Property Requirements';
    else if (key.includes('requirements.time')) context = 'Time Deposit Requirements';
    else if (key.includes('requirements.skilled')) context = 'Employee Requirements';
    else if (key.includes('requirements.dependent')) context = 'Dependent Requirements';
    else if (key.includes('costSummary')) context = 'Cost Summary';
    else if (key.includes('signature')) context = 'Signature';
    else if (key.includes('costsBreakdown')) context = 'Cost Breakdown';
    else if (key.includes('dependentCosts')) context = 'Dependent Costs';
    else context = 'Other';
    
    // Add notes
    let notes = '';
    if (englishText === '[FUNCTION]') {
      notes = '⚙️ Dynamic function';
    } else if (!hasGerman) {
      notes = '❌ NEEDS TRANSLATION';
    } else {
      if (englishText.includes('Golden Visa')) notes = 'Keep "Golden Visa"';
      else if (englishText.includes('UAE')) notes = 'Keep "UAE"';
      else if (englishText.includes('Emirates ID')) notes = 'Keep "Emirates ID"';
      else if (englishText.includes('TME')) notes = 'Keep "TME"';
      else if (englishText.includes('AED')) notes = 'Keep "AED"';
    }
    
    const row = worksheet.addRow({
      key: key,
      english: englishText === '[FUNCTION]' ? '[Dynamic Text Function]' : englishText,
      germanCurrent: germanText || (englishText === '[FUNCTION]' ? '[Dynamic Text Function]' : ''),
      germanNew: '',
      context: context,
      notes: notes
    });
    
    rowCount++;
    
    // Styling
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8F8F8' }
      };
    }
    
    // Highlight missing translations
    if (!hasGerman && englishText !== '[FUNCTION]') {
      row.getCell('germanCurrent').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFE0E0' }
      };
      row.getCell('notes').font = { color: { argb: 'FFCC0000' }, bold: true };
    }
    
    // Set text wrapping
    ['english', 'germanCurrent', 'germanNew'].forEach(col => {
      row.getCell(col).alignment = { wrapText: true, vertical: 'top' };
    });
    
    // Auto-height
    const textLength = Math.max(
      (englishText || '').length,
      (germanText || '').length
    );
    if (textLength > 200) row.height = 80;
    else if (textLength > 100) row.height = 60;
    else if (textLength > 50) row.height = 40;
  });
  
  // Instructions sheet
  const instructionSheet = workbook.addWorksheet('Instructions');
  instructionSheet.columns = [
    { header: 'Instructions for Translator', key: 'instruction', width: 120 }
  ];
  
  const instructions = [
    '📋 GOLDEN VISA TRANSLATION PROJECT',
    '',
    `📊 Summary:`,
    `• Total entries: ${rowCount}`,
    `• Already translated: ${matchedCount}`,
    `• Missing translations: ${missingCount}`,
    '',
    '📝 How to complete:',
    '1. Review "Current German (AI)" column',
    '2. If correction needed, enter in "New German (Human)" column',
    '3. If current translation is good, leave "New German" empty',
    '4. For empty German cells, provide new translation',
    '',
    '⚠️ Keep these terms in English:',
    '• Golden Visa',
    '• UAE',
    '• Emirates ID', 
    '• TME / TME Services',
    '• AED',
    '• DLD',
    '• GDRFA',
    '',
    '✅ When complete:',
    '• Save file as: golden-visa-translations-completed.xlsx',
    '• Return via email'
  ];
  
  instructions.forEach(line => {
    instructionSheet.addRow({ instruction: line });
  });
  
  // Save
  const outputPath = path.join(__dirname, '../golden-visa-translations-FINAL.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  
  console.log('✅ Export Complete!');
  console.log(`\n📁 Created: golden-visa-translations-FINAL.xlsx`);
  console.log(`\n📊 Results:`);
  console.log(`   ✅ ${matchedCount} entries with German translations`);
  console.log(`   ❌ ${missingCount} entries need German translation`);
  console.log(`   ⚙️ ${rowCount - matchedCount - missingCount} dynamic functions`);
  console.log(`   📝 ${rowCount} total entries`);
  console.log('\n✨ This file correctly shows existing German translations!');
  console.log('\n📨 Send this file to your translator for review.\n');
}

// Run export
exportTranslations().catch(error => {
  console.error('❌ Export failed:', error);
  process.exit(1);
});