'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Mail, 
  Search, 
  RefreshCw,
  MessageSquare,
  Clock,
  Users
} from 'lucide-react';

import { EnhancedHelpButton } from '@/components/ui/enhanced-help-button';
import { InteractiveTooltip } from '@/components/ui/interactive-tooltip';
import { PartnershipDetailPanel } from './PartnershipDetailPanel';
import { CategoryEmailList } from './CategoryEmailList';
import { PartnershipProgressiveThinking } from './PartnershipProgressiveThinking';
import { Partnership } from '../types';

export type MetricFilter = 'all' | 'active' | 'pending' | 'brand-deals';

interface PartnershipHubUIProps {
  // Data
  partnerships: Partnership[];
  filteredPartnerships: Partnership[];
  groupedEmails: Record<string, Partnership[]>;
  partnershipMetrics: {
    activePartnerships: number;
    pendingResponses: number;
    pipelineValue: number;
  };
  brandDealsCount: number;
  userEmail?: string | null;
  
  // State
  selectedPartnership: Partnership | null;
  searchQuery: string;
  activeFilter: MetricFilter;
  expandedCategories: Record<string, boolean>;
  
  // Loading/Progress
  refreshing?: boolean;
  progress?: any;
  refreshError?: string;
  refreshSuccess?: boolean;
  
  // Event handlers
  onRefresh?: () => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: MetricFilter) => void;
  onToggleCategory: (category: string) => void;
  onSelectPartnership: (partnership: Partnership) => void;
  onUpdatePartnership: (partnershipId: string, updates: Partial<Partnership>) => void;
  onPartnershipDeleted?: () => void;
  onCategoryChanged?: () => void;
  
  // Help system
  onInteractiveTour?: () => void;
  interactiveTourOpen?: boolean;
  onCloseInteractiveTour?: () => void;
  interactiveTours?: any;
  
  // UI state
  disabled?: boolean;
  gmailData?: any;
}

export function PartnershipHubUI({
  partnerships,
  filteredPartnerships,
  groupedEmails,
  partnershipMetrics,
  brandDealsCount,
  userEmail,
  selectedPartnership,
  searchQuery,
  activeFilter,
  expandedCategories,
  refreshing = false,
  progress,
  refreshError,
  refreshSuccess,
  onRefresh,
  onSearchChange,
  onFilterChange,
  onToggleCategory,
  onSelectPartnership,
  onUpdatePartnership,
  onPartnershipDeleted,
  onCategoryChanged,
  onInteractiveTour,
  interactiveTourOpen = false,
  onCloseInteractiveTour,
  interactiveTours,
  disabled = false,
  gmailData
}: PartnershipHubUIProps) {
  
  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="border-b border-border p-6">
          <div className="flex flex-col space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Partnership Hub</h1>
                  <p className="text-sm text-muted-foreground">
                    Your command center for discovering collaborations, managing partnerships, and growing your creator business
                  </p>
                </div>
                {onInteractiveTour && (
                  <div>
                    <EnhancedHelpButton 
                      onInteractiveTour={onInteractiveTour}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Progress Display */}
            {refreshing && progress?.step !== 'idle' && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{progress.message}</p>
                  </div>
                </div>
                <PartnershipProgressiveThinking
                  searchStatus={progress.message}
                  isCompleted={progress.step === 'complete'}
                  progressData={progress.data}
                />
              </div>
            )}

            {/* Status Messages */}
            {refreshError && (
              <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <strong>Sync Issue:</strong> {refreshError}
                <p className="text-xs mt-1">Please try again in a moment or check your Gmail connection in Settings.</p>
              </div>
            )}
            {refreshSuccess && (
              <div className="text-green-600 dark:text-green-400 text-sm p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <strong>Success!</strong> Your Gmail analysis is complete. Fresh opportunities are ready to explore!
              </div>
            )}

            {/* Metrics and Button Row */}
            <div className="flex items-center justify-between w-full">
              {/* Left side - 4 metric boxes */}
              <div className="flex items-center gap-4">
                {/* Metric Cards */}
                <div className="flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`flex items-center gap-2 px-4 py-3 border rounded-lg backdrop-blur-sm cursor-pointer transition-all duration-200 ${
                          activeFilter === 'all' 
                            ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/30 shadow-lg' 
                            : 'bg-card border-border hover:bg-muted'
                        } ${disabled ? 'pointer-events-none' : ''}`}
                        onClick={() => !disabled && onFilterChange('all')}
                      >
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="text-xl font-bold text-foreground">{partnerships.length}</div>
                          <div className="text-xs text-muted-foreground">Total Emails</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">Total partnership opportunities found</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`flex items-center gap-2 px-4 py-3 border rounded-lg backdrop-blur-sm cursor-pointer transition-all duration-200 ${
                          activeFilter === 'active' 
                            ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/30 shadow-lg' 
                            : 'bg-card border-border hover:bg-muted'
                        } ${disabled ? 'pointer-events-none' : ''}`}
                        onClick={() => !disabled && onFilterChange('active')}
                      >
                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="text-xl font-bold text-foreground">{partnershipMetrics.activePartnerships}</div>
                          <div className="text-xs text-muted-foreground">Active Discussions</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">Ongoing conversations and deals</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`flex items-center gap-2 px-4 py-3 border rounded-lg backdrop-blur-sm cursor-pointer transition-all duration-200 ${
                          activeFilter === 'pending' 
                            ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/30 shadow-lg' 
                            : 'bg-card border-border hover:bg-muted'
                        } ${disabled ? 'pointer-events-none' : ''}`}
                        onClick={() => !disabled && onFilterChange('pending')}
                      >
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="text-xl font-bold text-foreground">{partnershipMetrics.pendingResponses}</div>
                          <div className="text-xs text-muted-foreground">Needs Response</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">Opportunities waiting for your reply</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`flex items-center gap-2 px-4 py-3 border rounded-lg backdrop-blur-sm cursor-pointer transition-all duration-200 ${
                          activeFilter === 'brand-deals' 
                            ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/30 shadow-lg' 
                            : 'bg-card border-border hover:bg-muted'
                        } ${disabled ? 'pointer-events-none' : ''}`}
                        onClick={() => !disabled && onFilterChange('brand-deals')}
                      >
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="text-xl font-bold text-foreground">{brandDealsCount}</div>
                          <div className="text-xs text-muted-foreground">Brand Deals</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">High-value partnerships and serious negotiations</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Find New Opportunities Button */}
                <Button 
                  variant="outline" 
                  onClick={onRefresh}
                  disabled={disabled || refreshing || !onRefresh}
                  className="flex items-center gap-2 justify-center shrink-0"
                  data-find-opportunities-button
                  style={{
                    borderRadius: '25px',
                    border: '1px solid var(--Neutral_600, #747474)',
                    background: 'var(--neutral_950, #2B2B2B)',
                    width: '219px',
                    height: '43px',
                    flexShrink: 0,
                    color: 'var(--Neutral_400, #BCBCBC)',
                    fontSize: '14px',
                    fontStyle: 'normal',
                    fontWeight: 500,
                    lineHeight: 'normal'
                  }}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Find New Opportunities
                </Button>
              </div>

              {/* Right side - Deal Value */}
              <div 
                className="flex items-center gap-2 px-4 py-3 shrink-0"
                style={{
                  borderRadius: '15px',
                  background: 'rgba(245, 246, 98, 0.13)',
                  width: '209px',
                  height: '64px',
                  flexShrink: 0
                }}
              >
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-sm">$</span>
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">
                    {partnershipMetrics.pipelineValue >= 1000000 ? `$${(partnershipMetrics.pipelineValue / 1000000).toFixed(1)}M` :
                     partnershipMetrics.pipelineValue >= 1000 ? `$${(partnershipMetrics.pipelineValue / 1000).toFixed(1)}K` :
                     partnershipMetrics.pipelineValue === 0 ? '$0' : `$${partnershipMetrics.pipelineValue}`}
                  </div>
                  <div className="text-xs text-muted-foreground">Deal Value</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column - Category-Grouped Emails */}
          <div className={`w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto ${disabled ? 'pointer-events-none' : ''}`}>
            <div className="p-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    Partnership Opportunities
                  </h2>
                  <Badge variant="outline" className="text-xs">
                    {filteredPartnerships.length}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pick a partnership from the left to explore the conversation, draft replies, and turn opportunities into collaborations
                  {activeFilter !== 'all' && (
                    <span className="text-primary ml-2">
                      (Filtered: {filteredPartnerships.length} of {partnerships.length})
                    </span>
                  )}
                </p>
              </div>

              {/* Search above email list */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search partnerships or opportunities..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                    disabled={disabled}
                  />
                </div>
              </div>

              {/* Category-grouped email display */}
              <CategoryEmailList
                partnerships={filteredPartnerships}
                groupedEmails={groupedEmails}
                expandedCategories={expandedCategories}
                onToggleCategory={onToggleCategory}
                onSelectPartnership={onSelectPartnership}
                selectedPartnershipId={selectedPartnership?.id}
              />
            </div>
          </div>

          {/* Right Column - Partnership Detail Panel */}
          <div className={`w-full lg:w-1/2 overflow-y-auto ${disabled ? 'pointer-events-none' : ''}`}>
            <PartnershipDetailPanel 
              partnership={selectedPartnership}
              onUpdatePartnership={onUpdatePartnership}
              gmailData={gmailData}
              onCategoryChanged={onCategoryChanged}
              onPartnershipDeleted={onPartnershipDeleted}
              userEmail={userEmail}
            />
          </div>
        </div>

        {/* Interactive Tour */}
        {interactiveTours && onCloseInteractiveTour && (
          <InteractiveTooltip
            isOpen={interactiveTourOpen}
            onClose={onCloseInteractiveTour}
            steps={interactiveTours.partnershipHub}
            title="Partnership Hub Features Tour"
            autoPlay={false}
          />
        )}
      </div>
    </TooltipProvider>
  );
} 