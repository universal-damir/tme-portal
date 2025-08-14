#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and parse the TypeScript file as text
const translationPath = path.join(__dirname, '../src/lib/pdf-generator/translations/golden-visa.ts');
const fileContent = fs.readFileSync(translationPath, 'utf8');

// Manual extraction of translations
function extractTranslations(content) {
  const results = { en: {}, de: {} };
  
  // This is a simplified extraction - in practice we'd use AST parsing
  // But for now, let's extract the major sections we know exist
  
  // Extract English translations
  const enSection = content.match(/en: \{([\s\S]*?)\n  \},\n  de:/);
  const deSection = content.match(/de: \{([\s\S]*?)\n  \}\n\}/);
  
  if (!enSection || !deSection) {
    console.error('Could not find translation sections');
    return results;
  }
  
  // Parse each section
  function parseSection(sectionText, lang) {
    const lines = sectionText.split('\n');
    let currentPath = [];
    let depth = 0;
    
    lines.forEach(line => {
      // Count indentation to track nesting
      const indent = line.match(/^(\s*)/)[1].length;
      const newDepth = Math.floor(indent / 2);
      
      // Adjust path based on depth
      if (newDepth < depth) {
        currentPath = currentPath.slice(0, newDepth);
      }
      depth = newDepth;
      
      // Extract key-value pairs
      const keyValueMatch = line.match(/^\s*([a-zA-Z0-9_\-']+):\s*['"](.*)['"],?$/);
      if (keyValueMatch) {
        const key = keyValueMatch[1];
        const value = keyValueMatch[2];
        const fullKey = [...currentPath, key].join('.');
        results[lang][fullKey] = value;
      }
      
      // Track object nesting
      const objectMatch = line.match(/^\s*([a-zA-Z0-9_\-]+):\s*\{/);
      if (objectMatch) {
        currentPath[depth - 1] = objectMatch[1];
      }
    });
  }
  
  parseSection(enSection[1], 'en');
  parseSection(deSection[1], 'de');
  
  return results;
}

// Extract translations
console.log('📊 Extracting translations from TypeScript file...\n');
const translations = extractTranslations(fileContent);

// Count what we found
const enKeys = Object.keys(translations.en);
const deKeys = Object.keys(translations.de);

console.log(`Found ${enKeys.length} English translations`);
console.log(`Found ${deKeys.length} German translations\n`);

// If we got too few, alert the user
if (enKeys.length < 50) {
  console.log('⚠️  Warning: Found fewer translations than expected.');
  console.log('   The file may have complex nesting that requires manual review.\n');
}

// Create Excel file anyway with what we found
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Golden Visa Translations');

// Define columns
worksheet.columns = [
  { header: 'Key', key: 'key', width: 55 },
  { header: 'English', key: 'english', width: 75 },
  { header: 'Current German (AI)', key: 'germanCurrent', width: 75 },
  { header: 'New German (Human)', key: 'germanNew', width: 75 },
  { header: 'Status', key: 'status', width: 20 }
];

// Style header
worksheet.getRow(1).font = { bold: true };
worksheet.getRow(1).fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF243F7B' }
};
worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };

// Add translations
let matched = 0;
let missing = 0;

enKeys.sort().forEach((key, index) => {
  const english = translations.en[key];
  const german = translations.de[key];
  const hasGerman = german !== undefined;
  
  if (hasGerman) matched++;
  else missing++;
  
  const row = worksheet.addRow({
    key: key,
    english: english,
    germanCurrent: german || '',
    germanNew: '',
    status: hasGerman ? '✅' : '❌ Missing'
  });
  
  // Highlight missing
  if (!hasGerman) {
    row.getCell('status').font = { color: { argb: 'FFCC0000' } };
    row.getCell('germanCurrent').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFE0E0' }
    };
  }
  
  // Alternate row colors
  if (index % 2 === 0) {
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F8F8' }
    };
  }
});

// Save
const outputPath = path.join(__dirname, '../golden-visa-translations-CHECK.xlsx');
await workbook.xlsx.writeFile(outputPath);

console.log('✅ Export Complete!\n');
console.log(`📁 Created: golden-visa-translations-CHECK.xlsx`);
console.log(`\n📊 Summary:`);
console.log(`   • Total: ${enKeys.length} entries`);
console.log(`   • Matched: ${matched} have German`);
console.log(`   • Missing: ${missing} need translation`);

if (enKeys.length < 100) {
  console.log('\n⚠️  Note: This appears to be a partial export.');
  console.log('   For the complete translation file with all ~100+ entries,');
  console.log('   you may need to manually copy the translations from the');
  console.log('   TypeScript file into Excel, or wait for me to create');
  console.log('   a more sophisticated parser.\n');
} else {
  console.log('\n✨ Successfully exported all translations!\n');
}