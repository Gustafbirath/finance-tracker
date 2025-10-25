import { Card } from 'konsta/react';
import { formatCurrency } from '../../utils/dateHelpers';

interface ExpenseCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function ExpenseCard({ title, amount, subtitle, trend, className = '' }: ExpenseCardProps) {
  const getTrendColor = () => {
    if (!trend) return 'text-gray-900 dark:text-gray-100';
    if (trend === 'down') return 'text-green-600 dark:text-green-400';
    if (trend === 'up') return 'text-red-600 dark:text-red-400';
    return 'text-gray-900 dark:text-gray-100';
  };

  return (
    <Card
      outline
      className={`mb-4 ${className}`}
      header={<div className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</div>}
    >
      <div className="py-2">
        <div className={`text-3xl font-bold ${getTrendColor()}`}>
          {formatCurrency(amount)}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </div>
        )}
      </div>
    </Card>
  );
}
