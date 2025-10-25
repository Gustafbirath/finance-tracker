import { useState } from 'react';
import { Page, Block, BlockTitle, List } from 'konsta/react';
import type { Expense, Category } from '../types/expense';
import { ExpenseListItem } from '../components/ui/ExpenseListItem';
import { CategoryFilter } from '../components/ui/CategoryFilter';

interface ExpensesPageProps {
  expenses: Expense[];
  categories: Category[];
  onCategoryChange: (category: string) => void;
}

export function ExpensesPage({ expenses, categories, onCategoryChange }: ExpensesPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onCategoryChange(category);
  };

  return (
    <Page>
      <div className="pb-20">
        {/* Category Filter */}
        <Block>
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </Block>

        {/* Expenses List */}
        {expenses.length > 0 && (
          <>
            <BlockTitle>
              {selectedCategory === 'all' ? 'All Expenses' : selectedCategory}
              {' '}({expenses.length})
            </BlockTitle>
            <List strong dividers>
              {expenses.map((expense) => (
                <ExpenseListItem
                  key={expense.id}
                  expense={expense}
                  onClick={() => {
                    // TODO: Open expense detail modal
                    console.log('Expense clicked:', expense);
                  }}
                />
              ))}
            </List>
          </>
        )}

        {/* Empty State */}
        {expenses.length === 0 && (
          <Block>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <div className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No Expenses Found
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {selectedCategory !== 'all'
                  ? `No expenses in "${selectedCategory}" category`
                  : 'Start by uploading a PDF receipt'}
              </div>
            </div>
          </Block>
        )}
      </div>
    </Page>
  );
}
