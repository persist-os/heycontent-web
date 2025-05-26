import { LucideIcon } from 'lucide-react';

export type CommandCategory = 
  | 'navigation'
  | 'content'
  | 'ai'
  | 'analytics'
  | 'notes'
  | 'audience'
  | 'partnerships'
  | 'system';

export type CommandType = 
  | 'navigation' 
  | 'action' 
  | 'ai' 
  | 'search'
  | 'quick_ask';

export interface BaseCommand {
  id: string;
  type: CommandType;
  category: CommandCategory;
  label: string;
  description?: string;
  icon?: LucideIcon;
  shortcut?: string[];
  tags?: string[];
  hidden?: boolean;
}

export interface NavigationCommand extends BaseCommand {
  type: 'navigation';
  href: string;
  color?: string;
}

export interface ActionCommand extends BaseCommand {
  type: 'action';
  action: () => void;
}

export interface AICommand extends BaseCommand {
  type: 'ai';
  generateSuggestions?: (input: string) => Promise<string[]>;
  parseNaturalLanguage?: (input: string) => Command | null;
  action: (input?: string) => void;
}

export interface SearchCommand extends BaseCommand {
  type: 'search';
  onSearch: (query: string) => void;
}

export interface QuickAskCommand extends BaseCommand {
  type: 'quick_ask';
  question: string;
}

export type Command = 
  | NavigationCommand 
  | ActionCommand 
  | AICommand 
  | SearchCommand
  | QuickAskCommand;

export interface CommandGroup {
  category: CommandCategory;
  title: string;
  commands: Command[];
}

export type ConversationResult = {
  id: string;
  type: 'conversation';
  title: string;
  lastMessage: string;
  preview: string;
  updatedAt: string;
  path: string;
  participants: string[];
  icon: any;
  color: string;
};

export type SearchResultType = 
  | 'conversation' 
  | 'note' 
  | 'analytics' 
  | 'insight' 
  | 'audience' 
  | 'partnership'
  | 'conversation_history'; 