'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Tag, Type, Package, Star, Sparkles, Gem, ChevronDown, ChevronUp } from 'lucide-react';
import { BaseCard } from '@/components/ui/base-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContentItem, NoteMetadata, ShardMetadata } from './types/contentAttachment';
import { getItemIcon, getRelativeTime } from './utils/contentItemHelpers';

interface EnhancedItemCardProps {
  item: ContentItem;
  isAttached: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleExpanded: () => void;
}

export function EnhancedItemCard({ 
  item, 
  isAttached, 
  isExpanded, 
  onToggle, 
  onToggleExpanded 
}: EnhancedItemCardProps) {
  const Icon = getItemIcon(item.type);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <BaseCard
        variant="enhanced-item"
        title={item.title}
        summary={item.preview}
        className="group"
      >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center flex-shrink-0 group-hover:bg-muted/50 transition-colors">
          <Icon className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Metadata Row */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground/60">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {getRelativeTime(item.timestamp)}
                </div>
                
                {item.type === 'note' && (item.metadata as NoteMetadata).type && (
                  <div className="flex items-center gap-1">
                    <Type className="w-3 h-3" />
                    {(item.metadata as NoteMetadata).type.replace('_', ' ')}
                  </div>
                )}
                
                {item.type === 'artifact' && (item.metadata as any).type && (
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {(item.metadata as any).type}
                  </div>
                )}
                
                {item.type === 'stardust' && (item.metadata as any).dimension && (
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {(item.metadata as any).dimension}
                  </div>
                )}
                
                {item.type === 'note' && (item.metadata as NoteMetadata).tags && (item.metadata as NoteMetadata).tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {(item.metadata as NoteMetadata).tags.length} tags
                  </div>
                )}

                {item.type === 'shard' && (item.metadata as ShardMetadata).confidenceLevel && (
                  <div className="flex items-center gap-1">
                    <Type className="w-3 h-3" />
                    {(item.metadata as ShardMetadata).confidenceLevel} confidence
                  </div>
                )}
                
                {item.type === 'stardust' && (item.metadata as any).confidence !== undefined && (
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {(item.metadata as any).confidence} confidence
                  </div>
                )}
              </div>

              {/* Tags */}
              {item.type === 'note' && (item.metadata as NoteMetadata).tags && (item.metadata as NoteMetadata).tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(item.metadata as NoteMetadata).tags.slice(0, 3).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs rounded-full px-2 py-0.5">
                      {tag}
                    </Badge>
                  ))}
                  {(item.metadata as NoteMetadata).tags.length > 3 && (
                    <Badge variant="outline" className="text-xs rounded-full px-2 py-0.5">
                      +{(item.metadata as NoteMetadata).tags.length - 3}
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
                  <div className="space-y-4">
                    {item.fullContent && (
                      <div>
                        <div className="text-sm text-muted-foreground/80 font-light leading-relaxed">
                          {item.fullContent}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Additional Metadata */}
                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-muted-foreground/60">
                    <div>
                      <span className="font-medium">Created:</span> {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                    {item.type === 'note' && (item.metadata as NoteMetadata).platform && (
                      <div>
                        <span className="font-medium">Platform:</span> {(item.metadata as NoteMetadata).platform}
                      </div>
                    )}
                    {item.type === 'note' && (item.metadata as NoteMetadata).important && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Important:</span> 
                        <Badge variant="success" className="text-xs">Starred</Badge>
                      </div>
                    )}
                    {item.type === 'note' && (item.metadata as NoteMetadata).isWidgetOutput && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Source:</span> 
                        <Badge variant="outline" className="text-xs">Widget Output</Badge>
                      </div>
                    )}
                    {item.type === 'artifact' && (item.metadata as any).type && (
                      <div>
                        <span className="font-medium">Type:</span> {(item.metadata as any).type}
                      </div>
                    )}
                    {item.type === 'stardust' && (item.metadata as any).lifecycleStage && (
                      <div>
                        <span className="font-medium">Stage:</span> {(item.metadata as any).lifecycleStage}
                      </div>
                    )}
                    {item.type === 'shard' && (item.metadata as ShardMetadata).sourceType && (
                      <div>
                        <span className="font-medium">Source Type:</span> {(item.metadata as ShardMetadata).sourceType}
                      </div>
                    )}
                    {item.type === 'shard' && (item.metadata as ShardMetadata).shardStatus && (
                      <div>
                        <span className="font-medium">Status:</span> {(item.metadata as ShardMetadata).shardStatus.replace('_', ' ')}
                      </div>
                    )}
                    {item.type === 'shard' && (item.metadata as ShardMetadata).usedInCrystal && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Used in Crystal:</span> 
                        <Badge variant="outline" className="text-xs">Yes</Badge>
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
      </BaseCard>
    </motion.div>
  );
}
