'use client'

import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Task {
  id: string
  label: string
  status: 'active' | 'pending' | 'completed' | 'failed'
}

export interface TaskListProps {
  tasks: Task[]
  showDividers?: boolean
  className?: string
}

export function TaskList({ tasks, showDividers = true, className }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="w-3 h-3 rounded-full border-2 border-[hsl(var(--assignment-outline-variant))] flex-shrink-0" />
        <span className="text-base text-[hsl(var(--assignment-text-subtle))]">
          No tasks yet
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-[5px]', className)}>
      {tasks.map((task, index) => {
        const isActive = task.status === 'active'
        const isCompleted = task.status === 'completed'
        const isFailed = task.status === 'failed'

        return (
          <React.Fragment key={task.id}>
            {index > 0 && showDividers && (
              <div className="w-[2px] h-[22px] bg-[hsl(var(--assignment-outline-variant))] ml-[5px]" />
            )}
            <div className="flex items-center gap-3 mb-[5px] last:mb-0">
              {isCompleted ? (
                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
              ) : isFailed ? (
                <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
              ) : isActive ? (
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--assignment-brand-orange))] flex-shrink-0" />
              ) : (
                <div className="w-3 h-3 rounded-full border-2 border-[hsl(var(--assignment-outline-variant))] flex-shrink-0" />
              )}
              <span className={cn('text-base', {
                'text-[hsl(var(--assignment-text-subtle))]': isActive,
                'text-foreground': isCompleted || isFailed,
                'text-[hsl(var(--assignment-text-subtle))]': !isActive && !isCompleted && !isFailed
              })}>
                {task.label}
              </span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

