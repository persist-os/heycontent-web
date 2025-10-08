import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';

interface DeletionToolsProps {
  userId: string;
}

export const DeletionTools: React.FC<DeletionToolsProps> = ({ userId }) => {
  const batchMutateCrystalData = useMutation(api.crystalMutations.batchMutateCrystalData);
  const deleteStardust = useMutation(api.stardustMutations.deleteStardust);
  
  // Query all crystals, shards, and stardust for deletion operations
  const allCrystals = useQuery(api.crystalQueries.getCrystalData, userId ? { userId, table: 'crystals' } : 'skip');
  const allShards = useQuery(api.crystalQueries.getCrystalData, userId ? { userId, table: 'crystal_shards' } : 'skip');
  const allStardust = useQuery(api.stardustQueries.listStardust, userId ? { userId } : 'skip');

  const handleDeleteAllCrystalsAndShards = async () => {
    if (!userId || !allCrystals || !allShards || !allStardust) return;
    if (!confirm('⚠️ Delete ALL crystals, shards, AND stardust? This cannot be undone!')) return;
    
    try {
      const crystalIds = allCrystals.map((c: any) => c._id);
      const shardIds = allShards.map((s: any) => s._id);
      const stardustIds = allStardust.map((s: any) => s._id);

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

      toast.success(`Deleted ${crystalIds.length} crystals, ${shardIds.length} shards, and ${stardustIds.length} stardust`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete data');
    }
  };

  const handleDeleteAllShards = async () => {
    if (!userId || !allShards) return;
    if (!confirm('⚠️ Delete ALL shards? This cannot be undone!')) return;
    
    try {
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
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete shards');
    }
  };

  const handleDeleteAllCrystals = async () => {
    if (!userId || !allCrystals) return;
    if (!confirm('⚠️ Delete ALL crystals? This cannot be undone!')) return;
    
    try {
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
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete crystals');
    }
  };

  const handleDeleteAllStardust = async () => {
    if (!userId || !allStardust) return;
    if (!confirm('⚠️ Delete ALL stardust? This cannot be undone!')) return;
    
    try {
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
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete stardust');
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium text-sm text-foreground mb-2">Data Management</h4>
        <p className="text-sm text-muted-foreground mb-3 font-light">
          Remove crystal and stardust data. These actions cannot be undone.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Button
          onClick={handleDeleteAllCrystalsAndShards}
          variant="outline"
          size="sm"
          className="gap-2 justify-start text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-4 w-4" />
          Delete All
        </Button>
        
        <Button
          onClick={handleDeleteAllShards}
          variant="outline"
          size="sm"
          className="gap-2 justify-start text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-4 w-4" />
          Delete All Shards
        </Button>
        
        <Button
          onClick={handleDeleteAllCrystals}
          variant="outline"
          size="sm"
          className="gap-2 justify-start text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-4 w-4" />
          Delete All Crystals
        </Button>

        <Button
          onClick={handleDeleteAllStardust}
          variant="outline"
          size="sm"
          className="gap-2 justify-start text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-4 w-4" />
          Delete All Stardust
        </Button>
      </div>

      <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <p className="font-medium mb-1">Deletion Options:</p>
        <ul className="space-y-1">
          <li>• <strong>Delete All:</strong> Remove all crystals, shards, and stardust</li>
          <li>• <strong>Delete All Shards:</strong> Remove only shards (keeps crystals and stardust)</li>
          <li>• <strong>Delete All Crystals:</strong> Remove only crystals (keeps shards and stardust)</li>
          <li>• <strong>Delete All Stardust:</strong> Remove only stardust (keeps crystals and shards)</li>
        </ul>
      </div>
    </div>
  );
};
