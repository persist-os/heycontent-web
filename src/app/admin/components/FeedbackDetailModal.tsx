'use client';

import { useState } from 'react';
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  X, 
  Download, 
  ExternalLink,
  User,
  Calendar,
  Globe,
  Monitor,
  FileImage
} from 'lucide-react';

interface Screenshot {
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface FeedbackItem {
  _id: string;
  _creationTime: number;
  type: string;
  title: string;
  description: string;
  userEmail: string;
  userName: string;
  page: string;
  userAgent: string;
  timestamp: number;
  userId?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  tags: string[];
  screenshots: Screenshot[];
  discordMessageId?: string;
  createdAt: number;
  updatedAt: number;
}

interface FeedbackDetailModalProps {
  feedback: FeedbackItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (feedbackId: string, newStatus?: string, newPriority?: string, newAssignee?: string) => void;
  users: Array<{ _id: string; name: string; email: string; role: string }>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'resolved': return 'bg-green-100 text-green-800';
    case 'closed': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FeedbackDetailModal({ 
  feedback, 
  isOpen, 
  onClose, 
  onStatusUpdate,
  users 
}: FeedbackDetailModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignedTo, setAssignedTo] = useState('unassigned');
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when feedback changes
  React.useEffect(() => {
    if (feedback) {
      setStatus(feedback.status);
      setPriority(feedback.priority);
      setAssignedTo(feedback.assignedTo || 'unassigned');
    }
  }, [feedback]);

  const handleSave = async () => {
    if (feedback) {
      setIsSaving(true);
      try {
        // Convert "unassigned" back to empty string for the API
        const finalAssignedTo = assignedTo === 'unassigned' ? '' : assignedTo;
        await onStatusUpdate(feedback._id, status, priority, finalAssignedTo);
        
        // Update the feedback object locally to reflect changes
        if (feedback) {
          feedback.status = status;
          feedback.priority = priority;
          feedback.assignedTo = finalAssignedTo;
        }
      } catch (error) {
        console.error('Failed to save changes:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };

  const handleDownloadImage = (screenshot: Screenshot) => {
    if (screenshot.url) {
      const link = document.createElement('a');
      link.href = screenshot.url;
      link.download = screenshot.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!feedback) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{feedback.title}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={getStatusColor(feedback.status)}>
                    {feedback.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(feedback.priority)}>
                    {feedback.priority}
                  </Badge>
                  <Badge variant="outline">{feedback.type}</Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{feedback.description}</p>
            </div>

            {/* User Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold mb-2">User Information</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Name:</span>
                    <span>{feedback.userName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{feedback.userEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Submitted:</span>
                    <span>{formatDate(feedback.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold mb-2">Technical Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Page:</span>
                    <span>{feedback.page}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">User Agent:</span>
                    <span className="truncate max-w-xs" title={feedback.userAgent}>
                      {feedback.userAgent}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Screenshots */}
            {feedback.screenshots && feedback.screenshots.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  Screenshots ({feedback.screenshots.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {feedback.screenshots.map((screenshot, index) => (
                    <div key={index} className="relative group">
                      {screenshot.url ? (
                        <div className="relative">
                          <img
                            src={screenshot.url}
                            alt={screenshot.name}
                            className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleImageClick(screenshot.url!)}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleDownloadImage(screenshot)}
                                className="bg-white/90 hover:bg-white"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => window.open(screenshot.url, '_blank')}
                                className="bg-white/90 hover:bg-white"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center text-center p-2">
                          <div className="text-xs text-gray-500">
                            <div className="font-medium truncate">{screenshot.name}</div>
                            <div>No URL</div>
                            <div className="text-xs">{formatFileSize(screenshot.size)}</div>
                          </div>
                        </div>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground truncate">
                        {screenshot.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Management Controls */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignedTo">Assign To</Label>
                  <Select value={assignedTo || 'unassigned'} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users
                        .filter(user => user.role === 'admin' || user.role === 'super_admin')
                        .map(user => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name} ({user.role.replace('_', ' ')})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={onClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-size image modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Screenshot</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={selectedImage}
                alt="Screenshot"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 