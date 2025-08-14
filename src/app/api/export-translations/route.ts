import { NextResponse } from 'next/server';
import { GOLDEN_VISA_TRANSLATIONS } from '@/lib/pdf-generator/translations/golden-visa';

export async function GET() {
  // Flatten the translations object
  function flattenObject(obj: any, prefix = ''): any[] {
    const result: any[] = [];
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'string') {
          result.push({ key: fullKey, value });
        } else if (typeof value === 'function') {
          result.push({ 
            key: fullKey, 
            value: '[FUNCTION: ' + value.toString().substring(0, 50) + '...]',
            isFunction: true 
          });
        } else if (typeof value === 'object' && value !== null) {
          result.push(...flattenObject(value, fullKey));
        }
      }
    }
    
    return result;
  }
  
  const englishFlat = flattenObject(GOLDEN_VISA_TRANSLATIONS.en);
  const germanFlat = flattenObject(GOLDEN_VISA_TRANSLATIONS.de);
  
  // Create map for German lookups
  const germanMap: Record<string, string> = {};
  germanFlat.forEach(item => {
    germanMap[item.key] = item.value;
  });
  
  // Combine into final result
  const translations = englishFlat.map(enItem => ({
    key: enItem.key,
    english: enItem.value,
    german: germanMap[enItem.key] || '',
    hasGerman: !!germanMap[enItem.key],
    isFunction: enItem.isFunction || false
  }));
  
  return NextResponse.json({
    totalEntries: translations.length,
    withGerman: translations.filter(t => t.hasGerman).length,
    withoutGerman: translations.filter(t => !t.hasGerman && !t.isFunction).length,
    functions: translations.filter(t => t.isFunction).length,
    translations
  });
}