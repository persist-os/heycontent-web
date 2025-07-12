'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
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
  Info
} from 'lucide-react';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { useGmailAnalytics } from '../../content-analytics/hooks/useGmailAnalytics';
import { useGmailBatchRefresh } from '@/app/hooks/useGmailBatchRefresh';
import { PartnershipDetailPanel } from './PartnershipDetailPanel';
import { PartnershipHubSkeleton } from './PartnershipHubSkeleton';
import { GmailProgressScreen } from './GmailProgressScreen';
import { CategoryEmailList } from './CategoryEmailList';
import PartnershipMetrics, { MetricFilter } from './PartnershipMetrics';
import { Partnership } from '../types';
import { usePartnershipData } from '../hooks/usePartnershipData';
import { PartnershipProgressiveThinking } from './PartnershipProgressiveThinking';
import { getPartnershipColors } from '../utils/emailCategorization';

export function PartnershipHub() {
  const userId = getCurrentUserId();
  
  // State management
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<MetricFilter>('all');

  const [isClient, setIsClient] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({
    partnership: true,
    media: true, 
    business: true,
    community: true
  });

  // Use Gmail analytics to get real Gmail data
  const { gmailItems, loading: gmailLoading, hasConnectedAccounts } = useGmailAnalytics(userId, refreshCount);
  
  // Get Gmail account info for user email
  const gmailAccounts = useQuery(
    api.gmailQueries.getGmailAccounts,
    userId ? { userId } : "skip"
  );
  const userEmail = gmailAccounts && gmailAccounts.length > 0 ? gmailAccounts[0].email : null;
  
  // Use simplified Gmail refresh hook
  const { refresh, loading: refreshing, error: refreshError, success: refreshSuccess, progress } = useGmailBatchRefresh();

  // Use custom hook for partnership data processing
  const { partnerships, partnershipMetrics, groupedEmails } = usePartnershipData(
    gmailItems || [],
    userEmail,
    searchQuery
  );

  // Filter partnerships based on active filter
  const filteredPartnerships = partnerships.filter(partnership => {
    switch (activeFilter) {
      case 'active':
        // Active partnerships: active status or high-value opportunities or multiple messages
        return partnership.status === 'active' || partnership.status === 'negotiating' || 
               partnership.estimatedValue > 1000 || partnership.messageCount > 3;
      case 'pending':
        // Pending partnerships: opportunities and inquiries that need response
        return partnership.status === 'opportunity' || partnership.status === 'inquiry';
      case 'high-value':
        // High-value partnerships: partnerships with identified monetary value
        return partnership.estimatedValue > 500;
      case 'all':
      default:
        return true;
    }
  });

  // Update grouped emails to use filtered partnerships
  const filteredGroupedEmails = Object.keys(groupedEmails).reduce((acc, category) => {
    const filteredIds = new Set(filteredPartnerships.map(p => p.id));
    acc[category] = groupedEmails[category].filter(partnership => filteredIds.has(partnership.id));
    return acc;
  }, {} as Record<string, Partnership[]>);

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    console.log('[PARTNERSHIP HUB] Manual refresh triggered at', new Date().toISOString());
    
    try {
      await refresh({ max_threads: 200 });
      setRefreshCount((c) => c + 1);
    } catch (error) {
      console.error('[PARTNERSHIP HUB] Error during manual refresh:', error);
    }
  }, [refresh]);

  const handleUpdateStatus = (partnershipId: string, status: Partnership['status']) => {
    // Update the partnership status locally and trigger refresh
    console.log('Updating partnership status:', partnershipId, status);
    setRefreshCount(c => c + 1);
  };

  const handleUpdatePartnership = (partnershipId: string, updates: Partial<Partnership>) => {
    // Update the partnership locally and trigger refresh
    console.log('🔄 [PARTNERSHIP HUB] Updating partnership:', partnershipId, updates);
    
    // Force refresh by incrementing refresh count
    setRefreshCount(c => {
      const newCount = c + 1;
      console.log('🔄 [PARTNERSHIP HUB] Incrementing refresh count from', c, 'to', newCount);
      return newCount;
    });
  };

  const handlePartnershipDeleted = () => {
    // Clear selected partnership and trigger refresh
    setSelectedPartnership(null);
    setRefreshCount(c => c + 1);
  };

  const handleToggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSelectPartnership = (partnership: Partnership) => {
    setSelectedPartnership(partnership);
  };

  // Show loading during hydration to prevent mismatch
  if (!isClient) {
    return <PartnershipHubSkeleton isLoading={true} />;
  }

  if (!userId) {
    return <PartnershipHubSkeleton isLoading={true} />;
  }

  // Show loading skeleton while Gmail accounts are being fetched
  if (gmailAccounts === undefined) {
    return <PartnershipHubSkeleton isLoading={true} />;
  }

  // Show loading skeleton while Gmail data is loading (first load)
  if (gmailLoading && partnerships.length === 0) {
    return <PartnershipHubSkeleton isLoading={true} />;
  }

  // Show preview mode only after we've confirmed no Gmail accounts are connected
  if (!hasConnectedAccounts) {
    return (
      <PartnershipHubSkeleton 
        showPreview={true} 
        onConnectGmail={() => window.location.href = '/settings?tab=platform-connect'}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="border-b border-border p-3 md:p-6">
          <div className="flex flex-col space-y-3 md:space-y-4">
            {/* Title and Action Row */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-3 md:space-y-0">
              <div className="space-y-1">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Partnership Hub</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Your command center for discovering collaborations, managing partnerships, and growing your creator business
                </p>
              </div>
              <div className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="w-full md:w-auto"
                      size="sm"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">
                        {refreshing ? 'Finding opportunities...' : 'Find New Opportunities'}
                      </span>
                      <span className="sm:hidden">
                        {refreshing ? 'Finding...' : 'Refresh'}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs md:max-w-md">
                    <div className="space-y-2">
                      <p className="font-medium">Smart Gmail Analysis</p>
                      <p>This will:</p>
                      <ul className="text-xs space-y-1 list-disc list-inside">
                        <li>Only analyze emails without the "ProcessedByHeyContent" label</li>
                        <li>Learn from any label changes you've made in Gmail</li>
                        <li>Use AI + your creator persona to find partnership opportunities</li>
                        <li>Automatically organize opportunities by category</li>
                        <li>Mark all analyzed emails to avoid duplicate processing</li>
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Progress Display */}
            {refreshing && progress.step !== 'idle' && (
              <div className="p-3 md:p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-primary"></div>
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

            {/* Search */}
            <div className="flex flex-col space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      placeholder="Search partnerships, brands, or opportunities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs md:max-w-sm">
                    <p>Search through your partnership opportunities by brand name, email content, subject line, or sender. Try keywords like "sponsorship", "collaboration", or specific brand names.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Metrics Cards */}
            <PartnershipMetrics 
              totalEmails={partnerships.length}
              activePartnerships={partnershipMetrics.activePartnerships}
              pendingResponses={partnershipMetrics.pendingResponses}
              pipelineValue={partnershipMetrics.pipelineValue}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Show progress screen when initially processing Gmail */}
          {refreshing && progress.step !== 'idle' && filteredPartnerships.length === 0 ? (
            <GmailProgressScreen progress={progress} />
          ) : (
            <>
              {/* Left Column - Category-Grouped Emails */}
              <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
                <div className="p-3 md:p-4">
                  <div className="mb-3 md:mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h2 className="text-base md:text-lg font-semibold text-foreground cursor-help">
                            Partnership Opportunities
                          </h2>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs md:max-w-md">
                          <div className="space-y-2">
                            <p className="font-medium">Automatically Organized Categories:</p>
                            <ul className="text-xs space-y-1">
                              <li><strong>Partnership:</strong> Direct collaboration requests</li>
                              <li><strong>Media:</strong> Press coverage and media opportunities</li>
                              <li><strong>Business:</strong> Commercial partnerships and deals</li>
                              <li><strong>Community:</strong> Networking and event invitations</li>
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="cursor-help text-xs">
                            {filteredPartnerships.length}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>
                            {activeFilter === 'all' 
                              ? 'Total number of partnership opportunities found in your Gmail inbox.' 
                              : `Filtered partnership opportunities (${filteredPartnerships.length} of ${partnerships.length} total).`
                            }
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Discover collaborations organized by opportunity type. Click any email to view details and manage the partnership.
                      {activeFilter !== 'all' && (
                        <span className="text-primary ml-2">
                          (Filtered: {filteredPartnerships.length} of {partnerships.length})
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Category-grouped email display */}
                  <CategoryEmailList
                    partnerships={filteredPartnerships}
                    groupedEmails={filteredGroupedEmails}
                    expandedCategories={expandedCategories}
                    onToggleCategory={handleToggleCategory}
                    onSelectPartnership={handleSelectPartnership}
                    selectedPartnershipId={selectedPartnership?.id}
                  />
                </div>
              </div>

              {/* Right Column - Partnership Detail Panel */}
              <div className="w-full lg:w-1/2 overflow-y-auto">
                <PartnershipDetailPanel 
                  partnership={selectedPartnership}
                  onUpdatePartnership={handleUpdatePartnership}
                  gmailData={selectedPartnership ? gmailItems.find(item => item.id === selectedPartnership.id)?.convexData : undefined}
                  onCategoryChanged={handleRefresh}
                  onPartnershipDeleted={handlePartnershipDeleted}
                  userEmail={userEmail}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
} 