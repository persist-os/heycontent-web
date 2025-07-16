'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { useGmailAnalytics } from '../../content-analytics/hooks/useGmailAnalytics';
import { useGmailBatchRefresh } from '@/app/hooks/useGmailBatchRefresh';
import { PartnershipHubSkeleton } from './PartnershipHubSkeleton';
import { PartnershipHubUI } from './PartnershipHubUI';
import { GmailProgressScreen } from './GmailProgressScreen';
import { Partnership } from '../types';
import { usePartnershipData } from '../hooks/usePartnershipData';
import { PartnershipProgressiveThinking } from './PartnershipProgressiveThinking';

// Help system imports
import { interactiveTours } from '@/helpContent/interactiveTours';

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

  // Help system state

  const [interactiveTourOpen, setInteractiveTourOpen] = useState(false);

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

  // Show progress screen when initially processing Gmail
  if (refreshing && progress.step !== 'idle' && filteredPartnerships.length === 0) {
    return <GmailProgressScreen progress={progress} />;
  }

  return (
    <PartnershipHubUI
      partnerships={partnerships}
      filteredPartnerships={filteredPartnerships}
      groupedEmails={filteredGroupedEmails}
      partnershipMetrics={partnershipMetrics}
      brandDealsCount={brandDealsCount}
      userEmail={userEmail}
      selectedPartnership={selectedPartnership}
      searchQuery={searchQuery}
      activeFilter={activeFilter}
      expandedCategories={expandedCategories}
      refreshing={refreshing}
      progress={progress}
      refreshError={refreshError}
      refreshSuccess={refreshSuccess}
      onRefresh={handleRefresh}
      onSearchChange={setSearchQuery}
      onFilterChange={setActiveFilter}
      onToggleCategory={handleToggleCategory}
      onSelectPartnership={handleSelectPartnership}
      onUpdatePartnership={handleUpdatePartnership}
      onPartnershipDeleted={handlePartnershipDeleted}
      onCategoryChanged={handleRefresh}
      onInteractiveTour={() => setInteractiveTourOpen(true)}
      interactiveTourOpen={interactiveTourOpen}
      onCloseInteractiveTour={() => setInteractiveTourOpen(false)}
      interactiveTours={interactiveTours}
      gmailData={selectedPartnership ? gmailItems.find(item => item.id === selectedPartnership.id)?.convexData : undefined}
    />
  );
} 