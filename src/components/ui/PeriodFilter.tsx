import { Segmented, SegmentedButton } from 'konsta/react';
import type { TimePeriod } from '../../types/expense';

interface PeriodFilterProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

export function PeriodFilter({ selectedPeriod, onPeriodChange }: PeriodFilterProps) {
  return (
    <Segmented strong>
      <SegmentedButton
        active={selectedPeriod === 'week'}
        onClick={() => onPeriodChange('week')}
      >
        Week
      </SegmentedButton>
      <SegmentedButton
        active={selectedPeriod === 'month'}
        onClick={() => onPeriodChange('month')}
      >
        Month
      </SegmentedButton>
      <SegmentedButton
        active={selectedPeriod === 'year'}
        onClick={() => onPeriodChange('year')}
      >
        Year
      </SegmentedButton>
    </Segmented>
  );
}
