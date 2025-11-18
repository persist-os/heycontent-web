'use client'

import React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchBarProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

/**
 * SearchBar - Matches Figma design exactly
 * 
 * Figma specs:
 * - Width: 1124px (full width in container)
 * - Height: 44px
 * - Border: 1px solid #cccfdd (N80)
 * - Background: #313030 (N20) in dark mode, light surface in light mode
 * - Border radius: 12px
 * - Search icon: 24px, left padding 8px
 * - Placeholder: "What are you looking for?" (H3 styling, subtle color)
 */
export function SearchBar({ 
  value = '', 
  onChange, 
  placeholder = 'What are you looking for?',
  className 
}: SearchBarProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <div className="bg-[hsl(var(--notes-surface-dim))] dark:bg-[hsl(var(--notes-surface-dim))] border border-[hsl(var(--assignment-outline))] border-solid h-[44px] relative rounded-[12px] shrink-0 w-full">
        <div className="h-[44px] overflow-clip relative rounded-[inherit] w-full">
          {/* Search Icon - Responsive sizing */}
          <div className="absolute box-border content-stretch flex gap-[10px] items-center left-1 md:left-[5px] p-2 md:p-[8px] rounded-[8px] top-1/2 translate-y-[-50%] w-10 md:w-[40px]">
            <div className="overflow-clip relative shrink-0 size-5 md:size-[24px]">
              <Search className="w-5 h-5 md:w-6 md:h-6 text-[hsl(var(--assignment-text-subtle))]" />
            </div>
          </div>
          {/* Input - Responsive typography and padding */}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            aria-label="Search assignments"
            className="absolute flex flex-col font-['DM_Sans'] font-semibold justify-center leading-[0] left-12 md:left-[45px] text-[hsl(var(--assignment-text-subtle))] text-sm md:text-[16px] top-[22px] tracking-[-0.24px] md:tracking-[-0.48px] translate-y-[-50%] whitespace-nowrap bg-transparent border-0 outline-0 w-[calc(100%-3rem)] md:w-[calc(100%-45px)] placeholder:text-[hsl(var(--assignment-text-subtle)))] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-[8px] [font-variation-settings:'opsz'_14]"
          />
        </div>
      </div>
    </div>
  )
}

