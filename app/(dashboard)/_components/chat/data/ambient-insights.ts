import { Brain, FileText, MessageSquare, Target, Zap } from 'lucide-react';
import { AmbientInsight } from '../types';

// Mock data for ambient insights - replace with actual API call later
export const ambientInsights: AmbientInsight[] = [
  {
    type: 'notes',
    title: "React Performance Patterns",
    description: "From your notes on React optimization techniques, there's an opportunity to explore advanced performance patterns.",
    action: "Discuss React performance insights",
    icon: FileText
  },
  {
    type: 'content',
    title: 'High-Impact Tutorial Series',
    description: 'Your audience is showing strong interest in React Native content',
    icon: MessageSquare,
    action: 'Analyze content performance'
  },
  {
    type: 'platform',
    title: 'TikTok Growth Opportunity',
    description: 'Your tutorial style perfect for TikTok\'s format',
    icon: Brain,
    action: 'View platform insights'
  },
  {
    type: 'strategy',
    title: 'Cross-Platform Partnership',
    description: 'Potential collaboration opportunity with mobile dev learning platforms',
    icon: Target,
    action: 'Explore partnership opportunity'
  },
  {
    type: 'content',
    title: 'Beginner Developer Focus',
    description: 'Large audience gap in beginner-friendly content',
    icon: Zap,
    action: 'Explore content strategy'
  },
  {
    type: 'content',
    title: 'Email List Growth Strategy',
    description: 'High conversion potential from your tutorial viewers',
    icon: Target,
    action: 'View growth opportunities'
  },
  {
    type: 'platform',
    title: 'Instagram Carousel Strategy',
    description: 'Your technical insights perfect for visual learning',
    icon: MessageSquare,
    action: 'Analyze platform performance'
  },
  {
    type: 'content',
    title: 'Short-Form Code Tips',
    description: 'Huge potential in quick problem-solving content',
    icon: Brain,
    action: 'Explore content ideas'
  },
  {
    type: 'strategy',
    title: 'Developer Community Partnership',
    description: 'Opportunity to collaborate with coding bootcamps for content distribution',
    icon: Target,
    action: 'Discuss partnership strategy'
  },
  {
    type: 'platform',
    title: 'Content Strategy',
    description: 'Optimize your content strategy based on platform trends',
    icon: Zap,
    action: 'View strategy recommendations'
  }
];
