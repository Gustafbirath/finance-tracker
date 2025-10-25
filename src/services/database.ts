import { openDB, type IDBPDatabase } from 'idb';
import type { ExpenseTrackerDB, Expense, Category, ExpenseFilter } from '../types/expense';

const DB_NAME = 'expense-tracker-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<ExpenseTrackerDB> | null = null;

/**
 * Initialize and return the database instance
 */
export async function getDatabase(): Promise<IDBPDatabase<ExpenseTrackerDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<ExpenseTrackerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create expenses store with auto-increment ID
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', {
          keyPath: 'id',
          autoIncrement: true,
        });

        // Create indexes for efficient filtering
        expenseStore.createIndex('by-date', 'date', { unique: false });
        expenseStore.createIndex('by-category', 'category', { unique: false });
        expenseStore.createIndex('by-amount', 'amount', { unique: false });
        expenseStore.createIndex('by-created', 'createdAt', { unique: false });
      }

      // Create categories store
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', {
          keyPath: 'name',
        });
      }

      // Create settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });

  // Initialize default categories
  await initializeDefaultCategories(dbInstance);

  return dbInstance;
}

/**
 * Initialize default expense categories
 */
async function initializeDefaultCategories(db: IDBPDatabase<ExpenseTrackerDB>): Promise<void> {
  const defaultCategories: Category[] = [
    { name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B' },
    { name: 'Transportation', icon: 'car', color: '#4ECDC4' },
    { name: 'Shopping', icon: 'shopping', color: '#FFE66D' },
    { name: 'Entertainment', icon: 'entertainment', color: '#95E1D3' },
    { name: 'Bills & Utilities', icon: 'receipt', color: '#F38181' },
    { name: 'Healthcare', icon: 'health', color: '#AA96DA' },
    { name: 'Other', icon: 'more', color: '#FCBAD3' },
  ];

  const tx = db.transaction('categories', 'readwrite');

  for (const category of defaultCategories) {
    const existing = await tx.store.get(category.name);
    if (!existing) {
      await tx.store.put(category);
    }
  }

  await tx.done;
}

// CRUD Operations for Expenses

/**
 * Add a new expense to the database
 */
export async function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<number> {
  const db = await getDatabase();
  const tx = db.transaction('expenses', 'readwrite');

  const expenseWithTimestamp: Omit<Expense, 'id'> = {
    ...expense,
    createdAt: new Date(),
  };

  const id = await tx.store.add(expenseWithTimestamp);
  await tx.done;

  return id;
}

/**
 * Get an expense by ID
 */
export async function getExpense(id: number): Promise<Expense | undefined> {
  const db = await getDatabase();
  return await db.get('expenses', id);
}

/**
 * Get all expenses
 */
export async function getAllExpenses(): Promise<Expense[]> {
  const db = await getDatabase();
  return await db.getAll('expenses');
}

/**
 * Update an existing expense
 */
export async function updateExpense(id: number, updates: Partial<Omit<Expense, 'id'>>): Promise<Expense> {
  const db = await getDatabase();
  const tx = db.transaction('expenses', 'readwrite');

  const existing = await tx.store.get(id);

  if (!existing) {
    throw new Error(`Expense with id ${id} not found`);
  }

  const updated: Expense = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };

  await tx.store.put(updated);
  await tx.done;

  return updated;
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: number): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction('expenses', 'readwrite');
  await tx.store.delete(id);
  await tx.done;
}

/**
 * Get expenses filtered by category
 */
export async function getExpensesByCategory(category: string): Promise<Expense[]> {
  const db = await getDatabase();
  const tx = db.transaction('expenses', 'readonly');
  const index = tx.store.index('by-category');
  return await index.getAll(category);
}

/**
 * Get expenses filtered by date range
 */
export async function getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
  const db = await getDatabase();
  const range = IDBKeyRange.bound(startDate, endDate);
  const tx = db.transaction('expenses', 'readonly');
  const index = tx.store.index('by-date');

  return await index.getAll(range);
}

/**
 * Get expenses with advanced filtering
 */
export async function getFilteredExpenses(filter: ExpenseFilter): Promise<Expense[]> {
  await getDatabase();
  let expenses: Expense[];

  // Start with the most specific filter
  if (filter.startDate && filter.endDate) {
    expenses = await getExpensesByDateRange(filter.startDate, filter.endDate);
  } else if (filter.category) {
    expenses = await getExpensesByCategory(filter.category);
  } else {
    expenses = await getAllExpenses();
  }

  // Apply additional filters
  return expenses.filter((expense) => {
    if (filter.category && expense.category !== filter.category) {
      return false;
    }

    if (filter.startDate && expense.date < filter.startDate) {
      return false;
    }

    if (filter.endDate && expense.date > filter.endDate) {
      return false;
    }

    if (filter.minAmount !== undefined && expense.amount < filter.minAmount) {
      return false;
    }

    if (filter.maxAmount !== undefined && expense.amount > filter.maxAmount) {
      return false;
    }

    return true;
  });
}

// Category Operations

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<Category[]> {
  const db = await getDatabase();
  return await db.getAll('categories');
}

/**
 * Add a new category
 */
export async function addCategory(category: Category): Promise<void> {
  const db = await getDatabase();
  await db.put('categories', category);
}

/**
 * Delete a category
 */
export async function deleteCategory(name: string): Promise<void> {
  const db = await getDatabase();
  await db.delete('categories', name);
}

// Settings Operations

/**
 * Get a setting value
 */
export async function getSetting<T>(key: string): Promise<T | undefined> {
  const db = await getDatabase();
  return await db.get('settings', key) as T | undefined;
}

/**
 * Set a setting value
 */
export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getDatabase();
  await db.put('settings', value, key);
}

/**
 * Clear all expenses (for testing/reset)
 */
export async function clearAllExpenses(): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction('expenses', 'readwrite');
  await tx.store.clear();
  await tx.done;
}
