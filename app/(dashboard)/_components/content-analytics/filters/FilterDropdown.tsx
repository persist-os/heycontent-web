import React from 'react';
import { TimeRange, SortOption, FilterType } from '../types';

interface FilterDropdownProps {
  isOpen: boolean;
  timeRange: TimeRange;
  sortBy: SortOption;
  filterType: FilterType;
  onTimeRangeChange: (range: TimeRange) => void;
  onSortByChange: (sort: SortOption) => void;
  onFilterTypeChange: (filter: FilterType) => void;
  onReset: () => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  isOpen,
  timeRange,
  sortBy,
  filterType,
  onTimeRangeChange,
  onSortByChange,
  onFilterTypeChange,
  onReset
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-6 top-[4.5rem] w-72 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-lg shadow-lg p-4 space-y-4 z-50">
      {/* Time Range - Only visible on mobile */}
      <div className="space-y-2 sm:hidden">
        <h3 className="font-medium text-sm text-text-dark dark:text-white">Time Range</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onTimeRangeChange('7d')}
            className={`px-3 py-1 rounded-lg text-sm ${
              timeRange === '7d'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Last 7 days
          </button>
          <button
            onClick={() => onTimeRangeChange('30d')}
            className={`px-3 py-1 rounded-lg text-sm ${
              timeRange === '30d'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Last 30 days
          </button>
          <button
            onClick={() => onTimeRangeChange('90d')}
            className={`px-3 py-1 rounded-lg text-sm ${
              timeRange === '90d'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Last 90 days
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-sm text-text-dark dark:text-white">Sort By</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSortByChange('date')}
            className={`px-3 py-1 rounded-lg text-sm ${
              sortBy === 'date'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Date
          </button>
          <button
            onClick={() => onSortByChange('engagement')}
            className={`px-3 py-1 rounded-lg text-sm ${
              sortBy === 'engagement'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Engagement
          </button>
          <button
            onClick={() => onSortByChange('performance')}
            className={`px-3 py-1 rounded-lg text-sm ${
              sortBy === 'performance'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Performance
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-sm text-text-dark dark:text-white">Content Type</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFilterTypeChange('all')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filterType === 'all'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => onFilterTypeChange('post')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filterType === 'post'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => onFilterTypeChange('video')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filterType === 'video'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => onFilterTypeChange('email')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filterType === 'email'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Emails
          </button>
        </div>
      </div>

      <div className="pt-4 border-t dark:border-gray-800">
        <button
          onClick={onReset}
          className="w-full px-4 py-2 text-sm text-text-dark hover:bg-heycontent-light-yellow rounded-lg dark:text-white dark:hover:bg-gray-800"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};
