// Helper to dynamically load the translations
// This file will be required by the export/import scripts

const GOLDEN_VISA_TRANSLATIONS = {
  en: require('../src/lib/pdf-generator/translations/golden-visa-en.json'),
  de: require('../src/lib/pdf-generator/translations/golden-visa-de.json')
};

module.exports = { GOLDEN_VISA_TRANSLATIONS };