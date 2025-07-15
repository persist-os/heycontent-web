import React from 'react';
import { InteractiveStep } from '@/components/ui/interactive-tooltip';
import { User, Calendar, BarChart3, Target, Sparkles, TrendingUp, Clock, Award, FileText, Lightbulb, Activity } from 'lucide-react';
import { TourContent } from './tourContent';

// Self Hub specific content components
export const SelfHubContent = {
  // Enhanced persona content
  personaManagementDetailed: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <User className="w-4 h-4" />
        <span className="font-medium">Persona System</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Your persona is the foundation of everything in HeyContent. Here's how to manage it:</strong></p>
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30 p-3 rounded-lg">
          <p className="font-medium mb-2 text-blue-800 dark:text-blue-200">🎯 What Your Persona Includes:</p>
          <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
            <li>• <strong>Content Style & Voice:</strong> Your unique writing tone and approach</li>
            <li>• <strong>Target Audience:</strong> Demographics, interests, and preferences</li>
            <li>• <strong>Goals & Objectives:</strong> What you want to achieve with your content</li>
            <li>• <strong>Platform Preferences:</strong> Where you focus your content efforts</li>
            <li>• <strong>Brand Values:</strong> What you stand for and believe in</li>
          </ul>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/30 p-3 rounded-lg">
          <p className="font-medium mb-2 text-purple-800 dark:text-purple-200">📈 How It Powers Your Growth:</p>
          <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
            <li>• AI suggestions match your authentic voice</li>
            <li>• Content recommendations align with your goals</li>
            <li>• Audience insights become more targeted</li>
            <li>• Growth strategies are personalized to your niche</li>
          </ul>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Growth tip:</strong> Update your persona every 2-3 weeks as you evolve. Your content journey is dynamic!
        </div>
      </div>
    </div>
  ),

  // Timeline view detailed content
  timelineViewDetailed: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <Calendar className="w-4 h-4" />
        <span className="font-medium">Content Timeline</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>See your entire content journey in chronological order - every conversation, note, post, and insight.</strong></p>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/30 p-3 rounded-lg">
          <p className="font-medium mb-2 text-green-800 dark:text-green-200">🗓️ What You'll See:</p>
          <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
            <li>• <strong>Daily Activity:</strong> All your content creation moments</li>
            <li>• <strong>Conversation Highlights:</strong> Key AI discussions and breakthroughs</li>
            <li>• <strong>Smart Notes Evolution:</strong> How your ideas developed over time</li>
            <li>• <strong>Platform Posts:</strong> Instagram, YouTube, and other content</li>
            <li>• <strong>Growth Milestones:</strong> Important achievements and insights</li>
          </ul>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30 p-3 rounded-lg">
          <p className="font-medium mb-2 text-blue-800 dark:text-blue-200">💡 Use Timeline For:</p>
          <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
            <li>• <strong>Reflection:</strong> See how far you've come</li>
            <li>• <strong>Pattern Recognition:</strong> Identify what works</li>
            <li>• <strong>Content Planning:</strong> Build on successful themes</li>
            <li>• <strong>Inspiration:</strong> Rediscover forgotten gems</li>
          </ul>
        </div>
        <div className="bg-green-100 dark:bg-green-950/40 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Magic moment:</strong> Click any timeline item to jump back to that conversation or note!
        </div>
      </div>
    </div>
  ),

  // Activity heatmap detailed content
  activityHeatmapDetailed: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
        <BarChart3 className="w-4 h-4" />
        <span className="font-medium">Activity Analytics</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Visualize your creative patterns and discover your most productive times and platforms.</strong></p>
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/30 p-3 rounded-lg">
          <p className="font-medium mb-2 text-purple-800 dark:text-purple-200">📊 Analytics You'll Discover:</p>
          <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
            <li>• <strong>Peak Hours:</strong> When you're most creative and productive</li>
            <li>• <strong>Platform Usage:</strong> Where you spend your content time</li>
            <li>• <strong>Content Streaks:</strong> Your most productive periods</li>
            <li>• <strong>Topic Patterns:</strong> What themes you explore most</li>
            <li>• <strong>Engagement Cycles:</strong> When your audience is most active</li>
          </ul>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/30 p-3 rounded-lg">
          <p className="font-medium mb-2 text-orange-800 dark:text-orange-200">🎯 Optimize Your Workflow:</p>
          <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
            <li>• <strong>Schedule Creation:</strong> Work during your peak hours</li>
            <li>• <strong>Platform Focus:</strong> Double down on what's working</li>
            <li>• <strong>Batch Content:</strong> Use your productive streaks</li>
            <li>• <strong>Audience Timing:</strong> Post when they're most engaged</li>
          </ul>
        </div>
        <div className="bg-purple-100 dark:bg-purple-950/40 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Pro insight:</strong> Most creators have 2-3 peak productivity windows per week. Find yours!
        </div>
      </div>
    </div>
  ),

  // Goals and milestones content
  goalsAndMilestones: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
        <Target className="w-4 h-4" />
        <span className="font-medium">Goals & Milestones</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Track your content creation goals and celebrate your achievements along the way.</strong></p>
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/30 p-3 rounded-lg">
          <p className="font-medium mb-2 text-indigo-800 dark:text-indigo-200">🎯 Smart Goal Tracking:</p>
          <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
            <li>• <strong>Content Consistency:</strong> Daily/weekly creation targets</li>
            <li>• <strong>Audience Growth:</strong> Follower and engagement milestones</li>
            <li>• <strong>Platform Expansion:</strong> New channel development</li>
            <li>• <strong>Revenue Goals:</strong> Monetization and partnership targets</li>
            <li>• <strong>Skill Development:</strong> Learning and improvement objectives</li>
          </ul>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Achievement unlock:</strong> HeyContent celebrates your wins and suggests next-level challenges!
        </div>
      </div>
    </div>
  )
};

// Comprehensive Self Hub Interactive Tour
export const selfHubInteractiveTour: InteractiveStep[] = [
  {
    id: 'self-welcome',
    title: 'Welcome to Your Creator Dashboard',
    description: 'Your Self Hub is mission control for your content creation journey - track growth, analyze patterns, and evolve your creator identity.',
    position: 'center',
    delay: 0,
    content: (
      <div className="space-y-3">
        {TourContent.welcomeHeader(<User className="w-4 h-4" />, 'Self Hub Tour')}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This comprehensive tour shows you how to use Self Hub to understand your creator journey, optimize your workflow, and accelerate your growth.
        </p>
        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Creator insight:</strong> Self-awareness is the key to sustained content success. Let's dive deep into your data!
        </div>
      </div>
    )
  },
  {
    id: 'persona-management',
    title: 'Persona Management: Your Creator DNA',
    description: 'View, edit, and evolve your content persona - the AI uses this to personalize everything for you.',
    target: '[data-persona-tab]',
    position: 'bottom',
    delay: 300,
    action: 'click',
    content: SelfHubContent.personaManagementDetailed
  },
  {
    id: 'persona-evolution',
    title: 'Persona Evolution Tracker',
    description: 'See how your creator identity has evolved over time with version history and growth insights.',
    target: '[data-persona-history]',
    position: 'right',
    delay: 400,
    action: 'hover',
    fallbackContent: (
      <div className="space-y-2">
        <p className="text-sm">Track how your persona evolves as you grow!</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Your persona history shows your creator journey and helps identify growth patterns.
        </p>
      </div>
    ),
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">Growth Tracking</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>Your persona isn't static - it grows with you:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Version History:</strong> See how your voice has evolved</li>
            <li>• <strong>Growth Markers:</strong> Key moments that shaped your identity</li>
            <li>• <strong>Audience Shifts:</strong> How your target market has expanded</li>
            <li>• <strong>Goal Evolution:</strong> Your changing aspirations and focus</li>
          </ul>
          <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Insight:</strong> Successful creators update their persona every 2-3 weeks as they learn and grow!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'timeline-view',
    title: 'Content Timeline: Your Creative Journey',
    description: 'Click the "Timeline" tab above to see your entire content journey - conversations, notes, posts, and insights - all in chronological order.',
    target: '[data-timeline-tab]',
    position: 'bottom',
    delay: 400,
    action: 'none',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <Calendar className="w-4 h-4" />
          <span className="font-medium">Timeline Overview</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>👆 Click the "Timeline" tab to explore:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Chronological View:</strong> Everything you've created in order</li>
            <li>• <strong>Content Types:</strong> Notes, chats, posts, and AI insights</li>
            <li>• <strong>Growth Patterns:</strong> See how your content evolved</li>
            <li>• <strong>Inspiration Moments:</strong> Rediscover breakthrough ideas</li>
            <li>• <strong>Cross-Platform:</strong> All your content in one timeline</li>
          </ul>
          <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Creator tip:</strong> Your timeline is perfect for finding patterns in your most successful content!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'timeline-filters',
    title: 'Timeline Filters: Find What Matters',
    description: 'Once you\'re on the Timeline tab, use powerful filters to find specific content types, time periods, or themes in your timeline.',
    target: '[data-timeline-filters]',
    position: 'center',
    delay: 300,
    action: 'none',
    fallbackContent: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <FileText className="w-4 h-4" />
          <span className="font-medium">Smart Filtering</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>When you click Timeline, you'll see filters to search by:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Content Type:</strong> Notes, chats, posts, insights</li>
            <li>• <strong>Platform:</strong> Instagram, YouTube, email, etc.</li>
            <li>• <strong>Time Period:</strong> Last week, month, or custom ranges</li>
            <li>• <strong>Topics/Tags:</strong> Specific themes or subjects</li>
            <li>• <strong>Performance:</strong> High-engagement content only</li>
          </ul>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Power move:</strong> Filter by high-performing content to identify your winning formulas!
          </div>
        </div>
      </div>
    ),
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <FileText className="w-4 h-4" />
          <span className="font-medium">Smart Filtering</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>When you click Timeline, you'll see filters to search by:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Content Type:</strong> Notes, chats, posts, insights</li>
            <li>• <strong>Platform:</strong> Instagram, YouTube, email, etc.</li>
            <li>• <strong>Time Period:</strong> Last week, month, or custom ranges</li>
            <li>• <strong>Topics/Tags:</strong> Specific themes or subjects</li>
            <li>• <strong>Performance:</strong> High-engagement content only</li>
          </ul>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Power move:</strong> Filter by high-performing content to identify your winning formulas!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'activity-heatmap',
    title: 'Activity Heatmap: Discover Your Patterns',
    description: 'Click the "Activity" tab above to visualize your creative patterns and find your most productive times and platforms.',
    target: '[data-activity-tab]',
    position: 'bottom',
    delay: 500,
    action: 'none',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <BarChart3 className="w-4 h-4" />
          <span className="font-medium">Activity Analytics</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>👆 Click "Activity" to discover:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Productivity Heatmap:</strong> See your most creative hours</li>
            <li>• <strong>Platform Usage:</strong> Which tools you use most</li>
            <li>• <strong>Content Streaks:</strong> Track consistency patterns</li>
            <li>• <strong>Peak Performance:</strong> Your most productive days</li>
            <li>• <strong>Creative Rhythms:</strong> Find your natural flow</li>
          </ul>
          <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Insight:</strong> Understanding your patterns helps you optimize when and how you create content!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'productivity-insights',
    title: 'Productivity Insights: Optimize Your Workflow',
    description: 'Once you\'re on the Activity tab, see AI-powered recommendations to optimize your content creation workflow based on your patterns.',
    target: '[data-productivity-insights]',
    position: 'center',
    delay: 400,
    action: 'none',
    fallbackContent: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">AI Optimization</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>When you're on Activity, you'll see:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Peak Hours:</strong> When you're most creative</li>
            <li>• <strong>Tool Patterns:</strong> Your most effective workflows</li>
            <li>• <strong>Content Gaps:</strong> Opportunities to improve</li>
            <li>• <strong>AI Recommendations:</strong> Personalized productivity tips</li>
          </ul>
          <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Pro tip:</strong> AI analyzes your patterns to suggest when and how to create for maximum impact!
          </div>
        </div>
      </div>
    ),
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <Lightbulb className="w-4 h-4" />
          <span className="font-medium">AI Optimization</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>Get personalized recommendations for:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Optimal Posting Times:</strong> When your audience is most active</li>
            <li>• <strong>Content Batching:</strong> How to group similar tasks</li>
            <li>• <strong>Peak Productivity:</strong> Your best creation windows</li>
            <li>• <strong>Platform Scheduling:</strong> Which platforms to prioritize when</li>
            <li>• <strong>Break Recommendations:</strong> When to rest for sustained creativity</li>
          </ul>
          <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Success secret:</strong> The most successful creators optimize their workflow based on data, not just intuition!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'goals-milestones',
    title: 'Goals & Milestones: Track Your Growth',
    description: 'In the Activity tab, you can set content creation goals, track milestones, and celebrate your achievements along the way.',
    target: '[data-goals-section]',
    position: 'center',
    delay: 300,
    action: 'none',
    fallbackContent: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Target className="w-4 h-4" />
          <span className="font-medium">Goal Setting</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>In Activity, you'll find goal tracking for:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Content Volume:</strong> Posts per week/month targets</li>
            <li>• <strong>Engagement Goals:</strong> Likes, comments, shares milestones</li>
            <li>• <strong>Platform Growth:</strong> Follower and subscriber targets</li>
            <li>• <strong>Revenue Milestones:</strong> Monetization achievements</li>
            <li>• <strong>Consistency Streaks:</strong> Daily/weekly posting goals</li>
          </ul>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Growth mindset:</strong> Celebrate small wins - they compound into major achievements!
          </div>
        </div>
      </div>
    ),
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Target className="w-4 h-4" />
          <span className="font-medium">Goal Setting</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>In Activity, you'll find goal tracking for:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Content Volume:</strong> Posts per week/month targets</li>
            <li>• <strong>Engagement Goals:</strong> Likes, comments, shares milestones</li>
            <li>• <strong>Platform Growth:</strong> Follower and subscriber targets</li>
            <li>• <strong>Revenue Milestones:</strong> Monetization achievements</li>
            <li>• <strong>Consistency Streaks:</strong> Daily/weekly posting goals</li>
          </ul>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Growth mindset:</strong> Celebrate small wins - they compound into major achievements!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'performance-trends',
    title: 'Performance Trends: See Your Growth',
    description: 'In the Activity tab, track your content performance trends across all platforms and see what\'s driving your growth.',
    target: '[data-performance-trends]',
    position: 'center',
    delay: 400,
    action: 'none',
    fallbackContent: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">Growth Analytics</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>In Activity, visualize your growth trends:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Engagement Trends:</strong> Likes, comments, shares over time</li>
            <li>• <strong>Follower Growth:</strong> Audience expansion patterns</li>
            <li>• <strong>Content Performance:</strong> Which posts performed best</li>
            <li>• <strong>Platform Comparison:</strong> Cross-platform analytics</li>
            <li>• <strong>Growth Velocity:</strong> Rate of audience increase</li>
          </ul>
          <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Data insight:</strong> Trends reveal opportunities - focus on what's working and double down!
          </div>
        </div>
      </div>
    ),
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">Growth Analytics</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>Track your success metrics:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Follower Growth:</strong> Daily/weekly/monthly increases</li>
            <li>• <strong>Engagement Rates:</strong> Likes, comments, shares trends</li>
            <li>• <strong>Content Performance:</strong> Best and worst performing posts</li>
            <li>• <strong>Platform Comparison:</strong> Where you're growing fastest</li>
            <li>• <strong>Revenue Tracking:</strong> Monetization and partnership income</li>
          </ul>
          <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Growth hack:</strong> Focus on the metrics that truly matter for your specific goals, not vanity numbers!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'creator-insights',
    title: 'Creator Insights: AI-Powered Recommendations',
    description: 'Get personalized insights and recommendations to accelerate your content creator journey.',
    position: 'center',
    delay: 500,
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">AI Creator Coach</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>Your personal AI coach analyzes your data to provide:</strong></p>
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/30 p-3 rounded-lg">
            <p className="font-medium mb-2 text-indigo-800 dark:text-indigo-200">🧠 Intelligent Recommendations:</p>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>• <strong>Content Strategy:</strong> What to create next based on performance</li>
              <li>• <strong>Audience Insights:</strong> Who your content resonates with most</li>
              <li>• <strong>Growth Opportunities:</strong> Untapped platforms or content types</li>
              <li>• <strong>Collaboration Suggestions:</strong> Potential partnerships and sponsors</li>
              <li>• <strong>Skill Development:</strong> Areas to improve for bigger impact</li>
            </ul>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/30 p-3 rounded-lg">
            <p className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">⚡ Weekly Action Items:</p>
            <p className="text-xs text-gray-700 dark:text-gray-300">Every week, get 3-5 specific actions to take your content to the next level, personalized to your goals and performance data.</p>
          </div>
          <div className="bg-indigo-100 dark:bg-indigo-950/40 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>The secret:</strong> Successful creators combine creativity with data-driven decision making. Your AI coach helps you do both!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'self-hub-conclusion',
    title: 'You\'re Now a Data-Driven Creator! 📊',
    description: 'You\'ve mastered your Self Hub - time to use these insights to accelerate your growth.',
    position: 'center',
    delay: 0,
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <Award className="w-4 h-4" />
          <span className="font-medium">Creator Mastery</span>
        </div>
        <div className="text-sm space-y-3">
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/30 p-3 rounded-lg">
            <p className="font-medium mb-2 text-green-800 dark:text-green-200">🚀 Your Self-Optimization Workflow:</p>
            <ol className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li><strong>1.</strong> Check your timeline weekly to reflect on progress</li>
              <li><strong>2.</strong> Review activity heatmap to optimize your schedule</li>
              <li><strong>3.</strong> Update your persona every 2-3 weeks as you grow</li>
              <li><strong>4.</strong> Set and track meaningful goals, not just vanity metrics</li>
              <li><strong>5.</strong> Act on AI insights to accelerate your growth</li>
            </ol>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/30 p-3 rounded-lg">
            <p className="font-medium mb-2 text-purple-800 dark:text-purple-200">💡 Pro Creator Habits:</p>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Schedule weekly "data dates" to review your analytics</li>
              <li>• Use productivity insights to batch similar content tasks</li>
              <li>• Celebrate milestones - they fuel long-term motivation</li>
              <li>• Let your persona evolve - growth requires adaptation</li>
            </ul>
          </div>
          <p className="text-xs text-center font-medium text-purple-600 dark:text-purple-400">
            Data-driven creativity is your superpower! Use these insights to create content that truly resonates! ✨
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'explore-other-features',
    title: 'Continue Your HeyContent Journey! 🌟',
    description: 'Now that you\'ve mastered Self Hub, explore other powerful sections to complete your creator toolkit.',
    position: 'center',
    delay: 0,
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">Complete Your Toolkit</span>
        </div>
        <div className="text-sm space-y-3">
          <p className="text-gray-900 dark:text-gray-100">
            <strong>Continue exploring to unlock your full creative potential:</strong>
          </p>
          {TourContent.navigationGrid}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-blue-600 dark:text-blue-400">✨</div>
              <strong className="text-blue-800 dark:text-blue-200">Next Level Creator:</strong>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Combine Self Hub insights with Chat AI assistance, Smart Notes planning, and Content Hub analytics for unstoppable growth!
            </p>
          </div>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Remember: Great creators never stop learning and optimizing. Your journey is just beginning! 🚀
          </p>
        </div>
      </div>
    )
  }
];

// Export the comprehensive Self Hub tour
export const selfHubTours = {
  main: selfHubInteractiveTour
}; 