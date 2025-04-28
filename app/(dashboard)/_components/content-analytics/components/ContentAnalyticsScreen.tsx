'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { FirebaseApp } from 'firebase/app';
import { app } from '@/app/lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';

// Import components
import { ContentCard } from '../cards/ContentCard';
import { YouTubeCard } from '../cards/YouTubeCard';
import { FilterDropdown } from '../filters/FilterDropdown';
import { EmailTypeFilter } from '../filters/EmailTypeFilter';
import { DetailedAnalyticsModal } from '../modals/DetailedAnalyticsModal';
import { LoadingState } from '../loading/LoadingState';
import { Header } from '../header/Header';

// Import types and utilities
import { ContentItem, TimeRange, SortOption, FilterType, Platform, EmailType } from '../types';
import { sortAndFilterContent, getMockGmailItems } from '../utils';

// Define the type for the imported app variable
const typedApp: FirebaseApp | undefined = app;

export function ContentAnalyticsScreen() {
  // State management
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('all');
  const [selectedEmailType, setSelectedEmailType] = useState<EmailType>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterRef, setFilterRef] = useState<HTMLDivElement | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const router = useRouter();

  // Add Firebase auth listener
  useEffect(() => {
    // Check if app is initialized before using it
    if (typedApp) {
      const auth = getAuth(typedApp);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
        setAuthLoading(false);
      });
      return () => unsubscribe();
    } else {
      console.error("Firebase app not initialized.");
      setAuthLoading(false);
    }
  }, []);

  // Handle click outside filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef && !filterRef.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterRef]);

  // Fetch data from Convex - Use firebaseUser.uid
  const youtubeVideos = useQuery(
    api.youtubeQueries.listUserYouTubeVideos,
    !authLoading && firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );

  const allContentItems: ContentItem[] | undefined | null = youtubeVideos as ContentItem[] | undefined | null;
  const mockGmailItems: ContentItem[] = getMockGmailItems();

// Mock YouTube ContentItem for testing
const mockYouTubeItem: ContentItem = {
  id: 'mock-youtube-1',
  platform: 'youtube',
  type: 'video',
  content: {
    text: 'How to Grow on YouTube in 2025',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  metrics: {
    views: 12345,
    engagement: 87,
    likes: 543,
    comments: 67,
    shares: 12,
  },
  performance: {
    trend: 'up',
    percentageChange: 12.5,
  },
  publishedAt: '2025-04-01T12:00:00Z',
};

const combinedContent = [mockYouTubeItem, ...(allContentItems || []), ...mockGmailItems]; // Always show mock YT

  // Navigate to chat with content context
  const discussContent = (item: ContentItem) => {
    const context = {
      contentType: item.type,
      platform: item.platform,
      metrics: item.metrics,
      performance: item.performance,
      content: item.content
    };
    router.push(`/chat?context=${encodeURIComponent(JSON.stringify(context))}&type=content&id=${item.id}`);
  };

  // Reset filters
  const resetFilters = () => {
    setSortBy('date');
    setFilterType('all');
    setTimeRange('7d');
    setIsFilterOpen(false);
  };

  // Render loading state if needed
  if (authLoading) {
    return <LoadingState type="auth" />;
  }

  if (!firebaseUser) {
    return <LoadingState type="error" />;
  }

  if (youtubeVideos === undefined) {
    return <LoadingState type="content" />;
  }

  // Filter and sort content
  const displayItems = sortAndFilterContent(
    combinedContent,
    filterType,
    selectedPlatform,
    selectedEmailType,
    sortBy
  );

  return (
    <div className="relative">
      {/* Header */}
      <Header
        timeRange={timeRange}
        isFilterOpen={isFilterOpen}
        onTimeRangeChange={setTimeRange}
        onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
        filterRef={setFilterRef}
      />

      {/* Filter Dropdown */}
      <FilterDropdown
        isOpen={isFilterOpen}
        timeRange={timeRange}
        sortBy={sortBy}
        filterType={filterType}
        onTimeRangeChange={setTimeRange}
        onSortByChange={setSortBy}
        onFilterTypeChange={setFilterType}
        onReset={resetFilters}
      />

      {/* Content */} 
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Platform Tabs */} 
          <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setSelectedPlatform(value as Platform)}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Platforms</TabsTrigger>
              <TabsTrigger value="gmail">Email</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
              <TabsTrigger value="tiktok">TikTok</TabsTrigger>
            </TabsList>

            {/* AI Analysis Section - Show for YouTube */}
            {selectedPlatform === 'youtube' && (
              <div className="mb-6">
                {/* Placeholder for AI-driven insights. Replace with real AI analysis when available. */}
                <div className="p-4 bg-heycontent-light-yellow rounded-lg text-black dark:text-black">
                  <h3 className="font-semibold mb-2">AI Analysis</h3>
                  <p className="text-sm">Get actionable insights and recommendations for your YouTube content. (Coming soon)</p>
                </div>
              </div>
            )}

            {/* Email Type Filter - Only show when Gmail is selected */} 
            {selectedPlatform === 'gmail' && (
              <EmailTypeFilter
                selectedEmailType={selectedEmailType}
                onEmailTypeChange={setSelectedEmailType}
              />
            )}

            {/* Content Grid */} 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayItems.length > 0 ? (
                displayItems.map((item) => (
                  item.platform === 'youtube' ? (
                    <YouTubeCard
                      key={item.id}
                      item={item}
                      onDiscussContent={discussContent}
                      onViewDetailedAnalytics={() => setSelectedContent(item)}
                    />
                  ) : (
                    <ContentCard
                      key={item.id}
                      item={item}
                      onDiscussContent={discussContent}
                      onViewDetailedAnalytics={() => setSelectedContent(item)}
                    />
                  )
                ))
              ) : (
                // Show message when no content matches filters
                <div className="col-span-full text-center py-10 text-text-gray dark:text-gray-400">
                  No content found matching your criteria.
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      {/* Detailed Analytics Modal */} 
      {selectedContent && (
        <DetailedAnalyticsModal
          selectedContent={selectedContent}
          onClose={() => setSelectedContent(null)}
          onDiscussContent={discussContent}
        />
      )}
    </div>
  );
}
