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
import PartnershipMetrics from './PartnershipMetrics';
import { Partnership } from '../types';
import { usePartnershipData } from '../hooks/usePartnershipData';

export function PartnershipHub() {
  const userId = getCurrentUserId();
  
  // State management
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

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

  // CRITICAL FIX: Add refs to prevent infinite loop
  const hasTriggeredAutoRefresh = useRef(false);
  const manualRefreshInProgress = useRef(false);

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    console.log('[PARTNERSHIP HUB] Smart refresh triggered at', new Date().toISOString());
    manualRefreshInProgress.current = true;
    
    try {
      await refresh({ max_threads: 200 });
      setRefreshCount((c) => c + 1);
      // Mark that we've done a manual refresh, so auto-refresh shouldn't run anymore
      hasTriggeredAutoRefresh.current = true;
    } finally {
      manualRefreshInProgress.current = false;
    }
  }, [refresh]);

  // FIXED: Auto-refresh logic with proper guards to prevent infinite loop
  useEffect(() => {
    // Only auto-refresh once when user first connects Gmail and has no data
    if (
      isClient && 
      hasConnectedAccounts && 
      partnerships.length === 0 && 
      !gmailLoading && 
      !refreshing && 
      !hasTriggeredAutoRefresh.current &&
      !manualRefreshInProgress.current
    ) {
      console.log('[PARTNERSHIP HUB] Auto-refresh triggered - first time setup');
      hasTriggeredAutoRefresh.current = true;
      handleRefresh();
    }
  }, [isClient, hasConnectedAccounts, partnerships.length, gmailLoading, refreshing, handleRefresh]);

  // Reset auto-refresh flag when user disconnects Gmail accounts
  useEffect(() => {
    if (!hasConnectedAccounts) {
      hasTriggeredAutoRefresh.current = false;
    }
  }, [hasConnectedAccounts]);

  const handleUpdateStatus = (partnershipId: string, status: Partnership['status']) => {
    // TODO: Implement status update in Convex
  };

  const handleUpdatePartnership = (partnershipId: string, updates: Partial<Partnership>) => {
    // TODO: Implement partnership update
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
        <div className="border-b border-border p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Partnership Hub</h1>
              <p className="text-muted-foreground">
                Your command center for discovering collaborations, managing partnerships, and growing your creator business
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="w-full md:w-auto"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Finding opportunities...' : 'Find New Opportunities'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-md">
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
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="w-4 h-4" />
                    <span>Analyzes emails not yet processed by HeyContent</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                  <p>Only emails that have not yet been processed by HeyContent (i.e., emails without the "ProcessedByHeyContent" label) will be analyzed. This prevents duplicate processing and ensures you only see new opportunities.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Progress Display */}
          {refreshing && progress.step !== 'idle' && (
            <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <div>
                  <p className="text-sm font-medium text-foreground">{progress.message}</p>
                  {progress.step === 'processing' && (
                    <p className="text-xs text-muted-foreground">
                      Checking for new emails, learning from your Gmail label changes, and finding partnership opportunities with AI...
                    </p>
                  )}
                  {progress.step === 'complete' && progress.data && (
                    <div className="text-xs space-y-1 mt-2">
                      {progress.data.learned_signals > 0 && (
                        <p className="text-success font-medium">
                          ✅ Learned from {progress.data.learned_signals} of your Gmail label changes
                        </p>
                      )}
                      {progress.data.labeled_count > 0 && (
                        <p className="text-success font-medium">
                          🔍 Found {progress.data.labeled_count} new partnership opportunities
                        </p>
                      )}
                      {progress.data.stored_count > 0 && (
                        <p className="text-success font-medium">
                          💾 Saved {progress.data.stored_count} opportunities to your dashboard
                        </p>
                      )}
                      {progress.data.processed_count > 0 && (
                        <p className="text-xs text-muted-foreground">
                          📧 Processed {progress.data.processed_count} new emails
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {refreshError && (
            <div className="text-destructive text-sm mb-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <strong>Sync Issue:</strong> {refreshError}
              <p className="text-xs mt-1">Please try again in a moment or check your Gmail connection in Settings.</p>
            </div>
          )}
          {refreshSuccess && (
            <div className="text-success text-sm mb-2 p-3 bg-success/10 rounded-lg border border-success/20">
              <strong>Success!</strong> Your Gmail analysis is complete. Fresh opportunities are ready to explore!
            </div>
          )}

          {/* Search */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    placeholder="Search your partnerships, brands, or opportunities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
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
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Show progress screen when initially processing Gmail */}
          {refreshing && progress.step !== 'idle' && partnerships.length === 0 ? (
            <GmailProgressScreen progress={progress} />
          ) : (
            <>
              {/* Left Column - Category-Grouped Emails */}
              <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-border p-4 overflow-y-auto">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h2 className="text-lg font-semibold text-foreground cursor-help">
                          Partnership Opportunities
                        </h2>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-md">
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
                        <Badge variant="outline" className="cursor-help">
                          {partnerships.length}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Total number of partnership opportunities found in your Gmail inbox.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Discover collaborations organized by opportunity type. Click any email to view details and manage the partnership.
                  </p>
                </div>

                {/* Category-grouped email display */}
                <CategoryEmailList
                  partnerships={partnerships}
                  groupedEmails={groupedEmails}
                  expandedCategories={expandedCategories}
                  onToggleCategory={handleToggleCategory}
                  onSelectPartnership={handleSelectPartnership}
                  selectedPartnershipId={selectedPartnership?.id}
                />
              </div>

              {/* Right Column - Partnership Detail Panel */}
              <div className="w-full lg:w-1/2 p-4 overflow-y-auto">
                <PartnershipDetailPanel 
                  partnership={selectedPartnership}
                  onUpdatePartnership={handleUpdatePartnership}
                  gmailData={selectedPartnership ? gmailItems.find(item => item.id === selectedPartnership.id)?.convexData : undefined}
                  onCategoryChanged={handleRefresh}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
} 