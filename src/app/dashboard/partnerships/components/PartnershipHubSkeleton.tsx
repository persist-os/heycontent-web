'use client'

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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
  Users,
  X,
  ArrowRight
} from 'lucide-react';

// Help system imports
import { EnhancedHelpButton } from '@/components/ui/enhanced-help-button';
import { InteractiveTooltip } from '@/components/ui/interactive-tooltip';
import { interactiveTours } from '@/helpContent/interactiveTours';

// Import the actual components to reuse them
import { PartnershipDetailPanel } from './PartnershipDetailPanel';
import { CategoryEmailList } from './CategoryEmailList';
import { Partnership } from '../types';

export type MetricFilter = 'all' | 'active' | 'pending' | 'brand-deals';

interface PartnershipHubSkeletonProps {
  isLoading?: boolean;
  showPreview?: boolean;
  onConnectGmail?: () => void;
}

// Mock data that matches the real data structure
const mockPartnerships: Partnership[] = [
  {
    id: 'mock-1',
    emailThreadId: 'thread-1',
    brandName: 'TechCorp',
    subject: 'Partnership Proposal for Q1 Campaign',
    from: 'partnerships@techcorp.com',
    snippet: 'Hi there! We love your content and would like to explore a potential partnership opportunity...',
    messageCount: 3,
    lastActivity: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    estimatedValue: 5000,
    status: 'active' as const,
    category: 'partnership' as const,
    smartNoteIds: [],
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000 // 2 days ago
  },
  {
    id: 'mock-2',
    emailThreadId: 'thread-2',
    brandName: 'FashionBrand',
    subject: 'Influencer Collaboration Opportunity',
    from: 'creator@fashionbrand.com',
    snippet: 'Your aesthetic perfectly aligns with our brand values. Let\'s discuss a collaboration...',
    messageCount: 2,
    lastActivity: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    estimatedValue: 3200,
    status: 'negotiating' as const,
    category: 'media' as const,
    smartNoteIds: [],
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000 // 1 day ago
  },
  {
    id: 'mock-3',
    emailThreadId: 'thread-3',
    brandName: 'StartupX',
    subject: 'Content Creation Partnership',
    from: 'hello@startupx.io',
    snippet: 'We\'re launching a new product and would love to have you create content about it...',
    messageCount: 1,
    lastActivity: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    estimatedValue: 1500,
    status: 'inquiry' as const,
    category: 'business' as const,
    smartNoteIds: [],
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000, // 4 days ago
    updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000 // 3 days ago
  },
  {
    id: 'mock-4',
    emailThreadId: 'thread-4',
    brandName: 'BigCompany',
    subject: 'Long-term Brand Ambassador Program',
    from: 'ambassadors@bigcompany.com',
    snippet: 'We\'ve been following your work and are impressed with your engagement rates...',
    messageCount: 5,
    lastActivity: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    estimatedValue: 8000,
    status: 'active' as const,
    category: 'partnership' as const,
    smartNoteIds: [],
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000 // 5 days ago
  },
  {
    id: 'mock-5',
    emailThreadId: 'thread-5',
    brandName: 'LocalBusiness',
    subject: 'Social Media Collaboration',
    from: 'social@localbusiness.com',
    snippet: 'As a local business, we\'d love to support creators in our community...',
    messageCount: 1,
    lastActivity: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    estimatedValue: 500,
    status: 'opportunity' as const,
    category: 'community' as const,
    smartNoteIds: [],
    createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
    updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days ago
  }
];

const mockPartnershipMetrics = {
  activePartnerships: 2,
  pendingResponses: 3,
  pipelineValue: 18200
};

export function PartnershipHubSkeleton({ 
  isLoading = false, 
  showPreview = false, 
  onConnectGmail 
}: PartnershipHubSkeletonProps) {
  const [isOverlayDismissed, setIsOverlayDismissed] = React.useState(false);
  
  // Help system state
  const [interactiveTourOpen, setInteractiveTourOpen] = React.useState(false);

  // State management (same as real component)
  const [selectedPartnership, setSelectedPartnership] = React.useState<Partnership | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<MetricFilter>('all');
  const [expandedCategories, setExpandedCategories] = React.useState({
    partnership: true,
    media: true, 
    business: true,
    community: true
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Header Skeleton */}
        <div className="border-b border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Search and Filter Skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Skeleton className="h-10 w-full pl-10" />
            </div>
          </div>

          {/* Metrics Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column Skeleton */}
          <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-border p-4">
            <div className="mb-4">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="w-full lg:w-1/2 p-4">
            <Skeleton className="h-6 w-40 mb-4" />
            <Card className="p-6">
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Preview mode - use exact same structure as PartnershipHub.tsx
  if (showPreview) {
    // Calculate brand deals count dynamically (same logic as real component)
    const brandDealsCount = mockPartnerships.filter(partnership => 
      partnership.estimatedValue > 500 || 
      partnership.status === 'negotiating' || 
      partnership.messageCount > 5
    ).length;

    // Filter partnerships based on active filter (same logic as real component)
    const filteredPartnerships = mockPartnerships.filter(partnership => {
      switch (activeFilter) {
        case 'active':
          return partnership.status === 'active' || partnership.status === 'negotiating' || 
                 partnership.estimatedValue > 1000 || partnership.messageCount > 3;
        case 'pending':
          return partnership.status === 'opportunity' || partnership.status === 'inquiry';
        case 'brand-deals':
          return partnership.estimatedValue > 500 || 
                 partnership.status === 'negotiating' || 
                 partnership.messageCount > 5;
        case 'all':
        default:
          return true;
      }
    });

    // Group emails by category (simplified for mock data)
    const groupedEmails = filteredPartnerships.reduce((acc, partnership) => {
      const category = partnership.category || 'partnership';
      if (!acc[category]) acc[category] = [];
      acc[category].push(partnership);
      return acc;
    }, {} as Record<string, Partnership[]>);

    // Event handlers (same as real component)
    const handleToggleCategory = (category: string) => {
      setExpandedCategories(prev => ({
        ...prev,
        [category]: !prev[category]
      }));
    };

    const handleSelectPartnership = (partnership: Partnership) => {
      setSelectedPartnership(partnership);
    };

    const handleUpdatePartnership = (partnershipId: string, updates: Partial<Partnership>) => {
      // Mock handler - do nothing in preview mode
      console.log('Mock update partnership:', partnershipId, updates);
    };

    return (
      <TooltipProvider>
        <div className="min-h-screen flex flex-col bg-background relative">
          {/* Use exact same structure as PartnershipHub.tsx */}
          <div className={
            `opacity-80 transition-all duration-300 ${!isOverlayDismissed ? 'blur-sm pointer-events-none select-none' : ''}`
          }>
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
                    <div className="pointer-events-auto">
                      <EnhancedHelpButton 
                        onInteractiveTour={() => setInteractiveTourOpen(true)}
                      />
                    </div>
                  </div>
                </div>

                {/* Metrics and Button Row - Same as real component */}
                <div className="flex items-center justify-between w-full pointer-events-none">
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
                              <div className="text-xl font-bold text-foreground">{mockPartnerships.length}</div>
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
                              <div className="text-xl font-bold text-foreground">{mockPartnershipMetrics.activePartnerships}</div>
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
                              <div className="text-xl font-bold text-foreground">{mockPartnershipMetrics.pendingResponses}</div>
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
                      disabled
                      className="flex items-center gap-2 justify-center shrink-0 rounded-full border-2 border-border bg-background hover:bg-muted focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-foreground font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      data-find-opportunities-button
                      style={{
                        width: '219px',
                        height: '43px',
                      }}
                    >
                      <RefreshCw className="w-4 h-4" />
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
                        {mockPartnershipMetrics.pipelineValue >= 1000000 ? `$${(mockPartnershipMetrics.pipelineValue / 1000000).toFixed(1)}M` :
                         mockPartnershipMetrics.pipelineValue >= 1000 ? `$${(mockPartnershipMetrics.pipelineValue / 1000).toFixed(1)}K` :
                         mockPartnershipMetrics.pipelineValue === 0 ? '$0' : `$${mockPartnershipMetrics.pipelineValue}`}
                      </div>
                      <div className="text-xs text-muted-foreground">Deal Value</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area - Same structure as real component */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden pointer-events-none">
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
                          (Filtered: {filteredPartnerships.length} of {mockPartnerships.length})
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
                        disabled
                      />
                    </div>
                  </div>

                  {/* Use the real CategoryEmailList component with mock data */}
                  <CategoryEmailList
                    partnerships={filteredPartnerships}
                    groupedEmails={groupedEmails}
                    expandedCategories={expandedCategories}
                    onToggleCategory={handleToggleCategory}
                    onSelectPartnership={handleSelectPartnership}
                    selectedPartnershipId={selectedPartnership?.id}
                  />
                </div>
              </div>

              {/* Right Column - Use real PartnershipDetailPanel component */}
              <div className="w-full lg:w-1/2 overflow-y-auto">
                <PartnershipDetailPanel 
                  partnership={selectedPartnership}
                  onUpdatePartnership={handleUpdatePartnership}
                  gmailData={undefined} // No Gmail data in preview
                  onCategoryChanged={() => {}} // No-op in preview
                  onPartnershipDeleted={() => {}} // No-op in preview
                  userEmail="preview@example.com"
                />
              </div>
            </div>
          </div>

          {/* Floating Connect Card - Dismissable */}
          {!isOverlayDismissed && (
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
              <Card className="p-8 text-center max-w-md mx-auto shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
                {/* Dismiss Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOverlayDismissed(true)}
                  className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-muted pointer-events-auto"
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-3">Ready to unlock your partnership potential? 🚀</h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  Connect your Gmail to automatically discover amazing brand collaboration opportunities, track conversations with potential partners, and build your creator business like a pro!
                </p>
                <Button 
                  onClick={onConnectGmail}
                  className="bg-primary hover:bg-primary/90 w-full mb-4 pointer-events-auto"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Connect Gmail & Find Opportunities
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-xs pointer-events-auto flex items-center justify-center gap-2"
                  onClick={() => setIsOverlayDismissed(true)}
                >
                  Here's a sneak peek of what's coming your way
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Card>
            </div>
          )}

          {/* Interactive Tour */}
          <InteractiveTooltip
            isOpen={interactiveTourOpen}
            onClose={() => setInteractiveTourOpen(false)}
            steps={interactiveTours.partnershipHub}
            title="Partnership Hub Features Tour"
            autoPlay={false}
          />
        </div>
      </TooltipProvider>
    );
  }

  return null;
} 