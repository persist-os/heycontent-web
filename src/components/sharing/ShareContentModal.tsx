'use client';

import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/base-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users, Mail, Check, X, Share2, Lock, Edit3 } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';

interface ShareContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'note' | 'project';
  contentId: string;
  contentTitle: string;
}

type Permission = 'read' | 'edit';

interface Friend {
  _id: Id<"users">;
  userId: string;
  name: string;
  email: string;
  status: 'accepted';
}

interface SharedUser {
  userId: string;
  name: string;
  email: string;
  permission: Permission;
  sharedAt: number;
  sharedBy: string;
}

export const ShareContentModal: React.FC<ShareContentModalProps> = ({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentTitle
}) => {
  const { firebaseUser } = useAuth();
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<Permission>('read');
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);

  // Get friends list
  const friends = useQuery(api.friendshipQueries.getFriends, 
    firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );

  // Get current shared users
  const sharedUsers = useQuery(api.noteSharing.getNoteSharedUsers,
    firebaseUser?.uid && contentType === 'note' ? {
      noteId: contentId as Id<"notes">,
      requestingUserId: firebaseUser.uid
    } : "skip"
  );

  // Share mutations
  const shareNote = useMutation(api.noteSharing.shareNote);
  const revokeNoteAccess = useMutation(api.noteSharing.revokeNoteAccess);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setShareEmail('');
      setSharePermission('read');
      setShareMessage('');
      setShareSuccess(false);
    }
  }, [isOpen]);

  const handleShare = async () => {
    if (!firebaseUser?.uid || !shareEmail.trim()) return;

    setIsSharing(true);
    setShareMessage('');
    setShareSuccess(false);

    try {
      if (contentType === 'note') {
        const result = await shareNote({
          noteId: contentId as Id<"notes">,
          sharedWithEmail: shareEmail.trim(),
          permission: sharePermission,
          sharedBy: firebaseUser.uid
        });

        if (result.success) {
          setShareMessage(result.message);
          setShareSuccess(true);
          setShareEmail('');
        } else {
          setShareMessage(result.message);
          setShareSuccess(false);
        }
      }
      // TODO: Add project sharing logic when available
    } catch (error) {
      setShareMessage('Failed to share content. Please try again.');
      setShareSuccess(false);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!firebaseUser?.uid) return;

    try {
      if (contentType === 'note') {
        const result = await revokeNoteAccess({
          noteId: contentId as Id<"notes">,
          revokedUserId: userId,
          revokedBy: firebaseUser.uid
        });

        if (result.success) {
          setShareMessage(result.message);
          setShareSuccess(true);
        } else {
          setShareMessage(result.message);
          setShareSuccess(false);
        }
      }
      // TODO: Add project revoke logic when available
    } catch (error) {
      setShareMessage('Failed to revoke access. Please try again.');
      setShareSuccess(false);
    }
  };

  const handleFriendSelect = (friend: Friend) => {
    setShareEmail(friend.email);
  };

  const getPermissionIcon = (permission: Permission) => {
    return permission === 'edit' ? <Edit3 className="w-3 h-3" /> : <Lock className="w-3 h-3" />;
  };

  const getPermissionColor = (permission: Permission) => {
    return permission === 'edit' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400';
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share ${contentType === 'note' ? 'Note' : 'Project'}`}
      variant="share-content"
      maxWidth="md"
    >
      <div className="space-y-6">
          {/* Content Info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground truncate">
              {contentTitle}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {contentType === 'note' ? 'Smart Note' : 'Project'}
            </p>
          </div>

          {/* Share Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-email">Share with</Label>
              <Input
                id="share-email"
                type="email"
                placeholder="Enter email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="permission">Permission</Label>
              <Select value={sharePermission} onValueChange={(value: Permission) => setSharePermission(value)}>
                <SelectTrigger>
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
            </div>

            <Button 
              onClick={handleShare} 
              disabled={!shareEmail.trim() || isSharing}
              className="w-full"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share {contentType}
                </>
              )}
            </Button>

            {shareMessage && (
              <div className={cn(
                "p-3 rounded-lg text-sm",
                shareSuccess 
                  ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
              )}>
                <div className="flex items-center gap-2">
                  {shareSuccess ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  {shareMessage}
                </div>
              </div>
            )}
          </div>

          {/* Friends Quick Select */}
          {friends && friends.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick select from friends</Label>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                {friends.map((friend) => (
                  <button
                    key={friend._id}
                    onClick={() => handleFriendSelect(friend)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {friend.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{friend.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{friend.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current Shared Users */}
          {sharedUsers && sharedUsers.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Currently shared with</Label>
              <div className="space-y-2">
                {sharedUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-xs", getPermissionColor(user.permission))}>
                        <div className="flex items-center gap-1">
                          {getPermissionIcon(user.permission)}
                          {user.permission === 'edit' ? 'Can edit' : 'Can view'}
                        </div>
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeAccess(user.userId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
    </BaseModal>
  );
};
