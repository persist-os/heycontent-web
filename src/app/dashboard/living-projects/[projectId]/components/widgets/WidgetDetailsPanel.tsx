/**
 * WIDGET DETAILS PANEL COMPONENT
 * 
 * Side panel for displaying detailed widget information with
 * actions and metadata.
 */

'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { X, Layers, Palette, Clock, Activity, Target, Calendar, Lightbulb, FileText, ExternalLink, Maximize2, Play, Loader2, Edit, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WidgetConfig } from '@/types/projectWidgets'
import { getWidgetThemeClasses } from '../utils/widgetStyling'
import { useRouter } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { useQuery, useMutation } from 'convex/react'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { useWidgetRunner } from '@/app/dashboard/living-projects/hooks/useWidgetRunner'
import { launchThinkingLabWithOutput } from '@/app/dashboard/living-projects/utils/thinkingLabLauncher'

interface WidgetDetailsPanelProps {
  widget: WidgetConfig | null
  isOpen: boolean
  onClose: () => void
  projectId: string
  width?: number
  onWidthChange?: (width: number) => void
}

/**
 * Widget details panel component for displaying comprehensive widget information
 */
export function WidgetDetailsPanel({ 
  widget, 
  isOpen, 
  onClose,
  projectId,
  width = 384, // Default 24rem (w-96)
  onWidthChange
}: WidgetDetailsPanelProps) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const { executeWidget, isRunning } = useWidgetRunner()
  const resizeRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)
  const startPos = useRef({ x: 0 })
  const startWidth = useRef(384)

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true
    startPos.current = { x: e.clientX }
    startWidth.current = width

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return

      const deltaX = startPos.current.x - moveEvent.clientX // Inverted for right-side resize
      const newWidth = Math.max(320, Math.min(800, startWidth.current + deltaX))

      onWidthChange?.(newWidth)
    }

    const handleMouseUp = () => {
      isResizing.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [width, onWidthChange])
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 5,
    size: 'medium',
    theme: 'clean',
    update_frequency: 'daily'
  })
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Mutations
  const updateWidget = useMutation(api.projectWidgetsMutations.updateWidget)
  const deleteWidget = useMutation(api.projectWidgetsMutations.deleteWidget)
  
  // Loading states
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await getCurrentUserId()
        setUserId(id)
      } catch (error) {
        console.error('Failed to get user ID:', error)
      }
    }
    getUserId()
  }, [])
  
  // Update edit form when widget changes
  useEffect(() => {
    if (widget) {
      setEditForm({
        title: widget.title,
        description: widget.description || '',
        priority: widget.priority,
        size: widget.size,
        theme: widget.theme,
        update_frequency: widget.update_frequency
      })
    }
  }, [widget])
  
  // Fetch latest widget output
  const latestOutput = useQuery(
    api.widgetOutputsQueries.getWidgetOutputData,
    widget && userId ? {
      userId,
      filters: { widgetId: widget._id },  // ✅ Use Convex ID (_id)
      limit: 1,
      orderBy: 'desc'
    } : 'skip'
  )

  if (!isOpen || !widget) return null

  // When limit: 1, the query returns a single object, not an array
  const output = latestOutput && typeof latestOutput === 'object' && '_id' in latestOutput
    ? latestOutput 
    : null

  // Debug logging
  console.log('[WidgetDetailsPanel] Widget:', widget.widget_id, widget.title)
  console.log('[WidgetDetailsPanel] Latest output raw:', latestOutput)
  console.log('[WidgetDetailsPanel] Parsed output:', output)
  console.log('[WidgetDetailsPanel] Has noteId:', output?.noteId)
  console.log('[WidgetDetailsPanel] Has prompts:', output?.prompts?.length || 0)

  const handleLaunchThinkingLab = () => {
    if (output?.noteId) {
      launchThinkingLabWithOutput(router, output, projectId, widget._id)  // ✅ Use Convex ID (_id) instead of widget_id
    }
  }

  const handleOpenFullDashboard = () => {
    router.push(`/dashboard/living-projects/${projectId}/widgets/${widget._id}`)  // ✅ Use Convex ID (_id) for URL
  }

  const handleRunWidget = async () => {
    if (!widget) return
    
    try {
      await executeWidget({
        widgetId: widget._id,  // ✅ Use Convex ID (_id) instead of widget_id
        projectId
      })
      // Output will appear automatically via the query
    } catch (error) {
      console.error('Failed to run widget:', error)
    }
  }
  
  const handleEditWidget = async () => {
    if (!widget || !userId) return
    
    setIsUpdating(true)
    try {
      await updateWidget({
        projectId: projectId as any,
        userId,
        widgetId: widget._id as any,  // Cast to handle type inference
        updates: {
          title: editForm.title,
          description: editForm.description,
          priority: editForm.priority,
          size: editForm.size,
          theme: editForm.theme,
          update_frequency: editForm.update_frequency
        }
      })
      setIsEditDialogOpen(false)
      // Refresh will happen automatically via the query
    } catch (error) {
      console.error('Failed to update widget:', error)
      alert('Failed to update widget. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }
  
  const handleDeleteWidget = async () => {
    if (!widget || !userId) return
    
    setIsDeleting(true)
    try {
      await deleteWidget({
        projectId: projectId as any,
        userId,
        widgetId: widget._id as any  // Cast to handle type inference
      })
      setIsDeleteDialogOpen(false)
      onClose() // Close the panel after deletion
      // Refresh will happen automatically via the query
    } catch (error) {
      console.error('Failed to delete widget:', error)
      alert('Failed to delete widget. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600 dark:text-red-400'
    if (priority >= 6) return 'text-orange-600 dark:text-orange-400'
    if (priority >= 4) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return 'Critical'
    if (priority >= 6) return 'High'
    if (priority >= 4) return 'Medium'
    return 'Low'
  }

  return (
    <div 
      ref={resizeRef}
      className="fixed inset-y-0 right-0 bg-background/95 backdrop-blur-sm border-l border-border/50 shadow-xl z-30 transform transition-transform duration-300 ease-out"
      style={{ width: `${width}px` }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getWidgetThemeClasses(widget.theme).includes('orange') ? 'bg-orange-400' : getWidgetThemeClasses(widget.theme).includes('blue') ? 'bg-blue-400' : getWidgetThemeClasses(widget.theme).includes('purple') ? 'bg-purple-400' : 'bg-slate-400'}`} />
            <h2 className="text-lg font-semibold text-foreground">{widget.title}</h2>
          </div>
          <button
            title="Close"
            onClick={onClose}
            className="p-2 hover:bg-muted/50 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-sm text-foreground leading-relaxed">{widget.description}</p>
          </div>

          {/* Widget Type & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Type</h3>
              <Badge variant="outline" className="text-xs">
                {widget.widget_type}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Category</h3>
              <Badge variant="outline" className="text-xs">
                {widget.category}
              </Badge>
            </div>
          </div>

          {/* Priority */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Priority</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    widget.priority >= 8 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    widget.priority >= 6 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                    widget.priority >= 4 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                    'bg-gradient-to-r from-green-500 to-green-600'
                  }`}
                  style={{ width: `${(widget.priority / 10) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getPriorityColor(widget.priority)}`}>
                  {getPriorityLabel(widget.priority)}
                </span>
                <span className="text-xs text-muted-foreground">({widget.priority}/10)</span>
              </div>
            </div>
          </div>

          {/* Size & Theme */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Size</h3>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground capitalize">{widget.size}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Theme</h3>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground capitalize">{widget.theme}</span>
              </div>
            </div>
          </div>

          {/* Update Frequency */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Update Frequency</h3>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground capitalize">{widget.update_frequency}</span>
            </div>
          </div>

          {/* Widget ID */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Widget ID</h3>
            <div className="bg-muted/30 rounded-md p-3">
              <code className="text-xs text-muted-foreground font-mono break-all">
                {widget.widget_id}
              </code>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-border/30 space-y-2">
            <Button 
              onClick={handleRunWidget}
              disabled={isRunning}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Widget
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleOpenFullDashboard}
              variant="outline"
              className="w-full"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Open Full Dashboard
            </Button>
          </div>

          {/* Latest Output - Always visible */}
          <div className="pt-4 border-t border-border/30">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Latest Output
            </h3>
            
            {output ? (
              <>
                {/* Launch Thinking Lab Button */}
                {output.noteId && (
                  <Button 
                    onClick={handleLaunchThinkingLab}
                    className="w-full mb-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Launch Thinking Lab
                  </Button>
                )}

                {/* Output Details */}
                <div className="space-y-3 mb-4">
                  <div className="bg-muted/30 rounded-md p-3">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Output ID</div>
                    <code className="text-xs text-foreground font-mono break-all">
                      {output.outputId || output._id}
                    </code>
                  </div>
                  
                  {output.noteId && (
                    <div className="bg-muted/30 rounded-md p-3">
                      <div className="text-xs font-medium text-muted-foreground mb-2">Note ID</div>
                      <code className="text-xs text-foreground font-mono break-all">
                        {output.noteId}
                      </code>
                    </div>
                  )}
                </div>

                {/* Conversation Prompts */}
                {output.prompts && output.prompts.length > 0 ? (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      Conversation Starters ({output.prompts.length})
                    </h4>
                    <div className="space-y-2">
                      {output.prompts.slice(0, 3).map((prompt: any, idx: number) => (
                        <div 
                          key={idx}
                          className="bg-muted/30 rounded-md p-2 text-xs text-foreground/80 hover:bg-muted/50 transition-colors cursor-default"
                        >
                          {prompt.text}
                        </div>
                      ))}
                      {output.prompts.length > 3 && (
                        <div className="text-xs text-muted-foreground/60 text-center">
                          +{output.prompts.length - 3} more prompts
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 text-xs text-muted-foreground/60">
                    No conversation prompts generated
                  </div>
                )}

                {/* Output Timestamp */}
                <div className="text-xs text-muted-foreground/60">
                  Generated {new Date(output.createdAt).toLocaleDateString()} at {new Date(output.createdAt).toLocaleTimeString()}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground/60">
                  {latestOutput === undefined ? 'Loading output data...' : 'No output generated yet. Run this widget to create output.'}
                </div>
                {latestOutput === undefined && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-muted-foreground/50">Fetching latest results...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border/30">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Actions</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Widget
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Widget
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Activity className="w-4 h-4 mr-2" />
                View Activity
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Target className="w-4 h-4 mr-2" />
                Configure Settings
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Updates
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/30">
          <div className="text-xs text-muted-foreground/60 text-center">
            Widget created by AI • Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Edit Widget Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Widget</DialogTitle>
            <DialogDescription>
              Make changes to your widget configuration. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Widget title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Widget description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority (1-10)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="size">Size</Label>
              <Select
                value={editForm.size}
                onValueChange={(value) => setEditForm({ ...editForm, size: value })}
              >
                <SelectTrigger id="size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="xlarge">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={editForm.theme}
                onValueChange={(value) => setEditForm({ ...editForm, theme: value })}
              >
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="clean">Clean</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="update_frequency">Update Frequency</Label>
              <Select
                value={editForm.update_frequency}
                onValueChange={(value) => setEditForm({ ...editForm, update_frequency: value })}
              >
                <SelectTrigger id="update_frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditWidget} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Widget Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Widget</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this widget? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted/30 rounded-md p-4 space-y-2">
              <div className="font-medium">{widget?.title}</div>
              <div className="text-sm text-muted-foreground">{widget?.description}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteWidget}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Widget
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute top-0 left-0 w-1 h-full cursor-ew-resize group z-50 hover:bg-border/50 transition-colors"
        style={{ touchAction: 'none' }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors">
          <GripVertical className="w-4 h-4 rotate-90" />
        </div>
      </div>
    </div>
  )
}
