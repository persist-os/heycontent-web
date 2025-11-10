'use client'

import React, { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { ChevronRight, Copy, Save } from 'lucide-react'
import { toast } from 'sonner'

interface NotepadPanelProps {
  userId: string
  projectId?: string
  isOpen: boolean
  onToggle: () => void
}

export function NotepadPanel({
  userId,
  projectId,
  isOpen,
  onToggle
}: NotepadPanelProps) {
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  const createNote = useMutation(api.notesMutations.createNote)
  
  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Note is empty', {
        description: 'Please write something before saving'
      })
      return
    }
    
    setIsSaving(true)
    try {
      await createNote({
        userId,
        projectId: projectId || undefined,
        title: content.split('\n')[0].slice(0, 50) || 'Quick Note',
        content,
        type: 'idea_bank'
      })
      
      setContent('')
      toast.success('Note saved!', {
        description: projectId 
          ? 'Linked to current project' 
          : 'Saved to your notes'
      })
    } catch (error) {
      toast.error('Failed to save note', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleCopy = () => {
    if (!content.trim()) return
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard!', {
      description: 'Note content copied'
    })
  }
  
  // Collapsed state
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="w-[40px] h-full bg-card border-l border-border flex items-center justify-center hover:bg-muted transition-colors"
        title="Open notepad"
      >
        <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground [writing-mode:vertical-lr] rotate-180">
          <ChevronRight className="w-4 h-4 rotate-90" />
          <span>Notepad</span>
        </div>
      </button>
    )
  }
  
  // Expanded state
  return (
    <div className="w-[320px] h-full bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">Notepad</h3>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Editor */}
      <div className="flex-1 p-4 overflow-y-auto">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Take notes while you work..."
          className="w-full h-full bg-transparent resize-none outline-none text-sm leading-relaxed placeholder:text-muted-foreground"
        />
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        {projectId && (
          <div className="text-xs text-muted-foreground mb-2">
            💡 Note will be linked to current project
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopy}
            disabled={!content.trim()}
            className="flex-1 gap-2"
          >
            <Copy className="w-3 h-3" />
            Copy
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={isSaving || !content.trim()}
            className="flex-1 gap-2"
          >
            <Save className="w-3 h-3" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

