import type { DBSchema } from 'idb';

/**
 * Expense record stored in the database
 */
export interface Expense {
  id?: number; // Auto-increment, optional for new records
  amount: number;
  description: string;
  category: string;
  date: Date;
  from?: string; // Parsed from PDF
  to?: string; // Parsed from PDF
  transactionType?: string; // Parsed from PDF
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Category for organizing expenses
 */
export interface Category {
  name: string;
  icon?: string;
  color?: string;
}

/**
 * Type for creating new expenses (without auto-generated fields)
 */
export type NewExpense = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Type for expense updates (all fields optional except id)
 */
export type ExpenseUpdate = Partial<Omit<Expense, 'id'>>;

/**
 * IndexedDB schema definition
 */
export interface ExpenseTrackerDB extends DBSchema {
  expenses: {
    key: number;
    value: Expense;
    indexes: {
      'by-date': Date;
      'by-category': string;
      'by-amount': number;
      'by-created': Date;
    };
  };
  categories: {
    key: string;
    value: Category;
  };
  settings: {
    key: string;
    value: unknown;
  };
}

/**
 * Filter options for querying expenses
 */
export interface ExpenseFilter {
  category?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Time period for filtering expenses
 */
export type TimePeriod = 'week' | 'month' | 'year';

/**
 * Parsed data from bank receipt PDF
 */
export interface BankReceiptData {
  from?: string;
  to?: string;
  amount?: string;
  transactionType?: string;
  date?: string;
}
