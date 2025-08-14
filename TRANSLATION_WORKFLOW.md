# Translation Workflow Guide

## Overview
This system allows you to export all text from the TME Portal to Excel, send it to a human translator, and import the corrected translations back into the system.

## Complete Workflow

### Step 1: Export Translations (You)
```bash
node scripts/translation-export-excel-simple.js
```
This creates `golden-visa-translations.xlsx` with:
- **Key**: Reference ID for each text
- **English**: Original English text
- **Current German (AI)**: Existing AI-generated German translation
- **New German (Human)**: Empty column for translator to fill
- **Context**: Where this text appears
- **Notes**: Special instructions

### Step 2: Send to Translator
1. Email the `golden-visa-translations.xlsx` file to your translator
2. Include these instructions:
   - Review "Current German (AI)" column
   - If correction needed, type correct version in "New German (Human)" column
   - If current translation is good, leave "New German" empty
   - Keep these terms in English: Golden Visa, UAE, Emirates ID, TME, AED

### Step 3: Translator Works (Offline)
The translator:
- Opens Excel file
- Reviews each German translation
- Fills "New German" column ONLY where changes are needed
- Saves file with same name

### Step 4: Import Translations (You)
```bash
npm run import-translations
```
This will:
- Read the Excel file
- Update only the changed translations
- Create a backup of old translations
- Generate a change log

### Step 5: Test the Updates
1. Go to Golden Visa tab
2. Long-press the Preview button to reveal German option
3. Click "German Preview 🇩🇪"
4. Review the PDF with new translations

## File Locations

- **Excel file**: `golden-visa-translations.xlsx` (in project root)
- **Translation code**: `src/lib/pdf-generator/translations/golden-visa.ts`
- **Backup files**: Auto-created with timestamp
- **Change log**: `translation-changes.log`

## How It Works Behind the Scenes

1. **Export Process**:
   - Reads the TypeScript translation file
   - Extracts English and German texts
   - Creates structured Excel with formatting
   - Adds instructions sheet for translator

2. **Import Process**:
   - Reads completed Excel file
   - Compares "New German" with "Current German"
   - Updates only changed entries in code
   - Preserves code structure and formatting

## Scaling to Other Tabs

To add translation support to other tabs (Cost Overview, Company Services, etc.):

### 1. Create Translation File
```typescript
// src/lib/pdf-generator/translations/cost-overview.ts
export const COST_OVERVIEW_TRANSLATIONS = {
  en: { /* English texts */ },
  de: { /* German texts */ }
};
```

### 2. Create Export Script
Copy `translation-export-excel-simple.js` and modify:
- Change file paths
- Update translation keys
- Adjust context descriptions

### 3. Create Import Script
Copy `translation-import-excel.js` and modify:
- Change target file path
- Update regex patterns if needed

### 4. Add Language Toggle
Add language selection UI to the tab (like Golden Visa's hidden button)

## Tips for Success

### For You:
- Always test with a small batch first
- Keep backups (auto-created)
- Review change logs after import
- Test PDFs after each import

### For Translator:
- Only fill "New German" if change needed
- Keep special terms in English
- Maintain consistency across similar terms
- Ask questions in Notes column

## Troubleshooting

**Excel file won't open:**
- Make sure you have Excel or Google Sheets
- File might be corrupted - regenerate it

**Import not working:**
- Check Excel file has correct sheet names
- Ensure "New German" column has text (not formulas)
- File must be saved as .xlsx format

**Translations not showing:**
- Clear browser cache
- Restart development server
- Check console for errors

## Quick Test Process

1. Export current translations:
```bash
node scripts/translation-export-excel-simple.js
```

2. Open Excel, change one entry in "New German" column

3. Import changes:
```bash
npm run import-translations
```

4. Generate PDF and verify change appears

## Support

If you need help:
- Check the change log: `translation-changes.log`
- Review backups in: `src/lib/pdf-generator/translations/`
- Test with simplified export first

## Next Steps

Once this workflow is tested and working:
1. We can export ALL translations (not just test batch)
2. Apply same system to other tabs
3. Consider using professional translation management tools for larger scale