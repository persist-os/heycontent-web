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

  // Create dropdown options
  const options = [
    {
      value: 'new',
      label: 'Start new note',
      description: 'Create a fresh note',
      icon: <Plus className="w-3.5 h-3.5" />,
      color: 'bg-blue-500/80'
    },
    ...availableNotes.slice(0, maxNotesToShow).map((note, index) => ({
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

  const selectedValue = currentNoteId || 'new'

  return (
    <SharedDropdown
      value={selectedValue}
      options={options}
      onSelect={handleSelect}
      placeholder="Select note"
      isMobile={isMobile}
      width={isMobile ? "w-28" : "w-32"}
      triggerClassName="min-w-0"
    />
  )
}
