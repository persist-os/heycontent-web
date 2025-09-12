'use client'

import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  CODE,
  HEADING,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  LINK,
  ORDERED_LIST,
  QUOTE,
  STRIKETHROUGH,
  UNORDERED_LIST,
} from '@lexical/markdown'
import type { Transformer } from '@lexical/markdown'
import { $createNoteRefNode, NoteRefNode } from './nodes/NoteRefNode'
import { $createTextNode } from 'lexical'

// Custom transformer for note references
const NOTE_REF: Transformer = {
  dependencies: [NoteRefNode],
  export: (node) => {
    if (node instanceof NoteRefNode) {
      return `@[note:${node.getNoteId()}]@`
    }
    return null
  },
  importRegExp: /@\[note:([^\]]+)\]@/,
  regExp: /@\[note:([^\]]+)\]@/,
  replace: (textNode, match) => {
    const [, noteId] = match
    const noteRefNode = $createNoteRefNode(noteId)
    textNode.replace(noteRefNode)
  },
  trigger: '@',
  type: 'text-match',
}

// Export all transformers including the custom note reference transformer
export const transformers: Transformer[] = [
  // Custom transformers first
  NOTE_REF,
  
  // Standard markdown transformers
  HEADING,
  QUOTE,
  CODE,
  UNORDERED_LIST,
  ORDERED_LIST,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  LINK,
]
