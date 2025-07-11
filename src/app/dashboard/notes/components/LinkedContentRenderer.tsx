"use client";

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { 
  Youtube, 
  Instagram, 
  Mail,
  ExternalLink,
  Play,
  Image as ImageIcon,
  Video,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  User,
  Lightbulb,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkedContentRendererProps {
  prefixedId: string;
  onLinkContent?: (prefixedId: string) => void;
}

export const LinkedContentRenderer: React.FC<LinkedContentRendererProps> = ({
  prefixedId,
  onLinkContent
}) => {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;

  // Fetch content data
  const contentData = useQuery(api.notes.getContentByPrefixedId, {
    prefixedId,
    userId: userId || ''
  });

  if (!contentData) {
    // Extract content ID from prefixed ID for fallback
    const [contentType, contentId] = prefixedId.split(':', 2);
    
    if (contentType === 'youtube') {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-2 mx-1 my-1 rounded-lg border border-border bg-muted/50 text-sm">
          <Youtube className="w-4 h-4 text-red-500" />
          <span className="text-muted-foreground">YouTube Video</span>
        </div>
      );
    }
    
    if (contentType === 'instagram') {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-2 mx-1 my-1 rounded-lg border border-border bg-muted/50 text-sm">
          <Instagram className="w-4 h-4 text-pink-500" />
          <span className="text-muted-foreground">Instagram Post</span>
        </div>
      );
    }
    
    if (contentType === 'gmail') {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-2 mx-1 my-1 rounded-lg border border-border bg-muted/50 text-sm">
          <Mail className="w-4 h-4 text-red-500" />
          <span className="text-muted-foreground">Gmail Thread</span>
        </div>
      );
    }
    
    if (contentType === 'insight') {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-2 mx-1 my-1 rounded-lg border border-border bg-muted/50 text-sm">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          <span className="text-muted-foreground">Insight</span>
        </div>
      );
    }
    
    if (contentType === 'note') {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-2 mx-1 my-1 rounded-lg border border-border bg-muted/50 text-sm">
          <ImageIcon className="w-4 h-4" />
          <span className="text-muted-foreground">Note</span>
        </div>
      );
    }
    
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 mx-1 my-1 rounded-lg border border-border bg-muted/50 text-sm">
        <div className="w-4 h-4 bg-muted rounded animate-pulse" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'gmail':
        return <Mail className="w-4 h-4 text-red-500" />;
      case 'insights':
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'smart-notes':
        return <ImageIcon className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
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
      case 'email':
        return <Mail className="w-3 h-3" />;
      case 'insight':
        return <Lightbulb className="w-3 h-3" />;
      default:
        return <ImageIcon className="w-3 h-3" />;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getStatsDisplay = () => {
    if (contentData.type === 'youtube' && contentData.statistics) {
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Eye className="w-3 h-3" />
          <span>{contentData.statistics.views?.toLocaleString() || 0}</span>
          <Heart className="w-3 h-3" />
          <span>{contentData.statistics.likes?.toLocaleString() || 0}</span>
        </div>
      );
    }
    
    if (contentData.type === 'instagram' && contentData.insights) {
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Eye className="w-3 h-3" />
          <span>{contentData.insights.impressions?.toLocaleString() || 0}</span>
          <Heart className="w-3 h-3" />
          <span>{contentData.insights.likes?.toLocaleString() || 0}</span>
        </div>
      );
    }
    
    if (contentData.type === 'gmail') {
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageCircle className="w-3 h-3" />
          <span>{contentData.messageCount || 1} message{(contentData.messageCount || 1) !== 1 ? 's' : ''}</span>
          {contentData.from && (
            <>
              <span>•</span>
              <User className="w-3 h-3" />
              <span className="truncate max-w-24">{contentData.from}</span>
            </>
          )}
        </div>
      );
    }
    
    if (contentData.type === 'insight' && contentData.analysis) {
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Target className="w-3 h-3" />
          <span>{contentData.analysis.impact || 'Medium Impact'}</span>
        </div>
      );
    }
    
    return null;
  };

  const handleClick = () => {
    // For YouTube videos, Gmail threads, and insights, show preview card instead of opening in new tab
    if (contentData.type === 'youtube' || contentData.type === 'gmail' || contentData.type === 'insight') {
      // Call onLinkContent to trigger preview card
      if (onLinkContent) {
        onLinkContent(prefixedId);
      }
      return;
    }
    
    // Handle Instagram posts - open in new tab if permalink exists
    if (contentData.type === 'instagram' && 'permalink' in contentData && typeof contentData.permalink === 'string') {
      window.open(contentData.permalink, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // For other content types, call the onLinkContent callback
    if (onLinkContent) {
      onLinkContent(prefixedId);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "inline-flex items-start gap-3 px-4 py-3 mx-1 my-1 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group",
        contentData.type === 'youtube' && "hover:border-red-200",
        contentData.type === 'instagram' && "hover:border-pink-200",
        contentData.type === 'gmail' && "hover:border-red-200"
      )}
    >
      {/* Platform Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {getPlatformIcon(contentData.platform)}
      </div>
      
      {/* Content Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm truncate">
            {contentData.title || 
              (contentData.type === 'youtube' ? 'YouTube Video' : 
               contentData.type === 'instagram' ? 'Instagram Post' : 
               contentData.type === 'gmail' ? 'Gmail Thread' :
               contentData.type === 'insight' ? 'Insight' :
               contentData.type === 'note' ? 'Note' :
               'Content')}
          </h4>
          {contentData.important && (
            <span className="text-yellow-500">⭐</span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          {getContentTypeIcon(contentData.contentType)}
          <span className="capitalize">{contentData.contentType.replace('_', ' ')}</span>
          <span>•</span>
          <Calendar className="w-3 h-3" />
          <span>{formatDate(contentData.createdAt)}</span>
        </div>
        
        {/* Stats for YouTube/Instagram */}
        {getStatsDisplay()}
        
        {/* Tags */}
        {contentData.tags && contentData.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {contentData.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-block bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
            {contentData.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{contentData.tags.length - 3}
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
  );
}; 