'use client'

import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronUp } from 'lucide-react'
import { T } from '@/components/translation/T'
import { cn } from '@/lib/utils'

export interface FileItem {
  id: string
  name: string
  type: string
  lastOpened: number
}

export interface FilesTableColumn {
  key: string
  label: string
  width?: string
  sortable?: boolean
}

export interface FilesTableProps {
  items: FileItem[]
  columns?: FilesTableColumn[]
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  onItemClick?: (item: FileItem) => void
  className?: string
}

const DEFAULT_COLUMNS: FilesTableColumn[] = [
  { key: 'name', label: 'Name', width: 'w-[400px]', sortable: true },
  { key: 'type', label: 'Type', width: 'w-[120px]', sortable: true },
  { key: 'lastOpened', label: 'Last opened', width: 'w-[300px]', sortable: true }
]

export function FilesTable({
  items,
  columns = DEFAULT_COLUMNS,
  onSort,
  onItemClick,
  className
}: FilesTableProps) {
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getTypeLabel = (type: string): string => {
    if (type === 'artifact') return 'Artifact'
    if (type === 'widget') return 'Widget'
    return 'Chat'
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Table Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(var(--assignment-outline-variant))]">
        {columns.map((column) => (
          <div key={column.key} className={cn('flex items-center gap-3', column.width)}>
            {column.key === 'name' && <Checkbox />}
            <span className={cn(
              'text-sm font-semibold',
              column.key === 'lastOpened' ? 'text-foreground' : 'text-[hsl(var(--assignment-on-surface-variant))]'
            )}>
              {column.key === 'name' && <T context="assignment.files.table.name">Name</T>}
              {column.key === 'type' && <T context="assignment.files.table.type">Type</T>}
              {column.key === 'lastOpened' && <T context="assignment.files.table.last_opened">Last opened</T>}
            </span>
            {column.sortable && (
              <ChevronUp className="w-6 h-6 text-[hsl(var(--assignment-on-surface-variant))]" />
            )}
          </div>
        ))}
      </div>

      {/* Table Rows */}
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick?.(item)}
          className={cn(
            'flex items-center justify-between px-4 py-2 bg-[hsl(var(--assignment-surface-container))] border-b border-[hsl(var(--assignment-outline-variant))] last:border-b-0',
            onItemClick && 'cursor-pointer'
          )}
        >
          {columns.map((column) => (
            <div key={column.key} className={cn('flex items-center gap-3', column.width)}>
              {column.key === 'name' && <Checkbox />}
              <span className={cn(
                'text-sm font-semibold',
                column.key === 'lastOpened' ? 'text-foreground' : 'text-[hsl(var(--assignment-on-surface-variant))]'
              )}>
                {column.key === 'name' && (item.name || <T context="assignment.files.untitled">Untitled</T>)}
                {column.key === 'type' && (
                  <>
                    {item.type === 'artifact' && <T context="assignment.files.type.artifact">Artifact</T>}
                    {item.type === 'widget' && <T context="assignment.files.type.widget">Widget</T>}
                    {item.type !== 'artifact' && item.type !== 'widget' && <T context="assignment.files.type.chat">Chat</T>}
                  </>
                )}
                {column.key === 'lastOpened' && formatDate(item.lastOpened)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

