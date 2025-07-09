'use client'

import React, { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Search, 
  RefreshCw
} from 'lucide-react';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { useGmailAnalytics } from '../../content-analytics/hooks/useGmailAnalytics';
import { useGmailBatchRefresh } from '@/app/hooks/useGmailBatchRefresh';
import { GmailContentItem } from '../../content-analytics/types';
import ActivePartnerships from './ActivePartnerships';
import PartnershipMetrics from './PartnershipMetrics';
import { PartnershipDetailPanel } from './PartnershipDetailPanel';
import { PartnershipHubSkeleton } from './PartnershipHubSkeleton';
import { Partnership } from '../types';

export function PartnershipHub() {
  const userId = getCurrentUserId();
  
  // State management
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'active' | 'needs_response' | 'deal_value'>('all');
  const [isClient, setIsClient] = useState(false);

  // Use Gmail analytics to get real Gmail data
  const { gmailItems, loading: gmailLoading, hasConnectedAccounts } = useGmailAnalytics(userId, refreshCount);
  
  // Get Gmail account info for user email
  const gmailAccounts = useQuery(
    api.gmailQueries.getGmailAccounts,
    userId ? { userId } : "skip"
  );
  const userEmail = gmailAccounts && gmailAccounts.length > 0 ? gmailAccounts[0].email : null;
  
  // Use Gmail batch refresh hook
  const { refresh, loading: refreshing, error: refreshError, success: refreshSuccess } = useGmailBatchRefresh();

  // Client-side hydration check
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Show ALL emails in partnerships list (no filtering)
  const isPartnershipEmail = (item: any): boolean => {
    return true; // Show every email
  };

  // Helper function to determine if user needs to respond
  const needsResponse = (item: any): boolean => {
    if (!userEmail) return false;
    
    const messages = item.content?.data?.messages || [];
    if (messages.length === 0) return false;
    
    // Sort messages by timestamp to get the chronologically last message
    const sortedMessages = [...messages].sort((a, b) => {
      const aTime = a.timestamp || a.date || 0;
      const bTime = b.timestamp || b.date || 0;
      return aTime - bTime;
    });
    
    const lastMessage = sortedMessages[sortedMessages.length - 1];
    const lastSender = lastMessage?.from || '';
    
    // User needs to respond if the last message was NOT from them
    const userSentLast = lastSender.toLowerCase().includes(userEmail.toLowerCase());
    return !userSentLast;
  };

  // Helper function to extract actual deal value from email content
  const extractDealValue = (item: any): number => {
    // Check if there's an actual deal value from metrics first
    const existingDealValue = item.metrics?.dealValue;
    if (existingDealValue && existingDealValue > 0) {
      return existingDealValue;
    }
    
    // Get all email content to search for dollar amounts
    const subject = item.content?.data?.subject || '';
    const messages = item.content?.data?.messages || [];
    
    let allContent = subject;
    messages.forEach((message: any) => {
      if (message.body) allContent += ' ' + message.body;
    });
    
    if (!allContent.trim()) return 0;
    
         // Only extract CONFIRMED deal values, not rate negotiations
     const confirmedDealPatterns = [
       // Explicit confirmed deals with context
       /(?:agreed|confirmed|approved|accepted|final|total|deal)\s+(?:amount|value|budget|payment|compensation|deal)?\s*:?\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
       
       // "We'll pay you $X" or "You'll receive $X"
       /(?:we'll pay|you'll receive|we're paying|payment of|compensation of)\s+\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
       
       // "Total budget: $X" or "Campaign budget: $X"
       /(?:total|campaign|project|partnership)\s+budget\s*:?\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
       
       // K notation with confirmed context
       /(?:agreed|confirmed|approved|accepted|final|total|deal)\s+(?:amount|value|budget)?\s*:?\s*\$?(\d+(?:\.\d+)?)[kK]/gi,
       
       // "Deal worth $X" or "Partnership valued at $X"
       /(?:deal worth|partnership valued|valued at|worth)\s+\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi
     ];
    
    
     
     // Check if email contains rate negotiation keywords (skip extraction)
     const isNegotiation = /(?:rate|rates|pricing|quote|proposal|my rates|your rates|rate card|media kit)\s/gi.test(allContent);
     
     if (isNegotiation) {
       console.log('🔄 [RATE NEGOTIATION DETECTED]', {
         emailId: item.id,
         subject: subject.substring(0, 50) + '...',
         reason: 'Email contains rate negotiation keywords - no deal value extracted'
       });
       return 0;
     }
     
     let maxValue = 0;
     
     for (const pattern of confirmedDealPatterns) {
       let match;
       while ((match = pattern.exec(allContent)) !== null) {
         let value = 0;
         const numStr = match[1];
         const fullMatch = match[0];
         
         // Skip if this specific match looks like a false positive
         if (isLikelyFalsePositive(fullMatch, numStr)) {
           continue;
         }
         
         if (pattern.source.includes('[kK]')) {
           // Handle k notation (thousands)
           value = parseFloat(numStr) * 1000;
         } else {
           // Handle regular dollar amounts, remove commas
           value = parseInt(numStr.replace(/,/g, ''));
         }
         
         // Only consider realistic partnership values ($100 - $10M)
         if (value >= 100 && value <= 10000000 && value > maxValue) {
           maxValue = value;
         }
       }
       // Reset regex for next iteration
       pattern.lastIndex = 0;
     }
     
     // Helper function to detect false positives in confirmed deals
     function isLikelyFalsePositive(fullMatch: string, numStr: string): boolean {
       const lowerMatch = fullMatch.toLowerCase();
       const num = parseInt(numStr.replace(/,/g, ''));
       
       // Skip years (even in deal context)
       if (num >= 2020 && num <= 2030) return true;
       
       // Skip unrealistic deal amounts (too small or too large)
       if (num < 100 || num > 10000000) return true;
       
       // Since we're only looking at confirmed deal patterns, fewer false positives
       // But still check for obvious non-monetary context
       if (lowerMatch.includes('view') || lowerMatch.includes('follower') || 
           lowerMatch.includes('subscriber') || lowerMatch.includes('message')) {
         return true;
       }
       
       return false;
     }
    
         // Debug logging for deal value extraction
     if (maxValue > 0) {
       console.log('💰 [DEAL VALUE EXTRACTED]', {
         emailId: item.id,
         subject: subject.substring(0, 50) + '...',
         extractedValue: maxValue,
         contentSample: allContent.substring(0, 200) + '...'
       });
     } else {
       // Log when no value is found to help debug
       const partnershipTerms = ['partnership', 'collaboration', 'sponsor', 'deal', 'campaign'];
       const hasPartnershipTerms = partnershipTerms.some(term => allContent.toLowerCase().includes(term));
       
       if (hasPartnershipTerms) {
         console.log('🔍 [NO VALUE FOUND]', {
           emailId: item.id,
           subject: subject.substring(0, 50) + '...',
           reason: 'Partnership email detected but no monetary value extracted',
           contentSample: allContent.substring(0, 200) + '...'
         });
       }
     }
     
     return maxValue;
  };

  // Process ALL emails - no separation
  const { partnerships, aiOpportunities } = React.useMemo(() => {
    if (!gmailItems || gmailItems.length === 0) return { partnerships: [], aiOpportunities: [] };
    
    const allPartnerships: Partnership[] = [];
    
    gmailItems.forEach((item, index) => {
      const isPotential = isPartnershipEmail(item);
      
      // Process ALL emails (no skipping)
      
      const messageCount = item.content?.data?.messageCount || item.content?.data?.messages?.length || 1;
      const estimatedValue = extractDealValue(item);
      
      // Determine status based on message count and actual deal value
      let status: Partnership['status'] = 'opportunity';
      
      if (messageCount > 4) {
        status = 'negotiating';
      } else if (messageCount > 2) {
        status = 'inquiry';
      } else if (estimatedValue > 10000 || messageCount > 6) {
        status = 'active';
      }
      
      // Extract brand name more intelligently
      const fromEmail = item.content?.data?.from || '';
      const fromDomain = fromEmail.split('@')[1] || '';
      const brandName = fromDomain.split('.')[0]
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .replace(/\b(com|net|org|io|co|inc|llc)\b/gi, '')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') || 'Unknown Brand';
      
      const partnership: Partnership = {
        id: item.id,
        emailThreadId: item.content?.data?.threadId || item.id,
        brandName,
        subject: item.content?.data?.subject || 'No Subject',
        status,
        estimatedValue,
        lastActivity: new Date(item.publishedAt).getTime(),
        smartNoteIds: [],
        messageCount,
        snippet: item.content?.data?.snippet || '',
        from: item.content?.data?.from || 'Unknown',
        createdAt: new Date(item.publishedAt).getTime(),
        updatedAt: new Date(item.publishedAt).getTime()
      };
      
      // Add ALL emails to partnerships list
      allPartnerships.push(partnership);
    });
    
    // Log partnership detection results for debugging
    console.log('🔍 [ALL EMAILS LOADED]', {
      totalEmails: gmailItems.length,
      partnershipsShown: allPartnerships.length,
      totalPipelineValue: allPartnerships.reduce((sum, p) => sum + p.estimatedValue, 0)
    });

    // Log sample partnerships for debugging
    if (allPartnerships.length > 0) {
      console.log('📧 [ALL EMAILS IN LIST]', 
        allPartnerships.slice(0, 5).map(p => ({
          brandName: p.brandName,
          status: p.status,
          estimatedValue: p.estimatedValue,
          messageCount: p.messageCount,
          subject: p.subject.substring(0, 30) + '...'
        }))
      );
    }

    return { 
      partnerships: allPartnerships, 
      aiOpportunities: [] // Empty since we're showing all in partnerships
    };
  }, [gmailItems]);

  const handleRefresh = async () => {
    await refresh();
    setRefreshCount((c) => c + 1);
  };

  // Calculate metrics based on actual data
  const partnershipMetrics = React.useMemo(() => {
    return {
      activePartnerships: partnerships.filter(p => 
        p.messageCount >= 4 || p.estimatedValue > 1000
      ).length,
      pendingResponses: partnerships.filter(p => {
        // Find the corresponding gmail item to check who sent last message
        const gmailItem = gmailItems.find(item => item.id === p.id);
        return gmailItem ? needsResponse(gmailItem) : false;
      }).length,
      pipelineValue: partnerships.reduce((sum, p) => sum + p.estimatedValue, 0)
    };
  }, [partnerships, gmailItems, needsResponse]);

  const filteredPartnerships = React.useMemo(() => {
    let filtered = partnerships;
    
    // Apply category filter
    switch (filterType) {
      case 'active':
        filtered = partnerships.filter(p => 
          p.messageCount >= 4 || p.estimatedValue > 1000
        );
        break;
      case 'needs_response':
        filtered = partnerships.filter(p => {
          const gmailItem = gmailItems.find(item => item.id === p.id);
          return gmailItem ? needsResponse(gmailItem) : false;
        });
        break;
      case 'deal_value':
        filtered = partnerships.filter(p => p.estimatedValue > 0);
        break;
      case 'all':
      default:
        filtered = partnerships;
        break;
    }
    
    // Apply search filter on top of category filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(p => 
        p.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [partnerships, searchQuery, filterType, gmailItems, needsResponse]);

  const handleUpdateStatus = (partnershipId: string, status: Partnership['status']) => {
    console.log('Update partnership status:', partnershipId, status);
    // TODO: Implement status update in Convex
  };

  const handleUpdatePartnership = (partnershipId: string, updates: Partial<Partnership>) => {
    console.log('Update partnership:', partnershipId, updates);
    // TODO: Implement partnership update
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
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Partnership Hub</h1>
            <p className="text-muted-foreground">
              View and manage all emails, track partnerships, and identify collaboration opportunities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Syncing...' : 'Sync Gmail'}
            </Button>
          </div>
        </div>

        {/* Status Messages */}
        {refreshError && (
          <div className="text-red-500 text-sm mb-2">Error: {refreshError}</div>
        )}
        {refreshSuccess && (
          <div className="text-green-500 text-sm mb-2">Gmail synced successfully!</div>
        )}

        {/* Search and Filter Status */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={filterType === 'all' 
                ? "Search emails, brands, or status..." 
                : `Search in ${filterType.replace('_', ' ')} emails...`
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {filterType !== 'all' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Filtered by:</span>
              <Badge variant="outline" className="bg-primary/10">
                {filterType.replace('_', ' ')}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFilterType('all')}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Metrics Cards */}
        <PartnershipMetrics 
          totalEmails={partnerships.length}
          activePartnerships={partnershipMetrics.activePartnerships}
          pendingResponses={partnershipMetrics.pendingResponses}
          pipelineValue={partnershipMetrics.pipelineValue}
          activeFilter={filterType}
          onFilterChange={setFilterType}
        />
      </div>

      {/* Two-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Active Partnerships */}
        <div className="w-1/2 border-r border-border p-4 overflow-y-auto">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-foreground">
                {filterType === 'all' ? 'All Emails' : 
                 filterType === 'active' ? 'Active Discussions' :
                 filterType === 'needs_response' ? 'Needs Response' :
                 filterType === 'deal_value' ? 'Emails with Deal Values' : 'Emails'}
              </h2>
              <Badge variant="outline">{filteredPartnerships.length}</Badge>
            </div>
            {filterType !== 'all' && (
              <p className="text-sm text-muted-foreground">
                Showing {filteredPartnerships.length} of {partnerships.length} emails
              </p>
            )}
          </div>
          <ActivePartnerships 
            partnerships={filteredPartnerships}
            selectedPartnership={selectedPartnership}
            onSelectPartnership={setSelectedPartnership}
            onUpdateStatus={handleUpdateStatus}
            loading={gmailLoading}
            hideHeader={true}
          />
        </div>

        {/* Right Column - Partnership Detail Panel */}
        <div className="w-1/2 p-4 overflow-y-auto">
          <PartnershipDetailPanel 
            partnership={selectedPartnership}
            onUpdatePartnership={handleUpdatePartnership}
            gmailData={selectedPartnership ? gmailItems.find(item => item.id === selectedPartnership.id)?.convexData : undefined}
          />
        </div>
      </div>
    </div>
  );
} 