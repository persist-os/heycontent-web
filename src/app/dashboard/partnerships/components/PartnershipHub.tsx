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
  MessageSquare,
  Clock,
  Users
} from 'lucide-react';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { useGmailAnalytics } from '../../content-analytics/hooks/useGmailAnalytics';
import { useGmailBatchRefresh } from '@/app/hooks/useGmailBatchRefresh';
import { PartnershipDetailPanel } from './PartnershipDetailPanel';
import { PartnershipHubSkeleton } from './PartnershipHubSkeleton';
import { GmailProgressScreen } from './GmailProgressScreen';
import { CategoryEmailList } from './CategoryEmailList';
import { Partnership } from '../types';
import { usePartnershipData } from '../hooks/usePartnershipData';
import { PartnershipProgressiveThinking } from './PartnershipProgressiveThinking';
import { getPartnershipColors } from '../utils/emailCategorization';

export type MetricFilter = 'all' | 'active' | 'pending' | 'brand-deals';

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

  // Calculate brand deals count dynamically
  const brandDealsCount = partnerships.filter(partnership => 
    partnership.estimatedValue > 500 || 
    partnership.status === 'negotiating' || 
    partnership.messageCount > 5
  ).length;

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
      case 'brand-deals':
        // Brand deals: high-value partnerships and serious negotiations
        return partnership.estimatedValue > 500 || 
               partnership.status === 'negotiating' || 
               partnership.messageCount > 5;
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
        <div className="border-b border-border p-6">
          <div className="flex flex-col space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">Partnership Hub</h1>
              <p className="text-sm text-muted-foreground">
                Your command center for discovering collaborations, managing partnerships, and growing your creator business
              </p>
            </div>

            {/* Progress Display */}
            {refreshing && progress.step !== 'idle' && (
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
                        }`}
                        onClick={() => setActiveFilter('all')}
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
                        }`}
                        onClick={() => setActiveFilter('active')}
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
                        }`}
                        onClick={() => setActiveFilter('pending')}
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
                        }`}
                        onClick={() => setActiveFilter('brand-deals')}
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
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 justify-center shrink-0"
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
          {/* Show progress screen when initially processing Gmail */}
          {refreshing && progress.step !== 'idle' && filteredPartnerships.length === 0 ? (
            <GmailProgressScreen progress={progress} />
          ) : (
            <>
              {/* Left Column - Category-Grouped Emails */}
              <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
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
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
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