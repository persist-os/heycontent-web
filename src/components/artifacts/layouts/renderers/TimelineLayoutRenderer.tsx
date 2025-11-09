/**
 * TIMELINE LAYOUT RENDERER
 * 
 * Generic timeline renderer for artifacts with layout: 'timeline'
 * Works with ANY artifact type that uses timeline layout
 * 
 * Design Spec: border-accent/20, bg-accent/5 (purple tint)
 */

'use client'

import React, { useState } from 'react'
import { EventTypeDefinition, ArtifactMetadata } from '@/types/artifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Flag, Check, Circle, Star, Pencil, X } from 'lucide-react'
import { VersionSelector } from '../../VersionSelector'

interface TimelineEvent {
  id: string
  timestamp: number
  type: string
  title: string
  description?: string
  metadata?: Record<string, any>
}

interface TimelineLayoutRendererProps {
  data_model: {
    layout: 'timeline'
    eventTypes: EventTypeDefinition[]
    groupBy?: 'date' | 'type'
  }
  data: {
    events: Array<TimelineEvent>
  }
  editable: boolean
  onUpdate?: (data: any) => void
  artifactType?: string
  metadata?: ArtifactMetadata
}

// Icon mapping for common event types
const defaultIcons: Record<string, any> = {
  milestone: Flag,
  task: Check,
  note: Circle,
  default: Star,
}

// Color mapping for event types
const eventColors: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
}

export function TimelineLayoutRenderer({
  data_model,
  data,
  editable = false,
  onUpdate,
  artifactType,
  metadata
}: TimelineLayoutRendererProps) {
  // Defensive: ensure all required properties exist
  const eventTypes = Array.isArray(data_model?.eventTypes) ? data_model.eventTypes : []
  const events = Array.isArray(data?.events) ? data.events : []
  const artifactMetadata = metadata || {
    version: 1,
    lastUpdatedBy: 'unknown',
    lastUpdatedAt: Date.now()
  }

  // Per-event editing state (fixes bug where all events edit at once)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editState, setEditState] = useState<Record<string, { title: string; description: string }>>({})

  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0))

  // Get event type config
  const getEventTypeConfig = (eventType: string) => {
    return eventTypes.find(t => t?.type === eventType)
  }

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Handle editing event (per-event state)
  const handleEditEvent = (event: TimelineEvent, index: number) => {
    const eventId = event.id || `timeline-event-${index}`
    setEditingEventId(eventId)
    setEditState((prevState) => ({
      ...prevState,
      [eventId]: {
        title: event.title,
        description: event.description || ''
      }
    }))
  }

  const handleSaveEvent = (eventId: string) => {
    if (!onUpdate || !editingEventId) return

    // Get edit data from state and update
    setEditState((prevState) => {
      const editData = prevState[eventId]
      if (!editData) return prevState

      // Update events array - match by eventId (either event.id or computed ID)
      const newEvents = events.map((event, idx) => {
        const currentEventId = event.id || `timeline-event-${sortedEvents.indexOf(event)}`
        if (currentEventId === eventId) {
          return {
            ...event,
            title: editData.title,
            description: editData.description
          }
        }
        return event
      })

      // Call onUpdate outside of state setter
      setTimeout(() => {
        onUpdate({ ...data, events: newEvents })
      }, 0)
      
      // Clean up edit state for this event
      const newState = { ...prevState }
      delete newState[eventId]
      return newState
    })
    
    setEditingEventId(null)
  }

  const handleCancelEdit = (eventId: string) => {
    setEditingEventId(null)
    setEditState((prevState) => {
      const newState = { ...prevState }
      delete newState[eventId]
      return newState
    })
  }

  const updateEditField = (eventId: string, field: 'title' | 'description', value: string) => {
    setEditState((prevState) => ({
      ...prevState,
      [eventId]: {
        ...(prevState[eventId] || { title: '', description: '' }),
        [field]: value
      }
    }))
  }

  // Get artifact type display name
  const artifactTypeDisplay = artifactType || 'Timeline'

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-accent/20 hover:bg-card/80 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-sm font-medium text-foreground">{artifactTypeDisplay}</span>
            {editable && (
              <Pencil className="w-3 h-3 text-accent/60" />
            )}
          </div>
          <VersionSelector metadata={artifactMetadata} />
        </div>
      </CardHeader>
      
      <CardContent>
        {sortedEvents.length === 0 ? (
          // Empty state
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>No events available</p>
          </div>
        ) : (
          <div className="relative space-y-6 pl-8">
            {/* Timeline spine */}
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border/40" />

            {sortedEvents.map((event, index) => {
              const typeConfig = getEventTypeConfig(event.type)
              const Icon = defaultIcons[event.type] || defaultIcons.default
              const dotColor = typeConfig 
                ? eventColors[typeConfig.color] || 'bg-primary'
                : 'bg-primary'
              const isLast = index === sortedEvents.length - 1
              const eventId = event.id || `timeline-event-${index}` // Ensure unique ID
              const isEditing = editingEventId === eventId

              return (
                <div key={eventId} className="relative">
                  {/* Event dot */}
                  <div 
                    className={`absolute -left-8 top-1 w-4 h-4 rounded-full ${dotColor} border-2 border-background flex items-center justify-center`}
                  >
                    <Icon className="w-2 h-2 text-white" />
                  </div>

                  {/* Event content */}
                  <div className={`pb-2 ${!isLast ? '' : ''}`}>
                    <div className="bg-muted/10 hover:bg-muted/20 rounded-lg p-4 border border-border/20 transition-all duration-200">
                      {isEditing ? (
                        /* Editing mode */
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Title
                            </label>
                            <input
                              type="text"
                              value={editState[eventId]?.title || ''}
                              onChange={(e) => updateEditField(eventId, 'title', e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-primary/5 border border-primary/40 rounded-md ring-2 ring-primary/50 focus:outline-none"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Description
                            </label>
                            <Textarea
                              value={editState[eventId]?.description || ''}
                              onChange={(e) => updateEditField(eventId, 'description', e.target.value)}
                              className="w-full min-h-[80px] px-3 py-2 text-sm bg-primary/5 border border-primary/40 rounded-md ring-2 ring-primary/50 focus:outline-none resize-y"
                              placeholder="Enter event description..."
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSaveEvent(eventId)}
                              className="h-7 px-3 text-xs"
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelEdit(eventId)}
                              className="h-7 px-3 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Display mode */
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-foreground mb-1">
                                {event?.title || 'Untitled Event'}
                              </h4>
                              
                              {event?.description && (
                                <p className="text-sm text-muted-foreground">
                                  {event.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {typeConfig && (
                                <Badge variant="outline" className="text-xs">
                                  {typeConfig?.label || typeConfig?.type || 'Event'}
                                </Badge>
                              )}
                              {editable && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditEvent(event, index)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                            <span>{formatDate(event?.timestamp || Date.now())}</span>
                            {event?.metadata && Object.keys(event.metadata).length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-muted-foreground/70">
                                  {Object.keys(event.metadata).length} metadata
                                </span>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Metadata Footer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 border-t border-border/20 pt-3 mt-4">
          <span>{sortedEvents.length} events</span>
          <span>•</span>
          <span>Updated {new Date(artifactMetadata.lastUpdatedAt).toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}

