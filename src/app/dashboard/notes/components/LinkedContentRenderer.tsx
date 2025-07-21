"use client";

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { normalizePrefixedId, validatePrefixedId } from '@/lib/content-utils';
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
  Target,
  AlertTriangle
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
  // Get userId with proper error handling - never allow empty string
  const userId = getCurrentUserId();
  
  // Flag for completely invalid inputs
  const isInvalid = prefixedId === null || prefixedId === undefined;
  
  // Flag for empty prefixedId
  const isEmpty = !prefixedId || prefixedId.trim() === '';
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[LinkedContentRenderer] Initializing with:', {
      prefixedId,
      userId: userId ? `${userId.substring(0, 8)}...` : 'null',
      hasOnLinkContent: !!onLinkContent,
      isEmpty,
      isInvalid
    });
  }

  // Normalize and validate prefixedId (skip if empty or invalid)
  let normalizedPrefixedId = '';
  let isValidPrefixedId = false;
  let validationError: string | null = null;

  if (!isEmpty && !isInvalid) {
    try {
      // Normalize the prefixed ID (handles legacy 4-part insight format)
      normalizedPrefixedId = normalizePrefixedId(prefixedId);
      
      // Validate the normalized ID
      const validation = validatePrefixedId(normalizedPrefixedId);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid prefixed ID');
      }
      
      isValidPrefixedId = true;
    } catch (error) {
      validationError = error instanceof Error ? error.message : 'Unknown error';
      
      if (process.env.NODE_ENV === 'development' && prefixedId && validationError) {
        console.error('[LinkedContentRenderer] PrefixedId validation failed:', {
          original: prefixedId,
          normalized: normalizedPrefixedId,
          error: validationError
        });
      }
    }
  }

  // Extract content type from normalized prefixed ID for fallback displays
  const contentType = normalizedPrefixedId ? normalizedPrefixedId.split(':', 1)[0] : '';

  // Fetch content data - only when we have valid inputs
  // Use "skip" to prevent the query when conditions aren't met
  const contentData = useQuery(
    api.notes.getContentByPrefixedId, 
    userId && isValidPrefixedId && !isEmpty && !isInvalid ? {
      prefixedId: normalizedPrefixedId,
      userId
    } : "skip"
  );

  // Early return for invalid prefixedId after hooks
  if (isInvalid) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[LinkedContentRenderer] Received null/undefined prefixedId, skipping render');
    }
    return null;
  }

  // Early return for empty prefixedId after hooks
  if (isEmpty) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[LinkedContentRenderer] Empty prefixedId provided, skipping render');
    }
    return null;
  }

  // Early return if no userId - don't make queries with empty userId
  if (!userId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[LinkedContentRenderer] No userId available, rendering auth prompt');
    }
    
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 mx-1 my-1 rounded-lg border border-orange-200 bg-orange-50 text-sm">
        <AlertTriangle className="w-4 h-4 text-orange-500" />
        <span className="text-orange-700">Please sign in to view linked content</span>
      </div>
    );
  }

  // Handle validation errors
  if (validationError) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 mx-1 my-1 rounded-lg border border-red-200 bg-red-50 text-sm">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span className="text-red-700">Invalid content reference</span>
      </div>
    );
  }

  // Handle loading state with proper fallback
  if (contentData === undefined) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[LinkedContentRenderer] Loading content data for:', prefixedId);
    }
    
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 mx-1 my-1 rounded-lg border border-border bg-muted/50 text-sm">
        <div className="w-4 h-4 bg-muted rounded animate-pulse" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // Handle explicit null return (content not found or access denied)
  if (contentData === null) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[LinkedContentRenderer] Content not found or access denied for:', prefixedId);
    }
    
    // Provide fallback based on content type
    const getFallbackIcon = (type: string) => {
      switch (type) {
        case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
        case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
        case 'gmail': return <Mail className="w-4 h-4 text-red-500" />;
        case 'insight': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
        case 'note': return <ImageIcon className="w-4 h-4" />;
        default: return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
      }
    };
    
    const getFallbackLabel = (type: string) => {
      switch (type) {
        case 'youtube': return 'YouTube Video (Unavailable)';
        case 'instagram': return 'Instagram Post (Unavailable)';
        case 'gmail': return 'Gmail Thread (Unavailable)';
        case 'insight': return 'Insight (Unavailable)';
        case 'note': return 'Note (Unavailable)';
        default: return 'Content (Unavailable)';
      }
    };
    
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 mx-1 my-1 rounded-lg border border-muted bg-muted/30 text-sm opacity-60">
        {getFallbackIcon(contentType)}
        <span className="text-muted-foreground">{getFallbackLabel(contentType)}</span>
      </div>
    );
  }

  // Handle query errors (if Convex returns an error object)
  if (typeof contentData === 'object' && 'error' in contentData) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[LinkedContentRenderer] Query error:', contentData.error);
    }
    
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 mx-1 my-1 rounded-lg border border-red-200 bg-red-50 text-sm">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span className="text-red-700">Failed to load content</span>
      </div>
    );
  }

  // Validate content data structure
  if (!contentData || typeof contentData !== 'object' || !contentData.type) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[LinkedContentRenderer] Invalid content data structure:', contentData);
    }
    
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 mx-1 my-1 rounded-lg border border-red-200 bg-red-50 text-sm">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span className="text-red-700">Invalid content data</span>
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