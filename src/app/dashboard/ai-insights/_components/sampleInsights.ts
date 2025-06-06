import { InsightCardProps } from './InsightCard';

export const sampleInsights: Omit<InsightCardProps, 'expanded' | 'onExpand' | 'onDiscuss'>[] = [
  {
    platform: 'youtube',
    title: 'Enhance Video Thumbnails and Titles',
    impact: 'Impact: high',
    whyNow: [
      'Improve click-through rate (CTR) by using more compelling video thumbnails and titles that resonate with trending topics in e-commerce and personalization.',
      'Based on 3 recent videos',
      'Main topics: Online Shopping, E-commerce Solutions, AVA Setail Platform, Shopping Personalization, Influencer Marketing, Social Shopping',
    ],
    actionSteps: [
      'Conduct A/B testing with different thumbnail designs.',
      'Incorporate trending keywords in titles for better SEO.',
      'Use power words that evoke curiosity and urgency.',
    ],
    expectedOutcome: 'Increased audience engagement and growth through optimized content strategy.',
    sourceDetails: [
      'Based on 3 recent videos',
      'Main topics: Online Shopping, E-commerce Solutions, AVA Setail Platform, Shopping Personalization, Influencer Marketing, Social Shopping',
    ],
    relatedItems: [
      { label: 'Promotional (Video 1)', value: 'Views: 10, Engagement: 10' },
      { label: 'Promotional (Video 2)', value: 'Views: 15, Engagement: 15' },
    ],
  },
  {
    platform: 'youtube',
    title: 'Enhance Video Thumbnails and Titles',
    impact: 'Impact: high',
    whyNow: [
      'Improve click-through rate (CTR) by using more compelling video thumbnails and titles that resonate with trending topics in e-commerce and personalization.',
      'Based on 3 recent videos',
      'Main topics: Online Shopping, E-commerce Solutions, AVA Setail Platform, Shopping Personalization, Influencer Marketing, Social Shopping',
    ],
    actionSteps: [
      'Conduct A/B testing with different thumbnail designs.',
      'Incorporate trending keywords in titles for better SEO.',
      'Use power words that evoke curiosity and urgency.',
    ],
    expectedOutcome: 'Increased audience engagement and growth through optimized content strategy.',
    sourceDetails: [
      'Based on 3 recent videos',
      'Main topics: Online Shopping, E-commerce Solutions, AVA Setail Platform, Shopping Personalization, Influencer Marketing, Social Shopping',
    ],
    relatedItems: [
      { label: 'Promotional (Video 1)', value: 'Views: 10, Engagement: 10' },
      { label: 'Promotional (Video 2)', value: 'Views: 15, Engagement: 15' },
    ],
  },
  {
    platform: 'instagram',
    title: 'Try Reels for More Reach',
    impact: 'Impact: medium',
    whyNow: [
      'Instagram Reels are prioritized in the feed and can help you reach new audiences.',
      'Recent posts show higher engagement on short-form video content.',
    ],
    actionSteps: [
      'Create a 15-second Reel using trending audio.',
      'Add relevant hashtags and a call to action.',
    ],
    expectedOutcome: 'More followers and engagement from short-form video.',
    sourceDetails: [
      'Based on last 5 posts',
      'Trending audio: "Summer Vibes"',
    ],
    relatedItems: [
      { label: 'Reel (July 1)', value: 'Views: 120, Likes: 30' },
      { label: 'Reel (July 2)', value: 'Views: 150, Likes: 45' },
    ],
  },
]; 