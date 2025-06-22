import React from 'react'
import { FileText } from 'lucide-react'

interface NotepadToggleProps {
  isOpen: boolean
  onClick: () => void
  className?: string
}

export function NotepadToggle({ isOpen, onClick, className = '' }: NotepadToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? "Close markdown notepad" : "Open markdown notepad"}
      title={isOpen ? "Close markdown notepad" : "Open markdown notepad"}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 
        text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
        hover:bg-gray-100 dark:hover:bg-gray-700
        ${isOpen ? 'bg-gray-100 dark:bg-gray-700' : ''}
        ${className}`}
    >
      <FileText className="w-3.5 h-3.5" />
    </button>
  )
} 