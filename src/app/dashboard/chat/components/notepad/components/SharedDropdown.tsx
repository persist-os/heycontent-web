'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

interface DropdownOption {
  value: string
  label: string
  description?: string
  color?: string
  icon?: React.ReactNode
  isSelected?: boolean
}

interface SharedDropdownProps {
  value: string
  options: DropdownOption[]
  onSelect: (value: string) => void
  placeholder?: string
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
      // Calculate position when opening with better viewport handling
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const dropdownWidth = isMobile ? 288 : 320 // w-72 = 288px, w-80 = 320px
      
      let left = rect.left + window.scrollX
      let top = rect.bottom + window.scrollY + 4
      
      // Prevent horizontal overflow
      if (left + dropdownWidth > viewportWidth) {
        left = Math.max(8, viewportWidth - dropdownWidth - 8) // 8px margin from edge
      }
      
      // Prevent vertical overflow
      if (top + 320 > viewportHeight + window.scrollY) { // assume max height of 320px
        top = rect.top + window.scrollY - 320 - 4 // Show above instead
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

  const dropdownWidth = isMobile ? 'w-72' : 'w-80'

  return (
    <>
      <div className={`relative ${width} ${className}`}>
        <button
          ref={buttonRef}
          onClick={handleToggle}
          disabled={disabled}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-transparent hover:bg-muted/40 rounded-md transition-all duration-300 hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-50 ${triggerClassName}`}
        >
          {selectedOption?.color && (
            <div className={`w-2.5 h-2.5 rounded-full ${selectedOption.color} transition-all duration-300`} />
          )}
          {selectedOption?.icon && (
            <div className="flex-shrink-0">
              {selectedOption.icon}
            </div>
          )}
          <span className="tracking-wide truncate">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className={`w-3 h-3 transition-all duration-300 ${isOpen ? 'rotate-180 text-foreground' : 'text-muted-foreground/60'}`} />
        </button>
      </div>
      
      {/* Dropdown */}
      {typeof window !== 'undefined' && isOpen && (
        createPortal(
          <div
            ref={dropdownRef}
            className={`fixed ${dropdownWidth} border border-border/50 rounded-xl shadow-2xl z-[9999] backdrop-blur-md bg-background/95 overflow-hidden`}
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
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 group border border-transparent hover:scale-[1.01] hover:bg-muted/60
                    ${option.isSelected || option.value === value
                      ? 'bg-muted/80 text-foreground border-border/40'
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  {option.color && (
                    <div className={`w-3 h-3 rounded-full ${option.color} transition-all duration-300 group-hover:scale-110`} />
                  )}
                  {option.icon && (
                    <div className="flex-shrink-0 transition-all duration-300 group-hover:scale-110">
                      {option.icon}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm tracking-tight">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground/70 mt-0.5 leading-tight">{option.description}</div>
                    )}
                  </div>
                  {(option.isSelected || option.value === value) && (
                    <div className="w-2 h-2 rounded-full bg-primary/60" />
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
