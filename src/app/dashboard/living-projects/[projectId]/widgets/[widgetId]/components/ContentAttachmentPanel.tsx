'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useNotes } from '@/app/context/notes-context';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ContentType, AttachmentMode } from './types/contentAttachment';
import { transformAllItems } from './utils/itemTransformers';
import { useContentAttachment } from './hooks/useContentAttachment';
import { PanelHeader } from './PanelHeader';
import { QuickNoteForm } from './QuickNoteForm';
import { SearchAndFilterBar } from './SearchAndFilterBar';
import { EnhancedItemCard } from './EnhancedItemCard';
import { T } from '@/components/translation';

/**
 * ContentAttachmentPanel - Unified content attachment for widgets and projects
 * 
 * Supports three modes:
 * - Widget mode: Pass widgetId to attach content to a specific widget
 * - Project mode: Pass projectId to attach content to a project
 * - Selection mode: Pass onAttachmentsChange callback for pre-creation selection
 */
interface ContentAttachmentPanelProps {
  widgetId?: string | Id<"widgets">;
  projectId?: Id<"projects">;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  attachedNoteIds: string[];
  attachedConversationIds: string[];
  attachedCrystalIds?: string[];
  attachedShardIds?: string[];
  // Selection mode callback - if provided, panel won't persist changes, just call this
  onAttachmentsChange?: (noteIds: string[], conversationIds: string[], crystalIds: string[], shardIds: string[]) => void;
}

// Legacy export for backward compatibility
export type WidgetAttachmentPanelProps = ContentAttachmentPanelProps;

export function ContentAttachmentPanel({
  widgetId,
  projectId,
  userId,
  isOpen,
  onClose,
  attachedNoteIds,
  attachedConversationIds,
  attachedCrystalIds = [],
  attachedShardIds = [],
  onAttachmentsChange
}: ContentAttachmentPanelProps) {
  const { notes } = useNotes();
  const panelRef = useRef<HTMLDivElement>(null);

  // Determine attachment mode - selection mode if callback provided
  const isSelectionMode = !!onAttachmentsChange;
  const mode: AttachmentMode = widgetId ? 'widget' : 'project';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showQuickNote, setShowQuickNote] = useState(false);
  
  // Local state for selection mode
  const [localNoteIds, setLocalNoteIds] = useState<string[]>(attachedNoteIds);
  const [localConvIds, setLocalConvIds] = useState<string[]>(attachedConversationIds);
  const [localCrystalIds, setLocalCrystalIds] = useState<string[]>(attachedCrystalIds);
  const [localShardIds, setLocalShardIds] = useState<string[]>(attachedShardIds);

  // Use unified attachment hook only for non-selection mode
  const { handleToggleItem: handleToggleItemPersist } = useContentAttachment({
    userId,
    mode,
    widgetId,
    projectId
  });
  
  // Handle toggle in selection mode
  const handleToggleItemSelection = (item: any) => {
    const itemId = String(item.id);
    switch (item.type) {
      case 'note':
        setLocalNoteIds(prev => 
          prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
        break;
      case 'conversation':
        setLocalConvIds(prev => 
          prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
        break;
      case 'crystal':
        setLocalCrystalIds(prev => 
          prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
        break;
      case 'shard':
        setLocalShardIds(prev => 
          prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
        break;
    }
  };
  
  const handleToggleItem = isSelectionMode ? handleToggleItemSelection : handleToggleItemPersist;
  
  // Handle close - call callback in selection mode
  const handleClose = () => {
    if (isSelectionMode && onAttachmentsChange) {
      onAttachmentsChange(localNoteIds, localConvIds, localCrystalIds, localShardIds);
    }
    onClose();
  };

  // Fetch data
  const conversations = useQuery(api.chatQueries.getHistory, userId ? { userId } : "skip");
  const crystals = useQuery(api.crystalQueries.getCrystalPersonaData, userId ? { userId, limit: 100 } : "skip");
  const shards = useQuery(api.shardQueries.getShardPersonaData, userId ? { userId, limit: 100 } : "skip");

  // Transform all items using utility function
  // In selection mode, use local state; otherwise use props
  const currentNoteIds = isSelectionMode ? localNoteIds : attachedNoteIds;
  const currentConvIds = isSelectionMode ? localConvIds : attachedConversationIds;
  const currentCrystalIds = isSelectionMode ? localCrystalIds : attachedCrystalIds;
  const currentShardIds = isSelectionMode ? localShardIds : attachedShardIds;
  
  const allItems = useMemo(() => 
    transformAllItems(
      notes,
      conversations,
      crystals,
      shards,
      currentNoteIds,
      currentConvIds,
      currentCrystalIds,
      currentShardIds
    ),
    [notes, conversations, crystals, shards, currentNoteIds, currentConvIds, currentCrystalIds, currentShardIds]
  );

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesSearch = !searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.preview.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [allItems, selectedType, searchTerm]);

  const attachedItems = filteredItems.filter(item => item.isAttached);
  const availableItems = filteredItems.filter(item => !item.isAttached);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      ref={panelRef}
      drag
      dragMomentum={false}
      whileDrag={{ cursor: "grabbing" }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-background/95 backdrop-blur-xl border border-border/40 rounded-3xl shadow-2xl overflow-hidden cursor-grab w-full max-w-6xl h-[85vh] max-h-[800px]">
        <div className="flex h-full flex-col">
          {/* Header Section */}
          <div className="p-6 border-b border-border/20">
            <PanelHeader
              onClose={handleClose}
              onQuickNoteToggle={() => setShowQuickNote(!showQuickNote)}
            />

            <QuickNoteForm
              userId={userId}
              widgetId={widgetId}
              projectId={projectId}
              isOpen={showQuickNote}
              onToggle={() => setShowQuickNote(!showQuickNote)}
            />

            <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
            />
          </div>

          {/* Content Section */}
          <div className="flex-1 overflow-auto p-6">
            {/* Attached Items */}
            {attachedItems.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-lg font-light text-foreground">Attached Content</h3>
                  <Badge variant="default" className="rounded-full">{attachedItems.length}</Badge>
                </div>
                <div className="space-y-3">
                  {attachedItems.map(item => (
                    <EnhancedItemCard
                      key={item.id}
                      item={item}
                      isAttached={true}
                      isExpanded={expandedItems.has(item.id)}
                      onToggle={() => handleToggleItem(item)}
                      onToggleExpanded={() => toggleExpanded(item.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Available Items */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-light text-foreground">Available Content</h3>
                <Badge variant="outline" className="rounded-full">{availableItems.length}</Badge>
              </div>
              <div className="space-y-3">
                {availableItems.map(item => (
                  <EnhancedItemCard
                    key={item.id}
                    item={item}
                    isAttached={false}
                    isExpanded={expandedItems.has(item.id)}
                    onToggle={() => handleToggleItem(item)}
                    onToggleExpanded={() => toggleExpanded(item.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
