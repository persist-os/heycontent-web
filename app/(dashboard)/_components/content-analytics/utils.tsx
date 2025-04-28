import React from 'react';
import { Instagram, Youtube, Mail } from 'lucide-react';
import { ContentItem, FilterType, Platform, EmailType, SortOption } from './types';

// Platform icon utility
export const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'instagram':
      return <Instagram className="w-5 h-5" />;
    case 'youtube':
      return <Youtube className="w-5 h-5" />;
    case 'tiktok':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.321 5.562a5.124 5.124 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.946 6.174 6.174 0 0 1-1.853-4.308h-3.669v13.379c0 .842-.669 1.523-1.508 1.523h-.03c-.839 0-1.508-.681-1.508-1.523s.669-1.523 1.508-1.523h.03c.206 0 .399.042.578.115V8.372c-.179-.018-.358-.05-.578-.05h-.03c-2.767 0-5.008 2.242-5.008 5.008s2.241 5.008 5.008 5.008h.03c2.767 0 5.008-2.242 5.008-5.008V8.191a9.391 9.391 0 0 0 3.644.743V5.562z"/>
        </svg>
      );
    case 'gmail':
      return <Mail className="w-5 h-5" />;
    default:
      return null;
  }
};

// Get metrics display based on content type
export const getMetricsDisplay = (item: ContentItem) => {
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
      );
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
    );
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
  );
};

// Filter and sort content items
export const sortAndFilterContent = (
  items: ContentItem[] | undefined | null,
  filterType: FilterType,
  selectedPlatform: Platform,
  selectedEmailType: EmailType,
  sortBy: SortOption
) => {
  if (!items) return []; // Handle null or undefined input

  // First apply type filter
  let filtered = items;
  if (filterType !== 'all') {
    filtered = items.filter(item => item.type === filterType);
  }

  // Then apply platform filter if selected
  if (selectedPlatform !== 'all') {
    filtered = filtered.filter(item => item.platform === selectedPlatform);
  }

  // Then apply email type filter if applicable
  if (selectedPlatform === 'gmail' && selectedEmailType !== 'all') {
    filtered = filtered.filter(item => item.content.emailType === selectedEmailType);
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
        return 0;
    }
  });
};

// Mock Gmail data for testing
export const getMockGmailItems = (): ContentItem[] => [
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
];
