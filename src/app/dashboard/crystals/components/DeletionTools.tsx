import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
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

interface DeletionToolsProps {
  userId: string;
}

type DeletionType = 'all' | 'shards' | 'crystals' | 'stardust' | 'stars' | null;

export const DeletionTools: React.FC<DeletionToolsProps> = ({ userId }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletionType, setDeletionType] = useState<DeletionType>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState<{
    current: number;
    total: number;
    type: string;
  } | null>(null);
  
  // Batch mutation functions for production-ready deletion
  const batchMutateCrystalData = useMutation(api.crystalMutations.batchMutateCrystalData);
  const batchDeleteStardust = useMutation(api.stardustMutations.batchDeleteStardust);
  const batchDeleteProjects = useMutation(api.projectsMutations.batchDeleteProjects);
  
  // Query all crystals, shards, stardust, and projects for deletion operations
  const allCrystals = useQuery(api.crystalQueries.getAllCrystalsByUser, userId ? { userId } : 'skip');
  const allShards = useQuery(api.shardQueries.getAllShardsByUser, userId ? { userId } : 'skip');
  const allStardust = useQuery(api.stardustQueries.listStardust, userId ? { userId } : 'skip');
  const allProjects = useQuery(api.projectsQueries.getAllByUser, userId ? { userId } : 'skip');

  const openDeleteDialog = (type: DeletionType) => {
    setDeletionType(type);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletionType || isDeleting) return;

    setIsDeleting(true);
    setDeletionProgress(null);

    try {
      switch (deletionType) {
        case 'all':
          await executeDeleteAll();
          break;
        case 'shards':
          await executeDeleteShards();
          break;
        case 'crystals':
          await executeDeleteCrystals();
          break;
        case 'stardust':
          await executeDeleteStardust();
          break;
        case 'stars':
          await executeDeleteStars();
          break;
      }
      setShowDeleteDialog(false);
      setDeletionType(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Deletion failed. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeletionProgress(null);
    }
  };

  const executeDeleteAll = async () => {
    if (!userId || !allCrystals || !allShards || !allStardust || !allProjects) return;
    
    const crystalIds = allCrystals.map((c: any) => c._id);
    const shardIds = allShards.map((s: any) => s._id);
    const stardustIds = allStardust.map((s: any) => s._id);
    const projectIds = allProjects.map((p: any) => p._id);

    const totalItems = crystalIds.length + shardIds.length + stardustIds.length + projectIds.length;
    let processedItems = 0;

    // Delete all crystals in batches
    if (crystalIds.length > 0) {
      setDeletionProgress({ current: processedItems, total: totalItems, type: 'crystals' });
      
      // Process crystals in batches of 1000
      const BATCH_SIZE = 1000;
      let crystalProcessedCount = 0;
      let crystalTotalSuccessful = 0;
      let crystalTotalFailed = 0;
      
      for (let i = 0; i < crystalIds.length; i += BATCH_SIZE) {
        const batch = crystalIds.slice(i, i + BATCH_SIZE);
        
        // Update progress
        setDeletionProgress({ 
          current: processedItems + crystalProcessedCount, 
          total: totalItems, 
          type: `crystals (batch ${Math.floor(i / BATCH_SIZE) + 1})` 
        });
        
        const result = await batchMutateCrystalData({
          table: 'crystals',
          operations: batch.map((id: string) => ({ type: 'delete', id }))
        });
        
        crystalTotalSuccessful += result.successfulOperations;
        crystalTotalFailed += result.failedOperations;
        crystalProcessedCount += batch.length;
        
        // Small delay between batches
        if (i + BATCH_SIZE < crystalIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      processedItems += crystalIds.length;
      
      if (crystalTotalFailed > 0) {
        throw new Error(`Failed to delete ${crystalTotalFailed} crystals out of ${crystalIds.length}`);
      }
    }

    // Delete all shards in batches
    if (shardIds.length > 0) {
      setDeletionProgress({ current: processedItems, total: totalItems, type: 'shards' });
      
      // Process shards in batches of 1000
      const BATCH_SIZE = 1000;
      let shardProcessedCount = 0;
      let shardTotalSuccessful = 0;
      let shardTotalFailed = 0;
      
      for (let i = 0; i < shardIds.length; i += BATCH_SIZE) {
        const batch = shardIds.slice(i, i + BATCH_SIZE);
        
        // Update progress
        setDeletionProgress({ 
          current: processedItems + shardProcessedCount, 
          total: totalItems, 
          type: `shards (batch ${Math.floor(i / BATCH_SIZE) + 1})` 
        });
        
        const result = await batchMutateCrystalData({
          table: 'crystal_shards',
          operations: batch.map((id: string) => ({ type: 'delete', id }))
        });
        
        shardTotalSuccessful += result.successfulOperations;
        shardTotalFailed += result.failedOperations;
        shardProcessedCount += batch.length;
        
        // Small delay between batches
        if (i + BATCH_SIZE < shardIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      processedItems += shardIds.length;
      
      if (shardTotalFailed > 0) {
        throw new Error(`Failed to delete ${shardTotalFailed} shards out of ${shardIds.length}`);
      }
    }

    // Delete all stardust using batch operation
    if (stardustIds.length > 0) {
      setDeletionProgress({ current: processedItems, total: totalItems, type: 'stardust' });
      const result = await batchDeleteStardust({
        stardustIds: stardustIds as Id<"stardust">[]
      });
      processedItems += stardustIds.length;
      
      if (!result.success) {
        throw new Error(`Failed to delete stardust: ${result.failedOperations} failed`);
      }
    }

    // Delete all projects using batch operation
    if (projectIds.length > 0) {
      setDeletionProgress({ current: processedItems, total: totalItems, type: 'stars' });
      const result = await batchDeleteProjects({
        projectIds: projectIds as Id<"projects">[],
        userId
      });
      processedItems += projectIds.length;
      
      if (!result.success) {
        throw new Error(`Failed to delete projects: ${result.failedOperations} failed`);
      }
    }

    toast.success(`Successfully deleted ${crystalIds.length} crystals, ${shardIds.length} shards, ${stardustIds.length} stardust, and ${projectIds.length} stars`);
    setTimeout(() => window.location.reload(), 1000);
  };

  const executeDeleteShards = async () => {
    if (!userId || !allShards) return;
    
    const shardIds = allShards.map((s: any) => s._id);

    if (shardIds.length > 0) {
      setDeletionProgress({ current: 0, total: shardIds.length, type: 'shards' });
      
      // Process in batches of 1000 to avoid overwhelming Convex
      const BATCH_SIZE = 1000;
      let processedCount = 0;
      let totalSuccessful = 0;
      let totalFailed = 0;
      
      for (let i = 0; i < shardIds.length; i += BATCH_SIZE) {
        const batch = shardIds.slice(i, i + BATCH_SIZE);
        
        // Update progress
        setDeletionProgress({ 
          current: processedCount, 
          total: shardIds.length, 
          type: `shards (batch ${Math.floor(i / BATCH_SIZE) + 1})` 
        });
        
        const result = await batchMutateCrystalData({
          table: 'crystal_shards',
          operations: batch.map((id: string) => ({ type: 'delete', id }))
        });
        
        totalSuccessful += result.successfulOperations;
        totalFailed += result.failedOperations;
        processedCount += batch.length;
        
        // Small delay between batches to prevent overwhelming Convex
        if (i + BATCH_SIZE < shardIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      if (totalFailed > 0) {
        throw new Error(`Failed to delete ${totalFailed} shards out of ${shardIds.length}`);
      }
      
      toast.success(`Successfully deleted ${totalSuccessful} shards`);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast('No shards to delete');
    }
  };

  const executeDeleteCrystals = async () => {
    if (!userId || !allCrystals) return;
    
    const crystalIds = allCrystals.map((c: any) => c._id);

    if (crystalIds.length > 0) {
      setDeletionProgress({ current: 0, total: crystalIds.length, type: 'crystals' });
      
      // Process in batches of 1000 to avoid overwhelming Convex
      const BATCH_SIZE = 1000;
      let processedCount = 0;
      let totalSuccessful = 0;
      let totalFailed = 0;
      
      for (let i = 0; i < crystalIds.length; i += BATCH_SIZE) {
        const batch = crystalIds.slice(i, i + BATCH_SIZE);
        
        // Update progress
        setDeletionProgress({ 
          current: processedCount, 
          total: crystalIds.length, 
          type: `crystals (batch ${Math.floor(i / BATCH_SIZE) + 1})` 
        });
        
        const result = await batchMutateCrystalData({
          table: 'crystals',
          operations: batch.map((id: string) => ({ type: 'delete', id }))
        });
        
        totalSuccessful += result.successfulOperations;
        totalFailed += result.failedOperations;
        processedCount += batch.length;
        
        // Small delay between batches to prevent overwhelming Convex
        if (i + BATCH_SIZE < crystalIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      if (totalFailed > 0) {
        throw new Error(`Failed to delete ${totalFailed} crystals out of ${crystalIds.length}`);
      }
      
      toast.success(`Successfully deleted ${totalSuccessful} crystals`);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast('No crystals to delete');
    }
  };

  const executeDeleteStardust = async () => {
    if (!userId || !allStardust) return;
    
    const stardustIds = allStardust.map((s: any) => s._id);

    if (stardustIds.length > 0) {
      setDeletionProgress({ current: 0, total: stardustIds.length, type: 'stardust' });
      const result = await batchDeleteStardust({
        stardustIds: stardustIds as Id<"stardust">[]
      });
      
      if (!result.success) {
        throw new Error(`Failed to delete stardust: ${result.failedOperations} failed`);
      }
      
      toast.success(`Successfully deleted ${result.successfulOperations} stardust`);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast('No stardust to delete');
    }
  };

  const executeDeleteStars = async () => {
    if (!userId || !allProjects) return;
    
    const projectIds = allProjects.map((p: any) => p._id);

    if (projectIds.length > 0) {
      setDeletionProgress({ current: 0, total: projectIds.length, type: 'stars' });
      const result = await batchDeleteProjects({
        projectIds: projectIds as Id<"projects">[],
        userId
      });
      
      if (!result.success) {
        throw new Error(`Failed to delete projects: ${result.failedOperations} failed`);
      }
      
      toast.success(`Successfully deleted ${result.successfulOperations} stars`);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast('No stars to delete');
    }
  };

  const getDeleteDialogContent = () => {
    switch (deletionType) {
      case 'all':
        return {
          title: 'Delete Everything',
          description: 'This will permanently delete ALL crystals, shards, stardust, and stars. This action cannot be undone.',
          items: [
            allCrystals?.length || 0,
            allShards?.length || 0,
            allStardust?.length || 0,
            allProjects?.length || 0
          ]
        };
      case 'shards':
        return {
          title: 'Delete All Shards',
          description: 'This will permanently delete all memory fragments. Crystals and stardust will remain. This action cannot be undone.',
          items: [allShards?.length || 0]
        };
      case 'crystals':
        return {
          title: 'Delete All Crystals',
          description: 'This will permanently delete all consciousness insights. Shards and stardust will remain. This action cannot be undone.',
          items: [allCrystals?.length || 0]
        };
      case 'stardust':
        return {
          title: 'Delete All Stardust',
          description: 'This will permanently delete all emerging potentials. Crystals and shards will remain. This action cannot be undone.',
          items: [allStardust?.length || 0]
        };
      case 'stars':
        return {
          title: 'Delete All Stars',
          description: 'This will permanently delete all project organisms. Associated content (notes, crystals) will remain. This action cannot be undone.',
          items: [allProjects?.length || 0]
        };
      default:
        return { title: '', description: '', items: [] };
    }
  };

  const dialogContent = getDeleteDialogContent();

  return (
    <>
      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-sm text-foreground mb-2">Data Management</h4>
          <p className="text-sm text-muted-foreground mb-3 font-light">
            Remove cosmic intelligence data. These actions cannot be undone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <Button
            onClick={() => openDeleteDialog('all')}
            variant="outline"
            size="sm"
            className="gap-2 justify-start text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
            Delete All
          </Button>
          
          <Button
            onClick={() => openDeleteDialog('crystals')}
            variant="outline"
            size="sm"
            className="gap-2 justify-start text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
            Delete All Crystals
          </Button>
          
          <Button
            onClick={() => openDeleteDialog('shards')}
            variant="outline"
            size="sm"
            className="gap-2 justify-start text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
            Delete All Shards
          </Button>

          <Button
            onClick={() => openDeleteDialog('stardust')}
            variant="outline"
            size="sm"
            className="gap-2 justify-start text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
            Delete All Stardust
          </Button>

          <Button
            onClick={() => openDeleteDialog('stars')}
            variant="outline"
            size="sm"
            className="gap-2 justify-start text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
            Delete All Stars
          </Button>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
          <p className="font-medium mb-1">Deletion Options:</p>
          <ul className="space-y-1">
            <li>• <strong>Delete All:</strong> Remove everything (crystals, shards, stardust, and stars)</li>
            <li>• <strong>Delete All Crystals:</strong> Remove only consciousness insights</li>
            <li>• <strong>Delete All Shards:</strong> Remove only memory fragments</li>
            <li>• <strong>Delete All Stardust:</strong> Remove only emerging potentials</li>
            <li>• <strong>Delete All Stars:</strong> Remove only project organisms</li>
          </ul>
        </div>
      </div>

      {/* Styled Deletion Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-950/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl">
                {dialogContent.title}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {dialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Progress indicator */}
          {deletionProgress && (
            <div className="my-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Deleting {deletionProgress.type}... ({deletionProgress.current}/{deletionProgress.total})
                </p>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (deletionProgress.current / deletionProgress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Summary of items to be deleted */}
          <div className="my-4 p-4 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-sm font-medium text-foreground mb-2">Items to be deleted:</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              {deletionType === 'all' && (
                <>
                  <div className="flex justify-between">
                    <span>Crystals:</span>
                    <span className="font-medium text-foreground">{allCrystals?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shards:</span>
                    <span className="font-medium text-foreground">{allShards?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stardust:</span>
                    <span className="font-medium text-foreground">{allStardust?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stars:</span>
                    <span className="font-medium text-foreground">{allProjects?.length || 0}</span>
                  </div>
                </>
              )}
              {deletionType === 'crystals' && (
                <div className="flex justify-between">
                  <span>Crystals:</span>
                  <span className="font-medium text-foreground">{allCrystals?.length || 0}</span>
                </div>
              )}
              {deletionType === 'shards' && (
                <div className="flex justify-between">
                  <span>Shards:</span>
                  <span className="font-medium text-foreground">{allShards?.length || 0}</span>
                </div>
              )}
              {deletionType === 'stardust' && (
                <div className="flex justify-between">
                  <span>Stardust:</span>
                  <span className="font-medium text-foreground">{allStardust?.length || 0}</span>
                </div>
              )}
              {deletionType === 'stars' && (
                <div className="flex justify-between">
                  <span>Stars:</span>
                  <span className="font-medium text-foreground">{allProjects?.length || 0}</span>
                </div>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              className="font-normal"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-normal disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Permanently'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
