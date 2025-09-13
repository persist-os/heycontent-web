'use client';

import React, { useState } from 'react';
import { X, Mail, UserPlus, Check, AlertCircle, Trash2 } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/app/context/auth-context';
import { cn } from '@/lib/utils';

interface ShareNoteModalProps {
  noteId: Id<'notes'>;
  noteTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface SharedUser {
  userId: string;
  name: string;
  email: string;
  permission: 'read' | 'edit';
  sharedAt: number;
  sharedBy: string;
}

export function ShareNoteModal({ noteId, noteTitle, isOpen, onClose }: ShareNoteModalProps) {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;

  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'read' | 'edit'>('read');
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Convex hooks
  const shareNote = useMutation(api.noteSharing.shareNote);
  const revokeAccess = useMutation(api.noteSharing.revokeNoteAccess);
  const sharedUsers = useQuery(
    api.noteSharing.getNoteSharedUsers,
    userId ? { noteId, requestingUserId: userId } : 'skip'
  ) as SharedUser[] | undefined;

  if (!isOpen || !userId) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSharing) return;

    setIsSharing(true);
    setShareMessage(null);

    try {
      const result = await shareNote({
        noteId,
        sharedWithEmail: email.trim(),
        permission,
        sharedBy: userId,
      });

      if (result.success) {
        setShareMessage({ type: 'success', text: result.message });
        setEmail('');
        setPermission('read');
      } else {
        setShareMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error sharing note:', error);
      setShareMessage({ 
        type: 'error', 
        text: 'Failed to share note. Please try again.' 
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeAccess = async (revokedUserId: string) => {
    try {
      const result = await revokeAccess({
        noteId,
        revokedUserId,
        revokedBy: userId,
      });

      if (result.success) {
        setShareMessage({ type: 'success', text: result.message });
      } else {
        setShareMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      setShareMessage({ 
        type: 'error', 
        text: 'Failed to revoke access. Please try again.' 
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Share Note</h2>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {noteTitle}
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
          {/* Share Form */}
          <form onSubmit={handleShare} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Share with
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Permission
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setPermission('read')}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm rounded-md border transition-colors",
                    permission === 'read'
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  )}
                  disabled={isSharing}
                >
                  Can view
                </button>
                <button
                  type="button"
                  onClick={() => setPermission('edit')}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm rounded-md border transition-colors",
                    permission === 'edit'
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  )}
                  disabled={isSharing}
                >
                  Can edit
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!email.trim() || isSharing}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSharing ? 'Sharing...' : 'Share Note'}</span>
            </button>
          </form>

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

          {/* Shared Users List */}
          {sharedUsers && sharedUsers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">
                Shared with ({sharedUsers.length})
              </h3>
              <div className="space-y-2">
                {sharedUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 bg-muted rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.permission === 'edit' ? 'Can edit' : 'Can view'} • Shared {formatDate(user.sharedAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevokeAccess(user.userId)}
                      className="ml-2 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
                      title="Remove access"
                      aria-label={`Remove access for ${user.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
