'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertNodes, $getSelection, $isRangeSelection, TextNode, $createTextNode } from 'lexical'
import { useEffect } from 'react'
import { $createNoteRefNode, NoteRefNode } from '../nodes/NoteRefNode'

interface UseNoteRefPluginProps {
  availableNotes?: Array<{ _id: string; title: string; type: string }>
  onLinkNote?: (noteId: string) => void
}

export function useNoteRefPlugin({ availableNotes = [], onLinkNote }: UseNoteRefPluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Register command to insert note reference
    const unregisterCommand = editor.registerCommand(
      'INSERT_NOTE_REF' as any,
      (payload: { noteId: string; noteTitle?: string }) => {
        const selection = $getSelection()
        
        if ($isRangeSelection(selection)) {
          const { noteId, noteTitle } = payload
          const noteRefNode = $createNoteRefNode(noteId, noteTitle)
          $insertNodes([noteRefNode])
          
          // Call the callback if provided
          if (onLinkNote) {
            onLinkNote(noteId)
          }
        }
        
        return true
      },
      1 // Priority
    )

    return unregisterCommand
  }, [editor, onLinkNote])

  useEffect(() => {
    // Register transform to convert @[note:id]@ text to NoteRefNode
    const removeTransform = editor.registerNodeTransform(
      TextNode,
      (textNode: TextNode) => {
        const text = textNode.getTextContent()
        const noteRefRegex = /@\[note:([^\]]+)\]@/g
        
        let match
        const matches: Array<{ start: number; end: number; noteId: string }> = []
        
        while ((match = noteRefRegex.exec(text)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            noteId: match[1]
          })
        }
        
        if (matches.length > 0) {
          // Split the text node and insert note references
          matches.reverse().forEach(({ start, end, noteId }) => {
            // Find the note title if available
            const note = availableNotes.find(n => n._id === noteId)
            const noteTitle = note?.title
            
            // Split the text node
            const beforeText = text.substring(0, start)
            const afterText = text.substring(end)
            
            // Create new nodes
            const beforeNode = beforeText ? $createTextNode(beforeText) : null
            const noteRefNode = $createNoteRefNode(noteId, noteTitle)
            const afterNode = afterText ? $createTextNode(afterText) : null
            
            // Replace the text node
            if (beforeNode) textNode.insertBefore(beforeNode)
            textNode.insertBefore(noteRefNode)
            if (afterNode) textNode.insertBefore(afterNode)
            
            textNode.remove()
          })
        }
      }
    )

    return removeTransform
  }, [editor, availableNotes])

  return null
}
