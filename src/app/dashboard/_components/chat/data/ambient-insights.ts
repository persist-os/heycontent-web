import { Brain, FileText, MessageSquare, Target, Zap } from 'lucide-react';
import { AmbientInsight } from '../types';

// Mock data for ambient insights - replace with actual API call later
export const ambientInsights: AmbientInsight[] = [
  {
    type: 'strategy',
    title: "React Performance Patterns",
    description: "From your notes on React optimization techniques, there's an opportunity to explore advanced performance patterns.",
    action: "hey content update persona",
    icon: Brain
  },
  {
    type: 'content',
    title: 'High-Impact Tutorial Series',
    description: 'Your audience is showing strong interest in React Native content',
    icon: Zap,
    action: 'hey content help'
  },
  {
    type: 'platform',
    title: 'TikTok Growth Opportunity',
    description: 'Your tutorial style perfect for TikTok\'s format',
    icon: Target,
    action: 'How can I grow my audience faster?'
  },
  {
    type: 'strategy',
    title: 'Cross-Platform Partnership',
    description: 'Potential collaboration opportunity with mobile dev learning platforms',
    icon: FileText,
    action: 'What content should I create next?'
  },
  {
    type: 'content',
    title: 'Beginner Developer Focus',
    description: 'Large audience gap in beginner-friendly content',
    icon: MessageSquare,
    action: 'How do I improve my engagement rates?'
  },
  {
    type: 'platform',
    title: 'Email List Growth Strategy',
    description: 'High conversion potential from your tutorial viewers',
    icon: Zap,
    action: 'What platforms should I focus on?'
  },
  {
    type: 'strategy',
    title: 'Instagram Carousel Strategy',
    description: 'Your technical insights perfect for visual learning',
    icon: Brain,
    action: 'How do I find my content niche?'
  },
  {
    type: 'content',
    title: 'Short-Form Code Tips',
    description: 'Huge potential in quick problem-solving content',
    icon: Target,
    action: 'What are the latest trends in my space?'
  },
  {
    type: 'platform',
    title: 'Developer Community Partnership',
    description: 'Opportunity to collaborate with coding bootcamps for content distribution',
    icon: MessageSquare,
    action: 'How can I monetize my content better?'
  },
  {
    type: 'strategy',
    title: 'Content Strategy Optimization',
    description: 'Optimize your content strategy based on platform trends and analytics',
    icon: FileText,
    action: 'What do my analytics tell me?'
  }
];
