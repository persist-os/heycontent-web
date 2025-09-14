'use client'

import React, { forwardRef, useImperativeHandle, useCallback } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown'
import { $getRoot, EditorState, $createParagraphNode } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { CodeNode, CodeHighlightNode } from '@lexical/code'
import { LinkNode } from '@lexical/link'

import { NoteRefNode } from './nodes/NoteRefNode'
import { useNoteRefPlugin } from './plugins/NoteRefPlugin'
import { CommandPalettePlugin } from './plugins/CommandPalettePlugin'
import { transformers } from './markdown-transformers'

export interface LexicalNotepadEditorRef {
  triggerCommandPalette: () => void
  getContent: () => string
  setContent: (content: string) => void
  hasContent: () => boolean
  clear: () => void
}

interface LexicalNotepadEditorProps {
  content: string
  onContentChange: (content: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  // AI handlers
  onAskAI?: (prompt: string) => Promise<void>
  onRequestAnalysis?: (noteType: string) => Promise<void>
  onRequestIdeas?: () => Promise<void>
  // Note linking
  availableNotes?: Array<{ _id: string; title: string; type: string }>
  onLinkNote?: (noteId: string) => void
  // User context
  userId?: string
  noteType?: string
  containerRef?: React.RefObject<HTMLElement>
  // Refinement props
  onRefineText?: (refinementType: string, text: string) => Promise<string | void>
  onAcceptRefinement?: () => Promise<void>
  onRejectRefinement?: () => Promise<void>
  onRetryRefinement?: () => Promise<string | void>
}

const theme = {
  paragraph: 'mb-2 leading-relaxed',
  text: {
    bold: 'font-semibold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-muted px-1.5 py-0.5 rounded text-sm font-mono',
  },
  heading: {
    h1: 'text-2xl font-bold mb-3',
    h2: 'text-xl font-semibold mb-2',
    h3: 'text-lg font-medium mb-2',
  },
  list: {
    ul: 'list-disc ml-6 mb-2',
    ol: 'list-decimal ml-6 mb-2',
    listitem: 'mb-1',
  },
  link: 'text-blue-600 dark:text-blue-400 hover:underline',
  code: 'bg-muted p-3 rounded-md font-mono text-sm',
  quote: 'border-l-4 border-border pl-4 my-3 text-muted-foreground italic',
}

function onError(error: Error) {
  console.error('Lexical Error:', error)
}

// Internal component that has access to the editor context
function EditorContent({ 
  content, 
  onContentChange, 
  availableNotes,
  onLinkNote,
  onAskAI,
  onRequestAnalysis,
  onRequestIdeas,
  userId,
  noteType,
  containerRef,
  onRefineText,
  onAcceptRefinement,
  onRejectRefinement,
  onRetryRefinement,
  editorRef
}: LexicalNotepadEditorProps & { editorRef: React.RefObject<LexicalNotepadEditorRef> }) {
  const [editor] = useLexicalComposerContext()

  // Get current markdown content
  const getCurrentMarkdown = useCallback(() => {
    return editor.getEditorState().read(() => {
      return $convertToMarkdownString(transformers)
    })
  }, [editor])

  // Handle content changes
  const handleChange = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      const markdown = $convertToMarkdownString(transformers)
      onContentChange(markdown)
    })
  }, [onContentChange])

  // Set initial content
  React.useEffect(() => {
    const currentMarkdown = getCurrentMarkdown()
    
    if (content !== currentMarkdown) {
      editor.update(() => {
        const root = $getRoot()
        root.clear()
        
        if (content && content.trim()) {
          $convertFromMarkdownString(content, transformers)
        } else {
          const paragraph = $createParagraphNode()
          root.append(paragraph)
        }
      })
    }
  }, [content, editor, getCurrentMarkdown])

  // Expose methods to parent
  useImperativeHandle(editorRef, () => ({
    triggerCommandPalette: () => {
      // Will be implemented by CommandPalettePlugin
      editor.dispatchCommand('TRIGGER_COMMAND_PALETTE' as any, undefined)
    },
    getContent: () => getCurrentMarkdown(),
    setContent: (newContent: string) => {
      editor.update(() => {
        const root = $getRoot()
        root.clear()
        
        if (newContent.trim()) {
          $convertFromMarkdownString(newContent, transformers)
        } else {
          const paragraph = $createParagraphNode()
          root.append(paragraph)
        }
      })
    },
    hasContent: () => {
      const markdown = getCurrentMarkdown()
      return markdown.trim().length > 0
    },
    clear: () => {
      editor.update(() => {
        const root = $getRoot()
        root.clear()
        const paragraph = $createParagraphNode()
        root.append(paragraph)
      })
    }
  }), [editor, getCurrentMarkdown])

  // Plugin for note references
  useNoteRefPlugin({ availableNotes, onLinkNote })

  return (
    <>
      <RichTextPlugin
        contentEditable={
          <ContentEditable 
            className="w-full h-full min-h-[300px] p-4 bg-transparent border-0 focus:outline-none resize-none overflow-auto text-foreground selection:bg-blue-200/50 dark:selection:bg-blue-800/50"
            style={{
              fontFamily: 'inherit',
              fontSize: '16px',
              lineHeight: '1.625',
              fontWeight: 'inherit'
            }}
          />
        }
        placeholder={
          <div className="absolute top-4 left-4 text-muted-foreground/50 pointer-events-none">
            Start writing...
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      
      <OnChangePlugin onChange={handleChange} />
      <HistoryPlugin />
      <MarkdownShortcutPlugin transformers={transformers} />
      <ListPlugin />
      <LinkPlugin />
      
      <CommandPalettePlugin
        onAskAI={onAskAI}
        onRequestAnalysis={onRequestAnalysis}
        onRequestIdeas={onRequestIdeas}
        availableNotes={availableNotes}
        onLinkNote={onLinkNote}
        userId={userId}
        noteType={noteType}
        containerRef={containerRef}
        onRefineText={onRefineText}
        onAcceptRefinement={onAcceptRefinement}
        onRejectRefinement={onRejectRefinement}
        onRetryRefinement={onRetryRefinement}
      />
    </>
  )
}

export const LexicalNotepadEditor = forwardRef<LexicalNotepadEditorRef, LexicalNotepadEditorProps>(
  (props, ref) => {
    const { className = '', disabled = false, ...rest } = props
    
    const initialConfig = {
      namespace: 'NotepadEditor',
      theme,
      onError,
      nodes: [
        NoteRefNode,
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        LinkNode,
      ],
      editable: !disabled,
    }

    const editorRef = React.useRef<LexicalNotepadEditorRef>(null)
    
    // Forward ref
    useImperativeHandle(ref, () => editorRef.current!, [])

    return (
      <div className={`relative w-full h-full ${className}`}>
        <LexicalComposer initialConfig={initialConfig}>
          <EditorContent {...rest} editorRef={editorRef} />
        </LexicalComposer>
      </div>
    )
  }
)

LexicalNotepadEditor.displayName = 'LexicalNotepadEditor'
