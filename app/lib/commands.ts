import { matchSorter } from 'match-sorter';
import {
  MessageSquare,
  FileText,
  BarChart3,
  Users,
  Brain,
  Briefcase,
  Settings,
  Plus,
  Search,
  Send,
  Calendar,
  TrendingUp,
  LayoutDashboard,
} from 'lucide-react';
import { 
  Command, 
  CommandGroup,
  NavigationCommand,
  ActionCommand,
  AICommand,
  SearchCommand,
  QuickAskCommand,
} from '../types/command';

// Content types for search results
export interface SearchResultBase {
  id: string;
  title: string;
  type: 'conversation' | 'note' | 'analytics' | 'insight' | 'audience' | 'partnership' | 'conversation_history';
  icon: typeof MessageSquare;
  color: string;
  updatedAt: string;
  path: string;
}

export interface ConversationResult extends SearchResultBase {
  type: 'conversation';
  lastMessage: string;
  participants: string[];
}

export interface NoteResult extends SearchResultBase {
  type: 'note';
  preview: string;
  tags: string[];
}

export interface AnalyticsResult extends SearchResultBase {
  type: 'analytics';
  metric: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface InsightResult extends SearchResultBase {
  type: 'insight';
  category: string;
  summary: string;
}

export interface AudienceResult extends SearchResultBase {
  type: 'audience';
  segment: string;
  metrics: { label: string; value: string }[];
}

export interface PartnershipResult extends SearchResultBase {
  type: 'partnership';
  status: 'active' | 'pending' | 'completed';
  company: string;
  details: string;
}

export interface ConversationHistory extends SearchResultBase {
  type: 'conversation_history';
  preview: string;
  timestamp: number;
  participants: string[];
}

export type SearchResult = 
  | ConversationResult 
  | NoteResult 
  | AnalyticsResult 
  | InsightResult 
  | AudienceResult 
  | PartnershipResult
  | ConversationHistory;

// Mock data for content search
const mockSearchResults: SearchResult[] = [
  {
    id: 'conv1',
    type: 'conversation',
    title: 'Content Strategy for Q2',
    icon: MessageSquare,
    color: 'text-blue-500',
    lastMessage: "Let's focus on video content for TikTok and Instagram Reels",
    participants: ['Sarah', 'John'],
    updatedAt: '2024-03-28',
    path: '/chat/conv1',
  },
  {
    id: 'note1',
    type: 'note',
    title: 'Instagram Growth Tactics',
    icon: FileText,
    color: 'text-purple-500',
    preview: '1. Use trending audio\n2. Post consistently\n3. Engage with followers',
    tags: ['instagram', 'growth', 'social media'],
    updatedAt: '2024-03-27',
    path: '/notes/note1',
  },
  {
    id: 'analytics1',
    type: 'analytics',
    title: 'March Performance Report',
    icon: TrendingUp,
    color: 'text-green-500',
    metric: 'Engagement Rate',
    value: '5.2%',
    trend: 'up',
    updatedAt: '2024-03-26',
    path: '/analytics/report1',
  },
  {
    id: 'insight1',
    type: 'insight',
    title: 'Content Performance Analysis',
    icon: Brain,
    color: 'text-indigo-500',
    category: 'AI Insights',
    summary: 'Videos posted between 6-8 PM get 30% more engagement',
    updatedAt: '2024-03-25',
    path: '/insights/insight1',
  },
  {
    id: 'audience1',
    type: 'audience',
    title: 'Core Audience Demographics',
    icon: Users,
    color: 'text-yellow-500',
    segment: 'Gen Z Professionals',
    metrics: [
      { label: 'Age Range', value: '18-24' },
      { label: 'Top Location', value: 'New York' },
    ],
    updatedAt: '2024-03-24',
    path: '/audience/segment1',
  },
  {
    id: 'partnership1',
    type: 'partnership',
    title: 'Tech Brand Collaboration',
    icon: Briefcase,
    color: 'text-orange-500',
    status: 'active',
    company: 'TechCo',
    details: 'Content series about productivity tools',
    updatedAt: '2024-03-23',
    path: '/partnerships/tech-co',
  },
];

// Add mock conversation history data
const mockConversationHistory: ConversationHistory[] = [
  {
    id: 'conv-1',
    type: 'conversation_history',
    title: 'Content Strategy Discussion',
    preview: 'Let\'s analyze our Q1 content performance and plan for Q2...',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    path: '/conversations/1',
    participants: ['John', 'Sarah'],
    icon: MessageSquare,
    color: 'text-blue-500',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().split('T')[0]
  },
  {
    id: 'conv-2',
    type: 'conversation_history',
    title: 'Social Media Campaign Review',
    preview: 'The engagement metrics for our latest campaign show...',
    timestamp: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
    path: '/conversations/2',
    participants: ['Mike', 'Emma'],
    icon: MessageSquare,
    color: 'text-green-500',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString().split('T')[0]
  }
];

// Navigation Commands
const navigationCommands: NavigationCommand[] = [
  {
    id: 'nav-dashboard',
    type: 'navigation',
    category: 'navigation',
    label: 'Go to Dashboard',
    description: 'Navigate to the main dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    shortcut: ['g', 'd'],
    tags: ['dashboard', 'home', 'main'],
  },
  {
    id: 'nav-chat',
    type: 'navigation',
    category: 'navigation',
    label: 'Chat With Content',
    description: 'Open AI chat interface',
    icon: MessageSquare,
    href: '/chat',
    shortcut: ['g', 'c'],
    tags: ['chat', 'ai', 'conversation'],
  },
  {
    id: 'nav-analytics',
    type: 'navigation',
    category: 'navigation',
    label: 'Content Analytics',
    description: 'View content performance metrics',
    icon: BarChart3,
    href: '/content',
    shortcut: ['g', 'a'],
    tags: ['analytics', 'metrics', 'performance'],
  },
  {
    id: 'nav-ai-insights',
    type: 'navigation',
    category: 'navigation',
    label: 'AI Insights',
    description: 'View AI-generated content insights',
    icon: Brain,
    href: '/ai-insights',
    shortcut: ['g', 'i'],
    tags: ['ai', 'insights', 'analysis'],
  },
  {
    id: 'nav-audience',
    type: 'navigation',
    category: 'navigation',
    label: 'Audience DNA',
    description: 'Analyze your audience demographics',
    icon: Users,
    href: '/audience',
    shortcut: ['g', 'd'],
    tags: ['audience', 'demographics', 'analytics'],
  },
  {
    id: 'nav-partnerships',
    type: 'navigation',
    category: 'navigation',
    label: 'Partnerships',
    description: 'Manage brand partnerships',
    icon: Briefcase,
    href: '/partnerships',
    shortcut: ['g', 'p'],
    tags: ['partnerships', 'brands', 'collaboration'],
  },
  {
    id: 'nav-notes',
    type: 'navigation',
    category: 'navigation',
    label: 'Smart Notes',
    description: 'Access your content notes',
    icon: FileText,
    href: '/notes',
    shortcut: ['g', 'n'],
    tags: ['notes', 'documents', 'content'],
  },
];

// Action Commands
const actionCommands: ActionCommand[] = [
  {
    id: 'action-new-note',
    type: 'action',
    category: 'notes',
    label: 'Create New Note',
    description: 'Create a new smart note',
    icon: Plus,
    shortcut: ['n'],
    tags: ['new', 'create', 'note'],
    action: () => {
      // Implementation will be added when we integrate with the notes system
      console.log('Create new note');
    },
  },
  {
    id: 'action-new-chat',
    type: 'action',
    category: 'ai',
    label: 'Start New Chat',
    description: 'Start a new AI chat conversation',
    icon: MessageSquare,
    shortcut: ['c'],
    tags: ['new', 'chat', 'ai'],
    action: () => {
      // Implementation will be added when we integrate with the chat system
      console.log('Start new chat');
    },
  },
];

// AI Commands
const aiCommands: AICommand[] = [
  {
    id: 'ai-analyze',
    type: 'ai',
    category: 'ai',
    label: 'Analyze Content',
    description: 'Get AI analysis of your content',
    icon: Brain,
    tags: ['analyze', 'ai', 'content'],
    action: (input?: string) => {
      // Implementation will be added when we integrate with the AI system
      console.log('Analyze content:', input);
    },
    generateSuggestions: async (input: string) => {
      // Mock implementation - will be replaced with actual AI integration
      return ['Analyze engagement trends', 'Check content sentiment', 'Review posting schedule'];
    },
  },
];

// Search Commands
const searchCommandsList: SearchCommand[] = [
  {
    id: 'search-content',
    type: 'search',
    category: 'content',
    label: 'Search Content',
    description: 'Search through your content',
    icon: Search,
    tags: ['search', 'find', 'content'],
    onSearch: (query: string) => {
      // Implementation will be added when we integrate with the search system
      console.log('Search content:', query);
    },
  },
];

// Quick Ask Commands - These are dynamically generated based on user input
export const createQuickAskCommand = (question: string): QuickAskCommand => ({
  id: 'quick-ask',
  type: 'quick_ask',
  category: 'ai',
  label: `Ask: "${question}"`,
  description: 'Get an AI response to your question',
  icon: Send,
  tags: ['ask', 'question', 'ai'],
  question,
});

// Combine all static commands
export const staticCommands: Command[] = [
  ...navigationCommands,
  ...actionCommands,
  ...aiCommands,
  ...searchCommandsList,
];

// Group commands by category
export const commandGroups: CommandGroup[] = [
  {
    category: 'navigation',
    title: 'Navigation',
    commands: navigationCommands,
  },
  {
    category: 'ai',
    title: 'AI & Insights',
    commands: [...aiCommands, ...searchCommandsList.filter(cmd => cmd.category === 'ai')],
  },
  {
    category: 'content',
    title: 'Content',
    commands: searchCommandsList.filter(cmd => cmd.category === 'content'),
  },
  {
    category: 'notes',
    title: 'Notes',
    commands: actionCommands.filter(cmd => cmd.category === 'notes'),
  },
];

// Update SearchFilter type to include conversation_history
export type SearchFilter = {
  type?: 'conversation' | 'note' | 'analytics' | 'insight' | 'audience' | 'partnership' | 'conversation_history';
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  status?: string;
};

export type SearchQuery = {
  text: string;
  filters: SearchFilter;
};

// Add this function before the existing searchCommands function
export function parseSearchQuery(input: string): SearchQuery {
  const filters: SearchFilter = {};
  let text = input;

  // Parse type filter
  const typeMatch = input.match(/type:(\w+)/);
  if (typeMatch) {
    filters.type = typeMatch[1] as SearchFilter['type'];
    text = text.replace(typeMatch[0], '').trim();
  }

  // Parse date range
  const dateMatch = input.match(/date:(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    filters.dateRange = {
      start: new Date(dateMatch[1]),
      end: new Date(dateMatch[2])
    };
    text = text.replace(dateMatch[0], '').trim();
  }

  // Parse tags
  const tagMatches = input.match(/tag:(\w+)/g);
  if (tagMatches) {
    filters.tags = tagMatches.map(tag => tag.replace('tag:', ''));
    text = text.replace(/tag:\w+/g, '').trim();
  }

  // Parse status
  const statusMatch = input.match(/status:(\w+)/);
  if (statusMatch) {
    filters.status = statusMatch[1];
    text = text.replace(statusMatch[0], '').trim();
  }

  return { text, filters };
}

// Update the existing searchCommands function
export function searchCommands(input: string): (Command | SearchResult)[] {
  const { text, filters } = parseSearchQuery(input);
  
  // Search through commands
  const commandResults = matchSorter(staticCommands, text, {
    keys: ['label', 'description'],
    threshold: matchSorter.rankings.CONTAINS,
  });

  // Search through content and conversation history
  const contentResults = matchSorter([...mockSearchResults, ...mockConversationHistory], text, {
    keys: ['title', 'preview', 'summary', 'lastMessage'],
    threshold: matchSorter.rankings.CONTAINS,
  }).filter(result => {
    // Apply filters
    if (filters.type && result.type !== filters.type) return false;
    if (filters.tags && result.type === 'note' && !filters.tags.every(tag => result.tags.includes(tag))) return false;
    if (filters.status && result.type === 'partnership' && result.status !== filters.status) return false;
    if (filters.dateRange) {
      const resultDate = new Date(result.type === 'conversation_history' ? result.timestamp : result.updatedAt);
      if (resultDate < filters.dateRange.start || resultDate > filters.dateRange.end) return false;
    }
    return true;
  });

  return [...commandResults, ...contentResults];
}

// Get command by ID
export const getCommandById = (id: string): Command | undefined => {
  return staticCommands.find(cmd => cmd.id === id);
};

// Parse command string (for / commands)
export const parseCommandString = (input: string): { command: Command | null; args: string } => {
  if (!input.startsWith('/')) return { command: null, args: input };

  const [commandName, ...args] = input.slice(1).split(' ');
  const command = staticCommands.find(cmd => 
    cmd.label.toLowerCase().replace(/\s+/g, '-') === commandName.toLowerCase()
  );

  return {
    command: command || null,
    args: args.join(' '),
  };
}; 