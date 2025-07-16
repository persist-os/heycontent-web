import React from 'react';
import { InteractiveStep } from '@/components/ui/interactive-tooltip';
import { MessageCircle, Search, User, Brain, Sparkles, AtSign, Lightbulb, FileText, Zap, Layers, BarChart3 } from 'lucide-react';
import { conciseTours } from './coreTours';
import { TourContent } from './tourContent';
import { selfHubTours } from './selfHubTours';
import { contentHubTours } from './contentHubTours';
import { notesTours } from './notesTours';
import { partnershipHubInteractiveTour } from './partnershipHubTours';

// Main Chat Interactive Tour - Streamlined and focused
export const chatInteractiveTour: InteractiveStep[] = conciseTours.core;

// Quick Start Tour - Essential features only
export const quickStartTour: InteractiveStep[] = conciseTours.quickStart;

// Smart Notes Interactive Tour - Now comprehensive and detailed
export const notesInteractiveTour: InteractiveStep[] = notesTours.main;

// Content Hub Interactive Tour - Now comprehensive and detailed
export const contentHubInteractiveTour: InteractiveStep[] = contentHubTours.main;

// Self Hub Interactive Tour - Comprehensive and detailed
export const selfHubInteractiveTour: InteractiveStep[] = selfHubTours.main;

// Partnership Hub Interactive Tour - Comprehensive and detailed
export const partnershipHubTour: InteractiveStep[] = partnershipHubInteractiveTour;

// Main navigation tour for discovering all features
export const fullAppTour: InteractiveStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to HeyContent',
    description: 'Let\'s take a quick tour of your content creation command center.',
    position: 'center',
    delay: 0,
    content: (
      <div className="space-y-3">
        {TourContent.welcomeHeader(<Sparkles className="w-4 h-4" />, 'Complete App Tour')}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This tour will show you all the key features across HeyContent.
        </p>
      </div>
    )
  },
  {
    id: 'navigate-to-chat',
    title: 'AI Chat Interface',
    description: 'Your AI conversation hub for content assistance.',
    navigateTo: '/dashboard/chat',
    navigationDelay: 1000,
    target: '[data-chat-input]',
    position: 'top',
    delay: 800,
    action: 'focus',
    content: (
      <div className="space-y-2">
        <p className="text-sm">Ask questions and get AI assistance with:</p>
        {TourContent.featureList([
          'Content ideas and strategy',
          'Writing and editing help',
          'Analysis of your posts'
        ])}
      </div>
    )
  },
  {
    id: 'navigate-to-notes',
    title: 'Smart Notes',
    description: 'AI-powered note-taking and idea development.',
    navigateTo: '/dashboard/notes',
    navigationDelay: 1200,
    target: '[data-note-editor]',
    position: 'right',
    delay: 600,
    action: 'focus',
    content: (
      <div className="space-y-2">
        <p className="text-sm">Write notes with AI assistance - type "/" for commands!</p>
        {TourContent.proTip('Auto-save and organization built-in')}
      </div>
    )
  },
  {
    id: 'navigate-to-content-hub',
    title: 'Content Hub',
    description: 'Connect platforms for content analytics and insights.',
    navigateTo: '/dashboard/content-hub',
    navigationDelay: 1200,
    position: 'center',
    delay: 700,
    content: (
      <div className="space-y-2">
        <p className="text-sm">Connect your social media accounts for:</p>
        {TourContent.featureList([
          'Performance analytics',
          'AI-powered insights',
          'Content discussions'
        ])}
      </div>
    )
  },
  {
    id: 'navigate-to-self-hub',
    title: 'Self Hub',
    description: 'Your creator dashboard for tracking growth and optimizing workflow.',
    navigateTo: '/dashboard/self-hub',
    navigationDelay: 1200,
    position: 'center',
    delay: 700,
    content: (
      <div className="space-y-2">
        <p className="text-sm">Discover your creator patterns and optimize your workflow:</p>
        {TourContent.featureList([
          'Persona management and evolution',
          'Content timeline and journey',
          'Activity patterns and productivity insights'
        ])}
      </div>
    )
  },
  {
    id: 'tour-complete',
    title: 'Ready to Create! 🎉',
    description: 'You\'ve seen the key features - now start creating amazing content.',
    navigateTo: '/dashboard/chat',
    navigationDelay: 800,
    position: 'center',
    delay: 0,
    content: (
      <div className="space-y-3">
        {TourContent.welcomeHeader(<Sparkles className="w-4 h-4" />, 'Next Steps')}
        <div className="text-sm space-y-2">
          <p><strong>Get started:</strong></p>
          {TourContent.featureList([
            'Set up your persona with "hey content persona"',
            'Connect social media accounts in Settings',
            'Start asking questions and creating content',
            'Use Self Hub to track your growth'
          ])}
        </div>
      </div>
    )
  }
];

// Export all tours - clean and organized
export const interactiveTours = {
  chat: chatInteractiveTour,
  notes: notesInteractiveTour,
  contentHub: contentHubInteractiveTour,
  selfHub: selfHubInteractiveTour,
  partnershipHub: partnershipHubTour,
  quickStart: quickStartTour,
  fullAppTour: fullAppTour
}; 