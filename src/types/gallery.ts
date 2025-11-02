/**
 * UNIFIED GALLERY SYSTEM TYPES
 * 
 * Type-safe interfaces for the unified gallery showing BOTH artifacts and widgets together.
 * Items contain an itemType property to distinguish between types.
 */

/**
 * Gallery item type indicator
 */
export type ItemType = 'artifact' | 'widget'

/**
 * Unified gallery item (artifacts and widgets together)
 */
export interface GalleryItem {
  _id: string
  itemType: ItemType  // Identifies whether this is an artifact or widget
  title: string
  description: string
  updatedAt: number
  [key: string]: any  // Allow additional type-specific properties
}

/**
 * Props for UnifiedGalleryView component
 */
export interface UnifiedGalleryViewProps {
  projectId: string
  initialItemId: string
  items: GalleryItem[]
  onClose: () => void
}

