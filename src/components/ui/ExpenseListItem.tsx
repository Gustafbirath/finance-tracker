import { ListItem } from 'konsta/react';
import type { Expense } from '../../types/expense';
import { formatShortDate, formatCurrency } from '../../utils/dateHelpers';

interface ExpenseListItemProps {
  expense: Expense;
  onClick?: () => void;
}

export function ExpenseListItem({ expense, onClick }: ExpenseListItemProps) {
  const dateObj = expense.date instanceof Date ? expense.date : new Date(expense.date);

  return (
    <ListItem
      link={!!onClick}
      onClick={onClick}
      title={expense.description || 'Unknown'}
      subtitle={expense.category}
      text={formatShortDate(dateObj)}
      after={
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(expense.amount)}
        </span>
      }
    />
  );
}
