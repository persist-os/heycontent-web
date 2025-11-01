/**
 * FIELD EDITOR
 * 
 * Universal field editor for inline editing in artifacts.
 * Supports text, select, badge, and number field types.
 * 
 * Design Spec: Dashed underline for editable fields
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Check, X } from 'lucide-react'

interface FieldEditorProps {
  value: any
  type: 'text' | 'select' | 'badge' | 'number'
  options?: string[]
  editable: boolean
  onSave: (value: any) => void
  className?: string
}

export function FieldEditor({
  value,
  type,
  options = [],
  editable,
  onSave,
  className = ''
}: FieldEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  // Read-only or non-editable display
  if (!editable || !isEditing) {
    const displayClass = editable
      ? `cursor-pointer border-b border-dashed border-primary/40 hover:border-primary/60 transition-colors ${className}`
      : className

    return (
      <div onClick={() => editable && setIsEditing(true)}>
        {type === 'badge' ? (
          <Badge variant="outline" className={displayClass}>
            {value}
          </Badge>
        ) : (
          <span className={displayClass}>{value}</span>
        )}
      </div>
    )
  }

  // Editing mode
  return (
    <div className="flex items-center gap-2">
      {type === 'select' ? (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="px-2 py-1 text-sm bg-primary/5 border border-primary/40 rounded-md ring-2 ring-primary/50 focus:outline-none"
          autoFocus
          aria-label="Edit field value"
          title="Select a value"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          ref={inputRef}
          type={type === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="px-2 py-1 text-sm bg-primary/5 border border-primary/40 rounded-md ring-2 ring-primary/50 focus:outline-none"
          aria-label="Edit field value"
          placeholder="Enter value"
        />
      )}
      
      <button
        onClick={handleSave}
        className="p-1 hover:bg-green-500/10 rounded transition-colors"
        title="Save (Enter)"
      >
        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
      </button>
      
      <button
        onClick={handleCancel}
        className="p-1 hover:bg-red-500/10 rounded transition-colors"
        title="Cancel (Esc)"
      >
        <X className="w-4 h-4 text-red-600 dark:text-red-400" />
      </button>
    </div>
  )
}

