'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectWithItems } from '../../types/project';
import { useProjectDetails } from '../../hooks/useProjectDetails';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '@/app/context/auth-context';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Plus } from 'lucide-react';
import { AttachmentPanel } from './AttachmentPanel';
import { ProjectItemsGrid } from './ProjectItemsGrid';
import { EditProjectModal } from './EditProjectModal';
import toast from 'react-hot-toast';

interface ProjectDetailPageProps {
  projectId: Id<"projects">;
}

export function ProjectDetailPage({ projectId }: ProjectDetailPageProps) {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { project, isLoading } = useProjectDetails(projectId);
  const { deleteProject, updateProject, isUpdating } = useProjects(firebaseUser?.uid);
  
  const [showAttachmentPanel, setShowAttachmentPanel] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    if (!project) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      const success = await deleteProject(projectId);
      if (success) {
        router.push('/dashboard/notes');
      }
    }
  };

  const handleUpdateProject = async (name: string, description?: string) => {
    const success = await updateProject(projectId, { name, description });
    if (success) {
      setShowEditModal(false);
    }
    return success;
    };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="w-16 h-8 bg-muted rounded animate-pulse"></div>
            <div>
              <div className="w-48 h-8 bg-muted rounded animate-pulse mb-2"></div>
              <div className="w-72 h-4 bg-muted rounded animate-pulse mb-2"></div>
              <div className="w-32 h-3 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-8 bg-muted rounded animate-pulse"></div>
            <div className="w-16 h-8 bg-muted rounded animate-pulse"></div>
            <div className="w-20 h-8 bg-muted rounded animate-pulse"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-background border border-border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-muted rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-muted rounded animate-pulse mb-2"></div>
                    <div className="w-24 h-3 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-muted rounded animate-pulse"></div>
                  <div className="w-3/4 h-3 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-lg font-semibold text-foreground mb-2">Project not found</h2>
        <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const itemCount = 
    (project.attachedItems?.notes?.length || 0) + 
    (project.attachedItems?.conversations?.length || 0) + 
    (project.attachedItems?.instagramPosts?.length || 0) + 
    (project.attachedItems?.youtubeVideos?.length || 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {itemCount} item{itemCount !== 1 ? 's' : ''} • Created {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAttachmentPanel(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Items
          </Button>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDelete}
            className="hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {itemCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No items yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Start organizing your content by adding notes, conversations, and other items to this project.
            </p>
            <Button onClick={() => setShowAttachmentPanel(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Item
            </Button>
          </div>
        ) : (
          <ProjectItemsGrid project={project} />
        )}
      </div>

      {/* Attachment Panel */}
      {showAttachmentPanel && (
        <AttachmentPanel
          projectId={projectId}
          project={project}
          isOpen={showAttachmentPanel}
          onClose={() => setShowAttachmentPanel(false)}
        />
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <EditProjectModal
          project={project}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdateProject={handleUpdateProject}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
} 