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
  Target,
  Zap,
  PenTool,
  Megaphone,
  TrendingUp,
  MessageSquare,
  Clock,
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
  Settings,
  Edit3,
  Eye,
  Timer,
  Send,
  Sparkles,
  Hash,
  Camera
} from 'lucide-react';

// Import the NoteType from command-configs to maintain consistency
export type { NoteType } from './command-configs';
import type { NoteType } from './command-configs';

// Refinement-specific command interface
export interface RefinementCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'Core' | 'Note-Specific' | 'Advanced';
  usageFrequency: 'high' | 'medium' | 'low';
  noteTypes?: NoteType[]; // Which note types this refinement applies to
}

export interface RefinementConfig {
  coreRefinements: RefinementCommand[];
  noteSpecificRefinements: RefinementCommand[];
  advancedRefinements: RefinementCommand[];
  categories: string[];
}

// Helper function to create icon components
const createIcon = (IconComponent: React.ComponentType<{ className?: string }>) => 
  React.createElement(IconComponent, { className: "w-4 h-4" });

// Universal Core Refinements (appear for all note types, most frequently used)
export const CORE_REFINEMENTS: RefinementCommand[] = [
  {
    id: 'boost-clarity',
    label: 'Boost clarity',
    description: 'Make complex ideas instantly understandable without losing depth',
    icon: createIcon(Eye),
    category: 'Core',
    usageFrequency: 'high'
  },
  {
    id: 'make-concise',
    label: 'Cut the fluff',
    description: 'Eliminate unnecessary words while keeping all the impact',
    icon: createIcon(Scissors),
    category: 'Core',
    usageFrequency: 'high'
  },
  {
    id: 'improve-flow',
    label: 'Improve flow',
    description: 'Create smooth transitions that keep readers engaged from start to finish',
    icon: createIcon(Activity),
    category: 'Core',
    usageFrequency: 'high'
  },
  {
    id: 'add-detail',
    label: 'Add strategic detail',
    description: 'Expand with specific examples and concrete details that add value',
    icon: createIcon(Layers),
    category: 'Core',
    usageFrequency: 'high'
  },
  {
    id: 'professional-tone',
    label: 'Professional tone',
    description: 'Upgrade language to sound polished and credible in business contexts',
    icon: createIcon(Briefcase),
    category: 'Core',
    usageFrequency: 'medium'
  },
  {
    id: 'boost-engagement',
    label: 'Boost engagement',
    description: 'Add hooks, questions, and active voice to captivate your audience',
    icon: createIcon(Megaphone),
    category: 'Core',
    usageFrequency: 'medium'
  },
  {
    id: 'fix-grammar',
    label: 'Fix grammar',
    description: 'Correct grammar and spelling while maintaining your natural voice',
    icon: createIcon(CheckCircle),
    category: 'Core',
    usageFrequency: 'medium'
  },
  {
    id: 'casual-tone',
    label: 'Casual tone',
    description: 'Make content more conversational and approachable',
    icon: createIcon(MessageCircle),
    category: 'Core',
    usageFrequency: 'medium'
  }
];

// Note Type Specific Refinement Configurations
export const NOTE_TYPE_REFINEMENT_CONFIGS: Record<NoteType, RefinementConfig> = {
  // Email Draft - Professional communication refinements
  email_draft: {
    coreRefinements: CORE_REFINEMENTS,
    noteSpecificRefinements: [
      {
        id: 'professional-elevation',
        label: 'Elevate professionalism',
        description: 'Upgrade tone to sound polished and credible while staying authentic',
        icon: createIcon(Briefcase),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['email_draft']
      },
      {
        id: 'confidence-injection',
        label: 'Inject confidence',
        description: 'Remove weak language and hesitation - make every statement strong and decisive',
        icon: createIcon(Zap),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['email_draft']
      },
      {
        id: 'negotiation-sharpening',
        label: 'Sharpen negotiation language',
        description: 'Add protective clauses and rate justifications that secure better deals',
        icon: createIcon(Shield),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['email_draft']
      },
      {
        id: 'urgency-optimizer',
        label: 'Optimize urgency level',
        description: 'Match the energy and urgency of the incoming email perfectly',
        icon: createIcon(Timer),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['email_draft']
      }
    ],
    advancedRefinements: [
      {
        id: 'cultural-adaptation',
        label: 'Adapt for culture/region',
        description: 'Adjust communication style for different cultural business norms',
        icon: createIcon(Users),
        category: 'Advanced',
        usageFrequency: 'low',
        noteTypes: ['email_draft']
      }
    ],
    categories: ['Professional', 'Negotiation', 'Confidence']
  },

  // Content Script - Engagement and retention refinements
  content_script: {
    coreRefinements: CORE_REFINEMENTS,
    noteSpecificRefinements: [
      {
        id: 'hook-amplification',
        label: 'Amplify hook power',
        description: 'Strengthen the opening 10-15 seconds to stop scrollers dead in their tracks',
        icon: createIcon(Megaphone),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['content_script']
      },
      {
        id: 'retention-engineering',
        label: 'Engineer retention',
        description: 'Add curiosity gaps and pattern interrupts to prevent viewer drop-offs',
        icon: createIcon(Activity),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['content_script']
      },
      {
        id: 'platform-optimize',
        label: 'Optimize for platform',
        description: 'Adapt script length and style for TikTok, Instagram, YouTube, or Twitter',
        icon: createIcon(RefreshCw),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['content_script']
      },
      {
        id: 'match-voice',
        label: 'Match authentic voice',
        description: 'Rewrite to sound like you talking naturally to your best friend',
        icon: createIcon(Volume2),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['content_script']
      },
      {
        id: 'voice-consistency',
        label: 'Match my voice',
        description: 'Rewrite this script to sound authentically like me talking to my best friend',
        icon: createIcon(Palette),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['content_script']
      }
    ],
    advancedRefinements: [
      {
        id: 'viral-psychology',
        label: 'Apply viral psychology',
        description: 'Use psychological triggers that make content inherently shareable',
        icon: createIcon(Brain),
        category: 'Advanced',
        usageFrequency: 'low',
        noteTypes: ['content_script']
      },
      {
        id: 'algorithm-optimization',
        label: 'Optimize for algorithm',
        description: 'Structure content to trigger platform algorithm preferences',
        icon: createIcon(Settings),
        category: 'Advanced',
        usageFrequency: 'low',
        noteTypes: ['content_script']
      }
    ],
    categories: ['Engagement', 'Retention', 'Platform', 'Voice']
  },

  // Collaboration Note - Business protection and clarity
  collaboration_note: {
    coreRefinements: CORE_REFINEMENTS,
    noteSpecificRefinements: [
      {
        id: 'scope-crystallization',
        label: 'Crystallize scope',
        description: 'Make deliverables bulletproof against scope creep with precise definitions',
        icon: createIcon(Target),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['collaboration_note']
      },
      {
        id: 'set-boundaries',
        label: 'Fortify boundaries',
        description: 'Add protective language that maintains creative control and prevents overreach',
        icon: createIcon(Shield),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['collaboration_note']
      },
      {
        id: 'timeline-realism',
        label: 'Set realistic timelines',
        description: 'Build in buffer time for revisions and approval cycles that actually work',
        icon: createIcon(Clock),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['collaboration_note']
      },
      {
        id: 'value-communication',
        label: 'Communicate value clearly',
        description: 'Articulate your worth and expertise without underselling yourself',
        icon: createIcon(DollarSign),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['collaboration_note']
      }
    ],
    advancedRefinements: [
      {
        id: 'legal-protection',
        label: 'Add legal protection',
        description: 'Include clauses that protect against payment delays and rights issues',
        icon: createIcon(FileSignature),
        category: 'Advanced',
        usageFrequency: 'low',
        noteTypes: ['collaboration_note']
      }
    ],
    categories: ['Scope', 'Boundaries', 'Timeline', 'Value']
  },

  // Analytics Insight - Actionability and revenue focus
  analytics_insight: {
    coreRefinements: CORE_REFINEMENTS,
    noteSpecificRefinements: [
      {
        id: 'actionability-focus',
        label: 'Focus on actionable insights',
        description: 'Transform raw data into specific, implementable next steps that drive results',
        icon: createIcon(Target),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['analytics_insight']
      },
      {
        id: 'revenue-connection',
        label: 'Connect to revenue',
        description: 'Link every metric to monetization opportunities and income potential',
        icon: createIcon(DollarSign),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['analytics_insight']
      },

      {
        id: 'competitive-positioning',
        label: 'Frame competitive position',
        description: 'Position insights against market benchmarks and competitor performance',
        icon: createIcon(BarChart3),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['analytics_insight']
      },
      {
        id: 'actionable-insights',
        label: 'Extract action items',
        description: 'Turn this data into specific changes I should make to my content strategy',
        icon: createIcon(Target),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['analytics_insight']
      }
    ],
    advancedRefinements: [
      {
        id: 'data-clarity',
        label: 'Clarify data presentation',
        description: 'Make complex metrics more understandable and actionable',
        icon: createIcon(Eye),
        category: 'Advanced',
        usageFrequency: 'low',
        noteTypes: ['analytics_insight']
      }
    ],
    categories: ['Actionability', 'Revenue', 'Trends', 'Competition']
  },

  // Idea Bank - Virality and expansion focus
  idea_bank: {
    coreRefinements: CORE_REFINEMENTS,
    noteSpecificRefinements: [
      {
        id: 'audience-resonance',
        label: 'Align with audience',
        description: 'Refine ideas to perfectly match your community\'s interests and pain points',
        icon: createIcon(UserCheck),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['idea_bank']
      },
      {
        id: 'viral-factor-enhancement',
        label: 'Enhance viral factors',
        description: 'Strengthen shareability elements like hooks, emotions, and relatability',
        icon: createIcon(Zap),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['idea_bank']
      },
      {
        id: 'concept-clarification',
        label: 'Clarify core concept',
        description: 'Make the central idea more focused and compelling',
        icon: createIcon(Target),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['idea_bank']
      },
      {
        id: 'tone-adjustment',
        label: 'Adjust tone for platform',
        description: 'Refine voice and style to match specific platform audiences',
        icon: createIcon(Palette),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['idea_bank']
      }
    ],
    advancedRefinements: [
      {
        id: 'psychological-triggers',
        label: 'Add psychological hooks',
        description: 'Incorporate proven psychological triggers that drive engagement',
        icon: createIcon(Brain),
        category: 'Advanced',
        usageFrequency: 'low',
        noteTypes: ['idea_bank']
      }
    ],
    categories: ['Audience', 'Clarity', 'Tone', 'Psychology']
  },

  // Task Checklist - Efficiency and prioritization
  task_checklist: {
    coreRefinements: CORE_REFINEMENTS,
    noteSpecificRefinements: [
      {
        id: 'priority-reordering',
        label: 'Reorder by revenue impact',
        description: 'Sequence tasks by their direct impact on income and business growth',
        icon: createIcon(ArrowUp),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['task_checklist']
      },
      {
        id: 'batch-optimization',
        label: 'Optimize batching',
        description: 'Group similar tasks together for maximum efficiency and flow state',
        icon: createIcon(Layers),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['task_checklist']
      },
      {
        id: 'delegation-identification',
        label: 'Identify delegation opportunities',
        description: 'Flag tasks that should be outsourced, automated, or eliminated entirely',
        icon: createIcon(Users),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['task_checklist']
      },
      {
        id: 'milestone-creation',
        label: 'Create celebration milestones',
        description: 'Break large goals into achievement points that maintain motivation',
        icon: createIcon(Award),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['task_checklist']
      }
    ],
    advancedRefinements: [
      {
        id: 'energy-optimization',
        label: 'Optimize for energy levels',
        description: 'Match task complexity to your natural energy patterns throughout the day',
        icon: createIcon(Gauge),
        category: 'Advanced',
        usageFrequency: 'low',
        noteTypes: ['task_checklist']
      }
    ],
    categories: ['Priority', 'Efficiency', 'Delegation', 'Milestones']
  },

  // Reflection Journal - Growth and pattern recognition
  reflection_journal: {
    coreRefinements: CORE_REFINEMENTS,
    noteSpecificRefinements: [
      {
        id: 'growth-highlighting',
        label: 'Highlight hidden growth',
        description: 'Surface progress and wins that are easy to overlook in the daily hustle',
        icon: createIcon(TrendingUp),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['reflection_journal']
      },
      {
        id: 'pattern-recognition',
        label: 'Recognize patterns',
        description: 'Identify cycles in creativity, productivity, and personal energy levels',
        icon: createIcon(Activity),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['reflection_journal']
      },
      {
        id: 'lesson-extraction',
        label: 'Extract valuable lessons',
        description: 'Turn setbacks and challenges into actionable insights for future success',
        icon: createIcon(Lightbulb),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['reflection_journal']
      },
      {
        id: 'goal-realignment',
        label: 'Realign goals',
        description: 'Adjust objectives based on new self-knowledge and changing priorities',
        icon: createIcon(Target),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['reflection_journal']
      }
    ],
    advancedRefinements: [
      {
        id: 'psychological-insights',
        label: 'Extract psychological insights',
        description: 'Understand deeper motivations and behavioral patterns affecting your work',
        icon: createIcon(Brain),
        category: 'Advanced',
        usageFrequency: 'low',
        noteTypes: ['reflection_journal']
      }
    ],
    categories: ['Growth', 'Patterns', 'Lessons', 'Goals']
  }
};

// Helper function to get refinement commands for a specific note type
export function getRefinementCommandsForNoteType(noteType: NoteType): {
  coreRefinements: RefinementCommand[];
  noteSpecificRefinements: RefinementCommand[];
  advancedRefinements: RefinementCommand[];
  allRefinements: RefinementCommand[];
  categories: string[];
} {
  const config = NOTE_TYPE_REFINEMENT_CONFIGS[noteType] || NOTE_TYPE_REFINEMENT_CONFIGS.idea_bank;
  
  const allRefinements = [
    ...config.noteSpecificRefinements,
    ...config.coreRefinements,
    ...config.advancedRefinements
  ];

  return {
    coreRefinements: config.coreRefinements,
    noteSpecificRefinements: config.noteSpecificRefinements,
    advancedRefinements: config.advancedRefinements,
    allRefinements,
    categories: config.categories
  };
}

// Helper function to get refinements by usage frequency
export function getRefinementsByFrequency(noteType: NoteType): {
  high: RefinementCommand[];
  medium: RefinementCommand[];
  low: RefinementCommand[];
} {
  const { allRefinements } = getRefinementCommandsForNoteType(noteType);
  
  return {
    high: allRefinements.filter(cmd => cmd.usageFrequency === 'high'),
    medium: allRefinements.filter(cmd => cmd.usageFrequency === 'medium'),
    low: allRefinements.filter(cmd => cmd.usageFrequency === 'low')
  };
}

// Helper function to check if a refinement command exists for a note type
export function hasRefinementCommand(noteType: NoteType, commandId: string): boolean {
  const { allRefinements } = getRefinementCommandsForNoteType(noteType);
  return allRefinements.some(cmd => cmd.id === commandId);
}

// Helper function to get cross-note-type refinements (commands that work across multiple note types)
export function getCrossNoteTypeRefinements(): RefinementCommand[] {
  return CORE_REFINEMENTS; // Core refinements work across all note types
}

// Helper function to get refinements for multiple note types (for mode selector)
export function getRefinementsForNoteTypes(noteTypes: NoteType[]): {
  coreRefinements: RefinementCommand[];
  noteSpecificRefinements: RefinementCommand[];
  advancedRefinements: RefinementCommand[];
} {
  const allNoteSpecific: RefinementCommand[] = [];
  const allAdvanced: RefinementCommand[] = [];
  
  noteTypes.forEach(noteType => {
    const config = NOTE_TYPE_REFINEMENT_CONFIGS[noteType];
    if (config) {
      allNoteSpecific.push(...config.noteSpecificRefinements);
      allAdvanced.push(...config.advancedRefinements);
    }
  });

  // Remove duplicates based on command ID
  const uniqueNoteSpecific = allNoteSpecific.filter((cmd, index, self) => 
    index === self.findIndex(c => c.id === cmd.id)
  );
  const uniqueAdvanced = allAdvanced.filter((cmd, index, self) => 
    index === self.findIndex(c => c.id === cmd.id)
  );

  return {
    coreRefinements: CORE_REFINEMENTS,
    noteSpecificRefinements: uniqueNoteSpecific,
    advancedRefinements: uniqueAdvanced
  };
} 