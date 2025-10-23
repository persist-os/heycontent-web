import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { Edit3, Trash2, Save, X, ExternalLink } from 'lucide-react';
import { T } from '@/components/translation';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface StarCardProps {
  project: {
    _id: string;
    name: string;
    description?: string;
    noteCount: number;
    conversationCount: number;
    crystalCount: number;
    shardCount: number;
    totalContent: number;
    hasFingerprintId: boolean;
    fingerprintId?: string;
    createdAt: number;
    updatedAt: number;
  };
}

export const StarCard: React.FC<StarCardProps> = ({ project }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editedProject, setEditedProject] = useState({
    name: project.name,
    description: project.description || '',
  });
  const router = useRouter();

  // Fetch fingerprint if exists
  const fingerprint = useQuery(
    api.projectFingerprintQueries.getByProject,
    project.fingerprintId ? { projectId: project._id as any } : 'skip'
  );

  // Mutations
  const updateProject = useMutation(api.projectsMutations.updateProject);
  const deleteProject = useMutation(api.projectsMutations.deleteProject);

  const handleOpenConstellation = () => {
    router.push(`/dashboard/living-projects/${project._id}`);
  };

  const handleSave = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        toast.error('Authentication required');
        return;
      }

      await updateProject({
        projectId: project._id as any,
        userId,
        updates: {
          name: editedProject.name,
          description: editedProject.description,
        },
      });

      toast.success('Star updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating star:', error);
      toast.error('Failed to update star');
    }
  };

  const handleCancel = () => {
    setEditedProject({
      name: project.name,
      description: project.description || '',
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        toast.error('Authentication required');
        return;
      }

      await deleteProject({
        projectId: project._id as any,
        userId,
      });

      toast.success('Star deleted successfully');
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting star:', error);
      toast.error('Failed to delete star');
    }
  };

  return (
    <div className="border border-border/50 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-medium text-foreground">{project.name}</h4>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20 rounded-md transition-colors"
                  title="Save changes"
                >
                  <Save className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  title="Cancel editing"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleOpenConstellation}
                  className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/20 rounded-md transition-colors"
                  title="Open in constellation"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  title="Edit star"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                  title="Delete star"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
        {isEditing ? (
          <>
            <input
              type="text"
              value={editedProject.name}
              onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
              className="w-full text-lg font-medium text-foreground bg-muted/20 px-3 py-2 rounded-lg border border-border/50 focus:border-border focus:outline-none"
              placeholder="Star name..."
            />
            <textarea
              value={editedProject.description}
              onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
              className="w-full text-sm text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg border border-border/50 focus:border-border focus:outline-none resize-none"
              rows={2}
              placeholder="Star description..."
            />
          </>
        ) : (
          project.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {project.description}
            </p>
          )
        )}
      </div>

      {/* Content Stats */}
      {project.totalContent > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {project.noteCount > 0 && (
            <span className="px-2 py-1 bg-muted/30 rounded">
              {project.noteCount} <T context={`star.content.note${project.noteCount === 1 ? '' : 's'}`}>{project.noteCount === 1 ? 'note' : 'notes'}</T>
            </span>
          )}
          {project.conversationCount > 0 && (
            <span className="px-2 py-1 bg-muted/30 rounded">
              {project.conversationCount} <T context={`star.content.chat${project.conversationCount === 1 ? '' : 's'}`}>{project.conversationCount === 1 ? 'chat' : 'chats'}</T>
            </span>
          )}
          {project.crystalCount > 0 && (
            <span className="px-2 py-1 bg-muted/30 rounded">
              {project.crystalCount} <T context={`star.content.crystal${project.crystalCount === 1 ? '' : 's'}`}>{project.crystalCount === 1 ? 'crystal' : 'crystals'}</T>
            </span>
          )}
          {project.shardCount > 0 && (
            <span className="px-2 py-1 bg-muted/30 rounded">
              {project.shardCount} <T context={`star.content.shard${project.shardCount === 1 ? '' : 's'}`}>{project.shardCount === 1 ? 'shard' : 'shards'}</T>
            </span>
          )}
        </div>
      )}

      {/* Fingerprint Intelligence */}
      {project.hasFingerprintId && fingerprint && (
        <div className="space-y-3 pt-2">
          <div className="border-t border-border/30 pt-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-medium text-foreground uppercase tracking-wide hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <T context="star.fingerprint.title">Fingerprint</T> {isExpanded ? '−' : '+'}
            </button>
          </div>

          {isExpanded && (
            <div className="space-y-3">
              {fingerprint.core_intention && (
                <div className="space-y-1">
                  <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">
                    <T context="star.fingerprint.core_intention">Core Intention</T>
                  </h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {fingerprint.core_intention}
                  </p>
                </div>
              )}

              {fingerprint.working_style && (
                <div className="space-y-1">
                  <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">
                    <T context="star.fingerprint.working_style">Working Style</T>
                  </h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {fingerprint.working_style}
                  </p>
                </div>
              )}

              {fingerprint.primary_pattern && (
                <div className="space-y-1">
                  <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">
                    <T context="star.fingerprint.primary_pattern">Primary Pattern</T>
                  </h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {fingerprint.primary_pattern}
                  </p>
                </div>
              )}

              {fingerprint.time_horizon && (
                <div className="space-y-1">
                  <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">
                    <T context="star.fingerprint.time_horizon">Time Horizon</T>
                  </h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {fingerprint.time_horizon}
                  </p>
                </div>
              )}

              {fingerprint.domain && (
                <div className="space-y-1">
                  <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">
                    <T context="star.fingerprint.domain">Domain</T>
                  </h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {fingerprint.domain}
                  </p>
                </div>
              )}

              {fingerprint.success_vision && (
                <div className="space-y-1">
                  <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">
                    <T context="star.fingerprint.success_vision">Success Vision</T>
                  </h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {fingerprint.success_vision}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer Metadata */}
      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
        <span><T context="star.metadata.updated">Updated</T> {formatRelativeTime(project.updatedAt)}</span>
        {project.hasFingerprintId && (
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded">
            <T context="star.metadata.intelligent">intelligent</T>
          </span>
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Star"
        titleContext="star.delete_confirm.title"
        description="Are you sure you want to delete this star? This will remove the project but keep all associated content (notes, crystals, etc.). This action cannot be undone."
        descriptionContext="star.delete_confirm.description"
        confirmText="Delete"
        confirmContext="button.delete"
        cancelText="Cancel"
        cancelContext="button.cancel"
        variant="destructive"
      />
    </div>
  );
};

// Helper function to format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  
  return new Date(timestamp).toLocaleDateString();
}


