/**
 * FINGERPRINT EDITABLE FIELDS
 * Reusable components for editing fingerprint fields
 */

'use client'

import React from 'react'
import { X } from 'lucide-react'
import { T } from '@/components/translation/T'

interface EditableTextFieldProps {
  value: string
  onChange: (value: string) => void
  isEditing: boolean
  placeholder?: string
  rows?: number
  className?: string
}

export const EditableTextField = ({ 
  value, 
  onChange, 
  isEditing, 
  placeholder, 
  rows = 2,
  className = "text-sm"
}: EditableTextFieldProps) => {
  // Calculate min-height to match display mode
  const minHeight = rows === 1 ? '1.5rem' : rows === 2 ? '3rem' : `${rows * 1.5}rem`
  
  if (isEditing) {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${className} leading-relaxed bg-muted/20 border border-border/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none`}
        rows={rows}
        placeholder={placeholder}
        style={{ minHeight }}
      />
    )
  }
  return (
    <p 
      className={`${className} leading-relaxed text-muted-foreground/80`}
      style={{ minHeight }}
    >
      {value}
    </p>
  )
}

interface EditableArrayFieldProps {
  values: string[]
  onChange: (values: string[]) => void
  isEditing: boolean
  placeholder?: string
}

export const EditableArrayField = ({
  values,
  onChange,
  isEditing,
  placeholder
}: EditableArrayFieldProps) => {
  if (isEditing) {
    return (
      <div className="space-y-2">
        {values.length === 0 ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value=""
              onChange={(e) => onChange([e.target.value])}
              className="flex-1 text-sm bg-muted/20 border border-border/30 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              placeholder={placeholder}
            />
          </div>
        ) : (
          <>
            {values.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newValues = [...values]
                    newValues[idx] = e.target.value
                    onChange(newValues)
                  }}
                  className="flex-1 text-sm bg-muted/20 border border-border/30 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  placeholder={placeholder}
                />
                <button
                  onClick={() => onChange(values.filter((_, i) => i !== idx))}
                  className="text-muted-foreground/40 hover:text-foreground transition-colors flex-shrink-0"
                  aria-label="Remove item"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => onChange([...values, ''])}
              className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              + <T context="fingerprint.editable.add_item">Add item</T>
            </button>
          </>
        )}
      </div>
    )
  }
  
  return (
    <div className="space-y-2 min-h-[2rem]">
      {values.map((item, idx) => (
        <div key={idx} className="flex items-start gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60 mt-1.5 flex-shrink-0" />
          <span className="text-sm text-foreground/80">{item}</span>
        </div>
      ))}
    </div>
  )
}
