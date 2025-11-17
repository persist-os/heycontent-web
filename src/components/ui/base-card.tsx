'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { Card } from './card'

const baseCardVariants = cva(
  'relative rounded-[12px] shrink-0 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-card border-2 border-border text-card-foreground',
        artifact: 'bg-gradient-to-l border-2 border-[#ffa312] border-solid from-[rgba(243,156,18,0)] to-[rgba(255,163,18,0.3)]',
        widget: 'bg-gradient-to-l border-2 border-[#65b5ff] border-solid from-[rgba(101,181,255,0)] to-[rgba(101,181,255,0.3)]',
        assignment: 'bg-gradient-to-r border-2 border-[rgba(101,181,255,0.75)] border-solid from-[rgba(101,181,255,0)] to-[rgba(255,163,18,0.5)]',
        file: 'bg-card border-2 border-border text-card-foreground',
        insight: 'bg-card/40 border-border/50 hover:border-border',
        note: 'bg-card border-2 border-border text-card-foreground',
        project: 'bg-card border-2 border-border text-card-foreground',
        shard: 'bg-card border-2 border-border text-card-foreground',
        blog: 'bg-card border-2 border-border text-card-foreground',
        prompt: 'bg-card border-2 border-border text-card-foreground',
        thread: 'bg-card border-2 border-border text-card-foreground',
        metadata: 'bg-card border-2 border-border text-card-foreground',
        subscription: 'bg-card border-2 border-border text-card-foreground',
        usage: 'bg-card border-2 border-border text-card-foreground',
        checkout: 'bg-card border-2 border-border text-card-foreground',
        overage: 'bg-card border-2 border-border text-card-foreground',
        'recent-usage': 'bg-card border-2 border-border text-card-foreground',
        'account-subscription': 'bg-card border-2 border-border text-card-foreground',
        friend: 'bg-card border-2 border-border text-card-foreground',
        'friend-request': 'bg-card border-2 border-border text-card-foreground',
        'test-lab': 'bg-card border-2 border-border text-card-foreground',
        'admin-stats': 'bg-card border-2 border-border text-card-foreground',
        value: 'bg-card border-2 border-border text-card-foreground',
        pricing: 'bg-card border-2 border-border text-card-foreground',
        'widget-properties': 'bg-card border-2 border-border text-card-foreground',
        'enhanced-item': 'bg-card border-2 border-border text-card-foreground',
        'widget-status': 'bg-card border-2 border-border text-card-foreground',
        conversation: 'bg-card border-2 border-border text-card-foreground',
        'connected-note': 'bg-card border-2 border-border text-card-foreground',
        'widget-output': 'bg-card border-2 border-border text-card-foreground',
        'widget-id': 'bg-card border-2 border-border text-card-foreground',
        star: 'bg-card border-2 border-border text-card-foreground',
        idea: 'bg-card border-2 border-border text-card-foreground',
        email: 'bg-card border-2 border-border text-card-foreground',
        collaboration: 'bg-card border-2 border-border text-card-foreground',
        reflection: 'bg-card border-2 border-border text-card-foreground',
        todo: 'bg-card border-2 border-border text-card-foreground',
        tips: 'bg-card border-2 border-border text-card-foreground',
        'quick-entry': 'bg-card border-2 border-border text-card-foreground',
        content: 'bg-card border-2 border-border text-card-foreground',
        space: 'bg-card border-2 border-border text-card-foreground',
        'artifact-display': 'bg-card border-2 border-border text-card-foreground',
        unified: 'bg-card border-2 border-border text-card-foreground',
      },
      size: {
        small: 'min-h-[auto] md:h-[120px]',
        medium: 'min-h-[auto] md:h-[168px]',
        large: 'min-h-[auto] md:h-[200px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'medium',
    },
  }
)

export interface BaseCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof baseCardVariants> {
  title?: string
  timestamp?: string
  summary?: string
  tag?: string
  path?: string
  onClick?: () => void
  href?: string
  children?: React.ReactNode
}

/**
 * BaseCard - Universal card component with variant system
 * 
 * Features:
 * - 47 variants for all card types
 * - 3 sizes (small, medium, large)
 * - Mobile-first responsive design (44px touch targets)
 * - All four modes supported (Light/Dark + Mobile/Web)
 * - Semantic colors for automatic theme support
 * 
 * @example
 * ```tsx
 * <BaseCard
 *   variant="artifact"
 *   size="medium"
 *   title="My Artifact"
 *   timestamp="2 hours ago"
 *   summary="This is a summary"
 *   tag="Important"
 *   onClick={handleClick}
 * />
 * ```
 */
export function BaseCard({
  variant,
  size,
  title,
  timestamp,
  summary,
  tag,
  path,
  onClick,
  href,
  children,
  className,
  ...props
}: BaseCardProps) {
  const content = (
    <div
      className={cn(baseCardVariants({ variant, size }), className)}
      onClick={onClick}
      aria-label={title ? `View ${title}` : undefined}
      tabIndex={onClick || href ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && (onClick || href)) {
          e.preventDefault()
          onClick?.()
        }
      }}
      {...props}
    >
      {/* Mobile: Left-aligned stack | Desktop: Right-aligned (items-end) */}
      <div className="box-border content-stretch flex flex-col gap-3 md:gap-[8px] items-start md:items-end overflow-clip px-4 py-4 md:px-[36px] md:py-[8px] relative rounded-[inherit] w-full">
        {/* Title and Timestamp - Mobile: Stack | Desktop: Row */}
        {(title || timestamp) && (
          <div className="content-stretch flex flex-col md:flex-row font-['DM_Sans'] font-semibold gap-2 md:gap-[10px] md:h-[36px] items-start md:items-center justify-between md:justify-center leading-[0] relative shrink-0 w-full">
            {title && (
              <div className="flex flex-[1_0_0] flex-col justify-center min-h-px min-w-0 relative shrink-0 text-lg md:text-[24px] tracking-[-0.36px] md:tracking-[-0.72px] text-foreground [font-variation-settings:'opsz'_14]">
                <p className="leading-[1.4] md:leading-[36px] whitespace-pre-wrap break-words">{title}</p>
              </div>
            )}
            {timestamp && (
              <div className="flex flex-col justify-center relative shrink-0 text-xs md:text-[16px] tracking-[-0.24px] md:tracking-[-0.48px] whitespace-nowrap [font-variation-settings:'opsz'_14] self-start md:self-auto">
                <p className="leading-[1.4] md:leading-[24px] text-muted-foreground">{timestamp}</p>
              </div>
            )}
          </div>
        )}

        {/* Summary - Mobile: Full text | Desktop: Original layout */}
        {summary && (
          <div className="flex flex-col font-['DM_Sans'] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-muted-foreground text-sm md:text-[16px] w-full [font-variation-settings:'opsz'_14]">
            <p className="leading-[1.5] md:leading-[20px] whitespace-pre-wrap break-words">{summary}</p>
          </div>
        )}

        {/* Path and Tag - Mobile: Wrap | Desktop: Original layout */}
        {(path || tag) && (
          <div className="content-stretch flex flex-wrap md:flex-nowrap h-auto md:h-[32px] items-center relative shrink-0 w-full">
            <div className="content-stretch flex flex-wrap md:flex-nowrap gap-2 md:gap-[20px] items-center relative shrink-0">
              {path && (
                <div className="flex flex-col font-['DM_Sans'] font-semibold justify-center leading-[0] relative shrink-0 text-primary tracking-[-0.24px] md:tracking-[-0.48px] whitespace-nowrap [font-variation-settings:'opsz'_14]">
                  <p className="font-['DM_Sans'] font-semibold leading-[1.4] md:leading-[24px] text-sm md:text-[16px]">{path}</p>
                </div>
              )}
              {tag && (
                <div className="bg-primary/10 box-border content-stretch flex gap-[10px] items-center justify-center px-3 py-1.5 md:px-[8px] md:py-[4px] relative rounded-[8px] shrink-0 min-h-[28px] md:min-h-0">
                  <div className="flex flex-col font-['DM_Sans'] font-semibold justify-center leading-[0] relative shrink-0 text-primary text-xs md:text-[16px] tracking-[-0.24px] md:tracking-[-0.48px] whitespace-nowrap [font-variation-settings:'opsz'_14]">
                    <p className="leading-[1.4] md:leading-[24px]">{tag}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom children content */}
        {children}

        {/* Arrow Icon Button - Mobile: 44px touch target | Desktop: 40px x 40px */}
        {(onClick || href) && (
          <div className="box-border content-stretch cursor-pointer flex gap-[10px] items-center md:items-end justify-center md:justify-end p-2 md:p-[8px] relative rounded-[8px] shrink-0 min-h-[44px] min-w-[44px] md:w-[40px] md:h-[40px] md:min-h-0 md:min-w-0 self-end md:self-auto">
            <div className="overflow-clip relative shrink-0 size-5 md:size-[24px]">
              <div className="absolute inset-[20.83%_16.67%]">
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    )
  }

  return content
}

BaseCard.displayName = 'BaseCard'

export { baseCardVariants }

