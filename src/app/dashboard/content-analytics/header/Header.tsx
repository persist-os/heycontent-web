import React from 'react';
import { Calendar, Filter } from 'lucide-react';
import { CentralizedHeader } from '@/components/ui/centralized-header';

export type TimeRange = '7d' | '30d' | '90d';

interface HeaderProps {
  timeRange: TimeRange;
  isFilterOpen: boolean;
  onTimeRangeChange: (range: TimeRange) => void;
  onToggleFilter: () => void;
  filterRef: React.Ref<HTMLDivElement>;
}

export const Header: React.FC<HeaderProps> = ({
  timeRange,
  isFilterOpen,
  onTimeRangeChange,
  onToggleFilter,
  filterRef
}) => {
  // Create actions for the header
  const rightActions = [
    {
      id: 'filter',
      icon: Filter,
      onClick: onToggleFilter,
      title: 'Filter',
      variant: 'outline' as const,
      size: 'sm' as const,
      className: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
    }
  ];

  return (
    <CentralizedHeader
      title="Content Analytics"
      subtitle="Track and analyze your content performance across platforms"
      rightActions={rightActions}
      variant="minimal"
      className="px-6 py-4 bg-white dark:bg-gray-900"
    />
  );
};
