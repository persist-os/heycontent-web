// Main component
export { RichTextEditor } from './rich-text-editor'

// Hook
export { useRichTextEditor } from './use-rich-text-editor'

// Types
export type { 
  RichTextEditorProps, 
  NoteLink, 
  PalettePosition, 
  PaletteMode 
} from './rich-text-editor.types'

// Sub-components
export { ContentRenderer } from './content-renderer'
export { NoteLinkCard } from './note-link-card'

// Utilities (if needed by external consumers)
export { 
  extractPrefixedIds, 
  getDisplayContent, 
  getStorageContent 
} from './content-utils'

export { 
  formatText, 
  insertBulletList, 
  insertNumberedList, 
  insertHeading, 
  insertLink, 
  insertLinkEmbed, 
  insertTable,
  getCursorCoordinates
} from './formatting-utils' 