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
      <DialogContent className="sm:max-w-lg border-border/30">
        {/* Asymmetric gradient line at top */}
        <div className="h-px bg-gradient-to-r from-blue-400/60 via-transparent to-transparent w-3/4 mb-8" />
        
        <DialogHeader className="pb-8">
          <div className="space-y-6">
            {/* Asymmetric header layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-end">
              <div className="lg:col-span-3 space-y-3">
                <div className="flex items-baseline gap-4">
                  <DialogTitle className="text-4xl font-light tracking-tight text-foreground">
                    Living
                  </DialogTitle>
                  <div className="h-px bg-border/40 flex-1 mb-2" />
                </div>
                <h2 className="text-2xl font-medium text-muted-foreground ml-6">
                  project
                </h2>
              </div>
              <div className="lg:col-span-2">
                <div className="text-xs text-muted-foreground/60 leading-relaxed">
                  Evolves through conversation
                </div>
              </div>
            </div>
            
            <DialogDescription className="text-muted-foreground/80 leading-relaxed text-base ml-1 mt-6">
              Name your project and give it some initial context. Through discovery conversations, 
              it will develop its own intelligence and custom interface.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="project-name" className="text-sm font-medium text-foreground/90">
                What should we call it?
              </Label>
              <Input
                id="project-name"
                placeholder="Content Strategy Q1, Personal Blog, Creative Workshop..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-base py-3 border-border/50 focus:border-blue-400/60 transition-colors duration-300"
                autoFocus
                maxLength={100}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="project-description" className="text-sm font-medium text-foreground/90">
                Initial direction
                <span className="text-muted-foreground/60 ml-2 font-normal">optional</span>
              </Label>
              <Textarea
                id="project-description"
                placeholder="What are you hoping to build or explore together..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-base min-h-[90px] resize-none border-border/50 focus:border-blue-400/60 transition-colors duration-300"
                maxLength={500}
              />
              {description.length > 0 && (
                <div className="text-xs text-muted-foreground/60 text-right">
                  {description.length}/500
                </div>
              )}
            </div>
          </div>

          {/* Content block with subtle border */}
          <div className="bg-muted/20 p-6 rounded border-l-2 border-blue-400/60">
            <div className="text-xs text-muted-foreground/70 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-blue-400/60 mt-2 flex-shrink-0" />
                <p className="leading-relaxed">
                  <span className="font-medium text-foreground/80">Discovery phase:</span> We'll have a conversation to understand your goals, working style, and what success looks like
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-amber-400/60 mt-2 flex-shrink-0" />
                <p className="leading-relaxed">
                  <span className="font-medium text-foreground/80">Evolution:</span> Your project develops its own intelligence, custom tools, and interface based on how you work
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 py-3 text-base border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-300"
              disabled={isLoading}
            >
              Maybe later
            </Button>
            <Button
              type="submit"
              className="flex-1 py-3 text-base bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] transition-all duration-300"
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  <span>Creating...</span>
                </div>
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
