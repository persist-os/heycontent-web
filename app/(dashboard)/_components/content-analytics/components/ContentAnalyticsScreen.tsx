'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { FirebaseApp } from 'firebase/app';
import { app } from '@/app/lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';

// Import components
import { YouTubeCard } from '../cards/YouTubeCard';
import { InstagramCard, InstagramCardPlaceholder } from '../cards/InstagramCard';
import { GmailCard } from '../cards/GmailCard';
import { FilterDropdown } from '../filters/FilterDropdown';
import { EmailTypeFilter } from '../filters/EmailTypeFilter';
import { GmailModal } from '../modals/GmailModal';
import { InstagramModal } from '../modals/InstagramModal';
import { YoutubeModal } from '../modals/YoutubeModal';
import { LoadingState } from '../loading/LoadingState';
import { Header } from '../header/Header';

// Import types and utilities
import { AnyContentItem, TimeRange, SortOption, PlatformType, EmailTypeFilter as TEmailTypeFilter, YouTubeContentItem, InstagramContentItem, GmailContentItem, PlatformFilterType } from '../types';
import { sortAndFilterContent, getMockGmailItems, getMockInstagramItem, getMockYouTubeItem } from '../utils';

// Define the type for the imported app variable
const typedApp: FirebaseApp | undefined = app;

export function ContentAnalyticsScreen() {
  // State management
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('all');
  const [selectedEmailType, setSelectedEmailType] = useState<TEmailTypeFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterRef, setFilterRef] = useState<HTMLDivElement | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterType, setFilterType] = useState<PlatformFilterType>('all');
  const [selectedContent, setSelectedContent] = useState<AnyContentItem | null>(null);
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

  // Console log YouTube data for debugging
  useEffect(() => {
    console.log('YouTube Videos from Convex:', youtubeVideos);
  }, [youtubeVideos]);
  
  const allContentItems: AnyContentItem[] | undefined | null = useMemo(() => {
    // Combine actual fetched data from all sources
    const items: AnyContentItem[] = [];
    
    // Add YouTube videos if available - using direct assignment rather than spread
    if (youtubeVideos && Array.isArray(youtubeVideos) && youtubeVideos.length > 0) {
      // Log each YouTube item for debugging
      console.log(`Found ${youtubeVideos.length} real YouTube videos`);
      items.push(...youtubeVideos);
    } else {
      console.log('No YouTube videos found or data is not an array:', youtubeVideos);
    }
    
    // We'll add other platform data here as they become available
    // For now, we're only using real YouTube data
    
    return items;
  }, [youtubeVideos]); // Update when any data source changes
  
  // Mock data for other platforms - will replace with real data later
  const mockInstagramItem = getMockInstagramItem('1');
  const mockGmailItems = getMockGmailItems(10);

  const combinedContent = useMemo(() => {
    // Start with an empty array
    const combinedItems: AnyContentItem[] = [];
    
    // IMPORTANT: Directly use YouTube videos from the query if available
    if (youtubeVideos && Array.isArray(youtubeVideos) && youtubeVideos.length > 0) {
      console.log('Adding real YouTube videos to combinedContent:', youtubeVideos.length);
      combinedItems.push(...youtubeVideos);
    } else {
      // Only add mock YouTube data if we don't have real data AND we're not still loading
      if (youtubeVideos !== undefined) {
        console.log('Adding mock YouTube data as fallback');
        combinedItems.push(getMockYouTubeItem('mock-yt-fallback'));
      }
    }
    
    // Always add mock Instagram data for now
    combinedItems.push(getMockInstagramItem('mock-insta'));
    
    // Always add mock Gmail data for now
    combinedItems.push(...getMockGmailItems(2));
    
    console.log('Final combined content items:', combinedItems.length);
    return combinedItems;
  }, [youtubeVideos]);

  // Navigate to chat with content context
  const discussContent = (item: AnyContentItem) => {
    const context = {
      platform: item.platform,
      contentId: item.id,
      // Add other relevant context, e.g., title, key metrics
    };
    const encodedContext = encodeURIComponent(JSON.stringify(context));
    router.push(`/chat?contentContext=${encodedContext}`);
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

  // Create a special set of items that directly includes YouTube videos
  const youtubeItemsArray = youtubeVideos && Array.isArray(youtubeVideos) ? youtubeVideos : [];
  
  // Log YouTube items before filtering
  console.log('Direct YouTube items available:', youtubeItemsArray.length, youtubeItemsArray);
  
  // Apply normal filtering for non-YouTube content
  const filteredContent = selectedPlatform === 'youtube' 
    ? [...youtubeItemsArray] // If YouTube tab selected, directly use YouTube items 
    : sortAndFilterContent(
        combinedContent,
        selectedPlatform,
        selectedEmailType,
        sortBy,
        timeRange
      );
  
  // Final display items - ensure YouTube items are always included when YouTube tab is selected
  const displayItems = selectedPlatform === 'youtube' 
    ? filteredContent 
    : selectedPlatform === 'all' 
      ? [...filteredContent, ...youtubeItemsArray] // Include YouTube items when 'all' is selected
      : filteredContent;
  
  // Log the final items to be displayed
  console.log('Final displayItems:', displayItems.length, 
    selectedPlatform, 
    displayItems.map(item => item.platform));


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
          <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setSelectedPlatform(value as PlatformType)}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Platforms</TabsTrigger>
              <TabsTrigger value="gmail">Email</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
              {/* Add other platforms as needed */}
            </TabsList>

            {/* AI Analysis Section - Show for YouTube */}
            {selectedPlatform === 'youtube' && (
              <div className="mb-6">
                <div className="p-4 bg-heycontent-light-yellow rounded-lg text-black dark:text-black">
                  <h3 className="font-semibold mb-2">AI Analysis</h3>
                  <p className="text-sm">Get actionable insights and recommendations for your YouTube content. (Coming soon)</p>
                </div>
              </div>
            )}
            {selectedPlatform === 'instagram' && (
              <div className="mb-6">
                <div className="p-4 bg-gradient-to-r from-pink-200 via-purple-200 to-yellow-200 rounded-lg text-black dark:text-black">
                  <h3 className="font-semibold mb-2">AI Instagram Insights</h3>
                  <p className="text-sm">Discover trends, best posting times, and engagement drivers for your Instagram content. (Coming soon)</p>
                </div>
              </div>
            )}
            {selectedPlatform === 'gmail' && (
              <div className="mb-6">
                <div className="p-4 bg-gradient-to-r from-blue-100 via-white to-green-100 rounded-lg text-black dark:text-black">
                  <h3 className="font-semibold mb-2">AI Gmail Insights</h3>
                  <p className="text-sm">See partnership opportunities, response rates, and actionable email analytics. (Coming soon)</p>
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
                <>
                  {displayItems.map((item) => {
                    // Debug each item being rendered
                    console.log(`Rendering item for platform: ${item.platform}`, item);
                    
                    if (item.platform === 'instagram') {
                      return (
                        <InstagramCard
                          key={item.id}
                          item={item as InstagramContentItem}
                          onDiscussContent={() => discussContent(item)}
                          onViewDetailedAnalytics={() => setSelectedContent(item)}
                        />
                      );
                    } else if (item.platform === 'youtube') {
                      // Debug YouTube item in detail
                      console.log('Rendering YouTube item:', {
                        id: item.id,
                        title: item.content?.title,
                        thumbnailUrl: item.content?.thumbnailUrl,
                        metrics: item.metrics
                      });
                      
                      return (
                        <YouTubeCard
                          key={item.id}
                          item={item as YouTubeContentItem}
                          onDiscussContent={() => discussContent(item)}
                          onViewDetailedAnalytics={() => setSelectedContent(item)}
                        />
                      );
                    } else if (item.platform === 'gmail') {
                      return (
                        <GmailCard
                          key={item.id}
                          item={item as GmailContentItem}
                          onDiscussContent={() => discussContent(item)}
                          onViewDetailedAnalytics={() => setSelectedContent(item)}
                        />
                      );
                    }
                    return null; // Should not happen if platform is always defined
                  })}
                </>
              ) : (
                <div className="col-span-full text-center py-10 text-text-gray dark:text-gray-400">
                  No content found matching your criteria.
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      {/* Detailed Analytics Modal - Platform Specific */}
      {selectedContent && (
        <>
          {selectedContent.platform === 'gmail' && (
            <GmailModal
              selectedContent={selectedContent as GmailContentItem}
              onClose={() => setSelectedContent(null)}
              onDiscussContent={() => discussContent(selectedContent)}
            />
          )}
          {selectedContent.platform === 'instagram' && (
            <InstagramModal
              selectedContent={selectedContent as InstagramContentItem}
              onClose={() => setSelectedContent(null)}
              onDiscussContent={() => discussContent(selectedContent)}
            />
          )}
          {selectedContent.platform === 'youtube' && (
            <YoutubeModal
              selectedContent={selectedContent as YouTubeContentItem}
              onClose={() => setSelectedContent(null)}
              onDiscussContent={() => discussContent(selectedContent)}
            />
          )}
          {/* Optional: Fallback or error case if platform is unexpected */}
          {/* {['gmail', 'instagram', 'youtube'].indexOf(selectedContent.platform) === -1 && (
            <div>Error: Unknown content platform for detailed view.</div>
          )} */}
        </>
      )}
    </div>
  );
}
