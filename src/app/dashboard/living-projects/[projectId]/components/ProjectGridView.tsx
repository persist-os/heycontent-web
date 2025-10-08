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
  onWidgetRun?: (widgetId: string) => void
  runningWidgetId?: string | null
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
  onWidgetRun,
  runningWidgetId,
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
      createdAt: widget.created_at || Date.now(),
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

  // Get type-specific styling
  const getTypeStyling = (type: string) => {
    switch (type) {
      case 'widget':
        return {
          icon: PlayCircle,
          bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-700 dark:text-blue-300',
          iconColor: 'text-blue-600'
        }
      case 'note':
        return {
          icon: FileText,
          bgGradient: 'from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-700 dark:text-green-300',
          iconColor: 'text-green-600'
        }
      case 'conversation':
        return {
          icon: MessageCircle,
          bgGradient: 'from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          textColor: 'text-purple-700 dark:text-purple-300',
          iconColor: 'text-purple-600'
        }
      case 'crystal':
        return {
          icon: Gem,
          bgGradient: 'from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
          textColor: 'text-amber-700 dark:text-amber-300',
          iconColor: 'text-amber-600'
        }
      case 'shard':
        return {
          icon: Sparkles,
          bgGradient: 'from-rose-50 to-rose-100 dark:from-rose-950/20 dark:to-rose-900/20',
          borderColor: 'border-rose-200 dark:border-rose-800',
          textColor: 'text-rose-700 dark:text-rose-300',
          iconColor: 'text-rose-600'
        }
      default:
        return {
          icon: FileText,
          bgGradient: 'from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          textColor: 'text-gray-700 dark:text-gray-300',
          iconColor: 'text-gray-600'
        }
    }
  }

  // Handle item click
  const handleItemClick = (item: any) => {
    if (item.type === 'widget') {
      onWidgetClick(item.data)
    } else {
      handleContentOpen(item.id, item.type)
    }
  }

  // Handle content opening
  const handleContentOpen = (id: string, type: string) => {
    try {
      switch (type) {
        case 'note':
          router.push(`/dashboard/thinking_lab?noteId=${id}`)
          break
        case 'conversation':
          router.push(`/dashboard/thinking_lab?conversationId=${id}`)
          break
        case 'crystal':
          router.push(`/dashboard/crystals?crystalId=${id}`)
          break
        case 'shard':
          router.push(`/dashboard/crystals?shardId=${id}`)
          break
      }
      onContentOpen(id, type)
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }

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
              { type: 'all', label: 'All' },
              { type: 'widgets', label: 'Widgets' },
              { type: 'notes', label: 'Notes' },
              { type: 'conversations', label: 'Chats' },
              { type: 'crystals', label: 'Crystals' },
              { type: 'shards', label: 'Shards' }
            ].map(({ type, label }) => (
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
                {label}
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
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === 'list' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid/List */}
      {sortedItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">No items found</div>
          <div className="text-sm text-muted-foreground">
            {searchQuery ? 'Try adjusting your search' : 'No items match the current filter'}
          </div>
        </div>
      ) : (
        <div className={cn(
          "transition-all duration-300",
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-3"
        )}>
          {sortedItems.map((item, index) => {
            const styling = getTypeStyling(item.type)
            const Icon = styling.icon

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "group cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                  viewMode === 'grid' ? "h-fit" : "flex items-center gap-4 p-4"
                )}
                onClick={() => handleItemClick(item)}
              >
                <div className={cn(
                  "relative rounded-lg border backdrop-blur-sm transition-all duration-200 hover:shadow-md",
                  `bg-gradient-to-br ${styling.bgGradient}`,
                  styling.borderColor,
                  viewMode === 'grid' ? "p-4 h-full" : "flex-1 p-4"
                )}>
                  {/* Header */}
                  <div className={cn(
                    "flex items-start gap-3",
                    viewMode === 'list' && "flex-row items-center"
                  )}>
                    <div className={cn(
                      "rounded-md bg-background/50 flex-shrink-0",
                      styling.iconColor,
                      viewMode === 'grid' ? "p-2" : "p-1.5"
                    )}>
                      <Icon className={cn(viewMode === 'grid' ? "w-5 h-5" : "w-4 h-4")} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={cn(
                          "font-medium truncate",
                          styling.textColor,
                          viewMode === 'grid' ? "text-base" : "text-sm"
                        )}>
                          {item.title}
                        </h3>
                        
                        {item.type === 'widget' && onWidgetRun && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onWidgetRun(item.id)
                            }}
                            disabled={runningWidgetId === item.id}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background/50 rounded"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <p className={cn(
                        "text-sm mt-1 line-clamp-2",
                        styling.textColor + '/80'
                      )}>
                        {item.description}
                      </p>
                      
                      {/* Metadata */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          `bg-gradient-to-r ${styling.bgGradient}`,
                          styling.textColor
                        )}>
                          {item.type}
                        </span>
                        
                        {item.type === 'widget' && (
                          <span className="text-xs text-muted-foreground">
                            Priority {item.priority}
                          </span>
                        )}
                        
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
