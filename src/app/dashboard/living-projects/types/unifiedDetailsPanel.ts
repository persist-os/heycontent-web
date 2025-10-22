/**
 * UNIFIED DETAILS PANEL TYPES
 * 
 * Centralized type definitions for the unified details panel system
 * that handles widgets, notes, conversations, crystals, and shards.
 */

import { LucideIcon } from 'lucide-react'

/**
 * Supported item types for the unified panel
 */
export type DetailItemType = 'widget' | 'note' | 'conversation' | 'crystal' | 'shard'

/**
 * Available tabs in the expanded panel view
 */
export type TabType = 'overview' | 'metadata' | 'actions' | 'activity'

/**
 * Available action types for different items
 */
export type ActionType = 'run' | 'edit' | 'delete' | 'openFull' | 'launch' | 'view'

/**
 * Panel instance representing a single open panel
 */
export interface PanelInstance {
  /** Unique identifier for this panel instance */
  id: string
  /** The item being displayed (widget, note, etc.) */
  item: any
  /** Type of item being displayed */
  itemType: DetailItemType
  /** Panel position on screen */
  position: { x: number; y: number }
  /** Whether the panel is pinned (stays open) */
  isPinned: boolean
  /** Whether the panel is expanded or collapsed */
  isExpanded: boolean
  /** Panel dimensions */
  size: { width: number; height: number }
}

/**
 * Configuration for each item type's presentation
 */
export interface TypeConfig {
  /** Icon component to display */
  icon: LucideIcon
  /** Background gradient classes */
  bgGradient: string
  /** Border color classes */
  borderColor: string
  /** Accent color classes */
  accentColor: string
  /** Text color classes */
  textColor: string
  /** Icon color classes */
  iconColor: string
  /** Pulse color for animations */
  pulseColor: string
  /** Available tabs for this type */
  tabs: TabType[]
  /** Available actions for this type */
  actions: ActionType[]
  /** Display label */
  label: string
}

/**
 * Tab configuration
 */
export interface TabConfig {
  id: TabType
  label: string
  subtitle: string
}

/**
 * Props for UnifiedDetailsPanel component
 */
export interface UnifiedDetailsPanelProps {
  /** Array of open panel instances */
  instances: PanelInstance[]
  /** Callback to update a panel instance */
  onInstanceUpdate: (id: string, updates: Partial<PanelInstance>) => void
  /** Callback to close a panel instance */
  onInstanceClose: (id: string) => void
  /** Current project ID */
  projectId: string
  /** User ID for actions */
  userId?: string
}

/**
 * Props for CollapsedView component
 */
export interface CollapsedViewProps {
  instance: PanelInstance
  config: TypeConfig
  onExpand: () => void
}

/**
 * Props for ExpandedView component
 */
export interface ExpandedViewProps {
  instance: PanelInstance
  config: TypeConfig
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  onClose: () => void
  onPin: () => void
  onResize: (size: { width: number; height: number }) => void
  children: React.ReactNode
}

/**
 * Props for tab content components
 */
export interface TabContentProps {
  item: any
  itemType: DetailItemType
  config: TypeConfig
  projectId: string
  onClose: () => void
}

/**
 * Metadata field definition
 */
export interface MetadataField {
  label: string
  value: string | number
  icon: LucideIcon
}

