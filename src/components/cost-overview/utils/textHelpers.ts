/**
 * Shared text utility functions for cost overview components
 */

/**
 * Returns singular or plural form of "visa" based on count
 */
export const getVisaText = (count: number): string => {
  return count === 1 ? 'visa' : 'visas';
};

/**
 * Returns singular or plural form of "activity" based on count
 */
export const getActivityText = (count: number): string => {
  return count === 1 ? 'activity' : 'activities';
};

/**
 * Generates a clean key for React list items based on description
 */
export const generateListItemKey = (prefix: string, index: number, description: string): string => {
  const cleanDescription = description.substring(0, 20).replace(/\s+/g, '-');
  return `${prefix}-${index}-${cleanDescription}`;
};

/**
 * Formats service description with numbering
 */
export const formatServiceDescription = (serviceNumber: number, description: string): string => {
  return `${serviceNumber}. ${description}`;
}; 