// Formatting utilities extracted from the original PDF generator
import { formatCurrency, formatDate, formatDateDDMMYYYY } from '@/lib/utils';

// Re-export the existing utility functions
export { formatCurrency, formatDate, formatDateDDMMYYYY };

// formatNumber function extracted from the original OfferDocument component (line 484-486)
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// Helper function for visa text pluralization
export const getVisaText = (count: number): string => {
  return count === 1 ? 'visa' : 'visas';
};

// Helper function for activity text pluralization  
export const getActivityText = (count: number): string => {
  return count === 1 ? 'activity' : 'activities';
};

// Helper function to clean authority name for filename
export const cleanAuthorityName = (authorityName: string): string => {
  return authorityName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
};

// Helper function to format date as YYMMDD for filename
export const formatDateForFilename = (date: Date): string => {
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  return `${yy}${mm}${dd}`;
}; 