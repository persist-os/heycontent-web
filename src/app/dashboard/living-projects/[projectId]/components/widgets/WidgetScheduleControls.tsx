'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Calendar, Zap, X, Check, Clock3, CalendarDays, Sun, Clock4, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { scheduleWidget, unscheduleWidget, getSuggestedSchedule } from '@/lib/services/widgetSchedulingService'

interface WidgetScheduleControlsProps {
  widgetId: string
  projectId: string
  isScheduled?: boolean
  nextScheduledRun?: number | null
  frequency?: string
  suggestedFrequency?: string | null
  onScheduleChange?: () => void
  className?: string
  isAdmin?: boolean
}

export function WidgetScheduleControls({
  widgetId,
  projectId,
  isScheduled: initialIsScheduled = false,
  nextScheduledRun: initialNextScheduledRun = null,
  frequency: initialFrequency = 'daily',
  suggestedFrequency: initialSuggestedFrequency = null,
  onScheduleChange,
  className = '',
  isAdmin = false
}: WidgetScheduleControlsProps) {
  const [isScheduled, setIsScheduled] = useState(initialIsScheduled)
  const [nextScheduledRun, setNextScheduledRun] = useState<number | null>(initialNextScheduledRun)
  const [frequency, setFrequency] = useState(initialFrequency)
  const [suggestedFrequency, setSuggestedFrequency] = useState<string | null>(initialSuggestedFrequency)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsScheduled(initialIsScheduled)
    setNextScheduledRun(initialNextScheduledRun)
    setFrequency(initialFrequency)
    setSuggestedFrequency(initialSuggestedFrequency)
  }, [initialIsScheduled, initialNextScheduledRun, initialFrequency, initialSuggestedFrequency])

  // Load suggested frequency on mount if not provided
  useEffect(() => {
    if (!suggestedFrequency && !isScheduled) {
      getSuggestedSchedule(widgetId)
        .then((result) => {
          if (result.suggested_frequency) {
            setSuggestedFrequency(result.suggested_frequency)
          }
        })
        .catch((error) => {
          console.error('Failed to load suggested schedule:', error)
        })
    }
  }, [widgetId, suggestedFrequency, isScheduled])

  const handleSchedule = async (newFrequency: string) => {
    try {
      setIsLoading(true)
      const result = await scheduleWidget(widgetId, newFrequency)
      
      if (result.success) {
        setFrequency(newFrequency)
        setIsScheduled(true)
        setNextScheduledRun(result.next_run || null)
        toast.success(`Widget scheduled to run ${newFrequency}`)
        onScheduleChange?.()
      } else {
        throw new Error(result.error || 'Failed to schedule widget')
      }
    } catch (error) {
      console.error('Failed to schedule widget:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to schedule widget')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnschedule = async () => {
    try {
      setIsLoading(true)
      const result = await unscheduleWidget(widgetId)
      
      if (result.success) {
        setIsScheduled(false)
        setNextScheduledRun(null)
        toast.success('Widget schedule removed')
        onScheduleChange?.()
      } else {
        throw new Error(result.error || 'Failed to unschedule widget')
      }
    } catch (error) {
      console.error('Failed to unschedule widget:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove schedule')
    } finally {
      setIsLoading(false)
    }
  }

  const formatNextRunDisplay = (timestamp: number | null): string => {
    if (!timestamp) return 'Not scheduled'
    
    const now = new Date()
    const nextRun = new Date(timestamp * 1000)
    const diffMs = nextRun.getTime() - now.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMs <= 0) return 'Running soon'
    
    // Show minutes for anything less than 1 hour
    if (diffMinutes < 60) {
      return `In ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`
    }
    
    // For hourly schedules, show hours and minutes if less than 2 hours
    if (diffHours < 2 && frequency === 'hourly') {
      const remainingMinutes = diffMinutes % 60
      if (remainingMinutes > 0) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
      }
      return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`
    }
    
    // For other frequencies, show hours if less than 24 hours
    if (diffHours < 24) {
      return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`
    }
    
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 7) return `In ${diffDays} days`
    if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''}`
    return nextRun.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  if (isScheduled) {
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        <div className="flex items-center text-green-500">
          <Clock4 className="w-3.5 h-3.5 mr-1.5" />
          <span className="font-medium">Scheduled {frequency}</span>
        </div>
        <span className="text-muted-foreground">
          {nextScheduledRun ? `Next: ${formatNextRunDisplay(nextScheduledRun)}` : 'Scheduled'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-2 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            handleUnschedule()
          }}
          disabled={isLoading}
        >
          <X className="w-3 h-3 mr-1" />
          <span>Stop</span>
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {suggestedFrequency && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
          <Lightbulb className="w-3 h-3" />
          <span>Suggested: Run {suggestedFrequency}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-2 ml-auto"
            onClick={(e) => {
              e.stopPropagation()
              handleSchedule(suggestedFrequency)
            }}
            disabled={isLoading}
          >
            Enable
          </Button>
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`text-xs h-8 gap-1.5 ${className}`}
            onClick={(e) => e.stopPropagation()}
            disabled={isLoading}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Schedule</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleSchedule('hourly')}>
            <Clock3 className="w-4 h-4 mr-2" />
            Hourly
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSchedule('daily')}>
            <Sun className="w-4 h-4 mr-2" />
            Daily
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSchedule('weekly')}>
            <Calendar className="w-4 h-4 mr-2" />
            Weekly
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSchedule('monthly')}>
            <CalendarDays className="w-4 h-4 mr-2" />
            Monthly
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSchedule('5min')}>
                <Zap className="w-4 h-4 mr-2" />
                5 Minutes (Admin)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSchedule('15min')}>
                <Zap className="w-4 h-4 mr-2" />
                15 Minutes (Admin)
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
