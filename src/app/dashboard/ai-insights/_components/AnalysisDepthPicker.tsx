'use client'

import React, { useState } from 'react';
import { RefreshCw, AlertCircle, Settings, Zap, ChevronDown, Grid3X3, Zap as Auto } from 'lucide-react';

type PresetOption = {
  value: number;
  label: string;
};

interface AnalysisDepthPickerProps {
  platform: string;
  isRefreshing: boolean;
  error: string | null;
  onRefresh: () => void;
  disabled?: boolean;
  postLimit: number | 'all';
  setPostLimit: (limit: number | 'all') => void;
  customPostLimit: string;
  setCustomPostLimit: (limit:string) => void;
  showCustomInput: boolean;
  setShowCustomInput: (show: boolean) => void;
  handleCustomSubmit: () => void;
  // New props for manual selection
  selectionMode?: 'auto' | 'manual';
  onSelectionModeChange?: (mode: 'auto' | 'manual') => void;
  selectedPostIds?: string[];
  onSelectedPostsChange?: (postIds: string[]) => void;
  availablePosts?: any[];
  showPostSelection?: boolean;
  onShowPostSelectionChange?: (show: boolean) => void;
}

export function AnalysisDepthPicker({
  platform,
  isRefreshing,
  error,
  onRefresh,
  disabled = false,
  postLimit,
  setPostLimit,
  customPostLimit,
  setCustomPostLimit,
  showCustomInput,
  setShowCustomInput,
  handleCustomSubmit,
  // New props
  selectionMode = 'auto',
  onSelectionModeChange,
  selectedPostIds = [],
  onSelectedPostsChange,
  availablePosts = [],
  showPostSelection = false,
  onShowPostSelectionChange,
}: AnalysisDepthPickerProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const presetOptions: PresetOption[] = [
    { value: 5, label: '5' },
    { value: 10, label: '10' },
    { value: 15, label: '15' },
    { value: 20, label: '20' },
  ];

  const handleSelectionModeChange = (mode: 'auto' | 'manual') => {
    if (onSelectionModeChange) {
      onSelectionModeChange(mode);
      // Reset selection when switching modes
      if (onSelectedPostsChange) {
        onSelectedPostsChange([]);
      }
      if (onShowPostSelectionChange) {
        onShowPostSelectionChange(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
        <div className="flex-1 max-w-xl">
          <div className="mb-2 flex items-center justify-between">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="flex items-center justify-between w-full p-2 -m-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
              title="Toggle analysis depth"
            >
              <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-heycontent-yellow transition-colors">
                Analysis Depth
              </h3>
              <ChevronDown className={`w-4 h-4 text-gray-500 group-hover:text-heycontent-yellow transition-all duration-200 ${!isCollapsed ? 'transform rotate-180' : ''}`} />
            </button>
          </div>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-96'}`}>
            
            {/* Selection Mode Toggle */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Selection Mode:</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectionModeChange('auto')}
                  disabled={isRefreshing}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectionMode === 'auto'
                      ? 'bg-heycontent-yellow text-black'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Auto className="w-3 h-3" />
                  Auto Selection
                </button>
                <button
                  onClick={() => handleSelectionModeChange('manual')}
                  disabled={isRefreshing}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectionMode === 'manual'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Grid3X3 className="w-3 h-3" />
                  Manual Selection
                </button>
              </div>
            </div>

            {/* Auto Selection Mode */}
            {selectionMode === 'auto' && (
              <>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {presetOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setPostLimit(option.value);
                        setShowCustomInput(false);
                      }}
                      disabled={isRefreshing}
                      className={`relative group p-2 rounded-lg border transition-all duration-200 ${
                        postLimit === option.value
                          ? 'border-heycontent-yellow bg-heycontent-light-yellow/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-heycontent-yellow/50'
                      } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="text-center">
                        <div
                          className={`font-medium text-xs ${
                            postLimit === option.value
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {option.label}
                        </div>
                      </div>
                      {postLimit === option.value && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-heycontent-yellow rounded-full flex items-center justify-center">
                          <div className="w-1 h-1 bg-white rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setShowCustomInput(!showCustomInput)}
                    disabled={isRefreshing}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                      showCustomInput
                        ? 'bg-heycontent-light-yellow text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Settings className="w-3 h-3" />
                    Custom
                  </button>

                  <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                    <Zap className="w-3 h-3 text-heycontent-yellow" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {typeof postLimit === 'number' ? `${postLimit} items` : 'All items'}
                    </span>
                  </div>
                </div>

                {showCustomInput && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <input
                        id="custom-limit"
                        type="number"
                        min="1"
                        max="20"
                        value={customPostLimit}
                        onChange={(e) => setCustomPostLimit(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                        placeholder="e.g., 8"
                        disabled={isRefreshing}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-heycontent-yellow focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        onClick={handleCustomSubmit}
                        disabled={
                          !customPostLimit ||
                          isRefreshing ||
                          parseInt(customPostLimit) < 1 ||
                          parseInt(customPostLimit) > 20
                        }
                        className="px-3 py-1 bg-heycontent-yellow hover:bg-heycontent-yellow/90 text-black text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Maximum 20 posts allowed
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Manual Selection Mode */}
            {selectionMode === 'manual' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Selected Posts: {selectedPostIds.length} of 20
                    </span>
                  </div>
                  <button
                    onClick={() => onShowPostSelectionChange?.(!showPostSelection)}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Grid3X3 className="w-3 h-3" />
                    {showPostSelection ? 'Hide Selection' : 'Select Posts'}
                  </button>
                </div>
                
                {selectedPostIds.length > 0 && (
                  <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                    <p className="text-xs text-pink-700 dark:text-pink-300">
                      {selectedPostIds.length} posts selected for analysis
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={onRefresh}
            disabled={isRefreshing || disabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isRefreshing || disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                : 'bg-gray-100 hover:bg-heycontent-light-yellow text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>
              {isRefreshing
                ? 'Analyzing...'
                : disabled
                ? 'Coming Soon'
                : `Analyze ${platform}`}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {error}
          </p>
        </div>
      )}
    </div>
  );
} 