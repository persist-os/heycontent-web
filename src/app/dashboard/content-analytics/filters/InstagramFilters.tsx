'use client';

import React, { useState } from 'react';
import { Search, Filter, Calendar, BarChart3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InstagramFilters as InstagramFiltersType, InstagramMediaType, InstagramTimeRange, InstagramSortOption } from '../types';

interface InstagramFiltersProps {
  filters: InstagramFiltersType;
  onFiltersChange: (filters: InstagramFiltersType) => void;
  availableMediaTypes: InstagramMediaType[];
  totalPosts: number;
  filteredPosts: number;
}

export const InstagramFilters: React.FC<InstagramFiltersProps> = ({
  filters,
  onFiltersChange,
  availableMediaTypes,
  totalPosts,
  filteredPosts
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchChange = (searchQuery: string) => {
    onFiltersChange({ ...filters, searchQuery });
  };

  const handleMediaTypeChange = (mediaType: InstagramMediaType) => {
    onFiltersChange({ ...filters, mediaType });
  };

  const handleTimeRangeChange = (timeRange: InstagramTimeRange) => {
    onFiltersChange({ ...filters, timeRange });
  };

  const handleSortChange = (sortBy: InstagramSortOption) => {
    onFiltersChange({ ...filters, sortBy });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      mediaType: 'all',
      timeRange: 'all',
      sortBy: 'date'
    });
  };

  const hasActiveFilters = filters.searchQuery || filters.mediaType !== 'all' || filters.timeRange !== 'all';

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search captions, analysis, comments..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4"
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </Button>

        {/* Results Count */}
        <div className="text-sm text-gray-500 whitespace-nowrap">
          {filteredPosts} of {totalPosts} posts
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Filter Options</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Media Type Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Media Type</label>
              <Select value={filters.mediaType} onValueChange={handleMediaTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMediaTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === 'all' ? 'All Types' : type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Range Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Time Range</label>
              <Select value={filters.timeRange} onValueChange={handleTimeRangeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Sort By</label>
              <Select value={filters.sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="likes">Likes</SelectItem>
                  <SelectItem value="comments">Comments</SelectItem>
                  <SelectItem value="reach">Reach</SelectItem>
                  <SelectItem value="impressions">Impressions</SelectItem>
                  <SelectItem value="saved">Saved</SelectItem>
                  <SelectItem value="shares">Shares</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {filters.searchQuery && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                  <span>Search: "{filters.searchQuery}"</span>
                  <button
                    onClick={() => handleSearchChange('')}
                    className="ml-1 hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {filters.mediaType !== 'all' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs">
                  <span>Type: {filters.mediaType.replace('_', ' ')}</span>
                  <button
                    onClick={() => handleMediaTypeChange('all')}
                    className="ml-1 hover:text-purple-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {filters.timeRange !== 'all' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                  <span>Time: {filters.timeRange}</span>
                  <button
                    onClick={() => handleTimeRangeChange('all')}
                    className="ml-1 hover:text-green-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 