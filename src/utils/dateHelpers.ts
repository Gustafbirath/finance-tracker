import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
  isValid,
} from 'date-fns';
import type { TimePeriod } from '../types/expense';

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, formatString: string = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/**
 * Format a date as a short date (e.g., "Jan 15")
 */
export function formatShortDate(date: Date | string): string {
  return formatDate(date, 'MMM d');
}

/**
 * Format a date as a full date (e.g., "January 15, 2025")
 */
export function formatLongDate(date: Date | string): string {
  return formatDate(date, 'MMMM d, yyyy');
}

/**
 * Format a date as time (e.g., "3:45 PM")
 */
export function formatTime(date: Date | string): string {
  return formatDate(date, 'h:mm a');
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
  }).format(amount);
}

/**
 * Get date range for a given time period
 */
export function getDateRangeForPeriod(period: TimePeriod): { startDate: Date; endDate: Date } {
  const now = new Date();

  switch (period) {
    case 'week':
      return {
        startDate: startOfWeek(now),
        endDate: endOfWeek(now),
      };
    case 'month':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };
    case 'year':
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now),
      };
    default:
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };
  }
}

/**
 * Parse a date string from various formats
 */
export function parseDate(dateString: string): Date | null {
  // Try common date formats
  const formats = [
    /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/, // MM/DD/YYYY or MM-DD-YYYY
    /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/, // YYYY-MM-DD
  ];

  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      let year: number, month: number, day: number;

      if (format === formats[0]) {
        // MM/DD/YYYY or MM-DD-YYYY
        month = parseInt(match[1], 10);
        day = parseInt(match[2], 10);
        year = parseInt(match[3], 10);

        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
      } else {
        // YYYY-MM-DD
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        day = parseInt(match[3], 10);
      }

      const date = new Date(year, month - 1, day);
      if (isValid(date)) {
        return date;
      }
    }
  }

  // Try ISO date
  const isoDate = parseISO(dateString);
  if (isValid(isoDate)) {
    return isoDate;
  }

  return null;
}

/**
 * Parse amount from string (handles both US and Swedish formats)
 */
export function parseAmount(amountString: string): number | null {
  if (!amountString) return null;

  // Remove currency symbols and "kr"
  let cleaned = amountString.replace(/[$kr\s]/gi, '').trim();

  // Detect format: Swedish uses comma as decimal separator
  // If there's a comma followed by exactly 2 digits at the end, it's Swedish decimal format
  if (/,\d{2}$/.test(cleaned)) {
    // Swedish format: replace comma with period for decimal
    cleaned = cleaned.replace(/\s/g, '').replace(',', '.');
  } else {
    // US format or no decimals: remove commas (thousands separator)
    cleaned = cleaned.replace(/,/g, '');
  }

  const amount = parseFloat(cleaned);

  if (isNaN(amount)) {
    return null;
  }

  return amount;
}
