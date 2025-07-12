'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Trash2, 
  Edit3, 
  AlertTriangle 
} from 'lucide-react';
import { Partnership } from '../types';
import { categoryConfig, getPartnershipColors } from '../utils/emailCategorization';

interface PartnershipControlsProps {
  partnership: Partnership;
  onUpdateStatus: (status: Partnership['status']) => void;
  onUpdateCategory: (category: Partnership['category']) => void;
  onDelete: () => void;
  statusLoading?: boolean;
  categoryLoading?: boolean;
  deleteLoading?: boolean;
  categoryError?: string | null;
}

export function PartnershipControls({
  partnership,
  onUpdateStatus,
  onUpdateCategory,
  onDelete,
  statusLoading = false,
  categoryLoading = false,
  deleteLoading = false,
  categoryError = null
}: PartnershipControlsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Local state for optimistic updates
  const [optimisticStatus, setOptimisticStatus] = useState(partnership.status);
  const [optimisticCategory, setOptimisticCategory] = useState(partnership.category || 'none');

  // Sync local state with prop changes (when backend updates complete)
  useEffect(() => {
    setOptimisticStatus(partnership.status);
  }, [partnership.status]);

  useEffect(() => {
    setOptimisticCategory(partnership.category || 'none');
  }, [partnership.category]);

  const getStatusColor = (status: Partnership['status']) => {
    const colors = getPartnershipColors();
    switch (status) {
      case 'opportunity': return `bg-primary/10 ${colors.status.opportunity}`;
      case 'inquiry': return `bg-blue-50 dark:bg-blue-950/20 ${colors.status.inquiry}`;
      case 'negotiating': return `bg-amber-50 dark:bg-amber-950/20 ${colors.status.negotiating}`;
      case 'active': return `bg-green-50 dark:bg-green-950/20 ${colors.status.active}`;
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const statusOptions = [
    { value: 'opportunity', label: 'Opportunity' },
    { value: 'inquiry', label: 'Inquiry' },
    { value: 'negotiating', label: 'Negotiating' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' }
  ] as const;

  const categoryOptions = [
    { value: 'partnership', label: 'Partnership' },
    { value: 'media', label: 'Media' },
    { value: 'business', label: 'Business' },
    { value: 'community', label: 'Community' },
    { value: 'none', label: 'None' }
  ] as const;

  const handleStatusChange = (newStatus: Partnership['status']) => {
    // Immediately update local state for optimistic UI
    setOptimisticStatus(newStatus);
    // Call parent handler
    onUpdateStatus(newStatus);
  };

  const handleCategoryChange = (newCategory: Partnership['category']) => {
    // Immediately update local state for optimistic UI
    setOptimisticCategory(newCategory);
    // Call parent handler
    onUpdateCategory(newCategory);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    onDelete();
  };

  return (
    <div className="space-y-4">
      {/* Status Control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Status:</span>
          <span className="font-medium text-foreground">
            {optimisticStatus}
          </span>
        </div>
        <Select
          value={optimisticStatus}
          onValueChange={handleStatusChange}
          disabled={statusLoading}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Change status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Type:</span>
          {optimisticCategory && optimisticCategory !== 'none' ? (
            <span className="font-medium text-foreground">
              {categoryConfig[optimisticCategory]?.title}
            </span>
          ) : (
            <span className="text-xs text-destructive">Not set</span>
          )}
        </div>
        <Select
          value={optimisticCategory}
          onValueChange={handleCategoryChange}
          disabled={categoryLoading}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Change type" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error Display */}
      {categoryError && (
        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
          {categoryError}
        </div>
      )}

      {/* Delete Control */}
      <div className="pt-4 border-t border-border">
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={deleteLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteLoading ? 'Deleting...' : 'Delete Partnership'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Delete Partnership
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this partnership with{' '}
                <strong>{partnership.brandName}</strong>? This will permanently remove the email
                thread and all associated data from your Partnership Hub.
                <br />
                <br />
                <strong>This action cannot be undone.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Partnership
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
} 