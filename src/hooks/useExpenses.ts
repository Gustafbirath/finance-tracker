import { useState, useEffect, useCallback, useRef } from 'react';
import type { Expense, ExpenseFilter, Category, TimePeriod } from '../types/expense';
import * as db from '../services/database';
import { getDateRangeForPeriod } from '../utils/dateHelpers';

interface UseExpensesResult {
  expenses: Expense[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<number>;
  updateExpense: (id: number, updates: Partial<Omit<Expense, 'id'>>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  filterExpenses: (filter: ExpenseFilter) => Promise<void>;
  filterByPeriod: (period: TimePeriod) => Promise<void>;
  filterByCategory: (category: string) => Promise<void>;
  clearFilters: () => Promise<void>;
  refreshExpenses: () => Promise<void>;
}

/**
 * Custom hook for managing expenses
 */
export function useExpenses(): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentFilterRef = useRef<ExpenseFilter>({});

  // Load expenses with current filter
  const loadExpenses = useCallback(async (filter?: ExpenseFilter) => {
    try {
      setLoading(true);
      setError(null);

      const filterToUse = filter !== undefined ? filter : currentFilterRef.current;

      const expenseData = Object.keys(filterToUse).length > 0
        ? await db.getFilteredExpenses(filterToUse)
        : await db.getAllExpenses();

      // Sort by date (newest first)
      expenseData.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      setExpenses(expenseData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load expenses';
      setError(errorMessage);
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const categoryData = await db.getAllCategories();
      setCategories(categoryData);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }, []);

  // Initial load - only once
  useEffect(() => {
    loadExpenses();
    loadCategories();
  }, []); // Empty dependency array - only run once

  // Add expense
  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt'>): Promise<number> => {
    try {
      const id = await db.addExpense(expense);
      await loadExpenses();
      return id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add expense';
      setError(errorMessage);
      throw err;
    }
  }, [loadExpenses]);

  // Update expense
  const updateExpense = useCallback(async (id: number, updates: Partial<Omit<Expense, 'id'>>): Promise<void> => {
    try {
      await db.updateExpense(id, updates);
      await loadExpenses();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update expense';
      setError(errorMessage);
      throw err;
    }
  }, [loadExpenses]);

  // Delete expense
  const deleteExpense = useCallback(async (id: number): Promise<void> => {
    try {
      await db.deleteExpense(id);
      await loadExpenses();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete expense';
      setError(errorMessage);
      throw err;
    }
  }, [loadExpenses]);

  // Filter expenses
  const filterExpenses = useCallback(async (filter: ExpenseFilter): Promise<void> => {
    currentFilterRef.current = filter;
    await loadExpenses(filter);
  }, [loadExpenses]);

  // Filter by time period
  const filterByPeriod = useCallback(async (period: TimePeriod): Promise<void> => {
    const { startDate, endDate } = getDateRangeForPeriod(period);
    const filter: ExpenseFilter = {
      ...currentFilterRef.current,
      startDate,
      endDate,
    };
    currentFilterRef.current = filter;
    await loadExpenses(filter);
  }, [loadExpenses]);

  // Filter by category
  const filterByCategory = useCallback(async (category: string): Promise<void> => {
    const filter: ExpenseFilter = {
      ...currentFilterRef.current,
      category: category === 'all' ? undefined : category,
    };
    currentFilterRef.current = filter;
    await loadExpenses(filter);
  }, [loadExpenses]);

  // Clear all filters
  const clearFilters = useCallback(async (): Promise<void> => {
    currentFilterRef.current = {};
    await loadExpenses({});
  }, [loadExpenses]);

  // Refresh expenses
  const refreshExpenses = useCallback(async (): Promise<void> => {
    await loadExpenses();
  }, [loadExpenses]);

  return {
    expenses,
    categories,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    filterExpenses,
    filterByPeriod,
    filterByCategory,
    clearFilters,
    refreshExpenses,
  };
}
