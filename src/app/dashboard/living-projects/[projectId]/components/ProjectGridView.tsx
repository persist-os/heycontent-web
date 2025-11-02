/**
 * PROJECT GRID VIEW COMPONENT
 * 
 * Unified grid view displaying both widgets and content items in a structured layout.
 * Provides filtering, sorting, and unified interaction patterns.
 */

'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { WidgetConfig } from '@/types/projectWidgets'
import { T } from '@/components/translation'
import { ContentCard, ContentCardData } from '@/components/command-palette'
import { 
  FileText, 
  MessageCircle, 
  Gem, 
  Sparkles,
  PlayCircle,
  MoreHorizontal,
  Filter,
  Search,
  Grid3X3,
  List as ListIcon,
  Calendar,
  Star,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface ProjectGridViewProps {
  projectId: string
  userId: string
  widgets: WidgetConfig[]
  contentItems: any[]
  onWidgetClick: (widget: WidgetConfig) => void
  onContentOpen: (id: string, type: string) => void
}

type ItemType = 'all' | 'widgets' | 'notes' | 'conversations' | 'crystals' | 'shards'
type SortBy = 'recent' | 'importance' | 'name' | 'type'
type ViewMode = 'grid' | 'list'

export function ProjectGridView({
  projectId,
  userId,
  widgets,
  contentItems,
  onWidgetClick,
  onContentOpen
}: ProjectGridViewProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<ItemType>('all')
  const [sortBy, setSortBy] = useState<SortBy>('importance')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  // Combine and normalize all items
  const allItems = useMemo(() => {
    // Debug logging
    console.log('ProjectGridView - widgets:', widgets.length, widgets)
    console.log('ProjectGridView - contentItems:', contentItems.length, contentItems)
    
    const widgetItems = widgets.map(widget => ({
      id: widget._id,
      type: 'widget' as const,
      title: widget.title,
      description: widget.description,
      priority: widget.priority,
      size: widget.size,
      theme: widget.theme,
      createdAt: (widget as any).created_at || Date.now(),
      importance: 0.3 + (widget.priority > 7 ? 0.4 : 0) + (widget.size === 'large' ? 0.2 : 0) + 0.3,
      data: widget
    }))

    const contentItemsNormalized = contentItems.map((item: any) => {
      const contentType = item._contentType || 'note'
      let title = ''
      let description = ''
      
      switch (contentType) {
        case 'note':
          title = (item as any).title || 'Untitled Note'
          description = (item as any).content ? (item as any).content.substring(0, 100) + '...' : 'No content'
          break
        case 'conversation':
          title = (item as any).title || 'Conversation'
          description = (item as any).messages?.[0]?.content ? (item as any).messages[0].content.substring(0, 80) + '...' : 'No messages'
          break
        case 'crystal':
          title = (item as any).name || 'Crystal'
          const coreInsight = (item as any).core_insight
          const supportingQuote = (item as any).supporting_quotes
          description = coreInsight ? coreInsight.substring(0, 90) + '...' : 
                       supportingQuote ? supportingQuote.substring(0, 90) + '...' : 'No insight'
          break
        case 'shard':
          title = `${(item as any).dimension || 'Dimension'} Shard`
          description = (item as any).exact_quote ? (item as any).exact_quote.substring(0, 80) + '...' : 'No quote'
          break
        default:
          title = 'Unknown Item'
          description = 'No description available'
      }

      return {
        id: item._contentId || item._id || 'unknown',
        type: contentType,
        title,
        description,
        priority: 0,
        size: 'medium' as const,
        theme: 'default' as const,
        createdAt: (item as any).createdAt || Date.now(),
        importance: 0.3 + (contentType === 'note' ? 0.3 : contentType === 'conversation' ? 0.25 : 0.2),
        data: item
      }
    })

    return [...widgetItems, ...contentItemsNormalized]
  }, [widgets, contentItems])

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = allItems

    // Filter by type
    if (filter !== 'all') {
      if (filter === 'widgets') {
        filtered = filtered.filter(item => item.type === 'widget')
      } else if (filter === 'notes') {
        filtered = filtered.filter(item => item.type === 'note')
      } else if (filter === 'conversations') {
        filtered = filtered.filter(item => item.type === 'conversation')
      } else if (filter === 'crystals') {
        filtered = filtered.filter(item => item.type === 'crystal')
      } else if (filter === 'shards') {
        filtered = filtered.filter(item => item.type === 'shard')
      } else {
        filtered = filtered.filter(item => item.type === filter)
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        (item.title || '').toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query)
      )
    }

    return filtered
  }, [allItems, filter, searchQuery])

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.createdAt - a.createdAt
        case 'importance':
          return b.importance - a.importance
        case 'name':
          return a.title.localeCompare(b.title)
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })
    return sorted
  }, [filteredItems, sortBy])

  // Handle card click
  const handleCardClick = (content: ContentCardData) => {
    if (content.type === 'widget') {
      const widget = widgets.find(w => w._id === content.id)
      if (widget) onWidgetClick(widget)
    } else {
      onContentOpen(content.id, content.type)
    }
  }

  // Handle card click - widgets now managed via ProjectControlPanel
  const handleCardAction = (content: ContentCardData) => {
    // Card clicks open the unified details panel
    // Widget execution is now controlled via "Start Project" button
  }

  // Convert items to ContentCardData format
  const cardData: ContentCardData[] = useMemo(() => {
    return sortedItems.map(item => ({
      id: item.id,
      type: item.type as any,
      title: item.title,
      content: item.description,
      metadata: {
        createdAt: item.createdAt,
        priority: item.priority,
        size: item.size,
        theme: item.theme,
        important: item.importance > 0.7
      },
      importance: item.importance
    }))
  }, [sortedItems])

  // Get filter counts
  const getFilterCount = (type: ItemType) => {
    if (type === 'all') return allItems.length
    if (type === 'widgets') return allItems.filter(item => item.type === 'widget').length
    if (type === 'notes') return allItems.filter(item => item.type === 'note').length
    if (type === 'conversations') return allItems.filter(item => item.type === 'conversation').length
    if (type === 'crystals') return allItems.filter(item => item.type === 'crystal').length
    if (type === 'shards') return allItems.filter(item => item.type === 'shard').length
    return allItems.filter(item => item.type === type).length
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>

        {/* Filters and View Mode */}
        <div className="flex items-center gap-2">
          {/* Filter Tabs */}
          <div className="flex items-center bg-muted/20 rounded-lg p-1">
            {[
              { type: 'all', label: 'All', context: 'filter.all' },
              { type: 'widgets', label: 'Widgets', context: 'filter.widgets' },
              { type: 'notes', label: 'Notes', context: 'filter.notes' },
              { type: 'conversations', label: 'Chats', context: 'filter.chats' },
              { type: 'crystals', label: 'Crystals', context: 'filter.crystals' },
              { type: 'shards', label: 'Shards', context: 'filter.shards' }
            ].map(({ type, label, context }) => (
              <button
                key={type}
                onClick={() => setFilter(type as ItemType)}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-colors text-sm",
                  filter === type
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <T context={context}>{label}</T>
                <span className="ml-1 text-xs bg-muted/50 px-1.5 py-0.5 rounded-full">
                  {getFilterCount(type as ItemType)}
                </span>
              </button>
            ))}
          </div>

          {/* Sort and View Mode */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
              aria-label="Sort by"
              title="Sort by"
            >
              <option value="importance">Importance</option>
              <option value="recent">Recent</option>
              <option value="name">Name</option>
              <option value="type">Type</option>
            </select>

            <div className="flex items-center bg-muted/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === 'grid' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Grid view"
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === 'list' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="List view"
                title="List view"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid/List */}
      {cardData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">
            <T context="empty.no_items">No items found</T>
          </div>
          <div className="text-sm text-muted-foreground">
            {searchQuery ? <T context="empty.adjust_search">Try adjusting your search</T> : <T context="empty.no_match_filter">No items match the current filter</T>}
          </div>
        </div>
      ) : (
        <div className={cn(
          "transition-all duration-300",
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-3"
        )}>
          {cardData.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ContentCard
                content={card}
                onClick={handleCardClick}
                onAction={card.type === 'widget' ? handleCardAction : undefined}
                actionIcon={card.type === 'widget' ? PlayCircle : undefined}
                actionLabel={card.type === 'widget' ? 'Run widget' : undefined}
                showMetadata={true}
                variant={viewMode === 'list' ? 'compact' : 'default'}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
