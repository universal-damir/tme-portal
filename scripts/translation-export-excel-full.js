#!/usr/bin/env node

/**
 * FULL Translation Export to Excel for Golden Visa
 * Exports ALL translations from the golden-visa.ts file
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

// Main export function
async function exportAllTranslations() {
  console.log('📊 Starting FULL Golden Visa translation export to Excel...\n');
  
  // Read the translation file
  const translationPath = path.join(__dirname, '../src/lib/pdf-generator/translations/golden-visa.ts');
  const fileContent = fs.readFileSync(translationPath, 'utf8');
  
  // Parse the file to extract all translations
  // We'll extract line by line to get everything
  const lines = fileContent.split('\n');
  const translations = [];
  
  let currentPath = [];
  let inEnglish = false;
  let inGerman = false;
  let englishTexts = {};
  let germanTexts = {};
  
  // Parse through the file
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Track which section we're in
    if (trimmed === 'en: {') {
      inEnglish = true;
      inGerman = false;
      currentPath = [];
    } else if (trimmed === 'de: {') {
      inGerman = true;
      inEnglish = false;
      currentPath = [];
    }
    
    // Extract key-value pairs
    if ((inEnglish || inGerman) && trimmed && !trimmed.startsWith('//')) {
      // Handle different patterns
      
      // Pattern 1: Simple string values like -> propertyInvestment: 'Golden Visa...'
      const simpleMatch = trimmed.match(/^([a-zA-Z0-9_\-']+):\s*'([^']*)'[,]?$/);
      if (simpleMatch) {
        const key = [...currentPath, simpleMatch[1]].join('.');
        const value = simpleMatch[2];
        
        if (inEnglish) {
          englishTexts[key] = value;
        } else if (inGerman) {
          germanTexts[key] = value;
        }
      }
      
      // Pattern 2: Object opening like -> headlines: {
      const objectMatch = trimmed.match(/^([a-zA-Z0-9_\-]+):\s*\{$/);
      if (objectMatch) {
        currentPath.push(objectMatch[1]);
      }
      
      // Pattern 3: Function definitions (we'll mark these specially)
      const funcMatch = trimmed.match(/^([a-zA-Z0-9_\-]+):\s*\([^)]*\)\s*=>/);
      if (funcMatch) {
        const key = [...currentPath, funcMatch[1]].join('.');
        if (inEnglish) {
          englishTexts[key] = '[FUNCTION: Dynamic text with parameters]';
        } else if (inGerman) {
          germanTexts[key] = '[FUNKTION: Dynamischer Text mit Parametern]';
        }
      }
      
      // Track closing braces to maintain path
      const closeBraces = (trimmed.match(/\}/g) || []).length;
      const openBraces = (trimmed.match(/\{/g) || []).length;
      const netBraces = closeBraces - openBraces;
      
      if (netBraces > 0) {
        for (let j = 0; j < netBraces; j++) {
          currentPath.pop();
        }
      }
    }
  }
  
  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Golden Visa Translations');
  
  // Define columns
  worksheet.columns = [
    { header: 'Key', key: 'key', width: 50 },
    { header: 'English', key: 'english', width: 70 },
    { header: 'Current German (AI)', key: 'germanCurrent', width: 70 },
    { header: 'New German (Human)', key: 'germanNew', width: 70 },
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
  worksheet.getRow(1).height = 20;
  
  // Freeze the header row
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  
  // Add all translations
  let rowCount = 0;
  const sortedKeys = Object.keys(englishTexts).sort();
  
  sortedKeys.forEach((key, index) => {
    const englishText = englishTexts[key] || '';
    const germanText = germanTexts[key] || '[MISSING TRANSLATION]';
    
    // Determine context based on key path
    let context = '';
    if (key.includes('headlines')) context = 'PDF Header';
    else if (key.includes('intro')) context = 'Introduction';
    else if (key.includes('visaTypes')) context = 'Visa Type Label';
    else if (key.includes('requirements.sectionTitle')) context = 'Section Title';
    else if (key.includes('requirements.introText')) context = 'Intro Text';
    else if (key.includes('requirements.common')) context = 'Common Requirements';
    else if (key.includes('requirements.propertyInvestment')) context = 'Property Requirements';
    else if (key.includes('requirements.timeDeposit')) context = 'Time Deposit Requirements';
    else if (key.includes('requirements.skilledEmployee')) context = 'Employee Requirements';
    else if (key.includes('requirements.dependent')) context = 'Dependent Requirements';
    else if (key.includes('costSummary.titles')) context = 'Cost Summary Title';
    else if (key.includes('costSummary.descriptions')) context = 'Cost Description';
    else if (key.includes('costSummary.tableHeaders')) context = 'Table Header';
    else if (key.includes('costSummary.costItems')) context = 'Cost Item';
    else if (key.includes('signature')) context = 'Signature Section';
    else if (key.includes('costsBreakdown.explanations')) context = 'Service Explanation';
    else if (key.includes('costsBreakdown')) context = 'Cost Breakdown';
    else if (key.includes('dependentCosts')) context = 'Dependent Costs';
    else context = 'Other';
    
    // Add helpful notes
    let notes = '';
    if (englishText.includes('Golden Visa')) notes = 'Keep "Golden Visa" in English';
    else if (englishText.includes('AED')) notes = 'Keep "AED" unchanged';
    else if (englishText.includes('UAE')) notes = 'Keep "UAE" in English';
    else if (englishText.includes('Emirates ID')) notes = 'Keep "Emirates ID" in English';
    else if (englishText.includes('TME')) notes = 'Keep "TME" as company name';
    else if (englishText.includes('DLD')) notes = 'Keep "DLD" unchanged';
    else if (englishText.includes('NOC')) notes = 'Keep "NOC" or use standard German';
    else if (englishText.includes('[FUNCTION')) notes = 'Dynamic text - check parameters';
    else if (germanText === '[MISSING TRANSLATION]') notes = '⚠️ NEW - Needs translation';
    
    const row = worksheet.addRow({
      key: key,
      english: englishText,
      germanCurrent: germanText,
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
        fgColor: { argb: 'FFF5F5F5' }
      };
    }
    
    // Highlight missing translations
    if (germanText === '[MISSING TRANSLATION]') {
      row.getCell('germanCurrent').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFE0E0' }
      };
      row.getCell('germanCurrent').font = { color: { argb: 'FFCC0000' } };
    }
    
    // Set text wrapping
    row.getCell('english').alignment = { wrapText: true, vertical: 'top' };
    row.getCell('germanCurrent').alignment = { wrapText: true, vertical: 'top' };
    row.getCell('germanNew').alignment = { wrapText: true, vertical: 'top' };
    row.getCell('context').alignment = { vertical: 'top' };
    row.getCell('notes').alignment = { wrapText: true, vertical: 'top' };
    
    // Auto-adjust row height for long texts
    const maxLength = Math.max(englishText.length, germanText.length);
    if (maxLength > 200) {
      row.height = 80;
    } else if (maxLength > 100) {
      row.height = 60;
    } else if (maxLength > 50) {
      row.height = 40;
    } else {
      row.height = 25;
    }
  });
  
  // Add comprehensive instructions sheet
  const instructionSheet = workbook.addWorksheet('Instructions');
  instructionSheet.columns = [
    { header: 'Translation Instructions', key: 'instruction', width: 120 }
  ];
  
  instructionSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF243F7B' } };
  instructionSheet.getRow(1).height = 25;
  
  const instructions = [
    '📋 PROFESSIONAL TRANSLATION WORKFLOW FOR GOLDEN VISA DOCUMENTS',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '🎯 YOUR TASK:',
    '• Review AI-generated German translations and provide professional corrections',
    '• Focus on accuracy, formality, and consistency for official UAE documents',
    '• Total entries to review: ' + rowCount + ' translation strings',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '📝 HOW TO COMPLETE:',
    '1. Go to "Golden Visa Translations" tab',
    '2. Review each row\'s "Current German (AI)" column',
    '3. If correction needed → Type correct version in "New German (Human)" column',
    '4. If current translation is perfect → Leave "New German" column EMPTY',
    '5. Check "Notes" column for special instructions per entry',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '⚠️ CRITICAL TERMS - MUST KEEP IN ENGLISH:',
    '• Golden Visa (always)',
    '• UAE / United Arab Emirates',
    '• Emirates ID',
    '• TME / TME Services (company name)',
    '• DLD (Dubai Land Department)',
    '• GDRFA',
    '• AED (currency code)',
    '• NOC (or use: Unbedenklichkeitsbescheinigung)',
    '• Ejari (rental contract system)',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '🎨 STYLE GUIDELINES:',
    '• Use formal business German (Sie-form)',
    '• Match tone for official government documents',
    '• Numbers: Use German formatting (e.g., 2.000.000 not 2,000,000)',
    '• Dates: Use German format (TT.MM.JJJJ)',
    '• Keep technical terms consistent throughout',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '🔍 SPECIAL CASES:',
    '• [FUNCTION: ...] entries = Dynamic text with variables, maintain structure',
    '• [MISSING TRANSLATION] = New text needing translation from scratch',
    '• Red highlighted cells = Missing translations (priority)',
    '• Very long texts = Make sure German isn\'t significantly longer',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '✅ QUALITY CHECKLIST:',
    '□ All red cells addressed',
    '□ Terminology consistent across document',
    '□ English terms kept where noted',
    '□ Formal tone maintained',
    '□ No typos or grammatical errors',
    '□ Abbreviations explained on first use',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '💾 WHEN COMPLETE:',
    '1. Save file as: golden-visa-translations-completed.xlsx',
    '2. Return file via email',
    '3. Include any questions or concerns in email',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '📧 QUESTIONS?',
    'Add comments in the Notes column and we will review together.',
    'For urgent clarifications, please email back.',
    '',
    'Thank you for ensuring professional quality translations!'
  ];
  
  instructions.forEach((instruction) => {
    const row = instructionSheet.addRow({ instruction });
    
    if (instruction.startsWith('📋') || instruction.startsWith('🎯') || 
        instruction.startsWith('📝') || instruction.startsWith('⚠️') ||
        instruction.startsWith('🎨') || instruction.startsWith('🔍') ||
        instruction.startsWith('✅') || instruction.startsWith('💾') ||
        instruction.startsWith('📧')) {
      row.font = { bold: true, size: 12 };
      row.height = 20;
    } else if (instruction.startsWith('━')) {
      row.font = { color: { argb: 'FF999999' } };
      row.height = 15;
    } else if (instruction.startsWith('•') || instruction.startsWith('□')) {
      row.height = 18;
    }
  });
  
  // Add statistics sheet
  const statsSheet = workbook.addWorksheet('Statistics');
  statsSheet.columns = [
    { header: 'Category', key: 'category', width: 40 },
    { header: 'Count', key: 'count', width: 15 },
    { header: 'Percentage', key: 'percentage', width: 15 },
    { header: 'Description', key: 'description', width: 60 }
  ];
  
  statsSheet.getRow(1).font = { bold: true };
  statsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD2BC99' }
  };
  
  // Calculate statistics
  const stats = {};
  sortedKeys.forEach(key => {
    const category = key.split('.')[0];
    stats[category] = (stats[category] || 0) + 1;
  });
  
  const categoryDescriptions = {
    'headlines': 'Document headers and main titles',
    'intro': 'Introduction paragraphs and greetings',
    'visaTypes': 'Visa type labels and categories',
    'requirements': 'All visa requirements and eligibility criteria',
    'costSummary': 'Cost summaries and pricing tables',
    'signature': 'Signature section and agreements',
    'costsBreakdown': 'Detailed cost breakdowns and explanations',
    'dependentCosts': 'Dependent-specific cost information'
  };
  
  Object.entries(stats).forEach(([category, count]) => {
    statsSheet.addRow({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count: count,
      percentage: ((count / rowCount) * 100).toFixed(1) + '%',
      description: categoryDescriptions[category] || 'Other text elements'
    });
  });
  
  // Add total row
  const totalRow = statsSheet.addRow({
    category: 'TOTAL',
    count: rowCount,
    percentage: '100%',
    description: 'Total translation entries in document'
  });
  totalRow.font = { bold: true };
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEEEEEE' }
  };
  
  // Save the workbook
  const outputPath = path.join(__dirname, '../golden-visa-translations-FULL.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  
  console.log('✅ FULL Export Complete!\n');
  console.log(`📁 Excel file created: golden-visa-translations-FULL.xlsx`);
  console.log(`📊 Statistics:`);
  console.log(`   • Total entries: ${rowCount}`);
  console.log(`   • Categories: ${Object.keys(stats).length}`);
  console.log(`   • Worksheets: 3 (Translations, Instructions, Statistics)`);
  console.log('\n📨 Next steps:');
  console.log('1. Send "golden-visa-translations-FULL.xlsx" to your translator');
  console.log('2. Translator reviews ALL entries and provides corrections');
  console.log('3. Import completed file with: npm run import-translations');
  console.log('\n⏱️  Estimated translation time: 2-4 hours for professional review');
  console.log('💡 Tip: Ask translator to prioritize red-highlighted missing translations\n');
}

// Run the export
exportAllTranslations().catch(error => {
  console.error('❌ Export failed:', error);
  console.error('\nTry running: npm install exceljs');
  process.exit(1);
});