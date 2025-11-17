import React, { useState } from 'react';
import { BaseCard } from '@/components/ui/base-card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShardData } from './types';
import { EditShardModal } from './EditShardModal';
import { useShardMutations } from './hooks';
import { T } from '@/components/translation/T';

interface ShardCardProps {
  shard: ShardData;
  showActions?: boolean;
}

export const ShardCard: React.FC<ShardCardProps> = ({ shard, showActions = true }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteShard, isLoading } = useShardMutations();

  const handleDelete = async () => {
    const success = await deleteShard(shard._id);
    if (success) {
      // Small delay to prevent immediate re-renders causing UI freeze
      setTimeout(() => {
        setShowDeleteDialog(false);
      }, 100);
    }
  };

  const handleEditSuccess = () => {
    // Convex will automatically invalidate and refresh the query
  };
  return (
    <BaseCard variant="shard" className="p-4 space-y-3">
      {shard.exact_quote && (
        <blockquote className="text-sm text-foreground italic border-l-2 border-blue-400/60 pl-3 leading-relaxed">
          "{shard.exact_quote}"
        </blockquote>
      )}

      <div className="space-y-2">
        {shard.what_it_reveals && (
          <div className="space-y-1">
            <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">Reveals</h5>
            <p className="text-sm text-muted-foreground leading-relaxed">{shard.what_it_reveals}</p>
          </div>
        )}

        {shard.why_significant && (
          <div className="space-y-1">
            <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">Significance</h5>
            <p className="text-sm text-muted-foreground leading-relaxed">{shard.why_significant}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-muted/30 rounded">
            {shard.dimension}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${
            shard.confidence_level === 'high' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' :
            shard.confidence_level === 'medium' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' :
            'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}>
            {shard.confidence_level}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {shard.source_type}
          </span>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditShardModal
        shard={shard}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <T context="dialog.delete.shard.title">Delete Shard</T>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <T context="dialog.delete.shard.description">Are you sure you want to delete this shard? This action cannot be undone.</T>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BaseCard>
  );
};
