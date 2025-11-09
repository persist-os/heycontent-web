/**
 * UNIFIED PANEL CONFIGURATION
 * 
 * Type-specific configurations and constants for the unified details panel.
 * Consolidates styling and behavior from WidgetDetailsPanel and ContentDetailsPanel.
 */

import {
  FileText,
  MessageCircle,
  Gem,
  Sparkles,
  Zap,
  Box
} from 'lucide-react'
import {
  TypeConfig,
  TabConfig,
  DetailItemType,
  TabType
} from '@/app/dashboard/living-projects/types/unifiedDetailsPanel'

/**
 * Tab configurations with labels and subtitles
 */
export const TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', subtitle: 'Content & Description' },
  { id: 'metadata', label: 'Metadata', subtitle: 'Stats & Properties' },
  { id: 'actions', label: 'Actions', subtitle: 'Edit & Manage' },
  { id: 'activity', label: 'Activity', subtitle: 'History & Timeline' }
]

/**
 * Type-specific configurations for all supported item types
 * Consolidated from ContentDetailsPanel.tsx and WidgetDetailsPanel.tsx
 */
export const TYPE_CONFIGS: Record<DetailItemType, TypeConfig> = {
  widget: {
    icon: Zap,
    bgGradient: 'from-orange-500/10 via-amber-400/5 to-yellow-500/10',
    borderColor: 'border-orange-500/20',
    accentColor: 'bg-orange-500/20',
    textColor: 'text-orange-900 dark:text-orange-100',
    iconColor: 'text-orange-600 dark:text-orange-400',
    pulseColor: 'bg-orange-400',
    tabs: ['overview', 'metadata', 'actions', 'activity'],
    actions: ['run', 'openFull', 'edit', 'delete'],
    label: 'Widget'
  },
  note: {
    icon: FileText,
    bgGradient: 'from-blue-500/10 via-sky-400/5 to-cyan-500/10',
    borderColor: 'border-blue-500/20',
    accentColor: 'bg-blue-500/20',
    textColor: 'text-blue-900 dark:text-blue-100',
    iconColor: 'text-blue-600 dark:text-blue-400',
    pulseColor: 'bg-blue-400',
    tabs: ['overview', 'metadata', 'actions', 'activity'],
    actions: ['openFull', 'edit', 'delete'],
    label: 'Note'
  },
  conversation: {
    icon: MessageCircle,
    bgGradient: 'from-emerald-500/10 via-teal-400/5 to-green-500/10',
    borderColor: 'border-emerald-500/20',
    accentColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    pulseColor: 'bg-emerald-400',
    tabs: ['overview', 'metadata', 'actions', 'activity'],
    actions: ['openFull', 'edit', 'delete'],
    label: 'Conversation'
  },
  crystal: {
    icon: Gem,
    bgGradient: 'from-violet-500/10 via-purple-400/5 to-fuchsia-500/10',
    borderColor: 'border-violet-500/20',
    accentColor: 'bg-violet-500/20',
    textColor: 'text-violet-900 dark:text-violet-100',
    iconColor: 'text-violet-600 dark:text-violet-400',
    pulseColor: 'bg-violet-400',
    tabs: ['overview', 'metadata', 'activity'],
    actions: ['openFull', 'view'],
    label: 'Crystal'
  },
  shard: {
    icon: Sparkles,
    bgGradient: 'from-amber-500/10 via-orange-400/5 to-yellow-500/10',
    borderColor: 'border-amber-500/20',
    accentColor: 'bg-amber-500/20',
    textColor: 'text-amber-900 dark:text-amber-100',
    iconColor: 'text-amber-600 dark:text-amber-400',
    pulseColor: 'bg-amber-400',
    tabs: ['overview', 'metadata', 'activity'],
    actions: ['openFull', 'view'],
    label: 'Shard'
  },
  artifact: {
    icon: Box,
    bgGradient: 'from-indigo-500/10 via-blue-400/5 to-purple-500/10',
    borderColor: 'border-indigo-500/20',
    accentColor: 'bg-indigo-500/20',
    textColor: 'text-indigo-900 dark:text-indigo-100',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    pulseColor: 'bg-indigo-400',
    tabs: ['overview', 'metadata', 'activity'],
    actions: ['openFull', 'view'],
    label: 'Artifact'
  }
}

/**
 * Default panel sizes
 */
export const DEFAULT_SIZES = {
  collapsed: { width: 280, height: 80 },
  expanded: { width: 600, height: 500 }
}

/**
 * Size constraints for resize
 */
export const SIZE_CONSTRAINTS = {
  minWidth: 480,
  maxWidth: 1200,
  minHeight: 400,
  maxHeight: 1000
}

/**
 * Get title for any item type
 */
export function getItemTitle(item: any, itemType: DetailItemType): string {
  switch (itemType) {
    case 'widget':
      return item.title || 'Untitled Widget'
    case 'note':
      return item.title || 'Untitled Note'
    case 'conversation':
      return item.title || 'Thinking Session'
    case 'crystal':
      return item.name || 'Unnamed Pattern'
    case 'shard':
      return item.dimension ? `${item.dimension} Shard` : 'Quantum Fragment'
    case 'artifact':
      return item.title || item.artifactType || item.type || 'Artifact'
  }
}

/**
 * Get subtitle/status for any item type
 */
export function getItemSubtitle(item: any, itemType: DetailItemType): string {
  switch (itemType) {
    case 'widget':
      return `${item.widget_type} • ${item.category || 'widget'}`
    case 'note':
      return item.type || 'note'
    case 'conversation':
      return `${item.messageCount || 0} messages`
    case 'crystal':
      return item.crystal_type || 'pattern'
    case 'shard':
      return item.dimension || 'fragment'
    case 'artifact':
      return item.artifactType || item.type || 'structured data'
  }
}

/**
 * Get content preview for any item type
 */
export function getItemPreview(item: any, itemType: DetailItemType): string {
  switch (itemType) {
    case 'widget':
      return item.description || 'No description'
    case 'note':
      return item.content?.substring(0, 200) || 'Empty note'
    case 'conversation':
      return item.messages?.[0]?.content?.substring(0, 200) || 'No messages yet'
    case 'crystal':
      return item.core_insight || item.detailed_analysis?.substring(0, 200) || 'Forming...'
    case 'shard':
      return item.exact_quote || item.what_it_reveals || 'No content'
    case 'artifact':
      const dataPreview = JSON.stringify(item.artifactData || item.data)?.substring(0, 200)
      return dataPreview || 'Structured data artifact'
  }
}

