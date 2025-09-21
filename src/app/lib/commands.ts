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
  Moon,
  Sun,
  MessageCircle,
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
  type: 'conversation' | 'note' | 'analytics' | 'audience' | 'conversation_history';
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


export interface AudienceResult extends SearchResultBase {
  type: 'audience';
  segment: string;
  metrics: { label: string; value: string }[];
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
  | AudienceResult 
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
    tags: ['growth', 'social media'],
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
    id: 'nav-chat',
    type: 'navigation',
    category: 'navigation',
    label: 'Chat With Content',
    description: 'Open AI chat interface',
    icon: MessageSquare,
    href: '/dashboard/chat',
    shortcut: ['g', 'c'],
    tags: ['chat', 'ai', 'conversation'],
  },



  {
    id: 'nav-notes',
    type: 'navigation',
    category: 'navigation',
    label: 'Files',
    description: 'Access your notes and projects',
    icon: FileText,
    href: '/dashboard/notes',
    shortcut: ['g', 'n'],
    tags: ['notes', 'documents', 'content'],
  },
  {
    id: 'nav-self-hub',
    type: 'navigation',
    category: 'navigation',
    label: 'Self',
    description: 'Personal space for self-reflection and growth',
    icon: Users,
    href: '/dashboard/self-hub',
    shortcut: ['g', 's'],
    tags: ['self', 'personal', 'understanding', 'reflection'],
  },
  {
    id: 'nav-history',
    type: 'navigation',
    category: 'navigation',
    label: 'History',
    description: 'View conversation history',
    icon: Calendar,
    href: '/dashboard/history',
    shortcut: ['g', 'y'],
    tags: ['history', 'conversations'],
  },
  {
    id: 'nav-settings',
    type: 'navigation',
    category: 'navigation',
    label: 'Settings',
    description: 'Configure app settings',
    icon: Settings,
    href: '/settings',
    shortcut: ['g', 'set'],
    tags: ['settings', 'configuration', 'preferences'],
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
      window.location.href = '/dashboard/notes?new=true';
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
      window.location.href = '/dashboard/chat';
    },
  },
  {
    id: 'action-give-feedback',
    type: 'action',
    category: 'system',
    label: 'Give Feedback',
    description: 'Submit feedback, report bugs, or request features',
    icon: MessageCircle,
    shortcut: ['f'],
    tags: ['feedback', 'bug', 'feature', 'support'],
    action: () => {
      // This will be handled by the command palette to open the feedback modal
      window.dispatchEvent(new CustomEvent('open-feedback-modal'));
    },
  },
];

// Theme Commands
const themeCommands: ActionCommand[] = [
  {
    id: 'action-toggle-theme',
    type: 'action',
    category: 'system',
    label: 'Toggle Theme',
    description: 'Switch between light and dark mode',
    icon: Moon,
    shortcut: ['t'],
    tags: ['theme', 'dark', 'light', 'appearance'],
    action: () => {
      if (typeof window !== 'undefined') {
        // Get current theme from localStorage or system preference
        const currentTheme = localStorage.getItem('theme') || 
          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Update localStorage
        localStorage.setItem('theme', newTheme);
        
        // Update DOM directly
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'light');
        }
        
        // Dispatch custom event for next-themes compatibility
        window.dispatchEvent(new CustomEvent('theme-change', {
          detail: { theme: newTheme }
        }));
        
        // Also dispatch storage event for other components
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'theme',
          newValue: newTheme,
          oldValue: currentTheme,
        }));
      }
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
  ...themeCommands,
];

// Group commands by category
export const commandGroups: CommandGroup[] = [
  {
    category: 'navigation',
    title: 'Navigation',
    commands: navigationCommands,
  },
  {
    category: 'system',
    title: 'Actions',
    commands: actionCommands.concat(themeCommands),
  },
];

// Update SearchFilter type to include conversation_history
export type SearchFilter = {
  type?: 'conversation' | 'note' | 'analytics' | 'audience' | 'conversation_history';
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
export async function searchCommands(input: string): Promise<(Command | SearchResult)[]> {
  const { text, filters } = parseSearchQuery(input);
  
  // Search through commands (synchronous)
  const commandResults = matchSorter(staticCommands, text, {
    keys: ['label', 'description'],
    threshold: matchSorter.rankings.CONTAINS,
  });

  // If there's no text to search or it's too short, just return commands and mock data
  if (!text || text.length < 2) {
    const mockResults = matchSorter([...mockSearchResults, ...mockConversationHistory], text, {
      keys: ['title', 'preview', 'summary', 'lastMessage'],
      threshold: matchSorter.rankings.CONTAINS,
    });
    return [...commandResults, ...mockResults];
  }

  try {
    // Try vector search first for real content
    const vectorResults = await vectorSearchContent(text, 5);
    
    if (vectorResults.length > 0) {
      
      // Apply filters to vector results
      const filteredVectorResults = vectorResults.filter(result => {
        if (filters.type && result.type !== filters.type) return false;
        if (filters.tags && result.type === 'note' && 'tags' in result && !filters.tags.every(tag => result.tags.includes(tag))) return false;
        if (filters.dateRange) {
          const resultDate = new Date(result.type === 'conversation_history' && 'timestamp' in result ? result.timestamp : result.updatedAt);
          if (resultDate < filters.dateRange.start || resultDate > filters.dateRange.end) return false;
        }
        return true;
      });
      
      return [...commandResults, ...filteredVectorResults];
    }
  } catch (error) {
    // Vector search failed, fall back to mock data
  }

  // Fallback to mock data search
  const contentResults = matchSorter([...mockSearchResults, ...mockConversationHistory], text, {
    keys: ['title', 'preview', 'summary', 'lastMessage'],
    threshold: matchSorter.rankings.CONTAINS,
  }).filter(result => {
    // Apply filters
    if (filters.type && result.type !== filters.type) return false;
    if (filters.tags && result.type === 'note' && !filters.tags.every(tag => result.tags.includes(tag))) return false;
    if (filters.dateRange) {
      const resultDate = new Date(result.type === 'conversation_history' ? result.timestamp : result.updatedAt);
      if (resultDate < filters.dateRange.start || resultDate > filters.dateRange.end) return false;
    }
    return true;
  });

  return [...commandResults, ...contentResults];
}

// Export vector search function for external use
export { vectorSearchContent };

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

// Import vector search function
async function getConvexClient() {
  const { ConvexHttpClient } = await import('convex/browser');
  const { api } = await import('../../../convex/_generated/api');
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  return { convex: client, api };
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { getCurrentUserId } = await import('@/app/lib/api-helpers');
    return await getCurrentUserId();
  } catch (error) {
    return null;
  }
}

// Vector search function for command palette
async function vectorSearchContent(query: string, limit: number = 5): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return [];
    }

    const { convex, api } = await getConvexClient();
    
    // Try the new enhanced search with quotas first
    try {
      const vectorResults = await convex.action(api.vectorSearch.hybridSearchContentWithQuotas, {
        userId,
        query,
        limit,
        contentTypes: ["conversation", "note", "crystal"],
        minSimilarity: 0.3 // Lower threshold for command palette search
      });

      if (vectorResults && vectorResults.length > 0) {
        return vectorResults.map((result: any): SearchResult => {
          const baseResult = {
            id: result.contentId || result._id,
            title: result.title,
            icon: getIconForContentType(result.contentType),
            color: getColorForContentType(result.contentType),
            updatedAt: new Date().toISOString().split('T')[0],
            path: getPathForContentType(result.contentType, result.contentId || result._id),
          };

          // Type-specific fields
          switch (result.contentType) {
            case 'conversation':
              return {
                ...baseResult,
                type: 'conversation',
                lastMessage: result.content.substring(0, 100) + '...',
                participants: ['AI Assistant'],
              } as ConversationResult;
            
            case 'note':
              return {
                ...baseResult,
                type: 'note',
                preview: result.content.substring(0, 100) + '...',
                tags: [],
              } as NoteResult;
            
            default:
              return {
                ...baseResult,
                type: 'note',
                preview: result.content.substring(0, 100) + '...',
                tags: [],
              } as NoteResult;
          }
        });
      }
    } catch (enhancedError) {
      console.error('Enhanced vector search failed, falling back to standard search:', enhancedError);
    }

    // Fallback to old search method
    const vectorResults = await convex.action(api.vectorSearchHelpers.searchRelevantContent, {
      userId,
      query,
      limit,
      contentTypes: ["conversation", "note"],
      minSimilarity: 0.3 // Lower threshold for command palette search
    });

    // Convert vector results to SearchResult format
    return vectorResults.map((result: any): SearchResult => {
      const baseResult = {
        id: result.contentId || result._id,
        title: result.title,
        icon: getIconForContentType(result.contentType),
        color: getColorForContentType(result.contentType),
        updatedAt: new Date().toISOString().split('T')[0], // Default to today
        path: getPathForContentType(result.contentType, result.contentId || result._id),
      };

      // Type-specific fields
      switch (result.contentType) {
        case 'conversation':
          return {
            ...baseResult,
            type: 'conversation',
            lastMessage: result.content.substring(0, 100) + '...',
            participants: ['AI Assistant'],
          } as ConversationResult;
        
        case 'note':
          return {
            ...baseResult,
            type: 'note',
            preview: result.content.substring(0, 100) + '...',
            tags: [], // Could extract tags from content if needed
          } as NoteResult;
        
        default:
          return {
            ...baseResult,
            type: 'note',
            preview: result.content.substring(0, 100) + '...',
            tags: [],
          } as NoteResult;
      }
    });
  } catch (error) {
    console.error('Vector search failed:', error);
    return [];
  }
}

function getIconForContentType(contentType: string) {
  switch (contentType) {
    case 'conversation': return MessageSquare;
    case 'note': return FileText;
    default: return Brain;
  }
}

function getColorForContentType(contentType: string) {
  switch (contentType) {
    case 'conversation': return 'text-blue-500';
    case 'note': return 'text-purple-500';
    default: return 'text-gray-500';
  }
}

function getPathForContentType(contentType: string, contentId: string) {
  switch (contentType) {
    case 'conversation': return `/dashboard/chat/${contentId}`;
    case 'note': return `/dashboard/notes/${contentId}`;
    default: return '/dashboard';
  }
} 