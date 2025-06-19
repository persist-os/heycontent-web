import React from 'react';
import { Instagram, Mail } from 'lucide-react';
import { YouTubeBrandIcon } from '../../../lib/YoutubeBrandIcon';
import { 
  AnyContentItem, 
  SortOption, 
  TimeRange, 
  PlatformType, 
  EmailTypeFilter, 
  InstagramContentItem, 
  YouTubeContentItem, 
  GmailContentItem, 
  GmailContentDetails 
} from './types';

// Platform icon utility
export const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'instagram':
      return <Instagram className="w-5 h-5" />;
    case 'youtube':
      return <YouTubeBrandIcon href="https://youtube.com/" className="w-8 h-8 min-w-[20px] min-h-[20px]" />;
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
export const getMetricsDisplay = (item: AnyContentItem) => {
  if (item.platform === 'gmail') {
    if (item.content.data.emailType === 'partnership' || item.content.data.emailType === 'individual') {
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
              {item.content.data.messageCount} messages
            </p>
          </div>
          <div>
            <p className="text-sm text-text-gray dark:text-gray-400">
              {item.content.data.emailType === 'partnership' ? 'Deal Value' : 'Status'}
            </p>
            <p className="font-medium dark:text-white">
              {item.content.data.emailType === 'partnership' && item.metrics.dealValue 
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

  // Handle YouTube and Instagram
  let primaryMetricLabel = 'Interactions'; // Default/fallback
  let primaryMetricValue = 0;
  let secondaryMetricLabel = 'Likes'; // Default/fallback
  let secondaryMetricValue = 0;

  if (item.platform === 'youtube') {
    primaryMetricLabel = 'Views';
    primaryMetricValue = item.metrics.views ?? 0;
    secondaryMetricLabel = 'Watch Time (min)';
    secondaryMetricValue = item.metrics.watchTimeMinutes ?? 0;
  } else if (item.platform === 'instagram') {
    primaryMetricLabel = 'Reach'; // Prioritize Reach for Insta
    primaryMetricValue = item.metrics.reach ?? item.metrics.impressions ?? 0; // Fallback to Impressions if Reach is null/undefined
    secondaryMetricLabel = 'Likes';
    secondaryMetricValue = item.metrics.likes ?? 0;
  }

  // Common metric
  const commentsValue = item.metrics.comments ?? 0;

  return (
    <>
      <div>
        <p className="text-sm text-text-gray dark:text-gray-400">{primaryMetricLabel}</p>
        <p className="font-medium dark:text-white">
          {primaryMetricValue.toLocaleString()}
        </p>
      </div>
      <div>
        <p className="text-sm text-text-gray dark:text-gray-400">{secondaryMetricLabel}</p>
        <p className="font-medium dark:text-white">
          {secondaryMetricValue.toLocaleString()}
        </p>
      </div>
      <div>
        <p className="text-sm text-text-gray dark:text-gray-400">Comments</p>
        <p className="font-medium dark:text-white">
          {commentsValue.toLocaleString()}
        </p>
      </div>
    </>
  );
}

// Sort function
export function sortContent(items: AnyContentItem[], sortOption: SortOption): AnyContentItem[] {
  return [...items].sort((a, b) => {
    switch (sortOption) {
      case 'date':
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

      // --- Platform-Specific Metrics --- //
      // Use explicit checks and default to -1 for items not matching the platform

      case 'reach': { // Instagram only
        let valA = -1;
        let valB = -1;
        if (a.platform === 'instagram') valA = a.metrics.reach ?? 0;
        if (b.platform === 'instagram') valB = b.metrics.reach ?? 0;
        return valB - valA;
      }
      case 'impressions': { // Instagram only
        let valA = -1;
        let valB = -1;
        if (a.platform === 'instagram') valA = a.metrics.impressions ?? 0;
        if (b.platform === 'instagram') valB = b.metrics.impressions ?? 0;
        return valB - valA;
      }
      case 'likes': { // Instagram & YouTube
        let valA = -1;
        let valB = -1;
        if (a.platform === 'instagram' || a.platform === 'youtube') valA = a.metrics.likes ?? 0;
        if (b.platform === 'instagram' || b.platform === 'youtube') valB = b.metrics.likes ?? 0;
        return valB - valA;
      }
      case 'comments': { // Instagram & YouTube
        let valA = -1;
        let valB = -1;
        if (a.platform === 'instagram' || a.platform === 'youtube') valA = a.metrics.comments ?? 0;
        if (b.platform === 'instagram' || b.platform === 'youtube') valB = b.metrics.comments ?? 0;
        return valB - valA;
      }
      case 'views': { // YouTube only
        let valA = -1;
        let valB = -1;
        if (a.platform === 'youtube') valA = a.metrics.views ?? 0;
        if (b.platform === 'youtube') valB = b.metrics.views ?? 0;
        return valB - valA;
      }
      case 'watchTimeMinutes': { // YouTube only
        let valA = -1;
        let valB = -1;
        if (a.platform === 'youtube') valA = a.metrics.watchTimeMinutes ?? 0;
        if (b.platform === 'youtube') valB = b.metrics.watchTimeMinutes ?? 0;
        return valB - valA;
      }
      case 'openRate': { // Gmail only
        let valA = -1;
        let valB = -1;
        if (a.platform === 'gmail') valA = a.metrics.openRate ?? 0;
        if (b.platform === 'gmail') valB = b.metrics.openRate ?? 0;
        return valB - valA;
      }
      case 'clickRate': { // Gmail only
        let valA = -1;
        let valB = -1;
        if (a.platform === 'gmail') valA = a.metrics.clickRate ?? 0;
        if (b.platform === 'gmail') valB = b.metrics.clickRate ?? 0;
        return valB - valA;
      }
      case 'replies': { // Gmail only
        let valA = -1;
        let valB = -1;
        if (a.platform === 'gmail') valA = a.metrics.replies ?? 0;
        if (b.platform === 'gmail') valB = b.metrics.replies ?? 0;
        return valB - valA;
      }

      // If sortOption is unknown or not applicable, don't change order
      default:
        return 0;
    }
  });
}

// Filter and sort content items
export const sortAndFilterContent = (
  items: AnyContentItem[],
  platformFilter: PlatformType,
  emailTypeFilter: EmailTypeFilter,
  sortOption: SortOption,
  timeRange: TimeRange
): AnyContentItem[] => {
  const filteredItems = filterContent(
    items,
    platformFilter,
    emailTypeFilter,
    timeRange
  );
  return sortContent(filteredItems, sortOption);
};

// Function to filter content items
export function filterContent(
  items: AnyContentItem[],
  platformFilter: PlatformType, 
  emailTypeFilter: EmailTypeFilter,
  timeRange: TimeRange
): AnyContentItem[] {
  // Make sure 'all' is part of TimeRange type

  const now = new Date();
  let cutoffDate: Date | null = new Date();

  switch (timeRange) {
    case '7d':
      cutoffDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      cutoffDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      cutoffDate.setDate(now.getDate() - 90);
      break;
    case 'all':
    default:
      cutoffDate = null;
      break;
  }

  // Set time to start of the day for consistent comparison
  if (cutoffDate) {
    cutoffDate.setHours(0, 0, 0, 0);
  }

  return items.filter(item => {
    // Platform filter
    const platformMatch = platformFilter === 'all' || item.platform === platformFilter;

    // Email type filter - only apply if the item *is* Gmail
    let emailTypeMatch = true; // Default to true for non-Gmail items
    if (item.platform === 'gmail') {
      emailTypeMatch = emailTypeFilter === 'all' || item.content.data.emailType === emailTypeFilter;
    }

    // Time range filter
    let timeMatch = true;
    if (cutoffDate) {
      const itemDate = new Date(item.publishedAt);
      // If publishedAt is missing or invalid, include the item
      timeMatch = !item.publishedAt || isNaN(itemDate.getTime()) || itemDate >= cutoffDate;
    }

    return platformMatch && emailTypeMatch && timeMatch;
  });
}

// Function to get unique platforms from items
export const getAvailablePlatforms = (items: AnyContentItem[]): PlatformType[] => {
  const platforms = new Set<PlatformType>(['all']);
  items.forEach(item => platforms.add(item.platform));
  return Array.from(platforms);
};

// Function to get unique email types (only relevant for Gmail items)
export const getAvailableEmailTypes = (items: AnyContentItem[]): EmailTypeFilter[] => {
  const emailTypes = new Set<EmailTypeFilter>(['all']);
  items.forEach(item => {
    if (item.platform === 'gmail') {
      const gmailItem = item as GmailContentItem;
      emailTypes.add(gmailItem.content.data.emailType);
    }
  });
  return Array.from(emailTypes);
};

// Mock Instagram ContentItem for testing
export const getMockInstagramItem = (idSuffix: string): InstagramContentItem => {
  const likes = Math.floor(Math.random() * 5000) + 50;
  const comments = Math.floor(likes * (Math.random() * 0.1 + 0.02)); // Comments are a fraction of likes
  const reach = Math.floor(likes * (Math.random() * 10 + 1.5)) + 1000; // Reach > Likes
  const impressions = Math.floor(reach * (Math.random() * 0.3 + 1.0)); // Impressions >= Reach
  const shares = Math.floor(likes * (Math.random() * 0.05 + 0.01)); // Shares are a fraction of likes

  const captionTemplates = [
    `Exploring the city vibes today! #travel #citylife #${idSuffix}`,
    `New recipe experiment in the kitchen! 🍳 #foodie #cooking #${idSuffix}`,
    `Workout complete! Feeling energized. #fitness #health #${idSuffix}`,
    `Throwback to an amazing trip last year. #tbt #memories #${idSuffix}`,
    `Just enjoying a quiet moment with a book. #reading #relax #${idSuffix}`
  ];
  const caption = captionTemplates[Math.floor(Math.random() * captionTemplates.length)];

  return {
    id: `ig-${idSuffix}`,
    platform: 'instagram',
    // Ensure date is within the last 7 days for default view
    publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    content: {
      text: caption,
      mediaUrl: `https://picsum.photos/seed/ig${idSuffix}/1080/1080`,
      mediaType: Math.random() > 0.8 ? 'video' : (Math.random() > 0.6 ? 'carousel' : 'image'), // Vary media type
      thumbnailUrl: `https://picsum.photos/seed/igthumb${idSuffix}/200/200`,
      permalink: `https://instagram.com/p/mock${idSuffix}`,
    },
    metrics: {
      likes,
      comments,
      impressions,
      reach,
      shares,
    },
  };
};

// Mock YouTube ContentItem for testing
export const getMockYouTubeItem = (idSuffix: string): YouTubeContentItem => {
  const views = Math.floor(Math.random() * 1000000) + 500;
  const likes = Math.floor(views * (Math.random() * 0.05 + 0.01)); // Likes relative to views
  const comments = Math.floor(likes * (Math.random() * 0.1 + 0.01)); // Comments relative to likes
  const dislikes = Math.floor(likes * (Math.random() * 0.05 + 0.005)); // Dislikes relative to likes
  const shares = Math.floor(likes * (Math.random() * 0.08 + 0.02)); // Shares relative to likes
  const averageViewDurationSeconds = Math.floor(Math.random() * 300) + 60; // 1-6 minutes
  const watchTimeMinutes = Math.floor((views * averageViewDurationSeconds) / 60);

  const titleTemplates = [
    `Ultimate Guide to Topic ${idSuffix}: Everything You Need!`, 
    `Reviewing the Latest Gadget ${idSuffix}`, 
    `Travel Vlog: Exploring Destination ${idSuffix}`, 
    `How to Master Skill ${idSuffix} in 5 Steps`, 
    `My Thoughts on Recent Event ${idSuffix}`
  ];
  const title = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];

  const descriptionTemplates = [
    `In this video, we dive deep into ${title}. #tutorial #guide #${idSuffix}`,
    `Join me as I explore ${title}. Links in description! #vlog #adventure #${idSuffix}`,
    `Detailed review of ${title}. Is it worth it? #review #tech #${idSuffix}`
  ];
  const description = descriptionTemplates[Math.floor(Math.random() * descriptionTemplates.length)];

  const channelTitles = ['Tech Explained', 'Travel Adventures', 'Creative Corner', 'Daily Insights'];
  const channelTitle = channelTitles[Math.floor(Math.random() * channelTitles.length)];

  return {
    id: `yt-${idSuffix}`,
    platform: 'youtube',
    // Ensure date is within the last 7 days for default view
    publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    content: {
      title,
      description,
      thumbnailUrl: `https://picsum.photos/seed/ytthumb${idSuffix}/480/360`,
      videoUrl: `https://youtube.com/watch?v=mock${idSuffix}`,
      channelTitle,
    },
    metrics: {
      views,
      likes,
      comments,
      dislikes,
      shares,
      watchTimeMinutes,
      averageViewDurationSeconds,
    },
  };
};

// Mock Gmail ContentItems for testing
export const getMockGmailItems = (count: number): GmailContentItem[] => {
  const items: GmailContentItem[] = [];
  const emailTypes: ('newsletter' | 'partnership' | 'individual' | 'other')[] = ['newsletter', 'partnership', 'individual', 'other'];
  const subjects = {
    newsletter: [
      `Weekly Update Vol. ${Math.floor(Math.random() * 50) + 1}`,
      `Insights & News - ${new Date().toLocaleString('default', { month: 'long' })}`,
      'Exclusive Content Just For You!',
    ],
    partnership: [
      'Collaboration Proposal: [Your Brand] x [Partner Brand]',
      'Following Up: Partnership Opportunity',
      `Potential Synergy Discussion`,
    ],
    individual: ['Quick Question regarding [Project]', 'Catching Up Soon?', 'Meeting Request: Availability'],
    other: [
      'Your Order #[OrderNumber] Confirmation',
      'Security Alert: New Login Detected',
      'Event Reminder: [Event Name] Tomorrow',
    ],
  };
  const senders = {
    newsletter: ['updates@companynews.com', 'newsletter@expertblog.com', 'no-reply@serviceupdates.com'],
    partnership: ['bizdev@partnercorp.com', 'jane.doe@startup.io', 'marketing@creativeagency.net'],
    individual: ['john.smith@clientco.com', 'teammate@yourcompany.org', 'alex.williams@personal.com'],
    other: ['orders@onlinestore.com', 'security@yourbank.com', 'noreply@eventsplatform.com'],
  };
  const partnerNames = ['Innovate Solutions', 'Global Ventures', 'Creative Agency Inc.', 'Data Insights LLC'];
  const commonLabels = ['Inbox', 'Starred', 'Important'];

  for (let i = 1; i <= count; i++) {
    const emailType = emailTypes[i % emailTypes.length];
    const isPartnership = emailType === 'partnership';
    const isIndividual = emailType === 'individual';
    const isNewsletter = emailType === 'newsletter';
    const isOther = emailType === 'other';

    // Ensure date is within the last 7 days for default view
    const publishedDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const threadId = `thread-${Math.random().toString(36).substring(2, 10)}`;

    // Message count: Lower for newsletters/other, higher potential for individual/partnership
    const messageCount = isNewsletter || isOther
      ? 1
      : Math.floor(Math.random() * (isIndividual || isPartnership ? 6 : 1)) + 1; // 1 for N/O, 1-6 for I/P

    // lastReplyDate only if messageCount > 1
    let lastReplyDate: string | undefined = undefined;
    if (messageCount > 1) {
      const replyTimeOffset = (Math.random() * 3 + 0.1) * 24 * 60 * 60 * 1000; // 0.1 to 3 days later
      lastReplyDate = new Date(publishedDate.getTime() + replyTimeOffset).toISOString();
    }

    // Select Subject & Sender
    let currentSubjects = subjects[emailType];
    let currentSenders = senders[emailType];
    let subject = currentSubjects[Math.floor(Math.random() * currentSubjects.length)];
    const from = currentSenders[Math.floor(Math.random() * currentSenders.length)];
    const partnerName = isPartnership ? partnerNames[Math.floor(Math.random() * partnerNames.length)] : undefined;

    // Refine subject placeholders
    if (isPartnership) subject = subject.replace('[Partner Brand]', partnerName || 'Potential Partner');
    if (isIndividual) subject = subject.replace('[Project]', `Project ${String.fromCharCode(65 + (i % 5))}`);
    if (isOther && subject.includes('[OrderNumber]')) subject = subject.replace('[OrderNumber]', `${Math.floor(Math.random() * 90000) + 10000}`);
    if (isOther && subject.includes('[Event Name]')) subject = subject.replace('[Event Name]', `Workshop ${i % 3 + 1}`);

    // More realistic snippets
    let snippet = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...';
    if (isNewsletter) snippet = `This week's highlights include market trends, expert tips, and exclusive content...`;
    if (isPartnership) snippet = `Following up on our previous conversation, I'd like to propose a potential collaboration between our companies...`;
    if (isIndividual) snippet = `Hope you're having a good week. Just wanted to ask a quick question about the upcoming deadline...`;
    if (isOther && subject.toLowerCase().includes('order')) snippet = `Thank you for your order! Your items are being processed and will ship soon...`;
    if (isOther && subject.toLowerCase().includes('security')) snippet = `We detected a new login to your account from an unrecognized device. If this wasn't you...`;

    // Metrics adjustments
    const openRate = isNewsletter || isPartnership ? Math.floor(Math.random() * 50) + 20 : undefined; // 20-70% for N/P
    const clickRate = isNewsletter ? Math.floor(Math.random() * (openRate ? openRate * 0.2 : 10)) + 1 : undefined; // Click rate only for newsletters, relative to open
    const replies = messageCount > 1 ? messageCount - 1 - Math.floor(Math.random() * 2) : 0; // Replies if threaded
    const responseTime = isIndividual || isPartnership ? Math.floor(Math.random() * 47) + 1 : undefined; // Response time for I/P
    const dealValue = isPartnership ? (Math.floor(Math.random() * 20) + 1) * 500 : undefined; // Deal value for P

    // Labels
    let labels = ['Inbox'];
    if (Math.random() > 0.7) labels.push(commonLabels[Math.floor(Math.random() * commonLabels.length)]);
    if (isPartnership) labels.push('Partnerships');
    if (isNewsletter) labels.push('Newsletters');
    if (isIndividual && Math.random() > 0.5) labels.push('Requires Action');
    labels = [...new Set(labels)]; // Ensure unique labels

    items.push({
      id: `gm-${i}`,
      platform: 'gmail',
      publishedAt: publishedDate.toISOString(),
      content: {
        data: {
          subject,
          snippet,
          from,
          emailType: emailType,
          threadId: threadId,
          emailId: `msg-${Math.random().toString(36).substring(2, 10)}`,
          messageCount: messageCount,
          messages: [],
        }
      },
      metrics: {
        openRate,
        clickRate,
        replies,
        responseTime,
        dealValue,
      },
    });
  }
  return items;
};