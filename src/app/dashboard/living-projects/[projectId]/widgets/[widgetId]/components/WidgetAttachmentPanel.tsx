'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useNotes } from '@/app/context/notes-context';
import { useWidgetContent } from '@/app/dashboard/living-projects/hooks/useWidgetContent';
import { motion } from 'framer-motion';
import { X, Search, FileText, MessageSquare, Calendar, Tag, Type, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface WidgetAttachmentPanelProps {
  widgetId: string | Id<"widgets">;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  attachedNoteIds: string[];
  attachedConversationIds: string[];
}

export function WidgetAttachmentPanel({
  widgetId,
  userId,
  isOpen,
  onClose,
  attachedNoteIds,
  attachedConversationIds
}: WidgetAttachmentPanelProps) {
  const { notes } = useNotes();
  const { addNoteToWidget, removeNoteFromWidget, addConversationToWidget, removeConversationFromWidget } = useWidgetContent(userId);
  const panelRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'note' | 'conversation'>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Fetch conversations
  const conversations = useQuery(
    api.chatQueries.getHistory,
    userId ? { userId } : "skip"
  );

  // Convert to unified format with more metadata
  const allItems = useMemo(() => {
    const items: any[] = [];

    // Add notes with enhanced metadata
    notes.forEach(note => {
      items.push({
        id: note._id,
        type: 'note',
        title: note.title || 'Untitled Note',
        preview: note.content?.substring(0, 150) || '',
        fullContent: note.content || '',
        timestamp: note.updatedAt,
        createdAt: note.createdAt,
        isAttached: attachedNoteIds.includes(note._id),
        metadata: {
          type: note.type || 'idea_bank',
          tags: note.tags || [],
          platform: note.platform || '',
          important: note.important || false,
          isWidgetOutput: (note as any).isWidgetOutput || false,
          projectId: (note as any).projectId,
          widgetId: (note as any).widgetId
        }
      });
    });

    // Add conversations with enhanced metadata
    conversations?.forEach(conv => {
      const lastMessage = conv.messages[conv.messages.length - 1];
      items.push({
        id: conv._id,
        type: 'conversation',
        title: conv.title || 'Untitled Conversation',
        preview: lastMessage?.content?.substring(0, 150) || '',
        fullContent: lastMessage?.content || '',
        timestamp: conv.updatedAt,
        createdAt: conv.createdAt,
        isAttached: attachedConversationIds.includes(conv._id),
        metadata: {
          messageCount: conv.messages?.length || 0,
          conversationType: conv.conversationType || 'general',
          starred: conv.starred || false,
          projectId: conv.projectId,
          widgetId: conv.widgetId
        }
      });
    });

    return items;
  }, [notes, conversations, attachedNoteIds, attachedConversationIds]);

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesSearch = !searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.metadata.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [allItems, selectedType, searchTerm]);

  const attachedItems = filteredItems.filter(item => item.isAttached);
  const availableItems = filteredItems.filter(item => !item.isAttached);

  const handleToggle = async (item: any) => {
    if (item.type === 'note') {
      if (item.isAttached) {
        await removeNoteFromWidget(item.id as Id<"notes">);
      } else {
        await addNoteToWidget(item.id as Id<"notes">, widgetId);
      }
    } else if (item.type === 'conversation') {
      if (item.isAttached) {
        await removeConversationFromWidget(item.id as Id<"conversations">);
      } else {
        await addConversationToWidget(item.id as Id<"conversations">, widgetId);
      }
    }
  };

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

  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
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
        {/* Header */}
        <div className="p-6 border-b border-border/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary/70" />
              </div>
              <div>
                <h2 className="text-2xl font-light tracking-tight text-foreground">
                  Manage Widget Content
                </h2>
                <p className="text-sm text-muted-foreground/60 font-light">
                  Attach notes and conversations to enhance your widget
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-muted/20 rounded-lg">
                <span className="text-xs font-mono text-muted-foreground/60">ESC</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted/30">
                <X className="w-5 h-5 text-muted-foreground/60" />
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input
                placeholder="Search content, tags, or metadata..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-muted/20 border-0 rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-muted/30 transition-all font-light"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('all')}
                className="rounded-xl"
              >
                All
              </Button>
              <Button
                variant={selectedType === 'note' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('note')}
                className="rounded-xl"
              >
                Notes
              </Button>
              <Button
                variant={selectedType === 'conversation' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('conversation')}
                className="rounded-xl"
              >
                Conversations
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Attached Items */}
          {attachedItems.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-light text-foreground">
                  Attached Content
                </h3>
                <Badge variant="default" className="rounded-full">
                  {attachedItems.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {attachedItems.map(item => (
                  <EnhancedItemCard
                    key={item.id}
                    item={item}
                    isAttached={true}
                    onToggle={() => handleToggle(item)}
                    isExpanded={expandedItems.has(item.id)}
                    onToggleExpanded={() => toggleExpanded(item.id)}
                    getRelativeTime={getRelativeTime}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Items */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-light text-foreground">
                Available Content
              </h3>
              <Badge variant="outline" className="rounded-full">
                {availableItems.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {availableItems.map(item => (
                <EnhancedItemCard
                  key={item.id}
                  item={item}
                  isAttached={false}
                  onToggle={() => handleToggle(item)}
                  isExpanded={expandedItems.has(item.id)}
                  onToggleExpanded={() => toggleExpanded(item.id)}
                  getRelativeTime={getRelativeTime}
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

// Enhanced Item Card Component
function EnhancedItemCard({ 
  item, 
  isAttached, 
  onToggle, 
  isExpanded, 
  onToggleExpanded, 
  getRelativeTime 
}: any) {
  const Icon = item.type === 'note' ? FileText : MessageSquare;

  return (
    <motion.div
      className="border border-border/40 rounded-2xl p-5 hover:bg-muted/20 hover:border-border/60 transition-all duration-200 group"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center flex-shrink-0 group-hover:bg-muted/50 transition-colors">
          <Icon className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground group-hover:text-foreground transition-colors truncate">
                {item.title}
              </h4>
              <p className="text-sm text-muted-foreground/70 line-clamp-2 mt-1 font-light">
                {item.preview}
              </p>
              
              {/* Metadata Row */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground/60">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {getRelativeTime(item.timestamp)}
                </div>
                
                {item.metadata.type && (
                  <div className="flex items-center gap-1">
                    <Type className="w-3 h-3" />
                    {item.metadata.type.replace('_', ' ')}
                  </div>
                )}
                
                {item.metadata.messageCount && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {item.metadata.messageCount} messages
                  </div>
                )}
                
                {item.metadata.tags && item.metadata.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {item.metadata.tags.length} tags
                  </div>
                )}
              </div>

              {/* Tags */}
              {item.metadata.tags && item.metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.metadata.tags.slice(0, 3).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs rounded-full px-2 py-0.5">
                      {tag}
                    </Badge>
                  ))}
                  {item.metadata.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs rounded-full px-2 py-0.5">
                      +{item.metadata.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Expanded Content */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-border/20"
                >
                  <div className="text-sm text-muted-foreground/80 font-light leading-relaxed">
                    {item.fullContent}
                  </div>
                  
                  {/* Additional Metadata */}
                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-muted-foreground/60">
                    <div>
                      <span className="font-medium">Created:</span> {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                    {item.metadata.platform && (
                      <div>
                        <span className="font-medium">Platform:</span> {item.metadata.platform}
                      </div>
                    )}
                    {item.metadata.important && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Important:</span> 
                        <Badge variant="success" className="text-xs">Starred</Badge>
                      </div>
                    )}
                    {item.metadata.isWidgetOutput && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Source:</span> 
                        <Badge variant="outline" className="text-xs">Widget Output</Badge>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpanded}
                className="p-2 hover:bg-muted/30 rounded-lg"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                variant={isAttached ? 'destructive' : 'default'}
                size="sm"
                onClick={onToggle}
                className="rounded-xl"
              >
                {isAttached ? 'Remove' : 'Add'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
