'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { 
  MessageSquare, 
  TrendingUp,
  Calendar,
  Filter,
  Instagram,
  Youtube,
  Mail,
  ArrowUpRight,
  BarChart3,
  X,
  Users,
  Clock,
  Share2,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { FirebaseApp } from 'firebase/app';
import { app } from '@/app/lib/firebase';

// Define the type for the imported app variable
const typedApp: FirebaseApp | undefined = app;

interface ContentItem {
  id: string;
  platform: 'instagram' | 'youtube' | 'tiktok' | 'gmail';
  type: 'post' | 'video' | 'tweet' | 'email';
  content: {
    text?: string;
    mediaUrl?: string;
    thumbnail?: string;
    subject?: string;
    recipients?: number;
    emailType?: 'newsletter' | 'partnership' | 'individual';
    partnerName?: string;
    thread?: {
      messageCount: number;
      lastReplyDate: string;
    };
  };
  metrics: {
    views: number;
    engagement: number;
    likes?: number;
    comments?: number;
    shares?: number;
    openRate?: number;
    clickRate?: number;
    replies?: number;
    responseTime?: number; // in hours
    dealValue?: number;
  };
  performance: {
    trend: 'up' | 'down' | 'stable';
    percentageChange: number;
  };
  publishedAt: string;
}

export function ContentAnalyticsScreen() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedEmailType, setSelectedEmailType] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('7d')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterRef, setFilterRef] = useState<HTMLDivElement | null>(null)
  const [sortBy, setSortBy] = useState('date') // 'date', 'engagement', 'performance'
  const [filterType, setFilterType] = useState('all')
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const router = useRouter()
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef && !filterRef.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [filterRef])

  // Fetch data from Convex - Use firebaseUser.uid
  const youtubeVideos = useQuery(
    api.youtubeQueries.listUserYouTubeVideos,
    !authLoading && firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );

  const allContentItems: ContentItem[] | undefined | null = youtubeVideos as ContentItem[] | undefined | null;

  const mockGmailItems: ContentItem[] = [
    {
      id: '2',
      platform: 'gmail',
      type: 'email',
      content: {
        subject: 'Weekly Developer Newsletter: React Tips & Updates',
        text: 'This week we cover essential React performance optimization techniques...',
        recipients: 2500,
        emailType: 'newsletter'
      },
      metrics: {
        views: 1800, // Represents opens for emails
        engagement: 12.5,
        openRate: 72,
        clickRate: 15,
        replies: 45
      },
      performance: {
        trend: 'up',
        percentageChange: 8
      },
      publishedAt: '2024-03-19T15:00:00Z'
    },
    {
      id: '3',
      platform: 'gmail',
      type: 'email',
      content: {
        subject: 'Partnership Opportunity - Content Collaboration',
        text: 'Following up on our discussion about the content collaboration...',
        emailType: 'partnership',
        partnerName: 'TechCo Media',
        thread: {
          messageCount: 5,
          lastReplyDate: '2024-03-21T09:00:00Z'
        }
      },
      metrics: {
        views: 1, // Opened once
        engagement: 100, // Placeholder
        openRate: 100,
        replies: 3,
        responseTime: 2.5,
        dealValue: 5000
      },
      performance: {
        trend: 'up',
        percentageChange: 12
      },
      publishedAt: '2024-03-18T10:00:00Z'
    }
  ]

  const combinedContent = [...(allContentItems || []), ...mockGmailItems]; // Combine fetched YT with mock Gmail

  const discussContent = (item: ContentItem) => {
    const context = {
      contentType: item.type,
      platform: item.platform,
      metrics: item.metrics,
      performance: item.performance,
      content: item.content
    }
    router.push(`/chat?context=${encodeURIComponent(JSON.stringify(context))}&type=content&id=${item.id}`)
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-5 h-5" />
      case 'youtube':
        return <Youtube className="w-5 h-5" />
      case 'tiktok':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.321 5.562a5.124 5.124 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.946 6.174 6.174 0 0 1-1.853-4.308h-3.669v13.379c0 .842-.669 1.523-1.508 1.523h-.03c-.839 0-1.508-.681-1.508-1.523s.669-1.523 1.508-1.523h.03c.206 0 .399.042.578.115V8.372c-.179-.018-.358-.05-.578-.05h-.03c-2.767 0-5.008 2.242-5.008 5.008s2.241 5.008 5.008 5.008h.03c2.767 0 5.008-2.242 5.008-5.008V8.191a9.391 9.391 0 0 0 3.644.743V5.562z"/>
          </svg>
        )
      case 'gmail':
        return <Mail className="w-5 h-5" />
      default:
        return null
    }
  }

  const getMetricsDisplay = (item: ContentItem) => {
    if (item.platform === 'gmail') {
      if (item.content.emailType === 'partnership' || item.content.emailType === 'individual') {
        return (
          <>
            <div>
              <p className="text-sm text-text-gray dark:text-gray-400">Response Time</p>
              <p className="font-medium dark:text-white">
                {item.metrics.responseTime}h
              </p>
            </div>
            <div>
              <p className="text-sm text-text-gray dark:text-gray-400">Thread</p>
              <p className="font-medium dark:text-white">
                {item.content.thread?.messageCount} messages
              </p>
            </div>
            <div>
              <p className="text-sm text-text-gray dark:text-gray-400">
                {item.content.emailType === 'partnership' ? 'Deal Value' : 'Status'}
              </p>
              <p className="font-medium dark:text-white">
                {item.content.emailType === 'partnership' && item.metrics.dealValue 
                  ? `$${item.metrics.dealValue.toLocaleString()}`
                  : 'Active'
                }
              </p>
            </div>
          </>
        )
      }
      
      return (
        <>
          <div>
            <p className="text-sm text-text-gray dark:text-gray-400">Open Rate</p>
            <p className="font-medium dark:text-white">
              {item.metrics.openRate}%
            </p>
          </div>
          <div>
            <p className="text-sm text-text-gray dark:text-gray-400">Click Rate</p>
            <p className="font-medium dark:text-white">
              {item.metrics.clickRate}%
            </p>
          </div>
          <div>
            <p className="text-sm text-text-gray dark:text-gray-400">Replies</p>
            <p className="font-medium dark:text-white">
              {item.metrics.replies}
            </p>
          </div>
        </>
      )
    }

    return (
      <>
        <div>
          <p className="text-sm text-text-gray dark:text-gray-400">Views</p>
          <p className="font-medium dark:text-white">
            {item.metrics.views.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-text-gray dark:text-gray-400">Engagement</p>
          <p className="font-medium dark:text-white">
            {item.metrics.engagement}%
          </p>
        </div>
        <div>
          <p className="text-sm text-text-gray dark:text-gray-400">Interactions</p>
          <p className="font-medium dark:text-white">
            {((item.metrics.likes || 0) + (item.metrics.comments || 0)).toLocaleString()}
          </p>
        </div>
      </>
    )
  }

  const sortAndFilterContent = (items: ContentItem[] | undefined | null) => {
    if (!items) return []; // Handle null or undefined input

    // First apply type filter
    let filtered = items
    if (filterType !== 'all') {
      filtered = items.filter(item => item.type === filterType)
    }

    // Then apply platform filter if selected
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(item => item.platform === selectedPlatform)
    }

    // Then apply email type filter if applicable
    if (selectedPlatform === 'gmail' && selectedEmailType !== 'all') {
      filtered = filtered.filter(item => item.content.emailType === selectedEmailType)
    }

    // Finally sort the filtered items
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          // Ensure publishedAt is valid before comparing
          const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return dateB - dateA;
        case 'engagement':
          return (b.metrics.engagement || 0) - (a.metrics.engagement || 0);
        case 'performance':
          // Performance data might be missing or placeholder
          return (b.performance?.percentageChange || 0) - (a.performance?.percentageChange || 0);
        default:
          return 0
      }
    })
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Authenticating...</span>
      </div>
    );
  }

  if (!firebaseUser) {
     return (
      <div className="flex items-center justify-center h-screen">
        <span>Please log in to view content analytics.</span>
      </div>
    );
  }

  if (youtubeVideos === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading content...</span>
      </div>
    );
  }

  const displayItems = sortAndFilterContent(combinedContent); // Use combined data

  return (
    <div className="relative">
      {/* Fixed Header */}
      <div className="shrink-0 px-6 py-4 bg-white dark:bg-gray-900">
        <div className="flex justify-between items-center">
          <div className="w-[100px] sm:w-[24px]"></div>
          <div className="flex-1 flex justify-center sm:justify-start">
            <div className="text-center sm:text-left">
              <h1 className="text-base font-medium text-black dark:text-white">Content Analytics</h1>
              <p className="text-text-gray dark:text-gray-400">
                <span className="hidden sm:inline">Track and analyze your content performance across platforms</span>
              </p>
            </div>
          </div>
          <div className="w-[100px] sm:w-auto flex justify-end gap-2">
            {/* Time Range Selector */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              <select 
                aria-label="Select time range"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent border-none focus:ring-0"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
            {/* Filter Button */}
            <div ref={setFilterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>

              {/* Filter Dropdown */}
              {isFilterOpen && (
                 <div className="absolute right-6 top-[4.5rem] w-72 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-lg shadow-lg p-4 space-y-4 z-50">
                  {/* Time Range - Only visible on mobile */}
                  <div className="space-y-2 sm:hidden">
                    <h3 className="font-medium text-sm text-text-dark dark:text-white">Time Range</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setTimeRange('7d')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          timeRange === '7d'
                            ? 'bg-heycontent-yellow text-black'
                            : 'bg-heycontent-light-yellow text-text-dark'
                        }`}
                      >
                        Last 7 days
                      </button>
                      <button
                        onClick={() => setTimeRange('30d')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          timeRange === '30d'
                            ? 'bg-heycontent-yellow text-black'
                            : 'bg-heycontent-light-yellow text-text-dark'
                        }`}
                      >
                        Last 30 days
                      </button>
                      <button
                        onClick={() => setTimeRange('90d')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          timeRange === '90d'
                            ? 'bg-heycontent-yellow text-black'
                            : 'bg-heycontent-light-yellow text-text-dark'
                        }`}
                      >
                        Last 90 days
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-text-dark dark:text-white">Sort By</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSortBy('date')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          sortBy === 'date'
                            ? 'bg-heycontent-yellow text-black'
                            : 'bg-heycontent-light-yellow text-text-dark'
                        }`}
                      >
                        Date
                      </button>
                      <button
                        onClick={() => setSortBy('engagement')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          sortBy === 'engagement'
                            ? 'bg-heycontent-yellow text-black'
                            : 'bg-heycontent-light-yellow text-text-dark'
                        }`}
                      >
                        Engagement
                      </button>
                      <button
                        onClick={() => setSortBy('performance')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          sortBy === 'performance'
                            ? 'bg-heycontent-yellow text-black'
                            : 'bg-heycontent-light-yellow text-text-dark'
                        }`}
                      >
                        Performance
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-text-dark dark:text-white">Content Type</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setFilterType('all')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          filterType === 'all'
                            ? 'bg-heycontent-yellow text-black'
                            : 'bg-heycontent-light-yellow text-text-dark'
                        }`}
                      >
                        All Types
                      </button>
                      <button
                        onClick={() => setFilterType('post')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          filterType === 'post'
                            ? 'bg-heycontent-yellow text-black'
                            : 'bg-heycontent-light-yellow text-text-dark'
                        }`}
                      >
                        Posts
                      </button>
                      <button
                        onClick={() => setFilterType('video')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          filterType === 'video'
                            ? 'bg-heycontent-yellow text-black'
                            : 'bg-heycontent-light-yellow text-text-dark'
                        }`}
                      >
                        Videos
                      </button>
                      <button
                        onClick={() => setFilterType('email')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          filterType === 'email'
                            ? 'bg-heycontent-yellow text-black'
                            : 'bg-heycontent-light-yellow text-text-dark'
                        }`}
                      >
                        Emails
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t dark:border-gray-800">
                    <button
                      onClick={() => {
                        setSortBy('date')
                        setFilterType('all')
                        setTimeRange('7d')
                        setIsFilterOpen(false)
                      }}
                      className="w-full px-4 py-2 text-sm text-text-dark hover:bg-heycontent-light-yellow rounded-lg dark:text-white dark:hover:bg-gray-800"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */} 
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Platform Tabs */} 
          <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedPlatform}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Platforms</TabsTrigger>
              <TabsTrigger value="gmail">Email</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
              <TabsTrigger value="tiktok">TikTok</TabsTrigger>
            </TabsList>

            {/* Email Type Filter - Only show when Gmail is selected */} 
             {selectedPlatform === 'gmail' && (
              <div className="mb-6 flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedEmailType('all')}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    selectedEmailType === 'all'
                      ? 'bg-heycontent-purple text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedEmailType('partnership')}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    selectedEmailType === 'partnership'
                      ? 'bg-heycontent-purple text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Partnerships
                </button>
                <button
                  onClick={() => setSelectedEmailType('newsletter')}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    selectedEmailType === 'newsletter'
                      ? 'bg-heycontent-purple text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Newsletters
                </button>
                <button
                  onClick={() => setSelectedEmailType('individual')}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    selectedEmailType === 'individual'
                      ? 'bg-heycontent-purple text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Individual
                </button>
              </div>
            )}

            {/* Content Grid */} 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayItems.length > 0 ? (
                displayItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    {/* Content Preview */}
                    <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                      {item.platform === 'gmail' ? (
                        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                          <div className="w-full">
                            <h3 className="font-medium text-lg mb-2 line-clamp-2">{item.content.subject}</h3>
                            {item.content.emailType === 'partnership' && (
                              <p className="text-sm text-heycontent-purple mb-1">
                                Partner: {item.content.partnerName}
                              </p>
                            )}
                            {item.content.recipients ? (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Recipients: {item.content.recipients?.toLocaleString()}
                              </p>
                            ) : item.content.thread && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Thread: {item.content.thread.messageCount} messages
                              </p>
                            )}
                          </div>
                        </div>
                      // Use thumbnail for YouTube, mediaUrl for others (adjust if needed)
                      ) : (item.content.thumbnail || item.content.mediaUrl) && (
                        <img 
                          src={item.content.thumbnail || item.content.mediaUrl}
                          alt="Content thumbnail" // Add alt text
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = '/placeholder-image.svg'; }} // Add basic fallback
                        />
                      )}
                      {/* Platform Icon - Ensure it's visible */} 
                      <div className="absolute top-2 left-2 p-1 bg-black/30 rounded-full text-white">
                        {getPlatformIcon(item.platform)}
                      </div>
                    </div>

                    {/* Content Info */}
                     <div className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-medium dark:text-white line-clamp-2">
                            {/* Display subject for email, text for others */}
                            {item.platform === 'gmail' ? item.content.subject : item.content.text}
                          </p>
                          <p className="text-sm text-text-gray dark:text-gray-400">
                             {/* Format date nicely */}
                            {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'Date unknown'}
                          </p>
                        </div>
                        {/* Performance Trend - simplified for now */} 
                        <div className={`flex items-center gap-1 text-sm ${
                          item.performance.trend === 'up' 
                            ? 'text-green-500' 
                            : item.performance.trend === 'down'
                            ? 'text-red-500'
                            : 'text-gray-500'
                        }`}>
                           {item.performance.trend !== 'stable' && (
                             <TrendingUp className={`w-4 h-4 ${item.performance.trend === 'down' ? 'transform rotate-180' : ''}`} />
                           )}
                          {item.performance.percentageChange !== 0 ? `${item.performance.percentageChange}%` : '-'}
                        </div>
                      </div>

                      {/* Metrics */} 
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {getMetricsDisplay(item)}
                      </div>

                      {/* Action Buttons */} 
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => discussContent(item)}
                          className="flex items-center gap-2 text-sm text-heycontent-purple dark:text-heycontent-purple hover:underline"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Discuss with Content
                        </button>
                        <button 
                          onClick={() => setSelectedContent(item)}
                          className="flex items-center gap-2 text-sm text-text-gray dark:text-gray-400 hover:underline ml-auto"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Detailed Analytics
                        </button>
                      </div>
                    </div>
                  </Card>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */} 
            <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-medium text-black dark:text-white">Detailed Analytics</h2>
                <p className="text-sm text-text-gray dark:text-gray-400">
                  {/* Capitalize platform and type */}
                  {selectedContent.platform.charAt(0).toUpperCase() + selectedContent.platform.slice(1)} • {selectedContent.type.charAt(0).toUpperCase() + selectedContent.type.slice(1)}
                </p>
              </div>
              <button 
                aria-label="Close"
                onClick={() => setSelectedContent(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */} 
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="space-y-6">
                {/* Content Preview */} 
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* Use thumbnail for YT, mediaUrl for others */} 
                    {(selectedContent.content.thumbnail || selectedContent.content.mediaUrl) && (
                      <img 
                        src={selectedContent.content.thumbnail || selectedContent.content.mediaUrl}
                        alt="Content thumbnail" 
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => { e.currentTarget.src = '/placeholder-image.svg'; }} // Add basic fallback
                      />
                    )}
                    <div>
                      <h3 className="font-medium text-black dark:text-white mb-2">
                        {/* Subject for email, text otherwise */} 
                        {selectedContent.platform === 'gmail' 
                          ? selectedContent.content.subject 
                          : selectedContent.content.text}
                      </h3>
                      <p className="text-sm text-text-gray dark:text-gray-400">
                        {/* Nicer date and type display */} 
                        Published {selectedContent.publishedAt ? new Date(selectedContent.publishedAt).toLocaleDateString() : 'Date unknown'} • {
                          selectedContent.content.emailType 
                            ? `${selectedContent.content.emailType.charAt(0).toUpperCase() + selectedContent.content.emailType.slice(1)} Email`
                            : `${selectedContent.type.charAt(0).toUpperCase() + selectedContent.type.slice(1)}`
                        }
                      </p>
                       {/* Add link to original content if possible */} 
                       {selectedContent.platform === 'youtube' && (
                         <a 
                           href={`https://www.youtube.com/watch?v=${selectedContent.id}`}
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="text-sm text-heycontent-purple hover:underline inline-flex items-center gap-1 mt-1"
                         >
                           View on YouTube <ExternalLink className="w-3 h-3" />
                         </a>
                       )}
                       {/* TODO: Add links for other platforms */} 
                    </div>
                  </div>
                </div>

                {/* Performance Metrics - General */} 
                <div>
                  <h3 className="text-base font-medium mb-4 text-black dark:text-white">Performance Overview</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-heycontent-light-yellow rounded-lg">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-text-gray dark:text-gray-400">
                            {selectedContent.platform === 'gmail' ? 'Opens' : 'Views'}
                          </p>
                          <p className="text-lg font-medium">{selectedContent.metrics.views?.toLocaleString() || 'N/A'}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-heycontent-light-yellow rounded-lg">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-text-gray dark:text-gray-400">Engagement</p>
                           {/* Show N/A for email engagement? */} 
                          <p className="text-lg font-medium">{selectedContent.metrics.engagement?.toFixed(1) || 'N/A'}%</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-heycontent-light-yellow rounded-lg">
                          <MessageSquare className="w-5 h-5" /> 
                        </div>
                        <div>
                          <p className="text-sm text-text-gray dark:text-gray-400">
                            {selectedContent.platform === 'gmail' ? 'Replies' : 'Comments'}
                          </p>
                          <p className="text-lg font-medium">{selectedContent.metrics.comments?.toLocaleString() || selectedContent.metrics.replies?.toLocaleString() || 'N/A'}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-heycontent-light-yellow rounded-lg">
                           {/* Use Clock for email response time, Shares for others? */}
                          {selectedContent.platform === 'gmail' && selectedContent.metrics.responseTime ? <Clock className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                        </div>
                        <div>
                           <p className="text-sm text-text-gray dark:text-gray-400">
                            {selectedContent.platform === 'gmail' ? 
                              (selectedContent.metrics.responseTime ? 'Avg. Response' : 'Shares') // Fallback if no responseTime
                              : 'Shares'}
                           </p>
                           <p className="text-lg font-medium">
                             {selectedContent.platform === 'gmail' && selectedContent.metrics.responseTime ? `${selectedContent.metrics.responseTime}h` : (selectedContent.metrics.shares?.toLocaleString() || 'N/A')}
                           </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Platform-specific Metrics */} 
                {selectedContent.platform === 'gmail' ? (
                  <div>
                    <h3 className="text-base font-medium mb-4 text-black dark:text-white">Email Metrics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card className="p-4">
                         <h4 className="text-sm font-medium mb-1">Open Rate</h4>
                         <p className="text-2xl font-semibold mb-3">{selectedContent.metrics.openRate?.toFixed(1) || 'N/A'}%</p>
                         {/* Placeholder for graph */}
                        <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <p className="text-xs text-text-gray">Open Rate Over Time (Chart)</p>
                        </div>
                      </Card>
                      <Card className="p-4">
                         <h4 className="text-sm font-medium mb-1">Click Rate</h4>
                         <p className="text-2xl font-semibold mb-3">{selectedContent.metrics.clickRate?.toFixed(1) || 'N/A'}%</p>
                         {/* Placeholder for graph */}
                        <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <p className="text-xs text-text-gray">Click Distribution (Chart)</p>
                        </div>
                      </Card>
                      {/* Add Deal Value / Thread Info if relevant */} 
                       {selectedContent.content.emailType === 'partnership' && selectedContent.metrics.dealValue && (
                        <Card className="p-4 sm:col-span-2">
                           <h4 className="text-sm font-medium mb-1">Deal Value</h4>
                           <p className="text-2xl font-semibold">${selectedContent.metrics.dealValue.toLocaleString()}</p>
                           <p className="text-xs text-text-gray">Associated with partner: {selectedContent.content.partnerName}</p>
                         </Card>
                       )}
                       {selectedContent.content.thread && (
                        <Card className="p-4 sm:col-span-2">
                           <h4 className="text-sm font-medium mb-1">Conversation Thread</h4>
                           <p className="text-lg font-medium">{selectedContent.content.thread.messageCount} Messages</p>
                           <p className="text-xs text-text-gray">Last Reply: {new Date(selectedContent.content.thread.lastReplyDate).toLocaleString()}</p>
                         </Card>
                       )}
                    </div>
                  </div>
                ) : ( // YouTube / Instagram / TikTok specific metrics
                  <div>
                     <h3 className="text-base font-medium mb-4 text-black dark:text-white">{selectedContent.platform.charAt(0).toUpperCase() + selectedContent.platform.slice(1)} Metrics</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card className="p-4">
                         <h4 className="text-sm font-medium mb-1">Likes</h4>
                         <p className="text-2xl font-semibold mb-3">{selectedContent.metrics.likes?.toLocaleString() || 'N/A'}</p>
                         {/* Placeholder for graph */}
                        <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <p className="text-xs text-text-gray">Likes Over Time (Chart)</p>
                        </div>
                      </Card>
                      <Card className="p-4">
                         <h4 className="text-sm font-medium mb-1">Audience Retention</h4>
                         <p className="text-2xl font-semibold mb-3">N/A</p> {/* Placeholder */} 
                         {/* Placeholder for graph */}
                        <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <p className="text-xs text-text-gray">Retention Graph (Chart)</p>
                        </div>
                      </Card>
                       {/* Add more platform-specific cards as needed */}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer Actions */} 
            <div className="px-6 py-4 border-t dark:border-gray-800 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => discussContent(selectedContent)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-heycontent-light-yellow text-black rounded-lg hover:bg-heycontent-yellow/90"
              >
                <MessageSquare className="w-4 h-4" />
                Discuss with Content
              </button>
              {/* Conditionally render View on Platform button */} 
              {selectedContent.platform === 'youtube' && (
                <a 
                  href={`https://www.youtube.com/watch?v=${selectedContent.id}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-heycontent-yellow text-black rounded-lg hover:bg-heycontent-yellow/90"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on YouTube
                </a>
              )}
               {/* TODO: Add links for other platforms */}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 