import { useState, useMemo } from 'react';
import { Page, Block, BlockTitle, List, ListItem } from 'konsta/react';
import type { Expense, TimePeriod } from '../types/expense';
import { ExpenseCard } from '../components/ui/ExpenseCard';
import { PeriodFilter } from '../components/ui/PeriodFilter';
import { formatCurrency } from '../utils/dateHelpers';

interface HomePageProps {
  expenses: Expense[];
}

export function HomePage({ expenses }: HomePageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  // Group expenses by category and calculate totals
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    expenses.forEach((expense) => {
      const category = expense.category || 'Other';
      totals[category] = (totals[category] || 0) + expense.amount;
    });

    // Sort by amount (descending)
    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  // Get period label
  const periodLabel = selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'This Year';

  return (
    <Page>
      <div className="pb-20">
        {/* Period Filter */}
        <Block>
          <PeriodFilter
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </Block>

        {/* Total Expenses Card */}
        <Block>
          <ExpenseCard
            title={`Total Spent - ${periodLabel}`}
            amount={totalExpenses}
            subtitle={`${expenses.length} transaction${expenses.length !== 1 ? 's' : ''}`}
          />
        </Block>

        {/* Category Breakdown */}
        {categoryTotals.length > 0 && (
          <>
            <BlockTitle>Spending by Category</BlockTitle>
            <List strong outline>
              {categoryTotals.map(({ category, amount }) => {
                const percentage = totalExpenses > 0
                  ? ((amount / totalExpenses) * 100).toFixed(1)
                  : '0';

                return (
                  <ListItem
                    key={category}
                    title={category}
                    after={
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {formatCurrency(amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {percentage}%
                        </div>
                      </div>
                    }
                  />
                );
              })}
            </List>
          </>
        )}

        {/* Empty State */}
        {expenses.length === 0 && (
          <Block>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No Expenses Yet
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                Upload a PDF receipt to get started
              </div>
            </div>
          </Block>
        )}
      </div>
    </Page>
  );
}
