import React from 'react';
import { Calendar, Filter } from 'lucide-react';
import { TimeRange } from '../types';

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
  return (
    <div className="shrink-0 px-6 py-4 bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center">
        <div className="w-[100px] sm:w-[24px]"></div>
        <div className="flex-1 flex justify-center sm:justify-start">
          <div className="text-center sm:text-left">
            <h1 className="text-base font-medium text-black dark:text-white">Content Analytics</h1>
            <p className="text-text-gray dark:text-gray-400">
              <span className="hidden sm:inline">Track and analyze your content performance across platforms</span>
            </p>
          </div>
        </div>
        <div className="w-[100px] sm:w-auto flex justify-end gap-2">
          {/* Time Range Selector */}
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            <select 
              aria-label="Select time range"
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
              className="bg-transparent border-none focus:ring-0"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          
          {/* Filter Button */}
          <div ref={filterRef}>
            <button
              onClick={onToggleFilter}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
