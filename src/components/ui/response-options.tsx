'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface ResponseOption {
  text: string
  onClick: () => void
  type?: 'action' | 'detail' | 'suggestion' | 'explore'
  action?: string
}

export interface ResponseOptionsProps {
  message: string
  options: ResponseOption[]
  className?: string
}

/**
 * ResponseOptions Component
 * 
 * Displays a message/question with action buttons below it.
 * Matches Figma design: https://www.figma.com/design/V8NnSKXPeF7Lls9LfAKptZ/HeyContext-Design-System?node-id=1640-1816
 * 
 * @example
 * ```tsx
 * <ResponseOptions
 *   message="Sure! There are several ways to do it..."
 *   options={[
 *     {
 *       text: "I'd like to edit artifacts directly.",
 *       onClick: () => handleEditArtifacts()
 *     },
 *     {
 *       text: "Take me to widget/agent selection.",
 *       onClick: () => handleWidgetSelection()
 *     }
 *   ]}
 * />
 * ```
 */
export function ResponseOptions({
  message,
  options,
  className
}: ResponseOptionsProps) {
  return (
    <div
      className={cn(
        // Container: Full width, dark background, rounded corners, flex column, gap between message and buttons
        'bg-[hsl(var(--response-options-bg))]',
        'flex flex-col gap-[25px]',
        'items-start',
        'rounded-[12px]',
        'w-full',
        // Mobile: Responsive padding
        'p-3 sm:p-[12px]',
        className
      )}
    >
      {/* Message Text Container */}
      <div
        className={cn(
          // Message container: Same background, padding, rounded, full width
          'bg-[hsl(var(--response-options-bg))]',
          'box-border',
          'flex',
          'flex-col',
          'gap-[8px]',
          'items-start',
          'justify-center',
          'p-[12px]',
          'rounded-[12px]',
          'shrink-0',
          'w-full'
        )}
      >
        <p
          className={cn(
            // Text: Body/L (16px, Regular 400, line-height 20px)
            'flex-[1_0_0]',
            'font-["DM_Sans"]',
            'font-normal', // Regular 400
            'leading-[20px]',
            'min-h-px',
            'min-w-px',
            'relative',
            'shrink-0',
            'text-[hsl(var(--response-options-text))]',
            'text-[16px]', // Body/L
            'whitespace-pre-wrap',
            'w-full'
          )}
        >
          {message}
        </p>
        {/* Hint to use chat input */}
        <p
          className={cn(
            'text-[12px]',
            'text-[hsl(var(--response-options-text))]',
            'opacity-70',
            'italic',
            'mt-1'
          )}
        >
          Type your answers in the chat input below
        </p>
      </div>

      {/* Action Buttons Container */}
      <div
        className={cn(
          // Buttons container: Flex row on desktop, column on mobile, gap between buttons
          'box-border',
          'flex flex-col sm:flex-row',
          'gap-[25px]',
          'items-start',
          'p-[12px]',
          'relative',
          'shrink-0',
          'w-full'
        )}
      >
        {options.map((option, index) => (
          <button
            key={index}
            onClick={option.onClick}
            className={cn(
              // Button: Dark background, light blue border (2px), rounded, padding
              'bg-[hsl(var(--response-options-button-bg))]',
              'border-[2px]',
              'border-solid',
              'border-[hsl(var(--response-options-button-border))]',
              'relative',
              'rounded-[12px]',
              'shrink-0',
              // Hover state: Slightly lighter background
              'hover:opacity-90',
              'transition-opacity',
              // Focus state: Ring for accessibility
              'focus-visible:outline-none',
              'focus-visible:ring-2',
              'focus-visible:ring-[hsl(var(--response-options-button-border))]',
              'focus-visible:ring-offset-2',
              // Mobile: Full width on mobile, auto on desktop
              'w-full sm:w-auto'
            )}
          >
            <div
              className={cn(
                // Button content: Flex, gap, padding, items center
                'box-border',
                'content-stretch',
                'flex',
                'gap-[8px]',
                'isolate',
                'items-center',
                'justify-center',
                'overflow-clip',
                'px-[16px]',
                'py-[8px]',
                'relative',
                'rounded-[inherit]'
              )}
            >
              <div
                className={cn(
                  // Button text: Body/M (14px, SemiBold 600, line-height 21px, tracking -0.14px)
                  'flex',
                  'flex-col',
                  'font-["DM_Sans"]',
                  'font-semibold', // SemiBold 600
                  'justify-center',
                  'leading-[0]',
                  'relative',
                  'shrink-0',
                  'text-[hsl(var(--response-options-button-text))]',
                  'text-[14px]', // Body/M
                  'tracking-[-0.14px]',
                  'whitespace-nowrap',
                  'z-[2]'
                )}
              >
                <p className="leading-[21px]">{option.text}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

