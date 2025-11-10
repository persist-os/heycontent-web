/**
 * WIDGET SETTINGS DIALOG
 * 
 * Modal for editing widget configuration and behavior.
 * Uses Shadcn Dialog component for consistent design.
 */

'use client'

import React, { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { T } from '@/components/translation/T'
import { useTranslation } from '@/hooks/useTranslation'

interface WidgetSettingsDialogProps {
  widget: any
  isOpen: boolean
  onClose: () => void
  projectId: Id<"projects">
  userId: string
}

export function WidgetSettingsDialog({
  widget,
  isOpen,
  onClose,
  projectId,
  userId
}: WidgetSettingsDialogProps) {
  // Form state
  const [title, setTitle] = useState(widget.title || '')
  const [description, setDescription] = useState(widget.description || '')
  const [updateFrequency, setUpdateFrequency] = useState(widget.update_frequency || 'manual')
  const [priority, setPriority] = useState(widget.priority || 5)
  const [scheduleEnabled, setScheduleEnabled] = useState(widget.scheduleEnabled || false)
  const [interactive, setInteractive] = useState(widget.interactive ?? true)
  const [editable, setEditable] = useState(widget.editable ?? true)

  // Mutation
  const updateWidget = useMutation(api.projectWidgetsMutations.updateWidget)
  const [isSaving, setIsSaving] = useState(false)

  // Translated placeholders
  const { text: titlePlaceholder } = useTranslation('Enter widget title', {
    context: 'input.widget.title.placeholder'
  })
  const { text: descriptionPlaceholder } = useTranslation('Enter widget description', {
    context: 'input.widget.description.placeholder'
  })

  // Handle save
  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    if (priority < 1 || priority > 10) {
      toast.error('Priority must be between 1 and 10')
      return
    }

    setIsSaving(true)

    try {
      await updateWidget({
        projectId,
        userId,
        widgetId: widget._id as Id<"widgets">,
        updates: {
          title: title.trim(),
          description: description.trim() || undefined,
          update_frequency: updateFrequency,
          priority: Number(priority),
          scheduleEnabled,
          interactive,
          editable
        }
      })

      toast.success('Widget settings saved', {
        description: 'Your changes have been applied successfully'
      })

      onClose()
    } catch (error) {
      console.error('Failed to save widget settings:', error)
      toast.error('Failed to save settings', {
        description: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    // Reset form to original values
    setTitle(widget.title || '')
    setDescription(widget.description || '')
    setUpdateFrequency(widget.update_frequency || 'manual')
    setPriority(widget.priority || 5)
    setScheduleEnabled(widget.scheduleEnabled || false)
    setInteractive(widget.interactive ?? true)
    setEditable(widget.editable ?? true)
    
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Widget Settings</DialogTitle>
          <DialogDescription>
            Configure widget behavior and appearance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={titlePlaceholder}
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={descriptionPlaceholder}
              rows={3}
              className="w-full resize-none"
            />
          </div>

          {/* Update Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Update Frequency</Label>
            <Select value={updateFrequency} onValueChange={setUpdateFrequency}>
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority (1-10)</Label>
            <Input
              id="priority"
              type="number"
              min={1}
              max={10}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher priority widgets appear first
            </p>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-4 pt-4 border-t border-border">
            {/* Schedule Enabled */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="schedule">Schedule Enabled</Label>
                <p className="text-xs text-muted-foreground">
                  Run widget automatically based on frequency
                </p>
              </div>
              <Switch
                id="schedule"
                checked={scheduleEnabled}
                onCheckedChange={setScheduleEnabled}
              />
            </div>

            {/* Interactive */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="interactive">Interactive</Label>
                <p className="text-xs text-muted-foreground">
                  Allow user interaction with widget
                </p>
              </div>
              <Switch
                id="interactive"
                checked={interactive}
                onCheckedChange={setInteractive}
              />
            </div>

            {/* Editable */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="editable">Editable</Label>
                <p className="text-xs text-muted-foreground">
                  Allow editing widget outputs
                </p>
              </div>
              <Switch
                id="editable"
                checked={editable}
                onCheckedChange={setEditable}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
            <T context="button.cancel">Cancel</T>
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <T context="button.saving">Saving...</T>
              </>
            ) : (
              <T context="button.save_changes">Save Changes</T>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

