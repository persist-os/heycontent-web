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

  // Fetch Gmail threads from Convex
  const gmailThreads = useQuery(
    api.gmailQueries.listUserGmailThreads,
    !authLoading && firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );

  // Fetch Instagram posts from Convex
  const instagramPosts = useQuery(
    api.instagramQueries.getAllInstagramPosts,
    !authLoading && firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );

  // Console log data for debugging
  useEffect(() => {
    console.log('YouTube Videos from Convex:', youtubeVideos);
    console.log('Gmail Threads from Convex:', gmailThreads);
    console.log('Instagram Posts from Convex:', instagramPosts);
  }, [youtubeVideos, gmailThreads, instagramPosts]);
  
  // Combine all real content items from all platforms
  const allContentItems: AnyContentItem[] | undefined | null = useMemo(() => {
    const items: AnyContentItem[] = [];
    // Add YouTube videos
    if (youtubeVideos && Array.isArray(youtubeVideos) && youtubeVideos.length > 0) {
      items.push(...youtubeVideos);
    }
    // Add Gmail threads
    if (gmailThreads && Array.isArray(gmailThreads) && gmailThreads.length > 0) {
      items.push(...gmailThreads);
    }
    // Add Instagram posts, mapping to InstagramContentItem
    if (instagramPosts && Array.isArray(instagramPosts) && instagramPosts.length > 0) {
      const mappedInstagram = instagramPosts.map((post: any): InstagramContentItem => {
        // For carousels, use the first IMAGE child's media_url if present, else first child's media_url, else post.data.media_url
        let mediaUrl = post.data.media_url;
        if (
          post.data.media_type === 'CAROUSEL_ALBUM' ||
          post.data.media_type === 'carousel'
        ) {
          if (
            post.data.children &&
            Array.isArray(post.data.children) &&
            post.data.children.length > 0
          ) {
            // Prefer first IMAGE child
            const imageChild = post.data.children.find((child: any) => child.media_type === 'IMAGE');
            if (imageChild && imageChild.media_url) {
              mediaUrl = imageChild.media_url;
            } else if (post.data.children[0].media_url) {
              mediaUrl = post.data.children[0].media_url;
            }
          } else {
            mediaUrl = post.data.media_url;
          }
        }
        return {
          id: post._id,
          platform: 'instagram',
          publishedAt: post.data.timestamp ? new Date(post.data.timestamp).toISOString() : '',
          content: {
            text: post.data.caption,
            mediaUrl,
            mediaType: post.data.media_type === 'IMAGE' ? 'image' : post.data.media_type === 'VIDEO' ? 'video' : 'carousel',
            thumbnailUrl: post.data.thumbnail_url,
            permalink: post.data.permalink,
          },
          metrics: {
            impressions: undefined, // Not available in schema
            reach: undefined, // Not available in schema
            likes: post.data.like_count ?? 0,
            comments: post.data.comment_count ?? 0,
            shares: undefined, // Not available in schema
          }
        };
      });
      items.push(...mappedInstagram);
    }
    return items;
  }, [youtubeVideos, gmailThreads, instagramPosts]);
  
  // Remove mockInstagramItem and mockGmailItems

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
    
    // Add real Gmail data if available
    if (gmailThreads && Array.isArray(gmailThreads) && gmailThreads.length > 0) {
      console.log('Adding real Gmail threads to combinedContent:', gmailThreads.length);
      combinedItems.push(...gmailThreads);
    } else {
      // Only add mock Gmail data if we don't have real data AND we're not still loading
      if (gmailThreads !== undefined) {
        console.log('Adding mock Gmail data as fallback');
        combinedItems.push(...getMockGmailItems(2));
      }
    }
    
    // No more mock Instagram data; use real data from allContentItems
    console.log('Final combined content items:', combinedItems.length);
    return combinedItems;
  }, [youtubeVideos, gmailThreads, instagramPosts, allContentItems]);

  // Navigate to chat with content context
  const discussContent = (item: AnyContentItem) => {
    // Create a context object with the basic content info
    const context = {
      platform: item.platform,
      contentId: item.id,
      // Include analysis if it exists
      analysis: (item as any).aiAnalysis || null,
      // Include title if available
      title: item.platform === 'youtube' 
        ? (item as YouTubeContentItem).content?.title
        : item.platform === 'instagram'
          ? (item as InstagramContentItem).content?.text
          : (item as GmailContentItem).content?.subject
    };
    
    console.log('Sending to chat with context:', context);
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
    return <LoadingState type="auth" />
  }

  if (!firebaseUser) {
    return <LoadingState type="error" />;
  }

  if (youtubeVideos === undefined || gmailThreads === undefined) {
    return <LoadingState type="content" />;
  }

  // Create arrays of platform-specific items
  const youtubeItemsArray = youtubeVideos && Array.isArray(youtubeVideos) ? youtubeVideos : [];
  const gmailItemsArray = gmailThreads && Array.isArray(gmailThreads) ? gmailThreads : [];
  const instagramItemsArray = allContentItems && Array.isArray(allContentItems)
    ? allContentItems.filter(item => item.platform === 'instagram')
    : [];

  // Log platform items for debugging
  console.log('Direct YouTube items available:', youtubeItemsArray.length, youtubeItemsArray);
  console.log('Direct Gmail items available:', gmailItemsArray.length, gmailItemsArray);
  console.log('Direct Instagram items available:', instagramItemsArray.length, instagramItemsArray);

  // Apply filtering based on selected platform
  let filteredContent: AnyContentItem[] = [];

  if (selectedPlatform === 'youtube') {
    filteredContent = [...youtubeItemsArray];
  } else if (selectedPlatform === 'gmail') {
    filteredContent = [...gmailItemsArray];
  } else if (selectedPlatform === 'instagram') {
    filteredContent = [...instagramItemsArray];
  } else {
    // 'all' tab or fallback: use combined content with sorting and filtering
    filteredContent = sortAndFilterContent(
      combinedContent,
      selectedPlatform,
      selectedEmailType,
      sortBy,
      timeRange
    );
  }
  
  // Final display items
  const displayItems = filteredContent;
  
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
