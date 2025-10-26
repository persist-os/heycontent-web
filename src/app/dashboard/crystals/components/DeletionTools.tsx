import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
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
  
  const batchMutateCrystalData = useMutation(api.crystalMutations.batchMutateCrystalData);
  const deleteStardust = useMutation(api.stardustMutations.deleteStardust);
  const deleteProject = useMutation(api.projectsMutations.deleteProject);
  
  // Query all crystals, shards, stardust, and projects for deletion operations
  const allCrystals = useQuery(api.crystalQueries.getCrystalsByUser, userId ? { userId } : 'skip');
  const allShards = useQuery(api.shardQueries.getShardsByUser, userId ? { userId } : 'skip');
  const allStardust = useQuery(api.stardustQueries.listStardust, userId ? { userId } : 'skip');
  const allProjects = useQuery(api.projectsQueries.getByUser, userId ? { userId, limit: 1000 } : 'skip');

  const openDeleteDialog = (type: DeletionType) => {
    setDeletionType(type);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletionType) return;

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
    }
  };

  const executeDeleteAll = async () => {
    if (!userId || !allCrystals || !allShards || !allStardust || !allProjects) return;
    
    const crystalIds = allCrystals.map((c: any) => c._id);
    const shardIds = allShards.map((s: any) => s._id);
    const stardustIds = allStardust.map((s: any) => s._id);
    const projectIds = allProjects.map((p: any) => p._id);

    // Delete all crystals
    if (crystalIds.length > 0) {
      await batchMutateCrystalData({
        table: 'crystals',
        operations: crystalIds.map((id: string) => ({ type: 'delete', id }))
      });
    }

    // Delete all shards
    if (shardIds.length > 0) {
      await batchMutateCrystalData({
        table: 'crystal_shards',
        operations: shardIds.map((id: string) => ({ type: 'delete', id }))
      });
    }

    // Delete all stardust
    if (stardustIds.length > 0) {
      await Promise.all(
        stardustIds.map((id: string) => deleteStardust({ stardustId: id as Id<"stardust"> }))
      );
    }

    // Delete all projects
    if (projectIds.length > 0) {
      await Promise.all(
        projectIds.map((id: string) => deleteProject({ projectId: id as any, userId }))
      );
    }

    toast.success(`Deleted ${crystalIds.length} crystals, ${shardIds.length} shards, ${stardustIds.length} stardust, and ${projectIds.length} stars`);
    setTimeout(() => window.location.reload(), 1000);
  };

  const executeDeleteShards = async () => {
    if (!userId || !allShards) return;
    
    const shardIds = allShards.map((s: any) => s._id);

    if (shardIds.length > 0) {
      await batchMutateCrystalData({
        table: 'crystal_shards',
        operations: shardIds.map((id: string) => ({ type: 'delete', id }))
      });
      toast.success(`Deleted ${shardIds.length} shards`);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast('No shards to delete');
    }
  };

  const executeDeleteCrystals = async () => {
    if (!userId || !allCrystals) return;
    
    const crystalIds = allCrystals.map((c: any) => c._id);

    if (crystalIds.length > 0) {
      await batchMutateCrystalData({
        table: 'crystals',
        operations: crystalIds.map((id: string) => ({ type: 'delete', id }))
      });
      toast.success(`Deleted ${crystalIds.length} crystals`);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast('No crystals to delete');
    }
  };

  const executeDeleteStardust = async () => {
    if (!userId || !allStardust) return;
    
    const stardustIds = allStardust.map((s: any) => s._id);

    if (stardustIds.length > 0) {
      await Promise.all(
        stardustIds.map((id: string) => deleteStardust({ stardustId: id as Id<"stardust"> }))
      );
      toast.success(`Deleted ${stardustIds.length} stardust`);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast('No stardust to delete');
    }
  };

  const executeDeleteStars = async () => {
    if (!userId || !allProjects) return;
    
    const projectIds = allProjects.map((p: any) => p._id);

    if (projectIds.length > 0) {
      await Promise.all(
        projectIds.map((id: string) => deleteProject({ projectId: id as any, userId }))
      );
      toast.success(`Deleted ${projectIds.length} stars`);
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
            <AlertDialogCancel className="font-normal">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-normal"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
