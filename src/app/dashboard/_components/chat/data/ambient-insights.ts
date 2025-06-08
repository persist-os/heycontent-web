import { Brain, FileText, MessageSquare, Target, Zap, TrendingUp, Users, BarChart2, Lightbulb, Hash } from 'lucide-react';
import { AmbientInsight } from '../types';

// Mock data for ambient insights - replace with actual API call later
export const ambientInsights: AmbientInsight[] = [
  {
    type: 'performance',
    title: "React Performance Patterns",
    description: "From your notes on React optimization techniques, there's an opportunity to explore advanced performance patterns.",
    action: "Tell me more about React performance patterns",
    icon: Zap
  },
  {
    type: 'content',
    title: 'High-Impact Tutorial Series',
    description: 'Your audience is showing strong interest in React Native content',
    icon: FileText,
    action: 'Analyze React Native content opportunities'
  },
  {
    type: 'growth',
    title: 'TikTok Growth Opportunity',
    description: 'Your tutorial style is perfect for TikTok\'s short-form video format',
    icon: TrendingUp,
    action: 'Show me TikTok growth strategies'
  },
  {
    type: 'engagement',
    title: 'Audience Engagement Boost',
    description: 'Your recent posts have 23% higher engagement in the evenings',
    icon: Users,
    action: 'Suggest best posting times'
  },
  {
    type: 'analytics',
    title: 'Content Performance',
    description: 'Your tutorial videos have 3x more retention than other content types',
    icon: BarChart2,
    action: 'Analyze video performance'
  },
  {
    type: 'idea',
    title: 'Content Idea',
    description: 'Your audience is searching for "React hooks best practices"',
    icon: Lightbulb,
    action: 'Generate content ideas for React hooks'
  },
  {
    type: 'trending',
    title: 'Trending Topic',
    description: '#Web3 is trending among your followers',
    icon: Hash,
    action: 'Show me Web3 content ideas'
  },

];
