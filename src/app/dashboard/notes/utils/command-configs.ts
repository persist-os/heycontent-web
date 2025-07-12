import React from 'react';
import { 
  Lightbulb, 
  FileText, 
  Users, 
  BarChart3, 
  BookOpen, 
  CheckSquare, 
  Mail,
  Brain,
  Table,
  List,
  Heading1,
  Heading2,
  Heading3,
  Link,
  ExternalLink,
  Clock,
  Target,
  Zap,
  PenTool,
  Hash,
  Megaphone,
  TrendingUp,
  MessageSquare,
  Calendar,
  FileCheck,
  Sparkles,
  Send,
  Edit3,
  Eye,
  Timer,
  Star,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Palette,
  Volume2,
  Image,
  Camera,
  X,
  DollarSign,
  Shield,
  Scissors,
  Copy,
  RefreshCw,
  ArrowUp,
  Bookmark,
  Search,
  Filter,
  Layers,
  UserCheck,
  MessageCircle,
  PlayCircle,
  BarChart,
  Activity,
  Gauge,
  Percent,
  Award,
  Briefcase,
  FileSignature,
  Settings
} from 'lucide-react';

// Re-export existing types from InlineCommandPalette for consistency
export interface CommandOption {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  requiresInput?: boolean;
  category?: string;
}

export interface TypeSpecificConfig {
  quickCommands: Omit<CommandOption, 'action'>[];
  defaultPrompts: string[];
  categories: string[];
}

export type NoteType = 
  | 'idea_bank' 
  | 'content_script' 
  | 'collaboration_note' 
  | 'analytics_insight' 
  | 'reflection_journal' 
  | 'task_checklist' 
  | 'email_draft';

// Helper function to create icon components
const createIcon = (IconComponent: React.ComponentType<{ className?: string }>) => 
  React.createElement(IconComponent, { className: "w-4 h-4" });

// Configuration for each note type based on real creator workflow research
export const NOTE_TYPE_CONFIGS: Record<NoteType, TypeSpecificConfig> = {
  // Idea Bank - Eliminate 70% of creative blocks with systematic ideation
  idea_bank: {
    quickCommands: [
              {
          id: 'trend-mining',
          label: 'Mine trending topics',
          description: 'Research what\'s trending in my niche and turn it into 15+ content ideas in 10 minutes',
          icon: createIcon(TrendingUp),
          category: 'Research'
        },
      {
        id: 'audience-question-harvest',
        label: 'Harvest audience questions',
        description: 'Turn my comments, DMs, and community feedback into a content goldmine',
        icon: createIcon(MessageCircle),
        category: 'Research'
      },
      {
        id: 'competitor-gap-analysis',
        label: 'Find content gaps',
        description: 'Identify what successful creators in my space aren\'t covering yet',
        icon: createIcon(Search),
        category: 'Research'
      },
      {
        id: 'viral-concept-generator',
        label: 'Generate viral concepts',
        description: 'Create content ideas designed for maximum shareability and engagement',
        icon: createIcon(Zap),
        category: 'Ideate'
      },
      {
        id: 'series-multiplication',
        label: 'Turn 1 idea into 10',
        description: 'Expand this single concept into a multi-part content series',
        icon: createIcon(Layers),
        category: 'Expand'
      },
      {
        id: 'seasonal-calendar-builder',
        label: 'Build seasonal calendar',
        description: 'Create a 3-month content calendar around holidays, events, and seasonal trends',
        icon: createIcon(Calendar),
        category: 'Plan'
      }
    ],
    defaultPrompts: [
      'Research what\'s trending in [my niche] right now and generate 15 unique content angles I can cover',
      'Analyze my last 50 comments and DMs - what questions could I turn into viral content?',
      'Find 5 content gaps that top creators in my space aren\'t covering that I could own',
      'Take this basic idea and create a viral concept with maximum shareability potential',
      'Turn this single concept into a 10-part content series with unique angles for each piece',
      'Build me a seasonal content calendar for the next 3 months with holiday and trending angles'
    ],
    categories: ['Research', 'Ideate', 'Strategy']
  },

  // Content Script - Eliminate the 2-4 hour script bottleneck
  content_script: {
    quickCommands: [
      {
        id: 'hook-multiplier',
        label: 'Generate 10 hook variations',
        description: 'Create multiple scroll-stopping openings to test which performs best',
        icon: createIcon(Megaphone),
        category: 'Creation'
      },
      {
        id: 'retention-maximizer',
        label: 'Maximize watch time',
        description: 'Restructure script with pattern interrupts and curiosity loops to prevent drop-offs',
        icon: createIcon(Activity),
        category: 'Optimization'
      },
      {
        id: 'platform-adapter',
        label: 'Adapt for all platforms',
        description: 'Convert this script for TikTok (60s), Instagram (90s), YouTube (varies), Twitter thread',
        icon: createIcon(RefreshCw),
        category: 'Distribution'
      },
      {
        id: 'hashtag-researcher',
        label: 'Research viral hashtags',
        description: 'Find 20 hashtags my audience actually follows (not just high-volume ones)',
        icon: createIcon(Hash),
        category: 'Distribution'
      },
      {
        id: 'cta-psychology',
        label: 'Psychology-driven CTAs',
        description: 'Create calls-to-action that actually drive comments, shares, and follows',
        icon: createIcon(Target),
        category: 'Optimization'
      },
      {
        id: 'thumbnail-concepts',
        label: 'Design thumbnail concepts',
        description: 'Generate 5 scroll-stopping thumbnail ideas that increase click-through rates',
        icon: createIcon(Camera),
        category: 'Creation'
      },
      {
        id: 'voice-consistency',
        label: 'Match my voice',
        description: 'Rewrite this script to sound authentically like me talking to my best friend',
        icon: createIcon(Palette),
        category: 'Creation'
      }
    ],
    defaultPrompts: [
      'Write 10 different hook variations for this content and rank them by scroll-stopping potential',
      'Restructure this script to maximize retention - add pattern interrupts every 15-20 seconds',
      'Adapt this script for: TikTok (60s), Instagram Reel (90s), YouTube Short (60s), Twitter thread',
      'Research 20 hashtags my target audience actively follows, not just high-volume trending ones',
      'Create 3 different CTAs using psychology principles that will actually drive engagement',
      'Generate 5 thumbnail concepts that would make someone stop mid-scroll and click immediately',
      'Rewrite this script to sound like my authentic voice - conversational, relatable, and naturally me'
    ],
    categories: ['Creation', 'Optimization', 'Distribution']
  },

  // Collaboration Note - Reduce 40-60% administrative overhead
  collaboration_note: {
    quickCommands: [
      {
        id: 'scope-protector',
        label: 'Define bulletproof scope',
        description: 'Break down deliverables with specific metrics to prevent scope creep',
        icon: createIcon(Shield),
        category: 'Legal'
      },
      {
        id: 'rate-calculator',
        label: 'Calculate fair rates',
        description: 'Price this collaboration based on my metrics and industry standards',
        icon: createIcon(DollarSign),
        category: 'Business'
      },
      {
        id: 'contract-negotiator',
        label: 'Identify negotiation points',
        description: 'Spot contract terms I need to negotiate to protect my interests',
        icon: createIcon(FileSignature),
        category: 'Legal'
      },
      {
        id: 'timeline-realist',
        label: 'Set realistic timelines',
        description: 'Create achievable deadlines that account for revisions and brand approval cycles',
        icon: createIcon(Clock),
        category: 'Strategy'
      },
      {
        id: 'stakeholder-mapper',
        label: 'Map decision makers',
        description: 'Identify who makes decisions and who I need approval from at each stage',
        icon: createIcon(Users),
        category: 'Strategy'
      },
      {
        id: 'revision-controller',
        label: 'Control revision cycles',
        description: 'Set up systems to track feedback and prevent endless revision loops',
        icon: createIcon(RotateCcw),
        category: 'Strategy'
      },
      {
        id: 'payment-securer',
        label: 'Secure payment terms',
        description: 'Establish milestone payments and protect against late payment',
        icon: createIcon(CheckCircle),
        category: 'Business'
      }
    ],
    defaultPrompts: [
      'Break this collaboration into specific deliverables with measurable success criteria to prevent scope creep',
      'Calculate fair pricing: I have [X] followers, [Y]% engagement rate in [niche] - what should I charge?',
      'Review this contract and identify key terms I should negotiate to protect my brand and payment',
      'Create a realistic timeline that includes buffer time for 2-3 revision rounds and brand approvals',
      'Map out the decision-making hierarchy at this brand - who approves what at each stage?',
      'Design a revision tracking system that limits feedback loops to 3 rounds maximum',
      'Structure payment milestones: 50% upfront, 25% at draft delivery, 25% final approval'
    ],
    categories: ['Business', 'Legal', 'Strategy']
  },

  // Analytics Insight - Turn data overwhelm into revenue-driving decisions
  analytics_insight: {
    quickCommands: [
      {
        id: 'revenue-tracker',
        label: 'Connect content to revenue',
        description: 'Identify which content directly led to brand deals, affiliate sales, or monetization',
        icon: createIcon(DollarSign),
        category: 'Business'
      },
      {
        id: 'retention-analyzer',
        label: 'Find drop-off points',
        description: 'Identify exact timestamps where viewers leave and why they\'re dropping off',
        icon: createIcon(BarChart),
        category: 'Performance'
      },
      {
        id: 'audience-profiler',
        label: 'Profile engaged audience',
        description: 'Understand who my most valuable followers are and what content they love',
        icon: createIcon(UserCheck),
        category: 'Performance'
      },
      {
        id: 'competitor-benchmarker',
        label: 'Benchmark vs competitors',
        description: 'Compare my metrics to similar creators and identify improvement opportunities',
        icon: createIcon(BarChart3),
        category: 'Strategy'
      },
      {
        id: 'roi-calculator',
        label: 'Calculate content ROI',
        description: 'Determine which content types give the best return on time invested',
        icon: createIcon(Percent),
        category: 'Business'
      },
      {
        id: 'growth-forecaster',
        label: 'Predict growth trajectory',
        description: 'Forecast where my metrics are heading based on current performance patterns',
        icon: createIcon(TrendingUp),
        category: 'Strategy'
      },
      {
        id: 'actionable-insights',
        label: 'Extract action items',
        description: 'Turn this data into specific changes I should make to my content strategy',
        icon: createIcon(Target),
        category: 'Strategy'
      }
    ],
    defaultPrompts: [
      'Analyze which of my content pieces directly led to revenue opportunities in the last 90 days',
      'Identify exact drop-off points in my videos and suggest specific reasons why viewers are leaving',
      'Profile my most engaged followers - demographics, content preferences, and engagement patterns',
      'Compare my engagement rate, growth, and reach to successful creators in my niche',
      'Calculate ROI for different content types: time to create vs performance metrics',
      'Based on current trends, predict my follower growth and revenue potential for next 6 months',
      'Give me 5 specific actions I should take based on this data to improve my content performance'
    ],
    categories: ['Business', 'Performance', 'Strategy']
  },

  // Reflection Journal - Systematic growth tracking for sustainable success
  reflection_journal: {
    quickCommands: [
      {
        id: 'win-celebrator',
        label: 'Celebrate hidden wins',
        description: 'Identify progress and growth that\'s easy to overlook in the daily hustle',
        icon: createIcon(Award),
        category: 'Personal'
      },
      {
        id: 'failure-learner',
        label: 'Extract valuable lessons',
        description: 'Turn setbacks into actionable insights that improve my future strategy',
        icon: createIcon(Lightbulb),
        category: 'Personal'
      },
      {
        id: 'creativity-optimizer',
        label: 'Optimize creative flow',
        description: 'Understand when and how my best creative ideas emerge',
        icon: createIcon(Brain),
        category: 'Personal'
      },
      {
        id: 'burnout-detector',
        label: 'Detect burnout signals',
        description: 'Spot early warning signs before they impact my content quality',
        icon: createIcon(AlertTriangle),
        category: 'Personal'
      },
      {
        id: 'goal-realigner',
        label: 'Realign my objectives',
        description: 'Adjust goals based on what I\'ve learned about myself and my audience',
        icon: createIcon(Target),
        category: 'Strategy'
      },
      {
        id: 'audience-connector',
        label: 'Deepen audience bonds',
        description: 'Reflect on how to create more meaningful connections with my community',
        icon: createIcon(MessageSquare),
        category: 'Strategy'
      },
      {
        id: 'revenue-tracker',
        label: 'Track income growth',
        description: 'Analyze my creator economy earnings and identify revenue optimization opportunities',
        icon: createIcon(DollarSign),
        category: 'Business'
      }
    ],
    defaultPrompts: [
      'What progress have I made this month that I might be undervaluing? Help me celebrate the wins',
      'Analyze what went wrong with [specific situation] and extract 3 actionable lessons for next time',
      'When do my best creative ideas come? What patterns can I identify in my creative process?',
      'Am I showing early signs of burnout? What should I change to protect my creative energy?',
      'Based on recent learnings about myself and my audience, how should I adjust my goals?',
      'How can I create deeper connections with my audience based on recent community interactions?',
      'Analyze my revenue streams from the past quarter - where should I focus for growth?'
    ],
    categories: ['Personal', 'Business', 'Strategy']
  },

  // Task Checklist - Eliminate 40-60% time waste on admin tasks
  task_checklist: {
    quickCommands: [
      {
        id: 'revenue-prioritizer',
        label: 'Prioritize money-makers',
        description: 'Reorder tasks based on direct revenue impact - money-makers first',
        icon: createIcon(DollarSign),
        category: 'Business'
      },
      {
        id: 'batch-processor',
        label: 'Batch similar tasks',
        description: 'Group similar tasks for focused work sessions and maximum efficiency',
        icon: createIcon(Layers),
        category: 'Organization'
      },
      {
        id: 'delegation-identifier',
        label: 'Identify what to outsource',
        description: 'Determine which tasks to delegate, automate, or stop doing entirely',
        icon: createIcon(Users),
        category: 'Strategy'
      },
      {
        id: 'content-scheduler',
        label: 'Build content calendar',
        description: 'Transform tasks into a strategic content production and publishing schedule',
        icon: createIcon(Calendar),
        category: 'Strategy'
      },
      {
        id: 'energy-matcher',
        label: 'Match tasks to energy',
        description: 'Schedule creative work for peak hours, admin tasks for low-energy times',
        icon: createIcon(Gauge),
        category: 'Organization'
      },
      {
        id: 'milestone-creator',
        label: 'Create motivating milestones',
        description: 'Break big goals into celebration-worthy checkpoints that maintain momentum',
        icon: createIcon(CheckCircle),
        category: 'Organization'
      },
      {
        id: 'time-estimator',
        label: 'Estimate realistic time',
        description: 'Calculate how long tasks actually take to prevent schedule overruns',
        icon: createIcon(Clock),
        category: 'Organization'
      }
    ],
    defaultPrompts: [
      'Reorder these tasks by direct revenue impact - what makes money gets done first',
      'Group these tasks into batches I can complete in focused 2-3 hour work sessions',
      'Which of these tasks should I delegate to team members, automate, or eliminate entirely?',
      'Turn this task list into a strategic content calendar with optimal posting times',
      'Organize tasks by energy level: creative work for peak hours, admin for low-energy times',
      'Break down big goals into weekly milestones that feel achievable and worth celebrating',
      'Estimate realistic time requirements for each task to prevent overpacking my schedule'
    ],
    categories: ['Organization', 'Business', 'Strategy']
  },

  // Email Draft - Save 2-3 hours daily with professional templates
  email_draft: {
    quickCommands: [
      // Quick Actions - Simple responses for common scenarios
      {
        id: 'draft-reply',
        label: 'Draft professional reply',
        description: 'Create a professional response that maintains my brand voice',
        icon: createIcon(Mail),
        category: 'Quick Actions'
      },
      {
        id: 'accept-offer',
        label: 'Accept collaboration',
        description: 'Enthusiastically accept while confirming key details',
        icon: createIcon(CheckCircle),
        category: 'Quick Actions'
      },
      {
        id: 'reject-offer',
        label: 'Decline politely',
        description: 'Say no while keeping doors open for future opportunities',
        icon: createIcon(X),
        category: 'Quick Actions'
      },
      {
        id: 'request-details',
        label: 'Ask for more info',
        description: 'Request missing details about timeline, budget, and deliverables',
        icon: createIcon(MessageSquare),
        category: 'Quick Actions'
      },
      
      // Negotiation - Advanced rate and terms discussions
      {
        id: 'rate-negotiator',
        label: 'Negotiate rates confidently',
        description: 'Counter lowball offers with data-backed justifications and market rates',
        icon: createIcon(DollarSign),
        category: 'Negotiation'
      },
      {
        id: 'scope-clarifier',
        label: 'Clarify project scope',
        description: 'Ask strategic questions to prevent misunderstandings and scope creep',
        icon: createIcon(FileCheck),
        category: 'Negotiation'
      },
      {
        id: 'timeline-negotiator',
        label: 'Negotiate realistic timelines',
        description: 'Professionally explain why I need adequate time for quality deliverables',
        icon: createIcon(Clock),
        category: 'Negotiation'
      },
      {
        id: 'usage-protector',
        label: 'Protect content usage',
        description: 'Negotiate how long and where brands can use my content',
        icon: createIcon(Shield),
        category: 'Negotiation'
      },
      
      // Strategy - Brand evaluation and relationship building
      {
        id: 'brand-evaluator',
        label: 'Evaluate brand alignment',
        description: 'Assess if this brand matches my values and audience without being rude',
        icon: createIcon(Shield),
        category: 'Strategy'
      },
      {
        id: 'follow-up-strategist',
        label: 'Strategic follow-ups',
        description: 'Follow up on opportunities without appearing desperate or pushy',
        icon: createIcon(Send),
        category: 'Strategy'
      },
      {
        id: 'payment-securer',
        label: 'Secure payment terms',
        description: 'Ensure timely payment with clear milestones and penalties',
        icon: createIcon(Briefcase),
        category: 'Strategy'
      }
    ],
    defaultPrompts: [
      'Draft a professional reply that maintains my brand voice and sets the right tone',
      'Accept this collaboration enthusiastically while confirming all the important details',
      'Politely decline this opportunity while keeping the door open for future collaborations',
      'Ask for missing details about timeline, budget, deliverables, and usage rights',
      'Help me counter this rate offer professionally: I have [X] followers, [Y]% engagement in [niche]',
      'Ask clarifying questions about: deliverables, timeline, usage rights, approval process, and payment',
      'Professionally explain why I need [X] weeks for this project to deliver quality work',
      'Draft a polite response checking if this brand aligns with my values without offending them',
      'Write a follow-up for this opportunity that shows interest without appearing desperate',
      'Secure payment terms: 50% upfront, 50% on delivery, with late payment penalties'
    ],
    categories: ['Quick Actions', 'Negotiation', 'Strategy', 'Professional']
  }
};

// Universal commands that appear across all note types
export const UNIVERSAL_COMMANDS: Omit<CommandOption, 'action'>[] = [
  // Content Generation
  {
    id: 'ideas',
    label: 'Brainstorm ideas',
    description: 'Generate fresh, innovative content concepts',
    icon: createIcon(Lightbulb),
    category: 'Create'
  },
  {
    id: 'analysis',
    label: 'Deep analysis',
    description: 'Break down complex information into actionable insights',
    icon: createIcon(Brain),
    category: 'Analyze'
  },
  {
    id: 'action-items',
    label: 'Extract action items',
    description: 'Turn information into specific, actionable next steps',
    icon: createIcon(CheckCircle),
    category: 'Organize'
  },
  
  // Formatting
  {
    id: 'bullet-list',
    label: 'Bullet points',
    description: 'Convert to scannable bullet points for clarity',
    icon: createIcon(List),
    category: 'Format'
  },
  {
    id: 'numbered-list',
    label: 'Numbered steps',
    description: 'Create sequential, easy-to-follow instructions',
    icon: createIcon(List),
    category: 'Format'
  },
  {
    id: 'heading-1',
    label: 'Main heading',
    description: 'Add attention-grabbing primary headers',
    icon: createIcon(Heading1),
    category: 'Format'
  },
  {
    id: 'heading-2',
    label: 'Section header',
    description: 'Organize content with clear subsections',
    icon: createIcon(Heading2),
    category: 'Format'
  },
  {
    id: 'heading-3',
    label: 'Sub-header',
    description: 'Add structure with detailed breakdowns',
    icon: createIcon(Heading3),
    category: 'Format'
  },
  {
    id: 'table',
    label: 'Data table',
    description: 'Organize information in rows and columns',
    icon: createIcon(Table),
    category: 'Data'
  },
  {
    id: 'summary',
    label: 'Create summary',
    description: 'Condense key points into digestible highlights',
    icon: createIcon(FileText),
    category: 'Organize'
  }
];

// Helper function to get commands for a specific note type
export function getCommandsForNoteType(noteType: NoteType): {
  typeSpecificCommands: Omit<CommandOption, 'action'>[];
  universalCommands: Omit<CommandOption, 'action'>[];
  defaultPrompts: string[];
  categories: string[];
} {
  const config = NOTE_TYPE_CONFIGS[noteType] || NOTE_TYPE_CONFIGS.idea_bank;
  
  return {
    typeSpecificCommands: config.quickCommands,
    universalCommands: UNIVERSAL_COMMANDS,
    defaultPrompts: config.defaultPrompts,
    categories: config.categories
  };
}

// Helper function to get prompt suggestions for a note type
export function getPromptsForNoteType(noteType: NoteType): string[] {
  const config = NOTE_TYPE_CONFIGS[noteType] || NOTE_TYPE_CONFIGS.idea_bank;
  return config.defaultPrompts;
}

// Helper function to check if a command exists for a note type
export function hasTypeSpecificCommand(noteType: NoteType, commandId: string): boolean {
  const config = NOTE_TYPE_CONFIGS[noteType];
  if (!config) return false;
  
  return config.quickCommands.some(cmd => cmd.id === commandId);
} 