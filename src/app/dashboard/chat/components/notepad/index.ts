// Main component
export { MarkdownNotepad } from './MarkdownNotepad'

// Types
export type { 
  MarkdownNotepadProps, 
  MarkdownNotepadRef,
  NotepadState,
  AIHandlers,
  NoteHandlers,
  NotepadRefs
} from './types'

// Sub-components (in case they need to be used independently)
export { NoteSelector } from './components/NoteSelector'
export { SimpleTypeSelector } from './components/SimpleTypeSelector'
export { SharedDropdown } from './components/SharedDropdown'
export { ActionButtons } from './components/ActionButtons'
export { NotepadHeader } from './components/NotepadHeader'
export { MobileNotepadLayout } from './components/MobileNotepadLayout'
export { DesktopNotepadLayout } from './components/DesktopNotepadLayout'

// Hooks (in case they need to be used independently)
export { useNotepadState } from './hooks/useNotepadState'
export { useNotepadHandlers } from './hooks/useNotepadHandlers'
export { useNotepadAI } from './hooks/useNotepadAI'

// Utilities
export { buildNoteUpdate, validateNoteUpdate } from './types'
