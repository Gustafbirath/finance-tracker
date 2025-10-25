import { Segmented, SegmentedButton } from 'konsta/react';
import type { Category } from '../../types/expense';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  showAll?: boolean;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  showAll = true,
}: CategoryFilterProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <Segmented strong className="min-w-max">
        {showAll && (
          <SegmentedButton
            active={selectedCategory === 'all'}
            onClick={() => onCategoryChange('all')}
          >
            All
          </SegmentedButton>
        )}
        {categories.map((category) => (
          <SegmentedButton
            key={category.name}
            active={selectedCategory === category.name}
            onClick={() => onCategoryChange(category.name)}
          >
            {category.name}
          </SegmentedButton>
        ))}
      </Segmented>
    </div>
  );
}
