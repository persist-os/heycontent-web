'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (name: string, description?: string) => void
}

export function CreateProjectModal({ isOpen, onClose, onCreateProject }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    try {
      onCreateProject(name.trim(), description.trim() || undefined)
      // Reset form
      setName('')
      setDescription('')
      onClose()
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-light text-foreground">Start a project</DialogTitle>
          <DialogDescription className="text-muted-foreground/80 leading-relaxed mt-2">
            Give your project a name and brief description. You'll develop its intelligence through conversation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-sm font-medium">
              Project Name *
            </Label>
            <Input
              id="project-name"
              placeholder="e.g., Content Strategy for Q1, Personal Blog Launch..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              autoFocus
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description" className="text-sm font-medium">
              Brief Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="project-description"
              placeholder="A brief overview of what you're trying to achieve..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </div>
          </div>

          <div className="border-t border-border/30 pt-4">
            <div className="text-xs text-muted-foreground/70 space-y-2">
              <p>
                <span className="font-medium">Next:</span> Discovery conversation to understand your goals and working style
              </p>
              <p>
                <span className="font-medium">Then:</span> Your project develops its own intelligence and custom interface
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-foreground text-background hover:bg-foreground/90"
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Begin discovery'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
