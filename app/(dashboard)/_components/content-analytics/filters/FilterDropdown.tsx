import React from 'react';
import { TimeRange, SortOption, PlatformFilterType } from '../types';

interface FilterDropdownProps {
  isOpen: boolean;
  timeRange: TimeRange;
  sortBy: SortOption;
  filterType: PlatformFilterType;
  onTimeRangeChange: (range: TimeRange) => void;
  onSortByChange: (sort: SortOption) => void;
  onFilterTypeChange: (filter: PlatformFilterType) => void;
  onReset: () => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  isOpen,
  timeRange,
  sortBy,
  onTimeRangeChange,
  onSortByChange,
  onReset,
  onFilterTypeChange
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
            onClick={() => onSortByChange('views')}
            className={`px-3 py-1 rounded-lg text-sm ${
              sortBy === 'views'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Views
          </button>
          <button
            onClick={() => onSortByChange('likes')}
            className={`px-3 py-1 rounded-lg text-sm ${
              sortBy === 'likes'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Likes
          </button>
          <button
            onClick={() => onSortByChange('comments')}
            className={`px-3 py-1 rounded-lg text-sm ${
              sortBy === 'comments'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Comments
          </button>
          <button
            onClick={() => onSortByChange('replies')}
            className={`px-3 py-1 rounded-lg text-sm ${
              sortBy === 'replies'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Replies
          </button>
          <button
            onClick={() => onSortByChange('openRate')}
            className={`px-3 py-1 rounded-lg text-sm ${
              sortBy === 'openRate'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Open Rate
          </button>
          <button
            onClick={() => onSortByChange('reach')}
            className={`px-3 py-1 rounded-lg text-sm ${
              sortBy === 'reach'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Reach
          </button>
          <button
            onClick={() => onSortByChange('impressions')}
            className={`px-3 py-1 rounded-lg text-sm ${
              sortBy === 'impressions'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Impressions
          </button>
          <button
            onClick={() => onSortByChange('watchTimeMinutes')}
            className={`px-3 py-1 rounded-lg text-sm ${
              sortBy === 'watchTimeMinutes'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Watch Time (min)
          </button>
          <button
            onClick={() => onSortByChange('clickRate')}
            className={`px-3 py-1 rounded-lg text-sm ${
              sortBy === 'clickRate'
                ? 'bg-heycontent-yellow text-black'
                : 'bg-heycontent-light-yellow text-text-dark'
            }`}
          >
            Click Rate
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
