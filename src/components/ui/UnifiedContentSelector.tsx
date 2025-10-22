"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { 
  FileText, 
  Search, 
  X, 
  Plus,
  Minus,
  MessageCircle,
  CheckCircle,
  Eye,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { T } from '@/components/translation';
import { useLanguagePreference, useTranslation } from '@/hooks/useTranslation';

// Unified content item interface using the platform router
interface UnifiedContentItem {
  id: string; // Standardized format: platform:actualId
  platform: 'notes' | 'conversations';
  contentType: 'note' | 'conversation';
  title: string;
  content: string;
  metadata: {
    createdAt: number;
    updatedAt?: number;
    thumbnailUrl?: string;
    statistics?: any;
    from?: string;
    messageCount?: number;
    mediaType?: string;
  };
  originalDocument: any;
}

// Usage modes for the selector
export type SelectorMode = 'link' | 'attach';

interface UnifiedContentSelectorProps {
  // Core props
  isOpen: boolean;
  onClose: () => void;
  mode: SelectorMode;
  userId?: string;
  
  // Search and filtering
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  excludeContentId?: string;
  currentTab?: string;
  
  // For link mode (@ mentions)
  onSelect?: (contentId: string) => void;
  position?: { top: number; left: number };
  
  // For attach mode (projects)
  onToggleAttachment?: (contentId: string, isAttached: boolean) => void;
  attachedItems?: Set<string>;
  showAttachedSection?: boolean;
}

const PLATFORM_CONFIGS = {
  notes: {
    key: 'notes',
    labelKey: 'content_selector.platform.notes',
    label: 'Notes',
    icon: FileText,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
  },
  conversations: {
    key: 'conversations', 
    labelKey: 'content_selector.platform.chats',
    label: 'Chats',
    icon: MessageCircle,
    color: 'bg-green-500/10 text-green-600 dark:text-green-400'
  }
} as const;

export const UnifiedContentSelector: React.FC<UnifiedContentSelectorProps> = ({
  isOpen,
  onClose,
  mode,
  userId,
  searchTerm: externalSearchTerm = '',
  onSearchChange,
  excludeContentId,
  currentTab = 'all',
  onSelect,
  position,
  onToggleAttachment,
  attachedItems = new Set(),
  showAttachedSection = false
}) => {
  const { firebaseUser } = useAuth();
  const effectiveUserId = userId || firebaseUser?.uid;
  
  // Internal state
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | keyof typeof PLATFORM_CONFIGS>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguagePreference();
  
  const { text: searchPlaceholder } = useTranslation('Search content...', {
    context: 'content_selector.placeholder.search',
    targetLang: language,
    enabled: true,
  });
  
  const { text: linkText } = useTranslation('Link', {
    context: 'content_selector.button.link',
    targetLang: language,
    enabled: true,
  });
  
  const { text: loadingText } = useTranslation('Loading content...', {
    context: 'content_selector.status.loading',
    targetLang: language,
    enabled: true,
  });
  
  const { text: noMatchingText } = useTranslation('No matching content found', {
    context: 'content_selector.message.no_matching',
    targetLang: language,
    enabled: true,
  });
  
  const { text: noContentText } = useTranslation('No content available', {
    context: 'content_selector.message.no_content',
    targetLang: language,
    enabled: true,
  });
  
  const { text: noAttachedText } = useTranslation('No items attached yet', {
    context: 'content_selector.message.no_attached',
    targetLang: language,
    enabled: true,
  });
  
  const { text: doneText } = useTranslation('Done', {
    context: 'button.done',
    targetLang: language,
    enabled: true,
  });
  
  const { text: allText } = useTranslation('All', {
    context: 'content_selector.filter.all',
    targetLang: language,
    enabled: true,
  });

  // Use external search term if provided, otherwise use internal
  const searchTerm = onSearchChange ? externalSearchTerm : internalSearchTerm;
  const handleSearchChange = onSearchChange || setInternalSearchTerm;

  // Fetch unified content using the platform router  
  const allUnifiedContent = useQuery(
    api.platformRouter.getAllUnifiedContent,
    effectiveUserId ? { 
      userId: effectiveUserId,
      platforms: currentTab !== 'all' ? [currentTab] : undefined,
      limit: 200 
    } : "skip"
  );

  const isLoading = !effectiveUserId || allUnifiedContent === undefined;

  // Filter and process content
  const { availableItems, attachedContentItems } = useMemo(() => {
    if (!allUnifiedContent || isLoading) {
      return { availableItems: [], attachedContentItems: [] };
    }

    let filteredContent = allUnifiedContent;

    // Apply platform filter
    if (selectedPlatform !== 'all') {
      filteredContent = filteredContent.filter(item => item.platform === selectedPlatform);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredContent = filteredContent.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower)
      );
    }

    // Exclude specific content
    if (excludeContentId) {
      filteredContent = filteredContent.filter(item => item.id !== excludeContentId);
    }

    // Limit results for performance
    const limitedContent = filteredContent.slice(0, 50);

    // Split into attached and available for attach mode
    if (mode === 'attach') {
      const attached = limitedContent.filter(item => attachedItems.has(item.id));
      const available = limitedContent.filter(item => !attachedItems.has(item.id));
      return { availableItems: available, attachedContentItems: attached };
    }

    return { availableItems: limitedContent, attachedContentItems: [] };
  }, [allUnifiedContent, selectedPlatform, searchTerm, excludeContentId, attachedItems, mode, isLoading]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard navigation for link mode
  useEffect(() => {
    if (mode !== 'link') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'Enter':
          if (availableItems.length > 0 && onSelect) {
            onSelect(availableItems[0].id);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, availableItems, onClose, onSelect, mode]);

  // Calculate position for link mode
  const finalPosition = React.useMemo(() => {
    if (mode === 'link' && position && typeof window !== 'undefined') {
      const selectorWidth = 600;
      const selectorHeight = 400;
      const margin = 20;
      
      return {
        top: Math.max(margin, Math.min(
          position.top,
          window.innerHeight - selectorHeight - margin
        )),
        left: Math.max(margin, Math.min(
          position.left,
          window.innerWidth - selectorWidth - margin
        ))
      };
    }
    return { top: 100, left: 100 };
  }, [mode, position]);

  if (!isOpen) return null;

  const renderContentItem = (item: UnifiedContentItem, isAttached = false) => {
    const platformConfig = PLATFORM_CONFIGS[item.platform];
    const IconComponent = platformConfig.icon;
    
    return (
      <div
        key={item.id}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border min-w-0 transition-all duration-200",
          isAttached ? "bg-muted/50 border-muted" : "bg-background border-border hover:shadow-sm hover:bg-muted/30 hover:border-muted"
        )}
      >
        {/* Platform Icon */}
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", platformConfig.color)}>
          <IconComponent className="w-4 h-4" />
        </div>
        
        {/* Content Info */}
        <div className="flex-1 min-w-0 pr-3">
          <h4 className="font-medium text-foreground line-clamp-2 break-words leading-tight mb-1">
            {item.title}
          </h4>
          
          {/* Preview/Description */}
          {item.content && (
            <p className="text-sm text-muted-foreground line-clamp-2 break-words leading-tight mb-2">
              {item.content.substring(0, 120)}...
            </p>
          )}
          
          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{new Date(item.metadata.createdAt).toLocaleDateString()}</span>
            
            {/* Platform-specific metadata */}
            {item.platform === 'conversations' && item.metadata.messageCount && (
              <>
                <span>•</span>
                <MessageCircle className="w-3 h-3" />
                <span>{item.metadata.messageCount} messages</span>
              </>
            )}
          </div>
        </div>
        
        {/* Action Button */}
        <div className="flex-shrink-0">
          {mode === 'link' ? (
            <Button
              size="sm"
              onClick={() => onSelect?.(item.id)}
              className="h-8 px-3 text-xs"
            >
              {linkText}
            </Button>
          ) : mode === 'attach' ? (
            <Button
              size="sm"
              variant={isAttached ? "outline" : "default"}
              onClick={() => onToggleAttachment?.(item.id, isAttached)}
              className={cn(
                "w-8 h-8 p-0",
                isAttached 
                  ? "hover:bg-destructive hover:text-destructive-foreground"
                  : "hover:bg-primary/90"
              )}
            >
              {isAttached ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </Button>
          ) : null}
        </div>
      </div>
    );
  };

  const SelectorContent = (
    <>
      {/* Header - only show for link mode since Dialog mode has its own header */}
      {mode === 'link' && (
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-sm"><T context="content_selector.title.link">Link Content</T></h3>
          <button
            title="Close"
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Platform Filter */}
      <div className="p-3 border-b border-border">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
          <button
            onClick={() => setSelectedPlatform('all')}
            className={cn(
              "flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-md transition-colors",
              selectedPlatform === 'all'
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <FileText className="w-3 h-3" />
            <span className="hidden sm:inline">{allText}</span>
          </button>
          
          {Object.entries(PLATFORM_CONFIGS).map(([key, config]) => {
            const IconComponent = config.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedPlatform(key as keyof typeof PLATFORM_CONFIGS)}
                className={cn(
                  "flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-md transition-colors",
                  selectedPlatform === key
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <IconComponent className="w-3 h-3" />
                <span className="hidden sm:inline">
                  <T context={config.labelKey}>{config.label}</T>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">
            <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full mx-auto mb-2"></div>
            {loadingText}
          </div>
        ) : mode === 'attach' && showAttachedSection ? (
          // Two-column layout for attach mode
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 overflow-hidden">
            {/* Available Items */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  <T context="content_selector.section.available">Available</T> ({availableItems.length})
                </h4>
              </div>
              <div className="overflow-y-auto overflow-x-hidden max-h-[400px] scrollbar-hide">
                <div className="space-y-2 pr-2">
                  {availableItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {searchTerm ? noMatchingText : noContentText}
                    </div>
                  ) : (
                    availableItems.map(item => renderContentItem(item, false))
                  )}
                </div>
              </div>
            </div>
            
            {/* Attached Items */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  <T context="content_selector.section.attached">Attached</T> ({attachedContentItems.length})
                </h4>
              </div>
              <div className="overflow-y-auto overflow-x-hidden max-h-[400px] scrollbar-hide">
                <div className="space-y-2 pr-2">
                  {attachedContentItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {noAttachedText}
                    </div>
                  ) : (
                    attachedContentItems.map(item => renderContentItem(item, true))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Single column layout for link mode or attach without sections
          <div className="overflow-y-auto overflow-x-hidden max-h-80 scrollbar-hide">
            <div className="p-3 space-y-2">
              {availableItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? noMatchingText : noContentText}
                </div>
              ) : (
                availableItems.map(item => renderContentItem(item, false))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {mode === 'attach' && (
        <div className="flex justify-end p-3 border-t border-border">
          <Button onClick={onClose} variant="outline">
            {doneText}
          </Button>
        </div>
      )}
    </>
  );

  // Render based on mode
  if (mode === 'link') {
    return (
      <div 
        className="fixed z-[9999] w-80 sm:w-96 md:w-[32rem] lg:w-[40rem] bg-background border border-border rounded-lg shadow-xl backdrop-blur-sm max-h-[80vh] flex flex-col"
        style={{
          top: `${finalPosition.top}px`,
          left: `${finalPosition.left}px`,
        }}
      >
        {SelectorContent}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col w-[95vw]">
        <DialogHeader>
          <DialogTitle>
            <T context="content_selector.title.manage">Manage Content</T>
          </DialogTitle>
        </DialogHeader>
        {SelectorContent}
      </DialogContent>
    </Dialog>
  );
}; 