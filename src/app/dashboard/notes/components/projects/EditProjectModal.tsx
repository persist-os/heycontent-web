'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { T } from '@/components/translation/T';
import { BaseModal } from '@/components/ui/base-modal';
import { ProjectWithItems } from '../../types/project';

interface EditProjectModalProps {
  project: ProjectWithItems;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject: (name: string, description?: string) => Promise<boolean>;
  isUpdating: boolean;
}

export function EditProjectModal({
  project,
  isOpen,
  onClose,
  onUpdateProject,
  isUpdating
}: EditProjectModalProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');

  // Reset form when project changes
  useEffect(() => {
    setName(project.name);
    setDescription(project.description || '');
  }, [project]);

  const handleConfirm = async () => {
    if (!name.trim()) return;

    try {
      const success = await onUpdateProject(name.trim(), description.trim() || undefined);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleClose = () => {
    setName(project.name);
    setDescription(project.description || '');
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      onCancel={handleClose}
      title="Edit Project"
      titleContext="project.modal.title.edit"
      description="Update your project name and description."
      descriptionContext="project.modal.description.edit"
      confirmText="Update Project"
      confirmContext="button.update_project"
      cancelText="Cancel"
      cancelContext="button.cancel"
      isLoading={isUpdating}
      loadingText="Updating..."
      loadingContext="button.updating"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-project-name" className="text-sm font-medium text-foreground/90">
            <T context="project.modal.label.name">Project Name</T>
          </Label>
          <Input
            id="edit-project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter project name..."
            disabled={isUpdating}
            className="text-base py-3 border-border/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors duration-300"
            autoFocus
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-project-description" className="text-sm font-medium text-foreground/90">
            <T context="project.modal.label.description">Description</T>
            <span className="text-muted-foreground/60 ml-2 font-normal">
              <T context="project.modal.label.optional">optional</T>
            </span>
          </Label>
          <Textarea
            id="edit-project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your project..."
            disabled={isUpdating}
            className="text-base min-h-[90px] resize-none border-border/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors duration-300"
            rows={3}
          />
        </div>
      </div>
    </BaseModal>
  );
} 