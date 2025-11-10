'use client'

import React, { useState } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { generateWidget, type WidgetGenerationRequest } from '@/lib/services/widgetService'
import { T } from '@/components/translation/T'

interface SpawnWidgetDialogProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: (widgetsId: string) => void
}

export function SpawnWidgetDialog({
  projectId,
  isOpen,
  onClose,
  onSuccess
}: SpawnWidgetDialogProps) {
  const [description, setDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe the widget family you want to create')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const params: WidgetGenerationRequest = {
        projectId,
        widgetDescription: description
      }

      const result = await generateWidget(params)

      if (result.success && result.widgets_id) {
        onSuccess?.(result.widgets_id)
        onClose()
        setDescription('')
      } else {
        setError(result.error || 'Widget generation failed')
      }
    } catch (err) {
      console.error('[SpawnWidgetDialog] Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate widget')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                <T context="spawn_widget.title">Spawn Widget Family</T>
              </h2>
              <p className="text-sm text-muted-foreground">
                <T context="spawn_widget.subtitle">Describe the widget family you want to create</T>
              </p>
            </div>
          </div>
				  <button
					title="Close"
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={isGenerating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <T context="spawn_widget.label">Widget Family Description</T>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: I need a timeline tracker to organize events chronologically..."
              className="w-full h-32 px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              disabled={isGenerating}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              <T context="spawn_widget.hint">
                Describe what you want the widget family to do. Be as specific as possible about the capabilities and purpose.
              </T>
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Examples */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">
              <T context="spawn_widget.examples_title">Examples:</T>
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                • <T context="spawn_widget.example.timeline">Timeline tracker to organize events chronologically</T>
              </li>
              <li>
                • <T context="spawn_widget.example.task">Task tracker to monitor progress and milestones</T>
              </li>
              <li>
                • <T context="spawn_widget.example.research">Research coordinator to gather and organize information</T>
              </li>
              <li>
                • <T context="spawn_widget.example.analysis">Analysis agent to provide insights and recommendations</T>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
            disabled={isGenerating}
          >
            <T context="spawn_widget.button.cancel">Cancel</T>
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim()}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <T context="spawn_widget.button.generating">Generating...</T>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <T context="spawn_widget.button.generate">Generate Widget Family</T>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

