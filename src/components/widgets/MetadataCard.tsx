/**
 * METADATA CARD COMPONENT
 * 
 * Reusable stat card for widget metadata display.
 * Shows a label and value in a glassmorphism card.
 */

'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MetadataCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  variant?: 'default' | 'accent'
  className?: string
}

export function MetadataCard({
  label,
  value,
  icon: Icon,
  variant = 'default',
  className
}: MetadataCardProps) {
  return (
    <Card 
      className={cn(
        'backdrop-blur-sm transition-all duration-300',
        variant === 'default' 
          ? 'bg-card/50 border-border/40 hover:bg-card/80 hover:border-border/60'
          : 'bg-primary/10 border-primary/20 hover:bg-primary/15 hover:border-primary/30',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {Icon && (
            <Icon className={cn(
              'h-3.5 w-3.5',
              variant === 'accent' ? 'text-primary' : 'text-muted-foreground'
            )} />
          )}
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
        </div>
        <p className="text-2xl font-light text-foreground">
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

