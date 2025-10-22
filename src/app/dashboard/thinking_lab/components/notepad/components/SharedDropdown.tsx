'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

interface DropdownOption {
  value: string
  label: string | React.ReactNode
  description?: string | React.ReactNode
  color?: string
  icon?: React.ReactNode
  isSelected?: boolean
}

interface SharedDropdownProps {
  value: string
  options: DropdownOption[]
  onSelect: (value: string) => void
  placeholder?: string | React.ReactNode
  disabled?: boolean
  isMobile?: boolean
  className?: string
  triggerClassName?: string
  width?: string
}

export function SharedDropdown({
  value,
  options,
  onSelect,
  placeholder = "Select...",
  disabled = false,
  isMobile = false,
  className = "",
  triggerClassName = "",
  width = "w-auto"
}: SharedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  const handleToggle = () => {
    if (disabled) return
    
    if (!isOpen && buttonRef.current) {
      // Anti-corporate design: More thoughtful positioning with gentle spacing
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Progressive dropdown sizing based on screen real estate
      const dropdownWidth = viewportWidth < 640 ? 288 : viewportWidth < 1024 ? 320 : 352 // w-72/w-80/w-88
      
      let left = rect.left + window.scrollX
      let top = rect.bottom + window.scrollY + 6 // Slightly more breathing room
      
      // Elegant overflow prevention with generous margins
      if (left + dropdownWidth > viewportWidth) {
        left = Math.max(12, viewportWidth - dropdownWidth - 12) // 12px margin from edge
      }
      
      // Graceful vertical positioning
      if (top + 350 > viewportHeight + window.scrollY) { // More generous height estimate
        top = rect.top + window.scrollY - 350 - 6 // Show above with matching spacing
      }
      
      setDropdownPosition({ top, left })
    }
    
    setIsOpen(!isOpen)
  }

  const handleOptionSelect = (optionValue: string) => {
    onSelect(optionValue)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isInsideButton = buttonRef.current?.contains(target)
      const isInsideDropdown = dropdownRef.current?.contains(target)
      
      if (!isInsideButton && !isInsideDropdown) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 10)
      
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  // Anti-corporate: Progressive sizing that adapts to screen real estate
  const dropdownWidth = (() => {
    if (typeof window !== 'undefined') {
      const vw = window.innerWidth
      if (vw < 640) return 'w-72'
      if (vw < 1024) return 'w-80'
      return 'w-88'
    }
    return isMobile ? 'w-72' : 'w-80'
  })()

  return (
    <>
      <div className={`relative ${width} ${className}`}>
        <button
          ref={buttonRef}
          onClick={handleToggle}
          disabled={disabled}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[hsl(var(--notepad-icon))] hover:text-foreground bg-transparent hover:bg-black/5 dark:hover:bg-white/5 rounded-md border border-[hsl(var(--notepad-border))] transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 h-8 max-h-8 w-full max-w-full overflow-hidden ${triggerClassName}`}
        >
          {selectedOption?.color && (
            <div className={`w-2.5 h-2.5 rounded-full ${selectedOption.color} transition-all duration-200 flex-shrink-0`} />
          )}
          {selectedOption?.icon && (
            <div className="flex-shrink-0">
              {selectedOption.icon}
            </div>
          )}
          
          {/* Text with controlled overflow */}
          <div className="flex-1 min-w-0 text-left overflow-hidden">
            <span className="tracking-wide truncate block leading-tight">
              {selectedOption?.label || placeholder}
            </span>
          </div>
          
          <ChevronDown className={`w-3 h-3 transition-all duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-foreground' : 'text-[hsl(var(--notepad-icon))]/60'}`} />
        </button>
      </div>
      
      {/* Dropdown */}
      {typeof window !== 'undefined' && isOpen && (
        createPortal(
          <div
            ref={dropdownRef}
            className={`fixed ${dropdownWidth} border border-[hsl(var(--notepad-border))] rounded-xl shadow-2xl z-[9999] backdrop-blur-md bg-[hsl(var(--notepad-header-bg))] overflow-hidden`}
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleOptionSelect(option.value)
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group border border-transparent hover:bg-black/5 dark:hover:bg-white/5
                    ${option.isSelected || option.value === value
                      ? 'bg-black/5 dark:bg-white/5 text-foreground border-[hsl(var(--notepad-border))]'
                      : 'text-[hsl(var(--notepad-icon))] hover:text-foreground'
                    }
                  `}
                >
                  {option.color && (
                    <div className={`w-3 h-3 rounded-full ${option.color} transition-all duration-200 flex-shrink-0`} />
                  )}
                  {option.icon && (
                    <div className="flex-shrink-0 transition-all duration-200">
                      {option.icon}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm tracking-tight">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-[hsl(var(--notepad-icon))]/70 mt-0.5 leading-tight">{option.description}</div>
                    )}
                  </div>
                  {(option.isSelected || option.value === value) && (
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  )}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )
      )}
    </>
  )
}
