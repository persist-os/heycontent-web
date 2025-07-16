'use client'

import React from 'react';
import { Mail } from 'lucide-react';

// Reusable components
import { PageSkeleton } from '@/app/dashboard/partnerships/components/loading-skeleton';
import { ConnectionOverlay } from '@/app/dashboard/partnerships/components/connection-overlay';
import { PartnershipHubUI } from './PartnershipHubUI';
import { interactiveTours } from '@/helpContent/interactiveTours';

// Utils
import { getMockData } from '../utils/mockData';
import { Partnership } from '../types';

export type MetricFilter = 'all' | 'active' | 'pending' | 'brand-deals';

interface PartnershipHubSkeletonProps {
  isLoading?: boolean;
  showPreview?: boolean;
  onConnectGmail?: () => void;
}

export function PartnershipHubSkeleton({ 
  isLoading = false, 
  showPreview = false, 
  onConnectGmail 
}: PartnershipHubSkeletonProps) {
  const [isOverlayDismissed, setIsOverlayDismissed] = React.useState(false);
  const [interactiveTourOpen, setInteractiveTourOpen] = React.useState(false);
  
  // State management for preview mode
  const [selectedPartnership, setSelectedPartnership] = React.useState<Partnership | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<MetricFilter>('all');
  const [expandedCategories, setExpandedCategories] = React.useState({
    partnership: true,
    media: true, 
    business: true,
    community: true
  });

  // Simple loading skeleton
  if (isLoading) {
    return <PageSkeleton />;
  }

  // Preview mode using shared components
  if (showPreview) {
    const { partnerships, partnershipMetrics, brandDealsCount, groupedEmails } = getMockData();
    
    // Filter partnerships based on active filter
    const filteredPartnerships = partnerships.filter(partnership => {
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

    // Filter grouped emails to match filtered partnerships
    const filteredGroupedEmails = Object.keys(groupedEmails).reduce((acc, category) => {
      const filteredIds = new Set(filteredPartnerships.map(p => p.id));
      acc[category] = groupedEmails[category].filter(partnership => filteredIds.has(partnership.id));
      return acc;
    }, {} as Record<string, Partnership[]>);

    return (
      <div className="min-h-screen flex flex-col bg-background relative">
        {/* Blurred UI when overlay is visible */}
        <div className={`transition-all duration-300 ${!isOverlayDismissed ? 'opacity-80 blur-sm pointer-events-none select-none' : ''}`}>
          <PartnershipHubUI
            partnerships={partnerships}
            filteredPartnerships={filteredPartnerships}
            groupedEmails={filteredGroupedEmails}
            partnershipMetrics={partnershipMetrics}
            brandDealsCount={brandDealsCount}
            userEmail="preview@example.com"
            selectedPartnership={selectedPartnership}
            searchQuery={searchQuery}
            activeFilter={activeFilter}
            expandedCategories={expandedCategories}
            disabled={true} // Disable interactions in preview
            onSearchChange={setSearchQuery}
            onFilterChange={setActiveFilter}
            onToggleCategory={(category) => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
            onSelectPartnership={setSelectedPartnership}
            onUpdatePartnership={() => {}} // No-op in preview
            onInteractiveTour={() => setInteractiveTourOpen(true)}
            interactiveTourOpen={interactiveTourOpen}
            onCloseInteractiveTour={() => setInteractiveTourOpen(false)}
            interactiveTours={interactiveTours}
          />
        </div>

        {/* Connection overlay */}
        <ConnectionOverlay
          isVisible={!isOverlayDismissed}
          onDismiss={() => setIsOverlayDismissed(true)}
          onConnect={onConnectGmail || (() => {})}
          icon={<Mail className="w-8 h-8 text-white" />}
          title="Ready to unlock your partnership potential? 🚀"
          description="Connect your Gmail to automatically discover amazing brand collaboration opportunities, track conversations with potential partners, and build your creator business like a pro!"
          connectButtonText="Connect Gmail & Find Opportunities"
        />
      </div>
    );
  }

  return null;
} 