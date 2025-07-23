export interface RichTextEditorProps {
  content: string
  onContentChange: (content: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showPreview?: boolean
  onShowPreviewChange?: (show: boolean) => void
  // AI handlers
  onAskAI?: (prompt: string) => Promise<string>
  onRequestAnalysis?: (noteType: string) => Promise<string>
  onRequestIdeas?: () => Promise<string[]>
  // Context
  noteId?: string
  noteTitle?: string
  platform?: string
  tags?: string[]
  userId?: string
  noteType?: string
  // Content linking
  availableNotes?: Array<{ _id: string; title: string; type: string }>
  onLinkNote?: (noteId: string) => void
  onLinkContent?: (prefixedId: string) => void
  // All linkable content for title mapping
  allLinkableContent?: Array<{ id: string; title: string; type: string }>
  // Optional container ref for palette positioning
  containerRef?: React.RefObject<HTMLElement>
}

export interface NoteLink {
  _id: string
  title: string
  type: string
}

export interface PalettePosition {
  top: number
  left: number
}

export type PaletteMode = 'commands' | 'notes' 