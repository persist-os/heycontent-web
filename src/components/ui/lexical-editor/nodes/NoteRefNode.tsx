'use client'

import {
  DecoratorNode,
  NodeKey,
  LexicalNode,
  EditorConfig,
  LexicalEditor,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import React from 'react'

export interface NoteRefNodePayload {
  noteId: string
  noteTitle?: string
}

export type SerializedNoteRefNode = Spread<
  {
    noteId: string
    noteTitle?: string
    type: 'note-ref'
    version: 1
  },
  SerializedLexicalNode
>

export class NoteRefNode extends DecoratorNode<React.ReactElement> {
  __noteId: string
  __noteTitle?: string

  static getType(): string {
    return 'note-ref'
  }

  static clone(node: NoteRefNode): NoteRefNode {
    return new NoteRefNode(node.__noteId, node.__noteTitle, node.__key)
  }

  constructor(noteId: string, noteTitle?: string, key?: NodeKey) {
    super(key)
    this.__noteId = noteId
    this.__noteTitle = noteTitle
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = 'note-ref-wrapper'
    return span
  }

  updateDOM(): false {
    return false
  }

  getNoteId(): string {
    return this.__noteId
  }

  getNoteTitle(): string | undefined {
    return this.__noteTitle
  }

  setNoteTitle(title: string): void {
    const writable = this.getWritable()
    writable.__noteTitle = title
  }

  static importJSON(serializedNode: SerializedNoteRefNode): NoteRefNode {
    const { noteId, noteTitle } = serializedNode
    return $createNoteRefNode(noteId, noteTitle)
  }

  static importDOM(): null {
    return null
  }

  exportJSON(): SerializedNoteRefNode {
    return {
      noteId: this.__noteId,
      noteTitle: this.__noteTitle,
      type: 'note-ref',
      version: 1,
    }
  }

  getTextContent(): string {
    return `@[note:${this.__noteId}]@`
  }

  decorate(): React.ReactElement {
    return (
      <NoteRefComponent 
        noteId={this.__noteId} 
        noteTitle={this.__noteTitle}
        nodeKey={this.__key}
      />
    )
  }

  isInline(): true {
    return true
  }

  isKeyboardSelectable(): false {
    return false
  }
}

interface NoteRefComponentProps {
  noteId: string
  noteTitle?: string
  nodeKey: NodeKey
}

function NoteRefComponent({ noteId, noteTitle, nodeKey }: NoteRefComponentProps) {
  const displayText = noteTitle || `Note ${noteId.slice(0, 8)}`

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Could dispatch an event or call a callback to handle note opening
    console.log('Note reference clicked:', noteId)
    
    // For now, just prevent interaction
    // In a full implementation, this could open the note in a modal or navigate to it
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-sm font-medium cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
      onClick={handleClick}
      contentEditable={false}
      suppressContentEditableWarning={true}
    >
      <span className="text-xs opacity-60">@</span>
      {displayText}
    </span>
  )
}

export function $createNoteRefNode(noteId: string, noteTitle?: string): NoteRefNode {
  return new NoteRefNode(noteId, noteTitle)
}

export function $isNoteRefNode(node: LexicalNode | null | undefined): node is NoteRefNode {
  return node instanceof NoteRefNode
}
