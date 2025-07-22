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
  Clock,
  Target,
  Zap,
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
  Palette,
  Volume2,
  DollarSign,
  Shield,
  Scissors,
  Copy,
  RefreshCw,
  ArrowUp,
  Search,
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
  Settings,
  Camera,
  X
} from 'lucide-react';

// Re-export existing types for consistency
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

// GENERATION COMMANDS - Create new content from scratch
export const NOTE_TYPE_CONFIGS: Record<NoteType, TypeSpecificConfig> = {
  // Idea Bank - Turn blank page into content goldmine
  idea_bank: {
    quickCommands: [
      {
        id: 'trend-mining',
        label: 'Mine trending topics for content',
        description: 'Research what\'s hot in your niche and spin it into 15+ unique angles',
        icon: createIcon(TrendingUp),
        category: 'Research'
      },
      {
        id: 'audience-question-harvest',
        label: 'Turn audience questions into content',
        description: 'Mine your comments, DMs, and community for viral content ideas',
        icon: createIcon(MessageCircle),
        category: 'Research'
      },
      {
        id: 'competitor-gap-finder',
        label: 'Find gaps competitors missed',
        description: 'Spot content opportunities others in your space aren\'t covering',
        icon: createIcon(Search),
        category: 'Research'
      },
      {
        id: 'viral-concept-builder',
        label: 'Build viral content concepts',
        description: 'Create ideas designed for maximum shares and saves',
        icon: createIcon(Zap),
        category: 'Generate'
      },
      {
        id: 'series-multiplier',
        label: 'Turn 1 idea into 10 videos',
        description: 'Expand this concept into a multi-part series with unique hooks',
        icon: createIcon(Layers),
        category: 'Generate'
      },
      {
        id: 'seasonal-calendar',
        label: 'Build 3-month content calendar',
        description: 'Map out seasonal trends, holidays, and viral moments to plan ahead',
        icon: createIcon(Calendar),
        category: 'Plan'
      },
      {
        id: 'pain-point-miner',
        label: 'Mine audience pain points',
        description: 'Extract content from your followers\' biggest struggles and frustrations',
        icon: createIcon(AlertTriangle),
        category: 'Research'
      }
    ],
    defaultPrompts: [
      'Research trending topics in [my niche] and create 15 unique content angles I can own',
      'Analyze my last 100 comments - what questions keep coming up that I could turn into viral content?',
      'Find 5 content gaps in my space that successful creators aren\'t covering yet',
      'Take this basic idea and build it into a viral concept with maximum shareability',
      'Transform this single concept into a 10-part series with different hooks for each video',
      'Create a 3-month content calendar around upcoming trends, holidays, and seasonal moments'
    ],
    categories: ['Research', 'Generate', 'Plan']
  },

  // Content Script - From concept to scroll-stopping content
  content_script: {
    quickCommands: [
      {
        id: 'full-script-creator',
        label: 'Write complete script from concept',
        description: 'Turn your idea into a full, engaging script with natural flow',
        icon: createIcon(FileText),
        category: 'Create'
      },
      {
        id: 'hook-generator',
        label: 'Generate 10 scroll-stopping hooks',
        description: 'Create multiple opening lines to test which grabs attention best',
        icon: createIcon(Megaphone),
        category: 'Create'
      },
      {
        id: 'retention-booster',
        label: 'Add retention tactics',
        description: 'Insert curiosity gaps and pattern interrupts to prevent drop-offs',
        icon: createIcon(Activity),
        category: 'Optimize'
      },
      {
        id: 'platform-adapter',
        label: 'Adapt for TikTok/IG/YouTube',
        description: 'Reformat this script for different platform requirements and audiences',
        icon: createIcon(RefreshCw),
        category: 'Adapt'
      },
      {
        id: 'hashtag-researcher',
        label: 'Research audience-focused hashtags',
        description: 'Find 20 hashtags your followers actually use, not just trending ones',
        icon: createIcon(Hash),
        category: 'Optimize'
      },
      {
        id: 'cta-psychology',
        label: 'Write psychology-driven CTAs',
        description: 'Create calls-to-action that actually get comments, shares, and follows',
        icon: createIcon(Target),
        category: 'Optimize'
      },
      {
        id: 'thumbnail-concepts',
        label: 'Design thumbnail concepts',
        description: 'Generate 5 click-worthy thumbnail ideas that stop the scroll',
        icon: createIcon(Camera),
        category: 'Create'
      }
    ],
    defaultPrompts: [
      'Write a complete script from this concept with natural flow and compelling storytelling',
      'Create 10 different hook variations and rank them by scroll-stopping potential',
      'Add retention tactics - curiosity gaps every 15 seconds to prevent drop-offs',
      'Adapt this script for TikTok (60s), Instagram (90s), and YouTube Short formats',
      'Research 20 hashtags my specific audience actually follows and engages with',
      'Write 3 CTAs using psychology that will drive the engagement I want',
      'Generate 5 thumbnail concepts that would make someone stop mid-scroll'
    ],
    categories: ['Create', 'Optimize', 'Adapt']
  },

  // Collaboration Note - Protect your brand and get paid fairly
  collaboration_note: {
    quickCommands: [
      {
        id: 'scope-definer',
        label: 'Define bulletproof scope',
        description: 'Break down deliverables with specific metrics to prevent scope creep',
        icon: createIcon(Shield),
        category: 'Protect'
      },
      {
        id: 'rate-calculator',
        label: 'Calculate your worth',
        description: 'Price this deal based on your metrics and industry standards',
        icon: createIcon(DollarSign),
        category: 'Money'
      },
      {
        id: 'contract-reviewer',
        label: 'Review contract red flags',
        description: 'Spot terms you need to negotiate to protect your interests',
        icon: createIcon(Eye),
        category: 'Protect'
      },
      {
        id: 'timeline-setter',
        label: 'Set realistic timelines',
        description: 'Create deadlines that account for revisions and approval cycles',
        icon: createIcon(Clock),
        category: 'Plan'
      },
      {
        id: 'payment-securer',
        label: 'Secure payment terms',
        description: 'Structure milestone payments to protect against late payment',
        icon: createIcon(CheckCircle),
        category: 'Money'
      },
      {
        id: 'brand-alignment-checker',
        label: 'Check brand alignment',
        description: 'Evaluate if this partnership fits your values and audience',
        icon: createIcon(UserCheck),
        category: 'Strategy'
      }
    ],
    defaultPrompts: [
      'Break this collaboration into specific deliverables to prevent scope creep',
      'Calculate fair pricing: I have [X] followers, [Y]% engagement - what should I charge?',
      'Review this contract and flag terms I should negotiate to protect myself',
      'Create realistic timeline with buffer for 2-3 revision rounds and approvals',
      'Structure payment: 50% upfront, 25% at draft, 25% final with late fees',
      'Analyze if this brand aligns with my values and audience expectations'
    ],
    categories: ['Protect', 'Money', 'Strategy', 'Plan']
  },

  // Analytics Insight - Turn data into revenue decisions
  analytics_insight: {
    quickCommands: [
      {
        id: 'revenue-connector',
        label: 'Connect metrics to money',
        description: 'Identify which content led to brand deals, sales, or monetization',
        icon: createIcon(DollarSign),
        category: 'Money'
      },
      {
        id: 'drop-off-analyzer',
        label: 'Find where viewers leave',
        description: 'Pinpoint exact moments and reasons for audience drop-offs',
        icon: createIcon(BarChart),
        category: 'Performance'
      },
      {
        id: 'audience-profiler',
        label: 'Profile your best followers',
        description: 'Understand who engages most and what content they love',
        icon: createIcon(UserCheck),
        category: 'Audience'
      },
      {
        id: 'competitor-benchmarker',
        label: 'Benchmark vs competitors',
        description: 'Compare your performance to similar creators in your niche',
        icon: createIcon(BarChart3),
        category: 'Strategy'
      },
      {
        id: 'roi-calculator',
        label: 'Calculate content ROI',
        description: 'Find which content types give best return on time invested',
        icon: createIcon(Percent),
        category: 'Money'
      },
      {
        id: 'growth-forecaster',
        label: 'Predict growth trajectory',
        description: 'Forecast where your metrics are heading based on trends',
        icon: createIcon(TrendingUp),
        category: 'Strategy'
      }
    ],
    defaultPrompts: [
      'Show me which content directly led to revenue opportunities in the last 90 days',
      'Analyze drop-off points and explain why viewers are leaving at those moments',
      'Profile my most engaged followers - who are they and what do they want?',
      'Compare my metrics to successful creators in my niche - where do I stand?',
      'Calculate ROI: which content types give the best return on time invested?',
      'Based on current patterns, predict my growth and revenue potential'
    ],
    categories: ['Money', 'Performance', 'Audience', 'Strategy']
  },

  // Reflection Journal - Learn from wins and setbacks
  reflection_journal: {
    quickCommands: [
      {
        id: 'win-highlighter',
        label: 'Celebrate hidden progress',
        description: 'Surface wins and growth you might be overlooking',
        icon: createIcon(Award),
        category: 'Growth'
      },
      {
        id: 'lesson-extractor',
        label: 'Extract lessons from setbacks',
        description: 'Turn failures into actionable insights for future success',
        icon: createIcon(Lightbulb),
        category: 'Learning'
      },
      {
        id: 'pattern-spotter',
        label: 'Spot patterns in your work',
        description: 'Identify cycles in creativity, productivity, and energy',
        icon: createIcon(Activity),
        category: 'Insight'
      },
      {
        id: 'burnout-detector',
        label: 'Check for burnout signals',
        description: 'Spot early warning signs before they hurt your content',
        icon: createIcon(AlertTriangle),
        category: 'Wellness'
      },
      {
        id: 'goal-realigner',
        label: 'Realign your goals',
        description: 'Adjust objectives based on what you\'ve learned about yourself',
        icon: createIcon(Target),
        category: 'Strategy'
      },
      {
        id: 'confidence-tracker',
        label: 'Track confidence patterns',
        description: 'Understand what builds or kills your creative confidence',
        icon: createIcon(TrendingUp),
        category: 'Growth'
      }
    ],
    defaultPrompts: [
      'What progress have I made this month that I might be undervaluing?',
      'Analyze what went wrong with [situation] and extract lessons for next time',
      'What patterns do I see in my creative process and productivity cycles?',
      'Am I showing early burnout signs? What should I change to protect my energy?',
      'Based on recent learnings, how should I adjust my goals and priorities?',
      'What consistently builds vs undermines my creative confidence?'
    ],
    categories: ['Growth', 'Learning', 'Insight', 'Wellness', 'Strategy']
  },

  // Task Checklist - Stop drowning in busywork
  task_checklist: {
    quickCommands: [
      {
        id: 'revenue-prioritizer',
        label: 'Prioritize money-making tasks',
        description: 'Reorder by direct revenue impact - money tasks first',
        icon: createIcon(DollarSign),
        category: 'Priority'
      },
      {
        id: 'batch-optimizer',
        label: 'Batch similar tasks',
        description: 'Group related tasks for focused work sessions',
        icon: createIcon(Layers),
        category: 'Efficiency'
      },
      {
        id: 'delegation-spotter',
        label: 'Spot what to outsource',
        description: 'Identify tasks to delegate, automate, or eliminate',
        icon: createIcon(Users),
        category: 'Strategy'
      },
      {
        id: 'content-scheduler',
        label: 'Build content production schedule',
        description: 'Turn tasks into strategic content calendar',
        icon: createIcon(Calendar),
        category: 'Plan'
      },
      {
        id: 'energy-matcher',
        label: 'Match tasks to energy levels',
        description: 'Schedule creative work for peak hours, admin for low energy',
        icon: createIcon(Gauge),
        category: 'Efficiency'
      },
      {
        id: 'milestone-creator',
        label: 'Create celebration checkpoints',
        description: 'Break big goals into motivating mini-wins',
        icon: createIcon(CheckCircle),
        category: 'Motivation'
      }
    ],
    defaultPrompts: [
      'Reorder these tasks by direct revenue impact - money-makers first',
      'Group similar tasks into 2-3 hour focused work batches',
      'Which tasks should I delegate, automate, or stop doing entirely?',
      'Turn this task list into a strategic content production calendar',
      'Organize by energy: creative work for peak hours, admin for low energy',
      'Break big goals into weekly milestones worth celebrating'
    ],
    categories: ['Priority', 'Efficiency', 'Strategy', 'Plan', 'Motivation']
  },

  // Email Draft - Professional communication that protects your interests
  email_draft: {
    quickCommands: [
      {
        id: 'brand-inquiry-responder',
        label: 'Respond to brand inquiry',
        description: 'Professional response that shows interest while protecting your rates',
        icon: createIcon(Mail),
        category: 'Response'
      },
      {
        id: 'rate-negotiator',
        label: 'Counter lowball offers',
        description: 'Professionally negotiate higher rates with data-backed justification',
        icon: createIcon(DollarSign),
        category: 'Negotiate'
      },
      {
        id: 'polite-decliner',
        label: 'Decline while keeping doors open',
        description: 'Say no professionally while maintaining future opportunities',
        icon: createIcon(X),
        category: 'Response'
      },
      {
        id: 'scope-clarifier',
        label: 'Clarify project scope',
        description: 'Ask strategic questions to prevent misunderstandings',
        icon: createIcon(FileCheck),
        category: 'Protect'
      },
      {
        id: 'follow-up-strategist',
        label: 'Follow up without seeming desperate',
        description: 'Professional follow-ups that show interest, not desperation',
        icon: createIcon(Send),
        category: 'Strategy'
      },
      {
        id: 'payment-securer',
        label: 'Secure payment terms',
        description: 'Lock in milestone payments and late fees',
        icon: createIcon(Shield),
        category: 'Protect'
      }
    ],
    defaultPrompts: [
      'Draft professional response to this brand inquiry while protecting my rates',
      'Counter this lowball offer: I have [X] followers, [Y]% engagement in [niche]',
      'Politely decline this opportunity while keeping doors open for future work',
      'Ask clarifying questions about deliverables, timeline, usage rights, and budget',
      'Write follow-up that shows interest without appearing desperate or pushy',
      'Secure payment terms: 50% upfront, 50% on delivery with late payment fees'
    ],
    categories: ['Response', 'Negotiate', 'Protect', 'Strategy']
  }
};

// Universal commands for formatting and organization
export const UNIVERSAL_COMMANDS: Omit<CommandOption, 'action'>[] = [
  // Quick formatting
  {
    id: 'bullet-list',
    label: 'Convert to bullet points',
    description: 'Make content scannable with clean bullet points',
    icon: createIcon(List),
    category: 'Format'
  },
  {
    id: 'numbered-list',
    label: 'Number the steps',
    description: 'Turn into sequential, easy-to-follow instructions',
    icon: createIcon(List),
    category: 'Format'
  },
  {
    id: 'add-headers',
    label: 'Add section headers',
    description: 'Break up long content with clear headings',
    icon: createIcon(Heading2),
    category: 'Format'
  },
  {
    id: 'table',
    label: 'Organize into table',
    description: 'Structure data in rows and columns',
    icon: createIcon(Table),
    category: 'Format'
  },
  
  // Content enhancement
  {
    id: 'action-items',
    label: 'Pull out action items',
    description: 'Turn ideas into specific next steps',
    icon: createIcon(CheckCircle),
    category: 'Action'
  },
  {
    id: 'summary',
    label: 'Summarize key points',
    description: 'Create digestible highlights from long content',
    icon: createIcon(FileText),
    category: 'Summarize'
  }
];

// Helper functions
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

export function getPromptsForNoteType(noteType: NoteType): string[] {
  const config = NOTE_TYPE_CONFIGS[noteType] || NOTE_TYPE_CONFIGS.idea_bank;
  return config.defaultPrompts;
}

export function hasTypeSpecificCommand(noteType: NoteType, commandId: string): boolean {
  const config = NOTE_TYPE_CONFIGS[noteType];
  if (!config) return false;
  
  return config.quickCommands.some(cmd => cmd.id === commandId);
}