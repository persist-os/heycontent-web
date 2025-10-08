/**
 * Unified Content Card Component
 * 
 * Displays all content types (notes, conversations, crystals, shards) consistently.
 * Provides unified interface for content display in the Project Content Display feature.
 */

"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  MessageCircle, 
  Gem, 
  Sparkles,
  MoreVertical,
  ExternalLink,
  Edit3,
  Trash2,
  Star,
  Clock,
  Tag,
  Eye,
  Copy,
  Unlink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ProjectContentItem } from '@/convex/projectContentQueries';

interface UnifiedContentCardProps {
  content: ProjectContentItem;
  onOpen: (contentId: string, contentType: string) => void;
  onEdit?: (contentId: string, contentType: string) => void;
  onDelete?: (contentId: string, contentType: string) => void;
  className?: string;
}

export function UnifiedContentCard({
  content,
  onOpen,
  onEdit,
  onDelete,
  className = ''
}: UnifiedContentCardProps) {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get content type configuration
  const getContentTypeConfig = (type: string) => {
    switch (type) {
      case 'note':
        return {
          icon: FileText,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          hoverColor: 'hover:bg-blue-50 dark:hover:bg-blue-950/30'
        };
      case 'conversation':
        return {
          icon: MessageCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800',
          hoverColor: 'hover:bg-green-50 dark:hover:bg-green-950/30'
        };
      case 'crystal':
        return {
          icon: Gem,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-950/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          hoverColor: 'hover:bg-purple-50 dark:hover:bg-purple-950/30'
        };
      case 'shard':
        return {
          icon: Sparkles,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50 dark:bg-amber-950/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
          hoverColor: 'hover:bg-amber-50 dark:hover:bg-amber-950/30'
        };
      default:
        return {
          icon: FileText,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-950/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          hoverColor: 'hover:bg-gray-50 dark:hover:bg-gray-950/30'
        };
    }
  };

  const config = getContentTypeConfig(content.type);
  const IconComponent = config.icon;

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  // Get content type specific metadata
  const getContentMetadata = () => {
    const metadata = [];
    
    switch (content.type) {
      case 'note':
        if (content.metadata.important) {
          metadata.push({ icon: Star, text: 'Important', color: 'text-amber-600' });
        }
        if (content.metadata.type) {
          metadata.push({ icon: Tag, text: content.metadata.type, color: 'text-blue-600' });
        }
        break;
        
      case 'conversation':
        if (content.metadata.messageCount) {
          metadata.push({ 
            icon: MessageCircle, 
            text: `${content.metadata.messageCount} messages`,
            color: 'text-green-600'
          });
        }
        if (content.metadata.starred) {
          metadata.push({ icon: Star, text: 'Starred', color: 'text-amber-600' });
        }
        break;
        
      case 'crystal':
        if (content.metadata.dimension) {
          metadata.push({ icon: Tag, text: content.metadata.dimension, color: 'text-purple-600' });
        }
        if (content.metadata.confidence_score) {
          metadata.push({ 
            icon: Star, 
            text: content.metadata.confidence_score,
            color: 'text-purple-600'
          });
        }
        break;
        
      case 'shard':
        if (content.metadata.dimension) {
          metadata.push({ icon: Tag, text: content.metadata.dimension, color: 'text-amber-600' });
        }
        if (content.metadata.confidence_level) {
          metadata.push({ 
            icon: Star, 
            text: content.metadata.confidence_level,
            color: 'text-amber-600'
          });
        }
        break;
    }
    
    return metadata;
  };

  const metadata = getContentMetadata();

  // Handle card click - navigate to content detail page
  const handleCardClick = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Navigate to appropriate content page based on type
      switch (content.type) {
        case 'note':
          router.push(`/dashboard/notes/${content.id}`);
          break;
        case 'conversation':
          router.push(`/dashboard/thinking_lab?conversationId=${content.id}`);
          break;
        case 'crystal':
          router.push(`/dashboard/crystals?crystalId=${content.metadata.crystal_id || content.id}`);
          break;
        case 'shard':
          router.push(`/dashboard/crystals?shardId=${content.id}`);
          break;
        default:
          // Fallback to generic content view
          router.push(`/dashboard/content/${content.type}/${content.id}`);
      }
      
      // Call the onOpen callback for any additional handling
      onOpen(content.id, content.type);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle action menu
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(!showActions);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    if (onEdit) {
      onEdit(content.id, content.type);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    if (onDelete) {
      onDelete(content.id, content.type);
    }
  };

  // Handle copy content link
  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    
    try {
      const url = window.location.origin + `/dashboard/content/${content.type}/${content.id}`;
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
      console.log('Content link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  // Handle detach from project
  const handleDetach = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    
    // This would need to be implemented with a mutation
    console.log('Detach content from project:', content.id, content.type);
    // You could add a confirmation dialog here
  };

  // Handle quick view (open in modal/sidebar)
  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    
    // This could open a modal or sidebar with content preview
    console.log('Quick view content:', content.id, content.type);
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative bg-background border border-border rounded-lg overflow-hidden cursor-pointer transition-all duration-200",
        config.hoverColor,
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Header with icon and actions */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            config.bgColor
          )}>
            <IconComponent className={cn("w-5 h-5", config.color)} />
          </div>
          
          <div className="relative">
            <button
              onClick={handleActionClick}
              className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label="Content actions"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            
            {/* Actions Menu */}
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-8 bg-background border border-border rounded-lg shadow-lg py-1 z-10 min-w-[140px]"
              >
                <button
                  onClick={handleQuickView}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2"
                >
                  <Eye className="w-3 h-3" />
                  Quick View
                </button>
                <button
                  onClick={handleEdit}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2"
                >
                  <Copy className="w-3 h-3" />
                  Copy Link
                </button>
                <button
                  onClick={handleDetach}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2 text-orange-600"
                >
                  <Unlink className="w-3 h-3" />
                  Detach
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-medium text-foreground text-sm leading-tight mb-2 line-clamp-2">
          {content.title}
        </h3>

        {/* Preview */}
        {content.preview && (
          <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">
            {content.preview}
          </p>
        )}
      </div>

      {/* Metadata */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {metadata.slice(0, 2).map((meta, index) => {
            const MetaIcon = meta.icon;
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
                  meta.color,
                  "bg-muted/50"
                )}
              >
                <MetaIcon className="w-3 h-3" />
                <span>{meta.text}</span>
              </div>
            );
          })}
        </div>

        {/* Footer with timestamp */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDate(content.metadata.createdAt)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            <span className="capitalize">{content.type}</span>
          </div>
        </div>
      </div>

      {/* Click overlay for better UX */}
      <div className="absolute inset-0 bg-transparent hover:bg-muted/5 transition-colors pointer-events-none" />
    </motion.div>
  );
}
