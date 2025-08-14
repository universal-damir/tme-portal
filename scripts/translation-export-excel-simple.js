#!/usr/bin/env node

/**
 * Simplified Translation Export to Excel for Golden Visa
 * Creates an Excel file with all translations for human review/correction
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

// Main export function
async function exportTranslations() {
  console.log('📊 Starting Golden Visa translation export to Excel...\n');
  
  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Golden Visa Translations');
  
  // Define columns
  worksheet.columns = [
    { header: 'Key', key: 'key', width: 45 },
    { header: 'English', key: 'english', width: 65 },
    { header: 'Current German (AI)', key: 'germanCurrent', width: 65 },
    { header: 'New German (Human)', key: 'germanNew', width: 65 },
    { header: 'Context', key: 'context', width: 30 },
    { header: 'Notes', key: 'notes', width: 35 }
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
  
  // Sample translations data (key portions for testing)
  const translations = [
    // Headlines
    {
      key: 'headlines.propertyInvestment',
      english: 'Golden Visa (10 Years) Property Investment',
      germanCurrent: 'Golden Visa (10 Jahre) Immobilieninvestition',
      context: 'PDF Header',
      notes: 'Keep "Golden Visa" in English'
    },
    {
      key: 'headlines.timeDeposit',
      english: 'Golden Visa (10 Years) Time Deposit',
      germanCurrent: 'Golden Visa (10 Jahre) Termineinlage',
      context: 'PDF Header',
      notes: 'Keep "Golden Visa" in English'
    },
    {
      key: 'headlines.skilledEmployee',
      english: 'Golden Visa (10 Years) Skilled Employee',
      germanCurrent: 'Golden Visa (10 Jahre) Qualifizierte Fachkraft',
      context: 'PDF Header',
      notes: 'Keep "Golden Visa" in English'
    },
    {
      key: 'headlines.dependent',
      english: 'Golden Visa (10 Years) Dependent',
      germanCurrent: 'Golden Visa (10 Jahre) Angehörige',
      context: 'PDF Header',
      notes: 'Keep "Golden Visa" in English'
    },
    
    // Introduction texts
    {
      key: 'intro.standard',
      english: 'We are pleased to share a personalized proposal for your Golden Visa application. This document provides a transparent breakdown of costs and fees based on the requirements.',
      germanCurrent: 'Wir freuen uns, Ihnen einen personalisierten Vorschlag für Ihren Golden Visa Antrag zu unterbreiten. Dieses Dokument bietet eine transparente Aufschlüsselung der Kosten und Gebühren basierend auf den Anforderungen.',
      context: 'Introduction Text',
      notes: 'Formal business tone'
    },
    
    // Visa Types
    {
      key: 'visaTypes.property-investment',
      english: 'Property Investment',
      germanCurrent: 'Immobilieninvestition',
      context: 'Visa Type Label',
      notes: ''
    },
    {
      key: 'visaTypes.time-deposit',
      english: 'Time Deposit',
      germanCurrent: 'Termineinlage',
      context: 'Visa Type Label',
      notes: ''
    },
    {
      key: 'visaTypes.skilled-employee',
      english: 'Skilled Employee',
      germanCurrent: 'Qualifizierte Fachkraft',
      context: 'Visa Type Label',
      notes: ''
    },
    
    // Requirements section
    {
      key: 'requirements.sectionTitle',
      english: 'Visa Requirements & Eligibility',
      germanCurrent: 'Visa-Anforderungen & Berechtigung',
      context: 'Section Title',
      notes: ''
    },
    {
      key: 'requirements.common.processingTime',
      english: 'Processing time',
      germanCurrent: 'Bearbeitungszeit',
      context: 'Requirement Label',
      notes: ''
    },
    {
      key: 'requirements.common.processingTimeText',
      english: 'Approximately 10 - 15 working days. The applicant must be in the UAE to start the visa process and must remain in the UAE throughout the entire processing period.',
      germanCurrent: 'Etwa 10 - 15 Werktage. Der Antragsteller muss sich in den VAE befinden, um den Visa-Prozess zu beginnen und muss während der gesamten Bearbeitungsdauer in den VAE bleiben.',
      context: 'Requirement Details',
      notes: 'Keep "UAE" in English'
    },
    {
      key: 'requirements.common.healthInsurance',
      english: 'Health insurance',
      germanCurrent: 'Krankenversicherung',
      context: 'Requirement Label',
      notes: ''
    },
    {
      key: 'requirements.common.medicalEmirates',
      english: 'Medical test & Emirates ID',
      germanCurrent: 'Medizinische Untersuchung & Emirates ID',
      context: 'Requirement Label',
      notes: 'Keep "Emirates ID" in English'
    },
    
    // Cost Summary
    {
      key: 'costSummary.titles.propertyInvestment',
      english: 'Property Investment Golden Visa Summary',
      germanCurrent: 'Golden Visa Immobilieninvestition Zusammenfassung',
      context: 'Summary Title',
      notes: 'Keep "Golden Visa" in English'
    },
    {
      key: 'costSummary.tableHeaders.description',
      english: 'Description',
      germanCurrent: 'Beschreibung',
      context: 'Table Header',
      notes: ''
    },
    {
      key: 'costSummary.tableHeaders.aed',
      english: 'AED',
      germanCurrent: 'AED',
      context: 'Table Header',
      notes: 'Keep currency code unchanged'
    },
    {
      key: 'costSummary.tableHeaders.total',
      english: 'Total',
      germanCurrent: 'Gesamt',
      context: 'Table Header',
      notes: ''
    },
    {
      key: 'costSummary.costItems.authorityCosts',
      english: 'Golden Visa authority costs',
      germanCurrent: 'Golden Visa Behördenkosten',
      context: 'Cost Item',
      notes: 'Keep "Golden Visa" in English'
    },
    {
      key: 'costSummary.costItems.tmeServices',
      english: 'TME Services professional fee',
      germanCurrent: 'TME Services Beratungsgebühr',
      context: 'Cost Item',
      notes: 'Keep "TME Services" unchanged'
    },
    
    // Signature section
    {
      key: 'signature.signatureLabel',
      english: 'Signature',
      germanCurrent: 'Unterschrift',
      context: 'Signature Label',
      notes: ''
    },
    
    // Service explanations
    {
      key: 'costsBreakdown.pageTitle',
      english: 'Golden Visa Cost Breakdown',
      germanCurrent: 'Golden Visa Kostenaufschlüsselung',
      context: 'Page Title',
      notes: 'Keep "Golden Visa" in English'
    },
    {
      key: 'costsBreakdown.serviceExplanations',
      english: 'Service Explanations',
      germanCurrent: 'Service-Erklärungen',
      context: 'Section Title',
      notes: ''
    },
    {
      key: 'costsBreakdown.explanations.emiratesIdFee',
      english: 'Emirates ID Fee: For issuance of the mandatory Emirates ID card for all UAE residents.',
      germanCurrent: 'Emirates ID-Gebühr: Für die Ausstellung der obligatorischen Emirates ID-Karte für alle VAE-Einwohner.',
      context: 'Service Description',
      notes: 'Keep "Emirates ID" and "UAE" in English'
    }
  ];
  
  // Add rows to worksheet
  let rowCount = 0;
  translations.forEach((translation, index) => {
    const row = worksheet.addRow({
      key: translation.key,
      english: translation.english,
      germanCurrent: translation.germanCurrent,
      germanNew: '', // Empty for translator to fill
      context: translation.context,
      notes: translation.notes
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
    
    // Set text wrapping for long content
    row.getCell('english').alignment = { wrapText: true, vertical: 'top' };
    row.getCell('germanCurrent').alignment = { wrapText: true, vertical: 'top' };
    row.getCell('germanNew').alignment = { wrapText: true, vertical: 'top' };
    row.getCell('context').alignment = { vertical: 'top' };
    row.getCell('notes').alignment = { vertical: 'top' };
    
    // Adjust row height for longer texts
    if (translation.english.length > 100 || translation.germanCurrent.length > 100) {
      row.height = 60;
    } else if (translation.english.length > 50 || translation.germanCurrent.length > 50) {
      row.height = 40;
    }
  });
  
  // Add instructions sheet
  const instructionSheet = workbook.addWorksheet('Instructions');
  instructionSheet.columns = [
    { header: 'Instructions for Translator', key: 'instruction', width: 100 }
  ];
  
  // Style instructions header
  instructionSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF243F7B' } };
  
  const instructions = [
    '📋 TRANSLATION WORKFLOW',
    '',
    '1. Review the "Current German (AI)" column - this is the AI-generated translation',
    '2. If translation needs correction, type the correct version in "New German (Human)" column',
    '3. If current translation is already perfect, leave "New German" column EMPTY',
    '4. Pay attention to the "Notes" column for special instructions',
    '',
    '⚠️ IMPORTANT TERMS TO KEEP IN ENGLISH:',
    '• Golden Visa (always keep in English)',
    '• UAE (United Arab Emirates)',
    '• Emirates ID',
    '• TME / TME Services (company name)',
    '• DLD (Dubai Land Department)',
    '• AED (currency code)',
    '• NOC (No Objection Certificate)',
    '',
    '💡 TIPS:',
    '• Use formal business German suitable for official documents',
    '• Maintain consistency - if you translate a term one way, use it consistently',
    '• For legal/official terms, use standard German business terminology',
    '• Numbers and dates should follow German formatting conventions',
    '',
    '✅ WHEN COMPLETE:',
    '• Save the file with the same name: golden-visa-translations.xlsx',
    '• Return the file for automatic import into the system',
    '',
    'Questions? Add them in the Notes column and we\'ll review together.'
  ];
  
  instructions.forEach((instruction, index) => {
    const row = instructionSheet.addRow({ instruction });
    if (instruction.startsWith('📋') || instruction.startsWith('⚠️') || 
        instruction.startsWith('💡') || instruction.startsWith('✅')) {
      row.font = { bold: true, size: 12 };
      row.height = 20;
    }
  });
  
  // Add summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Category', key: 'category', width: 30 },
    { header: 'Count', key: 'count', width: 15 },
    { header: 'Description', key: 'description', width: 60 }
  ];
  
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD2BC99' }
  };
  
  const summary = [
    { category: 'Total Entries', count: rowCount, description: 'Total number of text strings to review' },
    { category: 'Headers & Titles', count: 8, description: 'Document headers and section titles' },
    { category: 'Requirements', count: 5, description: 'Visa requirement descriptions' },
    { category: 'Cost Items', count: 6, description: 'Cost breakdown and fee descriptions' },
    { category: 'Other', count: 6, description: 'Labels, buttons, and miscellaneous text' }
  ];
  
  summary.forEach(item => {
    summarySheet.addRow(item);
  });
  
  // Save the workbook
  const outputPath = path.join(__dirname, '../golden-visa-translations.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  
  console.log('✅ Export complete!\n');
  console.log(`📁 Excel file created: golden-visa-translations.xlsx`);
  console.log(`📊 ${rowCount} translation entries exported for review`);
  console.log('\n📨 Next steps:');
  console.log('1. Send "golden-visa-translations.xlsx" to your translator');
  console.log('2. Translator reviews "Current German (AI)" column');
  console.log('3. Translator fills "New German (Human)" column only where changes needed');
  console.log('4. Get file back and run: npm run import-translations');
  console.log('\n💡 Note: This is a TEST export with key translations.');
  console.log('   Once workflow is confirmed, we can export ALL translations.\n');
}

// Run the export
exportTranslations().catch(error => {
  console.error('❌ Export failed:', error);
  process.exit(1);
});