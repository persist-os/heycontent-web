import { LucideIcon } from 'lucide-react';
import { Command as CommandType } from '@/app/types/command';
import { SearchResult } from '@/app/lib/commands';

export interface CommandHistory {
  timestamp: number;
  command: CommandType;
  input?: string;
}

export interface CommandItemProps {
  command: CommandType;
  isActive?: boolean;
  onSelect: () => void;
  searchQuery?: string;
}

export interface SearchResultItemProps {
  result: SearchResult;
  isActive?: boolean;
  onSelect: () => void;
  searchQuery?: string;
}

export interface SearchFilter {
  type?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  status?: string;
} 