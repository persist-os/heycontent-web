'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FileText, MessageSquare, Plus, X } from 'lucide-react'
import { ContentAttachmentPanel } from '../[projectId]/widgets/[widgetId]/components/ContentAttachmentPanel'
import { T } from '@/components/translation/T'
import { useTranslation } from '@/hooks/useTranslation'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (name: string, description?: string, noteIds?: string[], conversationIds?: string[], crystalIds?: string[], shardIds?: string[]) => Promise<string>
  userId: string
  isCreating?: boolean
  defaultName?: string
}

export function CreateProjectModal({ 
  isOpen, 
  onClose, 
  onCreateProject, 
  userId,
  isCreating: externalIsCreating,
  defaultName 
}: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [internalIsLoading, setInternalIsLoading] = useState(false)
  const [showContentSelector, setShowContentSelector] = useState(false)
  const [attachedNoteIds, setAttachedNoteIds] = useState<string[]>([])
  const [attachedConversationIds, setAttachedConversationIds] = useState<string[]>([])
  const [attachedCrystalIds, setAttachedCrystalIds] = useState<string[]>([])
  const [attachedShardIds, setAttachedShardIds] = useState<string[]>([])

  // Use external isCreating if provided, otherwise use internal state
  const isLoading = externalIsCreating !== undefined ? externalIsCreating : internalIsLoading

  // Set default name when modal opens with a default name
  useEffect(() => {
    if (isOpen && defaultName) {
      setName(defaultName)
    }
  }, [isOpen, defaultName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (externalIsCreating === undefined) {
      setInternalIsLoading(true)
    }
    
    try {
      // Create project with all attached content
      await onCreateProject(
        name.trim(), 
        description.trim() || undefined,
        attachedNoteIds.length > 0 ? attachedNoteIds : undefined,
        attachedConversationIds.length > 0 ? attachedConversationIds : undefined,
        attachedCrystalIds.length > 0 ? attachedCrystalIds : undefined,
        attachedShardIds.length > 0 ? attachedShardIds : undefined
      )
      
      // Reset form
      setName('')
      setDescription('')
      setAttachedNoteIds([])
      setAttachedConversationIds([])
      setAttachedCrystalIds([])
      setAttachedShardIds([])
      onClose()
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      if (externalIsCreating === undefined) {
        setInternalIsLoading(false)
      }
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setAttachedNoteIds([])
    setAttachedConversationIds([])
    setAttachedCrystalIds([])
    setAttachedShardIds([])
    setShowContentSelector(false)
    onClose()
  }

  const removeNote = (noteId: string) => {
    setAttachedNoteIds(prev => prev.filter(id => id !== noteId))
  }

  const removeConversation = (convId: string) => {
    setAttachedConversationIds(prev => prev.filter(id => id !== convId))
  }
  
  const removeCrystal = (crystalId: string) => {
    setAttachedCrystalIds(prev => prev.filter(id => id !== crystalId))
  }
  
  const removeShard = (shardId: string) => {
    setAttachedShardIds(prev => prev.filter(id => id !== shardId))
  }
  
  const totalAttached = attachedNoteIds.length + attachedConversationIds.length + attachedCrystalIds.length + attachedShardIds.length

  // Translated texts
  const { text: projectNamePlaceholder } = useTranslation(
    defaultName || "Content Strategy Q1, Personal Blog, Creative Workshop...",
    { targetLang: 'en', context: 'project.modal.placeholder.name' }
  )
  const { text: descriptionPlaceholder } = useTranslation(
    defaultName ? "A few words about what you're building..." : "What are you hoping to build or explore together...",
    { targetLang: 'en', context: 'project.modal.placeholder.description' }
  )

  return (
    <>
      <Dialog open={isOpen && !showContentSelector} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg border-border/30">
          {/* Gradient line at top */}
          <div className="h-px bg-gradient-to-r from-primary/40 via-primary/20 to-transparent w-3/4 mb-8" />
          
          <DialogHeader className="pb-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <DialogTitle className="text-3xl font-light tracking-tight text-foreground">
                  {defaultName ? (
                    <T context="project.modal.title.new">New project</T>
                  ) : (
                    <T context="project.modal.title.living">Living project</T>
                  )}
                </DialogTitle>
                
                <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent w-2/3" />
              </div>
              
              <DialogDescription className="text-muted-foreground/80 leading-relaxed text-base ml-1">
                {defaultName ? (
                  <T context="project.modal.description.transform">
                    Transform your selected note into the foundation of a new project workspace.
                  </T>
                ) : (
                  <T context="project.modal.description.evolve">
                    Name your project and give it some initial context. It will evolve through discovery conversations.
                  </T>
                )}
              </DialogDescription>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="project-name" className="text-sm font-medium text-foreground/90">
                  <T context="project.modal.label.name">Project name</T>
                </Label>
                <Input
                  id="project-name"
                  placeholder={projectNamePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-base py-3 border-border/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors duration-300"
                  autoFocus
                  maxLength={100}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="project-description" className="text-sm font-medium text-foreground/90">
                  {defaultName ? (
                    <T context="project.modal.label.brief_context">Brief context</T>
                  ) : (
                    <T context="project.modal.label.initial_direction">Initial direction</T>
                  )}
                  <span className="text-muted-foreground/60 ml-2 font-normal">
                    <T context="project.modal.label.optional">optional</T>
                  </span>
                </Label>
                <Textarea
                  id="project-description"
                  placeholder={descriptionPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-base min-h-[90px] resize-none border-border/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors duration-300"
                  maxLength={500}
                  disabled={isLoading}
                />
                {description.length > 0 && (
                  <div className="text-xs text-muted-foreground/60 text-right">
                    {description.length}/500
                  </div>
                )}
              </div>
            </div>

            {/* Attach content section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground/90">
                  <T context="project.modal.label.attach_content">Attach content</T>
                  <span className="text-muted-foreground/60 ml-2 font-normal">
                    <T context="project.modal.label.optional">optional</T>
                  </span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowContentSelector(true)}
                  className="text-xs gap-2 border-border/50 hover:border-primary/60 hover:bg-primary/5 transition-colors duration-300"
                  disabled={isLoading}
                >
                  <Plus className="w-3 h-3" />
                  <T context="project.modal.button.add_content">Add content</T>
                </Button>
              </div>

              {totalAttached > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachedNoteIds.map((noteId) => (
                    <div key={noteId} className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/30 rounded text-xs text-foreground">
                      <FileText className="w-3 h-3" />
                      <span><T context="project.modal.content.note">Note</T></span>
                      <button
                        type="button"
                        onClick={() => removeNote(noteId)}
                        className="ml-1 hover:text-destructive transition-colors"
                        aria-label="Remove note"
                        title="Remove note"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {attachedConversationIds.map((convId) => (
                    <div key={convId} className="flex items-center gap-1.5 px-2 py-1 bg-accent/10 border border-accent/30 rounded text-xs text-foreground">
                      <MessageSquare className="w-3 h-3" />
                      <span><T context="project.modal.content.conversation">Conversation</T></span>
                      <button
                        type="button"
                        onClick={() => removeConversation(convId)}
                        className="ml-1 hover:text-destructive transition-colors"
                        aria-label="Remove conversation"
                        title="Remove conversation"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {attachedCrystalIds.map((crystalId) => (
                    <div key={crystalId} className="flex items-center gap-1.5 px-2 py-1 bg-secondary/30 border border-secondary/50 rounded text-xs text-foreground">
                      <span>💎</span>
                      <span><T context="project.modal.content.crystal">Crystal</T></span>
                      <button
                        type="button"
                        onClick={() => removeCrystal(crystalId)}
                        className="ml-1 hover:text-destructive transition-colors"
                        aria-label="Remove crystal"
                        title="Remove crystal"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {attachedShardIds.map((shardId) => (
                    <div key={shardId} className="flex items-center gap-1.5 px-2 py-1 bg-muted border border-border rounded text-xs text-foreground">
                      <span>✨</span>
                      <span><T context="project.modal.content.shard">Shard</T></span>
                      <button
                        type="button"
                        onClick={() => removeShard(shardId)}
                        className="ml-1 hover:text-destructive transition-colors"
                        aria-label="Remove shard"
                        title="Remove shard"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 py-3 text-base border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-300"
                disabled={isLoading}
              >
                {defaultName ? (
                  <T context="project.modal.button.not_now">Not now</T>
                ) : (
                  <T context="project.modal.button.maybe_later">Maybe later</T>
                )}
              </Button>
              <Button
                type="submit"
                className="flex-1 py-3 text-base bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] transition-all duration-300"
                disabled={!name.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    <span><T context="project.modal.button.creating">Creating...</T></span>
                  </div>
                ) : (
                  defaultName ? (
                    <T context="project.modal.button.create_project">Create project</T>
                  ) : (
                    <T context="project.modal.button.begin_discovery">Begin discovery</T>
                  )
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Content Attachment Panel in Selection Mode */}
      <ContentAttachmentPanel
        isOpen={showContentSelector}
        onClose={() => setShowContentSelector(false)}
        userId={userId}
        attachedNoteIds={attachedNoteIds}
        attachedConversationIds={attachedConversationIds}
        attachedCrystalIds={attachedCrystalIds}
        attachedShardIds={attachedShardIds}
        onAttachmentsChange={(noteIds, convIds, crystalIds, shardIds) => {
          setAttachedNoteIds(noteIds)
          setAttachedConversationIds(convIds)
          setAttachedCrystalIds(crystalIds)
          setAttachedShardIds(shardIds)
        }}
      />
    </>
  )
}