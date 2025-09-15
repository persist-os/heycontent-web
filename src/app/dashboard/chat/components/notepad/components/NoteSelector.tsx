'use client'

import React from 'react'
import { Plus, FileText } from 'lucide-react'
import { SharedDropdown } from './SharedDropdown'
import type { Id } from "@/convex/_generated/dataModel"

interface NoteSelectorProps {
  currentNoteId: string | Id<"notes"> | null
  availableNotes: Array<{ _id: string; title: string; type: string }>
  onCreateNew: () => void
  onSwitchNote: (noteId: string) => void
  isMobile?: boolean
}

export function NoteSelector({ 
  currentNoteId, 
  availableNotes, 
  onCreateNew, 
  onSwitchNote,
  isMobile = false 
}: NoteSelectorProps) {
  const maxNotesToShow = isMobile ? 6 : 8

  // Ensure the current note is always included in the options
  const notesToShow = React.useMemo(() => {
    const currentNoteIdStr = currentNoteId ? String(currentNoteId) : null
    
    // Find current note
    const currentNote = currentNoteIdStr ? availableNotes.find(note => note._id === currentNoteIdStr) : null
    
    // Get other notes (excluding current)
    const otherNotes = availableNotes.filter(note => note._id !== currentNoteIdStr)
    
    // Build final list: current note first (if exists), then others up to limit
    const result = []
    if (currentNote) {
      result.push(currentNote)
    }
    
    const remainingSlots = maxNotesToShow - result.length
    result.push(...otherNotes.slice(0, remainingSlots))
    
    return result
  }, [availableNotes, currentNoteId, maxNotesToShow])

  // Create dropdown options
  const options = [
    {
      value: 'new',
      label: 'Start new note',
      description: 'Create a fresh note',
      icon: <Plus className="w-3.5 h-3.5" />,
      color: 'bg-blue-500/80'
    },
    ...notesToShow.map((note, index) => ({
      value: note._id,
      label: note.title || 'Untitled',
      description: note.type?.replace('_', ' ') || 'idea bank',
      icon: <FileText className="w-3.5 h-3.5" />,
      color: index % 3 === 0 ? 'bg-blue-500/80' : 
             index % 3 === 1 ? 'bg-purple-500/80' : 
             'bg-green-500/80'
    }))
  ]

  const handleSelect = (value: string) => {
    if (value === 'new') {
      onCreateNew()
    } else {
      onSwitchNote(value)
    }
  }

  // Ensure currentNoteId is properly converted to string for comparison
  const selectedValue = currentNoteId ? String(currentNoteId) : 'new'

  return (
    <SharedDropdown
      value={selectedValue}
      options={options}
      onSelect={handleSelect}
      placeholder="Select note"
      isMobile={isMobile}
      width={isMobile ? "w-36 max-w-36" : "w-44 max-w-44 lg:w-48 lg:max-w-48"}
      triggerClassName="min-w-0 flex-shrink-0 h-8"
    />
  )
}
