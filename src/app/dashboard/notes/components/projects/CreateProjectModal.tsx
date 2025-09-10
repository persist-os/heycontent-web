'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, description?: string) => Promise<any>;
  isCreating: boolean;
  defaultName?: string;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onCreateProject,
  isCreating,
  defaultName
}: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Set default name when modal opens with a default name
  useEffect(() => {
    if (isOpen && defaultName) {
      setName(defaultName);
    }
  }, [isOpen, defaultName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await onCreateProject(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg border-border/30">
        {/* Subtle gradient line at top */}
        <div className="h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent mb-8" />
        
        <DialogHeader className="pb-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <DialogTitle className="text-3xl font-light tracking-tight text-foreground">
                {defaultName ? 'New project' : 'Start something'}
                <span className="text-muted-foreground/70 ml-4 text-xl font-light">
                  {defaultName ? 'with note' : 'new'}
                </span>
              </DialogTitle>
              
              <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent w-2/3" />
            </div>
            
            <DialogDescription className="text-muted-foreground/80 leading-relaxed text-base ml-1">
              {defaultName 
                ? 'Transform your selected note into the foundation of a new project workspace.'
                : 'Create a dedicated space where your ideas, conversations, and content can evolve together.'
              }
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="project-name" className="text-sm font-medium text-foreground/90">
                Project name
              </Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={defaultName ? defaultName : "Something meaningful to you..."}
                disabled={isCreating}
                autoFocus
                className="text-base py-3 border-border/50 focus:border-blue-400/60 transition-colors duration-300"
                maxLength={80}
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="project-description" className="text-sm font-medium text-foreground/90">
                Brief context
                <span className="text-muted-foreground/60 ml-2 font-normal">optional</span>
              </Label>
              <Textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A few words about what you're building or exploring..."
                disabled={isCreating}
                rows={3}
                className="text-base border-border/50 focus:border-blue-400/60 transition-colors duration-300 resize-none"
                maxLength={300}
              />
              {description.length > 0 && (
                <div className="text-xs text-muted-foreground/60 text-right">
                  {description.length}/300
                </div>
              )}
            </div>
          </div>
          
          {/* Subtle section divider */}
          <div className="border-b border-border/20 pb-6">
            <div className="text-xs text-muted-foreground/70 space-y-2 ml-1">
              <p className="leading-relaxed">
                <span className="font-medium text-foreground/80">Next:</span> {defaultName ? 'Your note becomes the first piece of project context' : 'Begin with a discovery conversation to understand your goals'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="flex-1 py-3 text-base border-border/50 hover:border-border hover:bg-muted/30 transition-all duration-300"
            >
              Not now
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isCreating}
              className="flex-1 py-3 text-base bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] transition-all duration-300"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  <span>Creating...</span>
                </div>
              ) : (
                defaultName ? 'Create & add note' : 'Begin project'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 