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
  return (
    <div className={cn('flex items-center gap-1 text-[32px] font-extralight leading-[60px] tracking-[-0.96px] text-foreground', className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-foreground/60">{separator}</span>
          )}
          {item.href ? (
            <Link href={item.href} className="hover:underline cursor-pointer">
              {item.label}
            </Link>
          ) : item.onClick ? (
            <button onClick={item.onClick} className="hover:underline cursor-pointer">
              {item.label}
            </button>
          ) : (
            <span>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

