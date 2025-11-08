/**
 * Search Results Component
 * 
 * Displays unified search results with Material Design 3 semantic colors.
 * Features glassmorphism, strong text contrast, and sophisticated visual hierarchy.
 */

'use client'

import React from 'react'
import { FileText, MessageCircle, Brain, Sparkles, Loader2, MessageSquare } from 'lucide-react'
import { SearchResult } from '@/hooks/useUnifiedSearch'
import { cn } from '@/lib/utils'

interface SearchResultsProps {
  results: SearchResult[];
  isSearching: boolean;
  searchMode: 'keyword' | 'vector';
  onNavigate: (href: string) => void;
}

export function SearchResults({ 
  results, 
  isSearching, 
  searchMode,
  onNavigate 
}: SearchResultsProps) {
  
  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-3 text-foreground">Searching...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <p className="text-foreground">
          {searchMode === 'vector' 
            ? 'No semantic matches found. Try different keywords.' 
            : 'No results found. Press Enter for semantic search.'}
        </p>
      </div>
    );
  }

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'note':
        return {
          label: 'Notes',
          icon: FileText,
          iconColor: 'text-primary',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20',
          hoverBg: 'hover:bg-primary/15'
        };
      case 'cognitive_field':
        return {
          label: 'Cognitive Fields',
          icon: Brain,
          iconColor: 'text-accent',
          bgColor: 'bg-accent/10',
          borderColor: 'border-accent/20',
          hoverBg: 'hover:bg-accent/15'
        };
      case 'shard':
        return {
          label: 'Shards',
          icon: Sparkles,
          iconColor: 'text-primary',
          bgColor: 'bg-card',
          borderColor: 'border-border',
          hoverBg: 'hover:bg-card/80'
        };
      case 'conversation':
        return {
          label: 'Conversations',
          icon: MessageCircle,
          iconColor: 'text-accent',
          bgColor: 'bg-secondary',
          borderColor: 'border-border',
          hoverBg: 'hover:bg-secondary/80'
        };
      case 'message':
        return {
          label: 'Messages',
          icon: MessageSquare,
          iconColor: 'text-primary',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20',
          hoverBg: 'hover:bg-primary/15'
        };
      case 'stardust':
        return {
          label: 'Stardust',
          icon: Sparkles,
          iconColor: 'text-primary',
          bgColor: 'bg-primary/5',
          borderColor: 'border-primary/10',
          hoverBg: 'hover:bg-primary/10'
        };
      default:
        return {
          label: 'Other',
          icon: FileText,
          iconColor: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border/50',
          hoverBg: 'hover:bg-muted/80'
        };
    }
  };

  const getNavigationPath = (id: string, type: string, metadata?: any) => {
    switch (type) {
      case 'note':
        return `/dashboard/thinking_lab?noteId=${id}`;
      case 'cognitive_field':
        // Cognitive fields are typically accessed via their associated conversation
        return `/dashboard/thinking_lab?cognitiveFieldId=${id}`;
      case 'conversation':
        return `/dashboard/thinking_lab?chatId=${id}`;
      case 'message':
        // Messages link to their conversation
        return metadata?.conversationId 
          ? `/dashboard/thinking_lab?chatId=${metadata.conversationId}&messageId=${id}`
          : `/dashboard/thinking_lab`;
      case 'shard':
        return `/dashboard/crystals?shard=${id}`;
      case 'stardust':
        return `/dashboard/crystals?stardust=${id}`;
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="px-6 pb-6 space-y-6">
      {/* Search Mode Indicator */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={cn(
            'px-2 py-1 rounded-lg',
            searchMode === 'vector' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-accent/10 text-accent'
          )}>
            <span className="font-medium">
              {searchMode === 'vector' ? 'Semantic Search' : 'Keyword Search'}
            </span>
          </div>
        </div>
        <span className="text-foreground font-medium">
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </span>
      </div>

      {/* Grouped Results */}
      {Object.entries(groupedResults).map(([type, typeResults]) => {
        const config = getTypeConfig(type);
        const Icon = config.icon;

        return (
          <div key={type} className="space-y-3">
            {/* Type Header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
              <Icon className={cn('w-4 h-4', config.iconColor)} />
              <span className="text-sm font-semibold text-foreground">
                {config.label}
              </span>
              <span className="text-xs text-muted-foreground">
                ({typeResults.length})
              </span>
            </div>

            {/* Results */}
            <div className="space-y-2">
              {typeResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => onNavigate(getNavigationPath(result.id, result.type, result.metadata))}
                  className={cn(
                    'w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200',
                    'backdrop-blur-sm',
                    'hover:scale-[1.01] active:scale-[0.99]',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                    config.bgColor,
                    config.borderColor,
                    config.hoverBg
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.iconColor)} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {result.title}
                      </div>
                      <div className="text-sm text-foreground/80 line-clamp-2 mt-1.5">
                        {result.content}
                      </div>
                      {result.score && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden max-w-[100px]">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${result.score * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">
                            {Math.round(result.score * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

