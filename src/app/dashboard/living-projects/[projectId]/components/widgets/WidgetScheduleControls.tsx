'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Calendar, Zap, X, Check, Clock3, CalendarDays, Sun, Clock4 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { toast } from 'sonner'

interface WidgetScheduleControlsProps {
  widgetId: string
  projectId: string
  isScheduled?: boolean
  nextScheduledRun?: number | null
  frequency?: string
  onScheduleChange?: () => void
  className?: string
}

export function WidgetScheduleControls({
  widgetId,
  projectId,
  isScheduled: initialIsScheduled = false,
  nextScheduledRun: initialNextScheduledRun = null,
  frequency: initialFrequency = 'daily',
  onScheduleChange,
  className = ''
}: WidgetScheduleControlsProps) {
  const [isScheduled, setIsScheduled] = useState(initialIsScheduled)
  const [nextScheduledRun, setNextScheduledRun] = useState<number | null>(initialNextScheduledRun)
  const [frequency, setFrequency] = useState(initialFrequency)
  const [isLoading, setIsLoading] = useState(false)

  const scheduleWidget = useMutation(api.widgets.schedule)
  const unscheduleWidget = useMutation(api.widgets.unschedule)

  useEffect(() => {
    setIsScheduled(initialIsScheduled)
    setNextScheduledRun(initialNextScheduledRun)
    setFrequency(initialFrequency)
  }, [initialIsScheduled, initialNextScheduledRun, initialFrequency])

  const handleSchedule = async (newFrequency: string) => {
    try {
      setIsLoading(true)
      await scheduleWidget({
        widgetId,
        projectId,
        frequency: newFrequency as any,
        userId: 'current-user-id' // This should be replaced with actual user ID from auth
      })
      
      setFrequency(newFrequency)
      setIsScheduled(true)
      // Calculate next run time (simplified - in a real app, this would come from the server)
      const nextRun = calculateNextRun(newFrequency)
      setNextScheduledRun(nextRun)
      
      toast.success(`Widget scheduled to run ${newFrequency}`)
      onScheduleChange?.()
    } catch (error) {
      console.error('Failed to schedule widget:', error)
      toast.error('Failed to schedule widget')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnschedule = async () => {
    try {
      setIsLoading(true)
      await unscheduleWidget({ widgetId })
      
      setIsScheduled(false)
      setNextScheduledRun(null)
      
      toast.success('Widget schedule removed')
      onScheduleChange?.()
    } catch (error) {
      console.error('Failed to unschedule widget:', error)
      toast.error('Failed to remove schedule')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateNextRun = (freq: string): number => {
    const now = new Date()
    const nextRun = new Date()
    
    switch (freq) {
      case 'hourly':
        nextRun.setHours(now.getHours() + 1)
        break
      case 'daily':
        nextRun.setDate(now.getDate() + 1)
        break
      case 'weekly':
        nextRun.setDate(now.getDate() + 7)
        break
      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1)
        break
      default:
        nextRun.setDate(now.getDate() + 1)
    }
    
    return Math.floor(nextRun.getTime() / 1000)
  }

  const formatNextRun = (timestamp: number | null): string => {
    if (!timestamp) return 'Not scheduled'
    
    const now = new Date()
    const nextRun = new Date(timestamp * 1000)
    const diff = Math.ceil((nextRun.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diff <= 0) return 'Running soon'
    if (diff === 1) return 'Tomorrow'
    if (diff < 7) return `In ${diff} days`
    if (diff < 30) return `In ${Math.floor(diff / 7)} weeks`
    return nextRun.toLocaleDateString()
  }

  const getFrequencyIcon = (freq: string) => {
    switch (freq) {
      case 'hourly':
        return <Clock3 className="w-4 h-4 mr-2" />
      case 'daily':
        return <Sun className="w-4 h-4 mr-2" />
      case 'weekly':
        return <Calendar className="w-4 h-4 mr-2" />
      case 'monthly':
        return <CalendarDays className="w-4 h-4 mr-2" />
      default:
        return <Zap className="w-4 h-4 mr-2" />
    }
  }

  if (isScheduled) {
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        <div className="flex items-center text-green-500">
          <Clock4 className="w-3.5 h-3.5 mr-1.5" />
          <span className="font-medium">Scheduled {frequency}</span>
        </div>
        <span className="text-muted-foreground">
          {nextScheduledRun ? `Next: ${formatNextRun(nextScheduledRun)}` : 'Scheduled'}
        </span>
        <Button
          variant="ghost"
          size="xs"
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
