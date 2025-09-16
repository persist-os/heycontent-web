'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X } from 'lucide-react'

interface CreateWidgetModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  onCreateWidget: (widgetData: {
    widgetType: string
    title: string
    description: string
    priority: number
    size: string
    theme: string
    config?: any
  }) => Promise<void>
}

const WIDGET_TYPES = [
  { value: 'content_calendar', label: 'Content Calendar', description: 'Track upcoming posts and campaigns' },
  { value: 'data_visualizer', label: 'Analytics Dashboard', description: 'Performance metrics and insights' },
  { value: 'goal_tracker', label: 'Task Manager', description: 'Daily tasks and reminders' },
  { value: 'research_tracker', label: 'Research Tracker', description: 'Track research progress and findings' },
  { value: 'milestone_timeline', label: 'Milestone Timeline', description: 'Project milestones and deadlines' },
  { value: 'collaboration_board', label: 'Collaboration Board', description: 'Team collaboration and notes' },
  { value: 'resource_library', label: 'Resource Library', description: 'Store and organize project resources' },
  { value: 'mood_tracker', label: 'Mood Tracker', description: 'Track team mood and satisfaction' },
  { value: 'time_tracker', label: 'Time Tracker', description: 'Track time spent on project tasks' },
  { value: 'inspiration_board', label: 'Inspiration Board', description: 'Collect and organize inspiration' },
]

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small', description: 'Compact widget for quick info' },
  { value: 'medium', label: 'Medium', description: 'Standard size for most content' },
  { value: 'large', label: 'Large', description: 'Spacious widget for detailed views' },
]

const THEME_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Clean and business-focused' },
  { value: 'creative', label: 'Creative', description: 'Colorful and inspiring' },
  { value: 'clean', label: 'Clean', description: 'Minimal and modern' },
  { value: 'warm', label: 'Warm', description: 'Friendly and approachable' },
]

export function CreateWidgetModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onCreateWidget
}: CreateWidgetModalProps) {
  const [formData, setFormData] = useState({
    widgetType: '',
    title: '',
    description: '',
    priority: 5,
    size: 'medium',
    theme: 'professional',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.widgetType || !formData.title.trim()) {
      return
    }

    setIsLoading(true)
    try {
      await onCreateWidget({
        widgetType: formData.widgetType,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        size: formData.size,
        theme: formData.theme,
        config: {},
      })
      
      // Reset form
      setFormData({
        widgetType: '',
        title: '',
        description: '',
        priority: 5,
        size: 'medium',
        theme: 'professional',
      })
      
      onClose()
    } catch (error) {
      console.error('Failed to create widget:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedWidgetType = WIDGET_TYPES.find(w => w.value === formData.widgetType)

  return (
    <>
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid hsl(var(--background));
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid hsl(var(--background));
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
          background: hsl(var(--muted));
        }
        
        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: hsl(var(--muted));
        }
      `}</style>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Widget
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Add a new widget to <span className="font-medium">"{projectName}"</span>
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Widget Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="widgetType">Widget Type</Label>
            <Select
              value={formData.widgetType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, widgetType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a widget type" />
              </SelectTrigger>
              <SelectContent>
                {WIDGET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedWidgetType && (
              <p className="text-xs text-muted-foreground">
                {selectedWidgetType.description}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Widget Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a descriptive title for your widget"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this widget will track or display"
              rows={3}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Low Priority</span>
                <span className="font-medium">{formData.priority}/10</span>
                <span>High Priority</span>
              </div>
              <input
                type="range"
                id="priority"
                min="1"
                max="10"
                step="1"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(formData.priority - 1) * 11.11}%, hsl(var(--muted)) ${(formData.priority - 1) * 11.11}%, hsl(var(--muted)) 100%)`
                }}
              />
              <p className="text-xs text-muted-foreground">
                Higher priority widgets appear closer to the project center
              </p>
            </div>
          </div>

          {/* Size and Theme */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Select
                value={formData.size}
                onValueChange={(value) => setFormData(prev => ({ ...prev, size: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{size.label}</span>
                        <span className="text-xs text-muted-foreground">{size.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={formData.theme}
                onValueChange={(value) => setFormData(prev => ({ ...prev, theme: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{theme.label}</span>
                        <span className="text-xs text-muted-foreground">{theme.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.widgetType || !formData.title.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Widget'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
