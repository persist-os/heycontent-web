'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  separator?: React.ReactNode
}

export function Breadcrumb({ items, className, separator = '/' }: BreadcrumbProps) {
  const isLastItem = (index: number) => index === items.length - 1
  
  return (
    <nav 
      aria-label="Breadcrumb navigation" 
      className={cn(
        'flex items-center gap-1 md:gap-[4px]',
        'text-xl md:text-[32px] font-extralight',
        'leading-[1.2] md:leading-[60px]',
        'tracking-[-0.48px] md:tracking-[-0.96px]',
        'text-foreground',
        className
      )}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-foreground/60 px-1" aria-hidden="true">{separator}</span>
          )}
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1 md:px-0 py-2 md:py-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center transition-colors"
              aria-current={isLastItem(index) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ) : item.onClick ? (
            <button 
              onClick={item.onClick} 
              className="hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1 md:px-0 py-2 md:py-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center transition-colors"
              aria-current={isLastItem(index) ? 'page' : undefined}
            >
              {item.label}
            </button>
          ) : (
            <span 
              className="py-2 md:py-0"
              aria-current={isLastItem(index) ? 'page' : undefined}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

