'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, UserPlus, Check, AlertCircle, Trash2, Users } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { cn } from '@/lib/utils';

interface ProjectCollaboratorsModalProps {
  projectId: Id<'projects'>;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Collaborator {
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: number;
  addedBy: string;
}

export function ProjectCollaboratorsModal({ 
  projectId, 
  projectName, 
  isOpen, 
  onClose 
}: ProjectCollaboratorsModalProps) {
  const [userId, setUserId] = useState<string | null>(null);
  
  // Get userId from cookie/API key
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await getCurrentUserId();
        setUserId(id);
      } catch (error) {
        console.error('Failed to get user ID:', error);
      }
    };
    fetchUserId();
  }, []);
  
  // Get user info from Convex
  const userInfo = useQuery(
    api.userQueries.getUserInfo,
    userId ? { userId } : 'skip'
  );

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'owner' | 'editor' | 'viewer'>('editor');
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Get user permission to determine what actions they can take
  const userPermission = useQuery(
    api.contentAccessHelpers.getUserContentPermission,
    userId ? {
      userId,
      contentType: 'project',
      contentId: projectId,
    } : 'skip'
  );

  // Convex hooks
  const addCollaborator = useMutation(api.projectsMutations.addProjectCollaborator)
    .withOptimisticUpdate((localStore, args) => {
      const project = localStore.getQuery(api.projectsQueries.getById, {
        projectId: args.projectId,
        userId: args.invitedByUserId,
      });
      if (project) {
        localStore.setQuery(api.projectsQueries.getById, {
          projectId: args.projectId,
          userId: args.invitedByUserId,
        }, {
          ...project,
          collaborators: [...(project.collaborators || []), {
            userId: args.invitedEmail, // Temporary, will be replaced by actual user
            role: args.role,
            addedAt: Date.now(),
            addedBy: args.invitedByUserId,
          }],
        });
      }
    });

  const removeCollaborator = useMutation(api.projectsMutations.removeProjectCollaborator);
  const collaborators = useQuery(
    api.projectsQueries.getProjectCollaborators,
    userId ? { projectId, requestingUserId: userId } : 'skip'
  ) as Collaborator[] | undefined;

  if (!isOpen || !userId) return null;

  const canInvite = userPermission === 'owner' || userPermission === 'editor';
  const canRemove = userPermission === 'owner';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSharing) return;

    setIsSharing(true);
    setShareMessage(null);

    try {
      const result = await addCollaborator({
        projectId,
        invitedByUserId: userId,
        invitedEmail: email.trim(),
        role,
      });

      if (result.success) {
        setShareMessage({ type: 'success', text: result.message });
        setEmail('');
        setRole('editor');
      } else {
        setShareMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error adding collaborator:', error);
      setShareMessage({ 
        type: 'error', 
        text: 'Failed to add collaborator. Please try again.' 
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemove = async (collaboratorUserId: string) => {
    if (!canRemove) return;

    setIsSharing(true);
    setShareMessage(null);

    try {
      const result = await removeCollaborator({
        projectId,
        removedByUserId: userId,
        collaboratorUserId,
      });

      if (result.success) {
        setShareMessage({ type: 'success', text: result.message });
      } else {
        setShareMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error removing collaborator:', error);
      setShareMessage({ 
        type: 'error', 
        text: 'Failed to remove collaborator. Please try again.' 
      });
    } finally {
      setIsSharing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleLabel = (role: 'owner' | 'editor' | 'viewer') => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'editor':
        return 'Can edit';
      case 'viewer':
        return 'Can view';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Share Project
            </h2>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Close share modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Role Selection */}
          {canInvite && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Permission
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setRole('viewer')}
                    className={cn(
                      "flex-1 px-3 py-2 text-sm rounded-md border transition-colors",
                      role === 'viewer'
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    )}
                    disabled={isSharing}
                  >
                    Can view
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('editor')}
                    className={cn(
                      "flex-1 px-3 py-2 text-sm rounded-md border transition-colors",
                      role === 'editor'
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    )}
                    disabled={isSharing}
                  >
                    Can edit
                  </button>
                  {userPermission === 'owner' && (
                    <button
                      type="button"
                      onClick={() => setRole('owner')}
                      className={cn(
                        "flex-1 px-3 py-2 text-sm rounded-md border transition-colors",
                        role === 'owner'
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      )}
                      disabled={isSharing}
                    >
                      Owner
                    </button>
                  )}
                </div>
              </div>

              {/* Email Invite Form */}
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Share with email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={isSharing}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!email.trim() || isSharing}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {isSharing ? 'Adding...' : 'Add Collaborator'}
                  </span>
                </button>
              </form>
            </>
          )}

          {!canInvite && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              You don't have permission to invite collaborators.
            </div>
          )}

          {/* Status Message */}
          {shareMessage && (
            <div className={cn(
              "flex items-center space-x-2 p-3 rounded-md text-sm",
              shareMessage.type === 'success' 
                ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
            )}>
              {shareMessage.type === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{shareMessage.text}</span>
            </div>
          )}

          {/* Collaborators List */}
          {collaborators && collaborators.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">
                Collaborators ({collaborators.length})
              </h3>
              <div className="space-y-2">
                {collaborators.map((collab) => (
                  <div
                    key={collab.userId}
                    className="flex items-center justify-between p-3 bg-muted rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {collab.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {collab.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getRoleLabel(collab.role)} • Added {formatDate(collab.addedAt)}
                      </p>
                    </div>
                    {canRemove && collab.role !== 'owner' && (
                      <button
                        onClick={() => handleRemove(collab.userId)}
                        className="ml-2 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
                        title="Remove collaborator"
                        aria-label={`Remove ${collab.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

