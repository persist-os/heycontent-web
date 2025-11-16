'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface SectionHeaderProps {
  title: string | React.ReactNode
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold leading-9 tracking-[-0.72px] text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div>{actions}</div>
        )}
      </div>
    </div>
  )
}

