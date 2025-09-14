'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Settings, Trash2, Edit3, Lock, MoreVertical, UserX, Shield } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';

interface ContentAccessManagerProps {
  contentType: 'note' | 'project';
  contentId: string;
  contentTitle: string;
  isOwner: boolean;
  className?: string;
}

interface SharedUser {
  userId: string;
  name: string;
  email: string;
  permission: 'read' | 'edit';
  sharedAt: number;
  sharedBy: string;
}

type Permission = 'read' | 'edit';

export const ContentAccessManager: React.FC<ContentAccessManagerProps> = ({
  contentType,
  contentId,
  contentTitle,
  isOwner,
  className
}) => {
  const { firebaseUser } = useAuth();
  const [updatingPermissions, setUpdatingPermissions] = useState<string | null>(null);

  // Get current shared users
  const sharedUsers = useQuery(api.noteSharing.getNoteSharedUsers,
    firebaseUser?.uid && contentType === 'note' ? {
      noteId: contentId as Id<"notes">,
      requestingUserId: firebaseUser.uid
    } : "skip"
  );

  // Mutations
  const shareNote = useMutation(api.noteSharing.shareNote);
  const revokeNoteAccess = useMutation(api.noteSharing.revokeNoteAccess);

  const handlePermissionChange = async (userId: string, userEmail: string, newPermission: Permission) => {
    if (!firebaseUser?.uid || !isOwner) return;

    setUpdatingPermissions(userId);
    
    try {
      if (contentType === 'note') {
        await shareNote({
          noteId: contentId as Id<"notes">,
          sharedWithEmail: userEmail,
          permission: newPermission,
          sharedBy: firebaseUser.uid
        });
      }
      // TODO: Add project permission update logic when available
    } catch (error) {
      console.error('Failed to update permissions:', error);
    } finally {
      setUpdatingPermissions(null);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!firebaseUser?.uid || !isOwner) return;

    try {
      if (contentType === 'note') {
        await revokeNoteAccess({
          noteId: contentId as Id<"notes">,
          revokedUserId: userId,
          revokedBy: firebaseUser.uid
        });
      }
      // TODO: Add project revoke logic when available
    } catch (error) {
      console.error('Failed to revoke access:', error);
    }
  };

  const getPermissionIcon = (permission: Permission) => {
    return permission === 'edit' ? <Edit3 className="w-3 h-3" /> : <Lock className="w-3 h-3" />;
  };

  const getPermissionColor = (permission: Permission) => {
    return permission === 'edit' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!sharedUsers || sharedUsers.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            Access Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">This {contentType} hasn't been shared yet.</p>
            <p className="text-xs mt-1">Use the share button to collaborate with others.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5" />
          Access Management
          <Badge variant="secondary" className="ml-auto">
            {sharedUsers.length} {sharedUsers.length === 1 ? 'person' : 'people'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Owner Section */}
        {firebaseUser && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={firebaseUser.photoURL || undefined} />
                <AvatarFallback>
                  {firebaseUser.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {firebaseUser.displayName || 'You'}
                  {isOwner && <span className="text-muted-foreground ml-1">(Owner)</span>}
                </p>
                <p className="text-xs text-muted-foreground">{firebaseUser.email}</p>
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              <Shield className="w-3 h-3 mr-1" />
              Owner
            </Badge>
          </div>
        )}

        {/* Shared Users */}
        <div className="space-y-3">
          {sharedUsers.map((user) => (
            <div
              key={user.userId}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Shared {formatDate(user.sharedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwner ? (
                  <>
                    <Select
                      value={user.permission}
                      onValueChange={(value: Permission) => 
                        handlePermissionChange(user.userId, user.email, value)
                      }
                      disabled={updatingPermissions === user.userId}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span>Can view</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="edit">
                          <div className="flex items-center gap-2">
                            <Edit3 className="w-4 h-4" />
                            <span>Can edit</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove access</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {user.name}'s access to this {contentType}? 
                            They will no longer be able to view or edit it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRevokeAccess(user.userId)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove access
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <Badge className={getPermissionColor(user.permission)}>
                    <div className="flex items-center gap-1">
                      {getPermissionIcon(user.permission)}
                      {user.permission === 'edit' ? 'Can edit' : 'Can view'}
                    </div>
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            {isOwner 
              ? "As the owner, you can manage permissions and remove access for any user."
              : "Contact the owner to change your permissions or request additional access."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
