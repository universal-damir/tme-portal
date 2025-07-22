import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency (AED)
 */
export function formatCurrency(amount: number, currency: string = 'AED'): string {
  return `${currency} ${amount.toLocaleString()}`
}

/**
 * Format a date string to DD/MM/YYYY format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB')
}

/**
 * Format a date string to DD.MM.YYYY format
 */
export function formatDateDDMMYYYY(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB').replace(/\//g, '.')
}
