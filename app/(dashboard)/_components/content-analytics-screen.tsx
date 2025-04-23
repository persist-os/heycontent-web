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
  ExternalLink
} from 'lucide-react'
import { useRouter } from 'next/navigation'

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

  // Add click outside handler
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

  // Mock data - Replace with actual API call
  const contentItems: ContentItem[] = [
    {
      id: '1',
      platform: 'instagram',
      type: 'post',
      content: {
        text: 'Check out these React performance tips! 🚀',
        mediaUrl: '/mock-content-1.jpg'
      },
      metrics: {
        views: 1500,
        engagement: 8.5,
        likes: 245,
        comments: 32,
        shares: 15
      },
      performance: {
        trend: 'up',
        percentageChange: 15
      },
      publishedAt: '2024-03-20T10:00:00Z'
    },
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
        views: 1800,
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
        views: 1,
        engagement: 100,
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

  const sortAndFilterContent = (items: ContentItem[]) => {
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
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        case 'engagement':
          return b.metrics.engagement - a.metrics.engagement
        case 'performance':
          return b.performance.percentageChange - a.performance.percentageChange
        default:
          return 0
      }
    })
  }

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
              <div className="mb-6 flex gap-2">
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
              {sortAndFilterContent(contentItems)
                .map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    {/* Content Preview */}
                    <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                      {item.platform === 'gmail' ? (
                        <div className="absolute inset-0 flex items-center justify-center p-6">
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
                      ) : item.content.mediaUrl && (
                        <img 
                          src={item.content.mediaUrl} 
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 left-2">
                        {getPlatformIcon(item.platform)}
                      </div>
                    </div>

                    {/* Content Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-medium dark:text-white line-clamp-2">
                            {item.platform === 'gmail' ? item.content.subject : item.content.text}
                          </p>
                          <p className="text-sm text-text-gray dark:text-gray-400">
                            {new Date(item.publishedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1 text-sm ${
                          item.performance.trend === 'up' 
                            ? 'text-green-500' 
                            : item.performance.trend === 'down'
                            ? 'text-red-500'
                            : 'text-gray-500'
                        }`}>
                          <TrendingUp className="w-4 h-4" />
                          {item.performance.percentageChange}%
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
                ))}
            </div>
          </Tabs>
        </div>
      </div>

      {/* Detailed Analytics Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-black dark:text-white">Detailed Analytics</h2>
                <p className="text-sm text-text-gray dark:text-gray-400">
                  {selectedContent.platform.charAt(0).toUpperCase() + selectedContent.platform.slice(1)} • {selectedContent.type.charAt(0).toUpperCase() + selectedContent.type.slice(1)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedContent(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-6">
                {/* Content Preview */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {selectedContent.content.mediaUrl && (
                      <img 
                        src={selectedContent.content.mediaUrl} 
                        alt="" 
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h3 className="font-medium text-black dark:text-white mb-2">
                        {selectedContent.platform === 'gmail' 
                          ? selectedContent.content.subject 
                          : selectedContent.content.text}
                      </h3>
                      <p className="text-sm text-text-gray dark:text-gray-400">
                        Published {new Date(selectedContent.publishedAt).toLocaleDateString()} • {
                          selectedContent.content.emailType 
                            ? `${selectedContent.content.emailType.charAt(0).toUpperCase() + selectedContent.content.emailType.slice(1)} Email`
                            : 'Content Post'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h3 className="text-base font-medium mb-4 text-black dark:text-white">Performance Metrics</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-heycontent-light-yellow rounded-lg">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-text-gray dark:text-gray-400">Views</p>
                          <p className="text-lg font-medium">{selectedContent.metrics.views.toLocaleString()}</p>
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
                          <p className="text-lg font-medium">{selectedContent.metrics.engagement}%</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-heycontent-light-yellow rounded-lg">
                          <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-text-gray dark:text-gray-400">Shares</p>
                          <p className="text-lg font-medium">{selectedContent.metrics.shares || 0}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-heycontent-light-yellow rounded-lg">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-text-gray dark:text-gray-400">Avg. Time</p>
                          <p className="text-lg font-medium">2.5m</p>
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
                        <h4 className="text-sm font-medium mb-3">Open Rate Over Time</h4>
                        <div className="h-40 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <p className="text-sm text-text-gray">Chart placeholder</p>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <h4 className="text-sm font-medium mb-3">Click Distribution</h4>
                        <div className="h-40 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <p className="text-sm text-text-gray">Chart placeholder</p>
                        </div>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base font-medium mb-4 text-black dark:text-white">Engagement Breakdown</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <h4 className="text-sm font-medium mb-3">Engagement by Time</h4>
                        <div className="h-40 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <p className="text-sm text-text-gray">Chart placeholder</p>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <h4 className="text-sm font-medium mb-3">Audience Demographics</h4>
                        <div className="h-40 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <p className="text-sm text-text-gray">Chart placeholder</p>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-gray-800">
                  <button
                    onClick={() => discussContent(selectedContent)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-heycontent-light-yellow text-black rounded-lg hover:bg-heycontent-yellow/90"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Discuss with Content
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm bg-heycontent-yellow text-black rounded-lg hover:bg-heycontent-yellow/90">
                    <ExternalLink className="w-4 h-4" />
                    View on Platform
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 