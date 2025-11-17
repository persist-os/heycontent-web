'use client'

import React, { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { BaseModal } from '@/components/ui/base-modal'
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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleGenerate}
      onCancel={onClose}
      title="Spawn Widget Family"
      titleContext="spawn_widget.title"
      description="Describe the widget family you want to create"
      descriptionContext="spawn_widget.subtitle"
      confirmText="Generate Widget Family"
      confirmContext="spawn_widget.button.generate"
      cancelText="Cancel"
      cancelContext="spawn_widget.button.cancel"
      variant="spawn-widget"
      isLoading={isGenerating}
      loadingText="Generating..."
      loadingContext="spawn_widget.button.generating"
      maxWidth="2xl"
    >
      <div className="space-y-4">
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
    </BaseModal>
  )
}

