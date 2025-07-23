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
    label: 'Can you make this clearer?',
    description: 'Make complex ideas instantly understandable',
    icon: createIcon(Eye),
    category: 'Core',
    usageFrequency: 'high'
  },
  {
    id: 'make-concise',
    label: 'Can you cut the fluff?',
    description: 'Remove unnecessary words while keeping the impact',
    icon: createIcon(Scissors),
    category: 'Core',
    usageFrequency: 'high'
  },
  {
    id: 'improve-flow',
    label: 'Can you improve the flow?',
    description: 'Create smooth transitions that keep readers engaged',
    icon: createIcon(Activity),
    category: 'Core',
    usageFrequency: 'high'
  },
  {
    id: 'add-detail',
    label: 'Can you add more detail?',
    description: 'Expand with specific examples and concrete details',
    icon: createIcon(Layers),
    category: 'Core',
    usageFrequency: 'high'
  },
  {
    id: 'professional-tone',
    label: 'Can you make this more professional?',
    description: 'Upgrade language to sound polished and credible',
    icon: createIcon(Briefcase),
    category: 'Core',
    usageFrequency: 'medium'
  },
  {
    id: 'boost-engagement',
    label: 'Can you make this more engaging?',
    description: 'Add hooks, questions, and active voice to captivate readers',
    icon: createIcon(Megaphone),
    category: 'Core',
    usageFrequency: 'medium'
  },
  {
    id: 'fix-grammar',
    label: 'Can you fix the grammar?',
    description: 'Correct grammar and spelling while maintaining your voice',
    icon: createIcon(CheckCircle),
    category: 'Core',
    usageFrequency: 'medium'
  },
  {
    id: 'casual-tone',
    label: 'Can you make this more casual?',
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
        label: 'Can you make this sound more professional?',
        description: 'Upgrade tone to sound polished and credible while staying authentic',
        icon: createIcon(Briefcase),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['email_draft']
      },
      {
        id: 'confidence-injection',
        label: 'Can you make me sound more confident?',
        description: 'Remove weak language and hesitation for stronger statements',
        icon: createIcon(Zap),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['email_draft']
      },
      {
        id: 'negotiation-sharpening',
        label: 'Can you help me negotiate better?',
        description: 'Add protective clauses and rate justifications',
        icon: createIcon(Shield),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['email_draft']
      },
      {
        id: 'urgency-optimizer',
        label: 'Can you match their energy level?',
        description: 'Adjust urgency and energy to match the incoming email',
        icon: createIcon(Timer),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['email_draft']
      }
    ],
    advancedRefinements: [
      {
        id: 'cultural-adaptation',
        label: 'Can you adapt this for different cultures?',
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
        label: 'Can you make the hook stronger?',
        description: 'Strengthen the opening to stop scrollers immediately',
        icon: createIcon(Megaphone),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['content_script']
      },
      {
        id: 'retention-engineering',
        label: 'How can I keep people watching?',
        description: 'Add curiosity gaps and pattern interrupts to prevent drop-offs',
        icon: createIcon(Activity),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['content_script']
      },
      {
        id: 'platform-optimize',
        label: 'Can you optimize this for [platform]?',
        description: 'Adapt script length and style for specific platforms',
        icon: createIcon(RefreshCw),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['content_script']
      },
      {
        id: 'match-voice',
        label: 'Can you make this sound like me?',
        description: 'Rewrite to sound like you talking naturally',
        icon: createIcon(Volume2),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['content_script']
      },
      {
        id: 'voice-consistency',
        label: 'Does this match my voice?',
        description: 'Ensure authentic voice consistency throughout',
        icon: createIcon(Palette),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['content_script']
      }
    ],
    advancedRefinements: [
      {
        id: 'viral-psychology',
        label: 'Can you make this more shareable?',
        description: 'Use psychological triggers that make content inherently shareable',
        icon: createIcon(Brain),
        category: 'Advanced',
        usageFrequency: 'low',
        noteTypes: ['content_script']
      },
      {
        id: 'algorithm-optimization',
        label: 'Can you optimize this for the algorithm?',
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
        label: 'Can you make the scope crystal clear?',
        description: 'Make deliverables bulletproof against scope creep',
        icon: createIcon(Target),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['collaboration_note']
      },
      {
        id: 'set-boundaries',
        label: 'Can you help me set stronger boundaries?',
        description: 'Add protective language that maintains creative control',
        icon: createIcon(Shield),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['collaboration_note']
      },
      {
        id: 'timeline-realism',
        label: 'Can you make the timeline more realistic?',
        description: 'Build in buffer time for revisions and approval cycles',
        icon: createIcon(Clock),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['collaboration_note']
      },
      {
        id: 'value-communication',
        label: 'Can you help me communicate my value?',
        description: 'Articulate your worth and expertise without underselling',
        icon: createIcon(DollarSign),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['collaboration_note']
      }
    ],
    advancedRefinements: [
      {
        id: 'legal-protection',
        label: 'Can you add legal protection?',
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
        label: 'What should I actually do with this data?',
        description: 'Transform raw data into specific, implementable next steps',
        icon: createIcon(Target),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['analytics_insight']
      },
      {
        id: 'revenue-connection',
        label: 'How does this connect to money?',
        description: 'Link every metric to monetization opportunities and income potential',
        icon: createIcon(DollarSign),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['analytics_insight']
      },
      {
        id: 'competitive-positioning',
        label: 'How do I compare to competitors?',
        description: 'Position insights against market benchmarks and competitor performance',
        icon: createIcon(BarChart3),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['analytics_insight']
      },
      {
        id: 'actionable-insights',
        label: 'What changes should I make?',
        description: 'Turn this data into specific changes for your content strategy',
        icon: createIcon(Target),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['analytics_insight']
      }
    ],
    advancedRefinements: [
      {
        id: 'data-clarity',
        label: 'Can you make this data clearer?',
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
        label: 'Will this resonate with my audience?',
        description: 'Refine ideas to match your community\'s interests and pain points',
        icon: createIcon(UserCheck),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['idea_bank']
      },
      {
        id: 'viral-factor-enhancement',
        label: 'Can you make this more viral?',
        description: 'Strengthen shareability elements like hooks, emotions, and relatability',
        icon: createIcon(Zap),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['idea_bank']
      },
      {
        id: 'concept-clarification',
        label: 'Can you make the core idea clearer?',
        description: 'Make the central idea more focused and compelling',
        icon: createIcon(Target),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['idea_bank']
      },
      {
        id: 'tone-adjustment',
        label: 'Can you adjust the tone for [platform]?',
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
        label: 'Can you add psychological hooks?',
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
        label: 'Can you prioritize by revenue impact?',
        description: 'Sequence tasks by their direct impact on income and business growth',
        icon: createIcon(ArrowUp),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['task_checklist']
      },
      {
        id: 'batch-optimization',
        label: 'Can you group similar tasks together?',
        description: 'Group similar tasks together for maximum efficiency',
        icon: createIcon(Layers),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['task_checklist']
      },
      {
        id: 'delegation-identification',
        label: 'What should I delegate or outsource?',
        description: 'Flag tasks that should be outsourced, automated, or eliminated',
        icon: createIcon(Users),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['task_checklist']
      },
      {
        id: 'milestone-creation',
        label: 'Can you break this into smaller wins?',
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
        label: 'Can you match tasks to my energy levels?',
        description: 'Match task complexity to your natural energy patterns',
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
        label: 'What growth am I missing?',
        description: 'Surface progress and wins that are easy to overlook',
        icon: createIcon(TrendingUp),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['reflection_journal']
      },
      {
        id: 'pattern-recognition',
        label: 'What patterns do you see?',
        description: 'Identify cycles in creativity, productivity, and personal energy levels',
        icon: createIcon(Activity),
        category: 'Note-Specific',
        usageFrequency: 'high',
        noteTypes: ['reflection_journal']
      },
      {
        id: 'lesson-extraction',
        label: 'What can I learn from this?',
        description: 'Turn setbacks and challenges into actionable insights',
        icon: createIcon(Lightbulb),
        category: 'Note-Specific',
        usageFrequency: 'medium',
        noteTypes: ['reflection_journal']
      },
      {
        id: 'goal-realignment',
        label: 'Should I adjust my goals?',
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
        label: 'What psychological patterns do you see?',
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