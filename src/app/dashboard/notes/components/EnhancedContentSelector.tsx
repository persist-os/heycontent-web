"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { 
  FileText, 
  Youtube, 
  Instagram, 
  Search, 
  X, 
  ExternalLink,
  Play,
  Image as ImageIcon,
  Video,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkableContent {
  id: string;
  title: string;
  type: 'note' | 'youtube' | 'instagram' | 'insight';
  contentType: string;
  platform: string;
  createdAt: number;
  important?: boolean;
  tags: string[];
  analysis?: any;
  // YouTube specific
  thumbnailUrl?: string;
  statistics?: any;
  // Instagram specific
  mediaUrl?: string;
  insights?: any;
}

interface EnhancedContentSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contentId: string) => void;
  position: { top: number; left: number };
  searchTerm: string;
  onSearchChange: (term: string) => void;
  excludeContentId?: string; // ID to exclude from results
}

export const EnhancedContentSelector: React.FC<EnhancedContentSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  position,
  searchTerm,
  onSearchChange,
  excludeContentId
}) => {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'smart-notes' | 'youtube' | 'instagram' | 'insights'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Add error boundary for Convex queries
  const [hasConvexError, setHasConvexError] = useState(false);

  // Fetch content based on selected platform
  
  const allContentData = useQuery(api.notes.getAllLinkableContent, { userId: userId || '' });
  const smartNotesContent = useQuery(api.notes.getContentByPlatform, { userId: userId || '', platform: 'smart-notes' as any });
  const youtubeContent = useQuery(api.notes.getContentByPlatform, { userId: userId || '', platform: 'youtube' as any });
  const instagramContent = useQuery(api.notes.getContentByPlatform, { userId: userId || '', platform: 'instagram' as any });
  const insightsContent = useQuery(api.notes.getContentByPlatform, { userId: userId || '', platform: 'insights' as any });

  // Check if any query is still loading or has errors
  const isLoading = !userId || 
    allContentData === undefined || 
    smartNotesContent === undefined || 
    youtubeContent === undefined || 
    instagramContent === undefined ||
    insightsContent === undefined;

  // Check if any query has errors
  const hasErrors = allContentData === null || 
    smartNotesContent === null || 
    youtubeContent === null || 
    instagramContent === null ||
    insightsContent === null;

  // If there are Convex errors, set the error state
  React.useEffect(() => {
    if (hasErrors && !hasConvexError) {
      console.error('EnhancedContentSelector: Convex queries failed');
      setHasConvexError(true);
    }
  }, [hasErrors, hasConvexError]);

  // Select the appropriate content based on platform filter
  const allContent = React.useMemo(() => {
    try {
      // If there are errors, return empty array
      if (hasErrors) {
        return [];
      }

      switch (selectedPlatform) {
        case 'smart-notes':
          return smartNotesContent || [];
        case 'youtube':
          return youtubeContent || [];
        case 'instagram':
          return instagramContent || [];
        case 'insights':
          return insightsContent || [];
        default:
          return allContentData || [];
      }
    } catch (error) {
      return [];
    }
  }, [selectedPlatform, allContentData, smartNotesContent, youtubeContent, instagramContent, insightsContent, hasErrors]);

  // Filter content based on search term and excluded content
  const filteredContent = React.useMemo(() => {
    try {
      if (!allContent || !Array.isArray(allContent)) return [];
      
      return allContent
        .filter(content => {
          // Exclude the specified content ID
          if (excludeContentId && content.id === excludeContentId) {
            return false;
          }
          
          // Filter out malformed insight IDs
          if (content.type === 'insight') {
            // Should match insight:someid:index
            if (!/^insight:[^:]+:[0-9]+$/.test(content.id)) {
              console.warn('Filtering out malformed insight ID:', content.id);
              return false;
            }
          }
          
          // Filter by search term
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
              (content.title?.toLowerCase().includes(searchLower) || false) ||
              (content.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false) ||
              (content.contentType?.toLowerCase().includes(searchLower) || false)
            );
          }
          
          return true;
        })
        .slice(0, 20) // Limit results for performance
        .map(content => ({
          ...content,
          type: content.type as 'note' | 'youtube' | 'instagram' | 'insight'
        }));
    } catch (error) {
      return [];
    }
  }, [allContent, searchTerm, excludeContentId]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'Enter':
          if (filteredContent.length > 0) {
            onSelect(filteredContent[0].id);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredContent, onClose, onSelect]);

  if (!isOpen) return null;

  // If there are Convex errors, show a simple fallback
  if (hasConvexError) {
    return (
      <div 
        className="fixed z-[9999] w-80 sm:w-96 md:w-[32rem] lg:w-[40rem] xl:w-[48rem] bg-background border border-border rounded-lg shadow-lg backdrop-blur-sm"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="p-4 text-center">
          <div className="text-sm text-red-500 mb-2">Content linking unavailable</div>
          <div className="text-xs text-muted-foreground mb-3">
            There was an issue loading content. Please try refreshing the page.
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'smart-notes':
        return <FileText className="w-4 h-4" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'insights':
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Video className="w-3 h-3" />;
      case 'image':
        return <ImageIcon className="w-3 h-3" />;
      case 'carousel_album':
        return <Users className="w-3 h-3" />;
      case 'reels':
        return <Play className="w-3 h-3" />;
      case 'insight':
        return <Lightbulb className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return 'Today';
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown date';
    }
  };

  const getStatsDisplay = (content: LinkableContent) => {
    try {
      if (content.type === 'youtube' && content.statistics) {
        return (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>{content.statistics.views?.toLocaleString() || 0}</span>
            <Heart className="w-3 h-3" />
            <span>{content.statistics.likes?.toLocaleString() || 0}</span>
          </div>
        );
      }
      
      if (content.type === 'instagram' && content.insights) {
        return (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>{content.insights.impressions?.toLocaleString() || 0}</span>
            <Heart className="w-3 h-3" />
            <span>{content.insights.likes?.toLocaleString() || 0}</span>
          </div>
        );
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  return (
    <div 
      className="fixed z-[9999] w-80 sm:w-96 md:w-[32rem] lg:w-[40rem] xl:w-[48rem] bg-background border border-border rounded-lg shadow-lg backdrop-blur-sm"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm">Link Content</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Platform Filter */}
      <div className="p-3 border-b border-border">
        <div className="grid grid-cols-5 gap-1">
          {[
            { key: 'all', label: 'All', icon: <FileText className="w-3 h-3" /> },
            { key: 'smart-notes', label: 'Notes', icon: <FileText className="w-3 h-3" /> },
            { key: 'youtube', label: 'YouTube', icon: <Youtube className="w-3 h-3" /> },
            { key: 'instagram', label: 'Instagram', icon: <Instagram className="w-3 h-3" /> },
            { key: 'insights', label: 'Insights', icon: <Lightbulb className="w-3 h-3" /> }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setSelectedPlatform(key as any)}
              className={cn(
                "flex items-center justify-center gap-1 px-2 py-1 text-xs rounded-md transition-colors",
                selectedPlatform === key
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading content...
          </div>
        ) : hasErrors ? (
          <div className="p-4 text-center text-muted-foreground">
            <div className="text-sm text-red-500 mb-2">Unable to load content</div>
            <div className="text-xs mb-2">Please try refreshing the page</div>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchTerm ? 'No content found' : 'No content available'}
          </div>
        ) : (
          <div className="p-1">
            {filteredContent.map((content) => {
              try {
                return (
                  <button
                    key={content.id}
                    onClick={() => onSelect(content.id)}
                    className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Platform Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getPlatformIcon(content.platform)}
                      </div>
                      
                      {/* Content Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {content.title || 'Untitled'}
                          </h4>
                          {content.important && (
                            <span className="text-yellow-500">⭐</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          {getContentTypeIcon(content.contentType)}
                          <span className="capitalize">{(content.contentType || 'unknown').replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{formatDate(content.createdAt || Date.now())}</span>
                        </div>
                        
                        {/* Stats for YouTube/Instagram */}
                        {getStatsDisplay(content)}
                        
                        {/* Tags */}
                        {content.tags && content.tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {content.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                            {content.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{content.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* External Link Icon */}
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                );
              } catch (error) {
                return (
                  <div key={content.id} className="p-3 text-sm text-muted-foreground">
                    Error loading content
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Press Enter to select first result</span>
          <span>{filteredContent.length} items</span>
        </div>
      </div>
    </div>
  );
}; 