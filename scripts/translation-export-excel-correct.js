#!/usr/bin/env node

/**
 * CORRECTED Translation Export to Excel for Golden Visa
 * Properly parses and matches English and German translations
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const vm = require('vm');

// Main export function
async function exportAllTranslations() {
  console.log('📊 Starting CORRECTED Golden Visa translation export to Excel...\n');
  
  // Read the translation file
  const translationPath = path.join(__dirname, '../src/lib/pdf-generator/translations/golden-visa.ts');
  let fileContent = fs.readFileSync(translationPath, 'utf8');
  
  // Remove TypeScript specific syntax to make it valid JavaScript
  fileContent = fileContent.replace('export const', 'const');
  fileContent = fileContent.replace(/\(([^:)]+): string([^)]*)\)/g, '($1)'); // Remove type annotations from functions
  fileContent = fileContent.replace(/: string/g, ''); // Remove all : string type annotations
  fileContent = fileContent.replace(/: number/g, ''); // Remove all : number type annotations
  fileContent = fileContent.replace(/export type.*\n/g, ''); // Remove type exports
  fileContent = fileContent.replace(/export interface.*\n/g, ''); // Remove interface exports
  fileContent = fileContent.replace(/Locale/g, ''); // Remove Locale type references
  
  // Create a sandbox to safely evaluate the translations object
  const sandbox = {};
  const script = new vm.Script(fileContent + '\n; GOLDEN_VISA_TRANSLATIONS');
  const TRANSLATIONS = script.runInNewContext(sandbox);
  
  // Helper function to flatten nested objects with proper key paths
  function flattenObject(obj, prefix = '') {
    const result = [];
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'string') {
          result.push({ key: fullKey, value: value });
        } else if (typeof value === 'function') {
          // Handle functions - extract a sample or mark as dynamic
          result.push({ 
            key: fullKey, 
            value: '[DYNAMIC: Function with parameters]',
            isFunction: true 
          });
        } else if (typeof value === 'object' && value !== null) {
          // Recursively flatten nested objects
          result.push(...flattenObject(value, fullKey));
        }
      }
    }
    
    return result;
  }
  
  // Flatten both language versions
  console.log('Parsing English translations...');
  const englishFlat = flattenObject(TRANSLATIONS.en);
  console.log(`  Found ${englishFlat.length} English entries`);
  
  console.log('Parsing German translations...');
  const germanFlat = flattenObject(TRANSLATIONS.de);
  console.log(`  Found ${germanFlat.length} German entries\n`);
  
  // Create a map of German translations for easy lookup
  const germanMap = {};
  germanFlat.forEach(item => {
    germanMap[item.key] = item.value;
  });
  
  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Golden Visa Translations');
  
  // Define columns with better widths
  worksheet.columns = [
    { header: 'Key', key: 'key', width: 55 },
    { header: 'English', key: 'english', width: 75 },
    { header: 'Current German (AI)', key: 'germanCurrent', width: 75 },
    { header: 'New German (Human)', key: 'germanNew', width: 75 },
    { header: 'Context', key: 'context', width: 35 },
    { header: 'Notes', key: 'notes', width: 40 }
  ];
  
  // Style the header row
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF243F7B' }
  };
  worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
  worksheet.getRow(1).height = 25;
  
  // Freeze the header row and first column
  worksheet.views = [{ 
    state: 'frozen', 
    xSplit: 1,
    ySplit: 1,
    topLeftCell: 'B2',
    activeCell: 'B2'
  }];
  
  // Process all English entries and match with German
  let rowCount = 0;
  let missingCount = 0;
  let functionCount = 0;
  
  englishFlat.forEach((enItem, index) => {
    const germanText = germanMap[enItem.key];
    const hasGerman = germanText !== undefined;
    
    if (!hasGerman && !enItem.isFunction) {
      missingCount++;
    }
    if (enItem.isFunction) {
      functionCount++;
    }
    
    // Determine context based on key path
    let context = '';
    const keyParts = enItem.key.split('.');
    const mainSection = keyParts[0];
    const subSection = keyParts[1];
    
    if (mainSection === 'headlines') context = 'PDF Header';
    else if (mainSection === 'intro') context = 'Introduction';
    else if (mainSection === 'visaTypes') context = 'Visa Type Label';
    else if (mainSection === 'requirements') {
      if (subSection === 'sectionTitle') context = 'Section Title';
      else if (subSection === 'introText') context = 'Intro Text';
      else if (subSection === 'common') context = 'Common Requirements';
      else if (subSection === 'propertyInvestment') context = 'Property Requirements';
      else if (subSection === 'timeDeposit') context = 'Time Deposit Requirements';
      else if (subSection === 'skilledEmployee') context = 'Employee Requirements';
      else if (subSection === 'dependent') context = 'Dependent Requirements';
      else context = 'Requirements';
    }
    else if (mainSection === 'costSummary') {
      if (subSection === 'titles') context = 'Cost Summary Title';
      else if (subSection === 'descriptions') context = 'Cost Description';
      else if (subSection === 'tableHeaders') context = 'Table Header';
      else if (subSection === 'costItems') context = 'Cost Item';
      else context = 'Cost Summary';
    }
    else if (mainSection === 'signature') context = 'Signature Section';
    else if (mainSection === 'costsBreakdown') {
      if (subSection === 'explanations') context = 'Service Explanation';
      else context = 'Cost Breakdown';
    }
    else if (mainSection === 'dependentCosts') {
      if (subSection === 'explanations') context = 'Dependent Explanation';
      else if (subSection === 'serviceDescriptions') context = 'Service Description';
      else context = 'Dependent Costs';
    }
    else context = 'Other';
    
    // Add helpful notes
    let notes = '';
    const engText = enItem.value;
    
    if (enItem.isFunction) {
      notes = '⚙️ Dynamic text with variables';
    } else if (!hasGerman) {
      notes = '❌ MISSING - Needs German translation';
    } else {
      // Check for terms that should remain in English
      if (engText.includes('Golden Visa')) notes = 'Keep "Golden Visa" in English';
      else if (engText.includes('AED')) notes = 'Keep "AED" unchanged';
      else if (engText.includes('UAE')) notes = 'Keep "UAE" in English';
      else if (engText.includes('Emirates ID')) notes = 'Keep "Emirates ID" in English';
      else if (engText.includes('TME')) notes = 'Keep "TME" as company name';
      else if (engText.includes('DLD')) notes = 'Keep "DLD" unchanged';
      else if (engText.includes('GDRFA')) notes = 'Keep "GDRFA" unchanged';
      else if (engText.includes('NOC')) notes = 'NOC = Unbedenklichkeitsbescheinigung';
      else if (engText.includes('Ejari')) notes = 'Keep "Ejari" (rental system)';
    }
    
    // Display appropriate German text
    let displayGerman = '';
    if (enItem.isFunction && germanText) {
      displayGerman = germanText;
    } else if (enItem.isFunction) {
      displayGerman = '[DYNAMIC: Needs function translation]';
    } else if (hasGerman) {
      displayGerman = germanText;
    } else {
      displayGerman = '[MISSING TRANSLATION]';
    }
    
    const row = worksheet.addRow({
      key: enItem.key,
      english: enItem.value,
      germanCurrent: displayGerman,
      germanNew: '', // Empty for translator to fill
      context: context,
      notes: notes
    });
    
    rowCount++;
    
    // Style rows
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8F8F8' }
      };
    }
    
    // Highlight rows that need attention
    if (!hasGerman && !enItem.isFunction) {
      // Missing translation - red highlight
      row.getCell('germanCurrent').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFE0E0' }
      };
      row.getCell('germanCurrent').font = { color: { argb: 'FFCC0000' }, bold: true };
    } else if (enItem.isFunction) {
      // Dynamic function - yellow highlight
      row.getCell('germanCurrent').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF0D0' }
      };
    }
    
    // Set text wrapping and alignment
    ['english', 'germanCurrent', 'germanNew'].forEach(col => {
      row.getCell(col).alignment = { wrapText: true, vertical: 'top' };
    });
    row.getCell('context').alignment = { vertical: 'top' };
    row.getCell('notes').alignment = { wrapText: true, vertical: 'top' };
    
    // Auto-adjust row height based on content length
    const maxLength = Math.max(
      enItem.value.length,
      displayGerman.length
    );
    
    if (maxLength > 300) row.height = 100;
    else if (maxLength > 200) row.height = 80;
    else if (maxLength > 100) row.height = 60;
    else if (maxLength > 50) row.height = 40;
    else row.height = 30;
  });
  
  // Add validation column to check translator's work
  worksheet.getColumn('H').header = 'Status';
  worksheet.getColumn('H').width = 15;
  worksheet.getCell('H1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF243F7B' }
  };
  worksheet.getCell('H1').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  
  // Add comprehensive instructions sheet
  const instructionSheet = workbook.addWorksheet('Instructions');
  instructionSheet.columns = [
    { header: 'Professional Translation Instructions', key: 'instruction', width: 130 }
  ];
  
  instructionSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF243F7B' } };
  instructionSheet.getRow(1).height = 25;
  
  const instructions = [
    '═══════════════════════════════════════════════════════════════════════════════',
    '📋 GOLDEN VISA DOCUMENT TRANSLATION PROJECT',
    '═══════════════════════════════════════════════════════════════════════════════',
    '',
    `📊 STATISTICS:`,
    `• Total entries: ${rowCount}`,
    `• Existing translations to review: ${rowCount - missingCount - functionCount}`,
    `• Missing translations (RED): ${missingCount}`,
    `• Dynamic functions (YELLOW): ${functionCount}`,
    '',
    '═══════════════════════════════════════════════════════════════════════════════',
    '📝 HOW TO COMPLETE THIS TRANSLATION:',
    '═══════════════════════════════════════════════════════════════════════════════',
    '',
    '1️⃣ Go to "Golden Visa Translations" worksheet',
    '2️⃣ Review each row:',
    '   • Column B: English original text',
    '   • Column C: Current German (AI-generated)',
    '   • Column D: Your corrected German translation',
    '',
    '3️⃣ ONLY fill Column D ("New German") if correction is needed:',
    '   ✅ If current German is perfect → Leave Column D empty',
    '   ✏️ If correction needed → Type correct version in Column D',
    '   ❌ If marked [MISSING TRANSLATION] → Provide full translation',
    '',
    '═══════════════════════════════════════════════════════════════════════════════',
    '⚠️ CRITICAL TERMS - MUST REMAIN IN ENGLISH:',
    '═══════════════════════════════════════════════════════════════════════════════',
    '',
    '• Golden Visa (always keep in English)',
    '• UAE / United Arab Emirates',
    '• Emirates ID',
    '• TME / TME Services (company name)',
    '• AED (currency code)',
    '• DLD (Dubai Land Department)',
    '• GDRFA',
    '• Ejari (rental contract system)',
    '',
    'For NOC: Use "Unbedenklichkeitsbescheinigung" or keep as "NOC"',
    '',
    '═══════════════════════════════════════════════════════════════════════════════',
    '🎨 TRANSLATION STYLE GUIDE:',
    '═══════════════════════════════════════════════════════════════════════════════',
    '',
    '• Tone: Formal business German (Sie-form)',
    '• Audience: Business professionals and government officials',
    '• Numbers: German format (2.000.000 not 2,000,000)',
    '• Dates: German format (TT.MM.JJJJ)',
    '• Consistency: Use same translation for repeated terms',
    '',
    '═══════════════════════════════════════════════════════════════════════════════',
    '🔍 COLOR CODING EXPLANATION:',
    '═══════════════════════════════════════════════════════════════════════════════',
    '',
    '🔴 RED CELLS: Missing translations - Priority!',
    '🟡 YELLOW CELLS: Dynamic functions - Check if translation makes sense',
    '⬜ WHITE/GRAY: Existing translations - Review for accuracy',
    '',
    '═══════════════════════════════════════════════════════════════════════════════',
    '✅ QUALITY CHECKLIST BEFORE SUBMITTING:',
    '═══════════════════════════════════════════════════════════════════════════════',
    '',
    '□ All red cells have been translated',
    '□ English terms listed above kept in English',
    '□ No spelling or grammar errors',
    '□ Consistent terminology throughout',
    '□ Formal tone maintained',
    '□ Length reasonable (German not excessively longer)',
    '',
    '═══════════════════════════════════════════════════════════════════════════════',
    '💾 SAVING YOUR WORK:',
    '═══════════════════════════════════════════════════════════════════════════════',
    '',
    '1. Save as: golden-visa-translations-completed.xlsx',
    '2. Keep Excel format (.xlsx)',
    '3. Return via email',
    '',
    'Questions? Add notes in Column F ("Notes") and we will review together.',
    '',
    'Thank you for ensuring professional quality translations!',
    '═══════════════════════════════════════════════════════════════════════════════'
  ];
  
  instructions.forEach((instruction) => {
    const row = instructionSheet.addRow({ instruction });
    
    if (instruction.includes('═══')) {
      row.font = { color: { argb: 'FF666666' } };
      row.height = 15;
    } else if (instruction.startsWith('📋') || instruction.startsWith('📊') || 
               instruction.startsWith('📝') || instruction.startsWith('⚠️') ||
               instruction.startsWith('🎨') || instruction.startsWith('🔍') ||
               instruction.startsWith('✅') || instruction.startsWith('💾')) {
      row.font = { bold: true, size: 12, color: { argb: 'FF243F7B' } };
      row.height = 22;
    } else if (instruction.startsWith('•') || instruction.startsWith('□') || 
               instruction.match(/^[1-3]️⃣/)) {
      row.height = 20;
    }
  });
  
  // Save the workbook
  const outputPath = path.join(__dirname, '../golden-visa-translations-CORRECTED.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  
  console.log('✅ CORRECTED Export Complete!\n');
  console.log(`📁 Excel file created: golden-visa-translations-CORRECTED.xlsx`);
  console.log('\n📊 Export Statistics:');
  console.log(`   • Total entries: ${rowCount}`);
  console.log(`   • With German translations: ${rowCount - missingCount - functionCount}`);
  console.log(`   • Missing translations (needs work): ${missingCount}`);
  console.log(`   • Dynamic functions: ${functionCount}`);
  console.log('\n🎯 Translation Priority:');
  console.log(`   1. Fix ${missingCount} missing translations (RED cells)`);
  console.log(`   2. Review ${rowCount - missingCount - functionCount} existing translations`);
  console.log(`   3. Check ${functionCount} dynamic functions if needed`);
  console.log('\n📨 Next steps:');
  console.log('1. Send "golden-visa-translations-CORRECTED.xlsx" to translator');
  console.log('2. Translator fills Column D only where corrections needed');
  console.log('3. Import with: npm run import-translations');
  console.log('\n✨ This file properly shows all German translations that exist!\n');
}

// Run the export
exportAllTranslations().catch(error => {
  console.error('❌ Export failed:', error);
  console.error('\nFull error:', error.stack);
  process.exit(1);
});