/**
 * Department phone numbers configuration
 * These are German landline numbers shared by all users in each department
 */

export const DEPARTMENT_PHONES: Record<string, string> = {
  'Company Setup': '+49 7634 3 50 86 64',
  'Accounting': '+49 7634 3 50 86 61',
  'Tax and Compliance': '+49 7634 3 50 86 63',
  'Client Support': '+49 7634 3 50 86 62',
  'IT': '+49 7634 3 50 86 62',
  'Marketing': '+49 7634 3 50 86 60',
  // Alternative spellings/variations
  'Tax & Compliance': '+49 7634 3 50 86 63',
  'Tax and compliance': '+49 7634 3 50 86 63',
  'tax and compliance': '+49 7634 3 50 86 63',
  'company setup': '+49 7634 3 50 86 64',
  'accounting': '+49 7634 3 50 86 61',
  'client support': '+49 7634 3 50 86 62',
  'it': '+49 7634 3 50 86 62',
  'marketing': '+49 7634 3 50 86 60'
};

/**
 * Get department phone number by department name
 * @param department - The department name
 * @returns The department phone number or undefined if not found
 */
export function getDepartmentPhone(department?: string): string | undefined {
  if (!department) return undefined;
  
  // Try exact match first
  if (DEPARTMENT_PHONES[department]) {
    return DEPARTMENT_PHONES[department];
  }
  
  // Try case-insensitive match
  const lowerDept = department.toLowerCase();
  if (DEPARTMENT_PHONES[lowerDept]) {
    return DEPARTMENT_PHONES[lowerDept];
  }
  
  // Try to find partial match (e.g., "Tax & Compliance" vs "Tax and Compliance")
  for (const [key, value] of Object.entries(DEPARTMENT_PHONES)) {
    if (key.toLowerCase().replace(/[&]/g, 'and').replace(/\s+/g, ' ') === 
        lowerDept.replace(/[&]/g, 'and').replace(/\s+/g, ' ')) {
      return value;
    }
  }
  
  return undefined;
}