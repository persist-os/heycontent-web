'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { FirebaseApp } from 'firebase/app';
import { getFirebaseApp, getFirebaseAuth } from '@/app/lib/firebase'; // Only call these inside functions or useEffect
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

export function ContentAnalyticsScreen() {
  // State management
  const [typedApp, setTypedApp] = useState<FirebaseApp | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTypedApp(getFirebaseApp());
    }
  }, []);

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
    if (!typedApp) return;
    const auth = getAuth(typedApp);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [typedApp]);

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
  
  // Map YouTube items
  const mappedYouTubeItems: YouTubeContentItem[] = useMemo(() => {
    if (youtubeVideos && Array.isArray(youtubeVideos)) {
      return youtubeVideos.map((video: any) => ({
        id: video._id || video.id,
        platform: 'youtube',
        publishedAt: video.publishedAt || video.published_at || '',
        content: {
          title: video.title || video.content?.title || '',
          description: video.description || video.content?.description || '',
          thumbnailUrl: video.thumbnailUrl || video.content?.thumbnailUrl || '',
          videoUrl: video.videoUrl || video.content?.videoUrl || '',
        },
        metrics: {
          views: video.metrics?.views ?? video.views ?? 0,
          likes: video.metrics?.likes ?? video.likes ?? 0,
          comments: video.metrics?.comments ?? video.comments ?? 0,
          shares: video.metrics?.shares ?? video.shares ?? 0,
        },
        aiAnalysis: video.aiAnalysis || null,
      }));
    }
    return [];
  }, [youtubeVideos]);

  // Map Gmail items
  const mappedGmailItems: GmailContentItem[] = useMemo(() => {
    if (gmailThreads && Array.isArray(gmailThreads)) {
      return gmailThreads.map((thread: any) => ({
        id: thread._id || thread.id,
        platform: 'gmail',
        publishedAt: thread.publishedAt || thread.published_at || '',
        content: {
          subject: thread.subject || thread.content?.subject || '',
          snippet: thread.snippet || thread.content?.snippet || '',
          threadId: thread.threadId || thread.content?.threadId || '',
          historyId: thread.historyId || thread.content?.historyId || '',
          emailType: thread.emailType || thread.content?.emailType || 'all', // default to 'all' if missing
        },
        metrics: thread.metrics && typeof thread.metrics === 'object' ? thread.metrics : {},
      }));
    }
    return [];
  }, [gmailThreads]);

  // Map Instagram items
  const mappedInstagramItems: InstagramContentItem[] = useMemo(() => {
    if (instagramPosts && Array.isArray(instagramPosts)) {
      return instagramPosts.map((post: any): InstagramContentItem => {
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
        // Remove 'children' property if not in InstagramContentDetails type
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
            // children: post.data.children || [] // REMOVE if not in type
          },
          metrics: {
            impressions: undefined, // Not available in schema
            reach: undefined, // Not available in schema
            likes: post.data.like_count ?? 0,
            comments: post.data.comment_count ?? 0,
            shares: undefined, // Not available in schema
          },

        };
      });
    }
    return [];
  }, [instagramPosts]);

  // Combine all mapped items for the All tab
  const allContentItems: AnyContentItem[] = useMemo(() => {
    return [
      ...mappedYouTubeItems,
      ...mappedGmailItems,
      ...mappedInstagramItems
    ];
  }, [mappedYouTubeItems, mappedGmailItems, mappedInstagramItems]);


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
    router.push(`/dashboard/chat?contentContext=${encodedContext}`);
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

  // Platform-specific arrays using mapped items
  const youtubeItemsArray = mappedYouTubeItems;
  const gmailItemsArray = mappedGmailItems;
  const instagramItemsArray = mappedInstagramItems;

  // Apply filtering based on selected platform
  let filteredContent: AnyContentItem[] = [];
  if (selectedPlatform === 'youtube') {
    filteredContent = youtubeItemsArray;
  } else if (selectedPlatform === 'gmail') {
    filteredContent = gmailItemsArray;
  } else if (selectedPlatform === 'instagram') {
    filteredContent = instagramItemsArray;
  } else {
    // 'all' tab or fallback: use all real content items with sorting and filtering
    filteredContent = sortAndFilterContent(
      allContentItems,
      selectedPlatform,
      selectedEmailType,
      sortBy,
      timeRange
    );
  }
  // Final display items
  const displayItems = filteredContent;


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
