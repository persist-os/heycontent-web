import React, { useState } from 'react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CrystalData } from './types';
import { EditCrystalModal } from './EditCrystalModal';
import { useCrystalMutations, useShardsByIds, useAuth } from './hooks';

interface CrystalCardProps {
  crystal: CrystalData;
  isCompact?: boolean;
  showActions?: boolean;
}

export const CrystalCard: React.FC<CrystalCardProps> = ({ 
  crystal, 
  isCompact = false, 
  showActions = true
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAllShards, setShowAllShards] = useState(false);
  const { deleteCrystal, isLoading } = useCrystalMutations();
  const userId = useAuth();
  const { shards, isLoading: shardsLoading, hasShards } = useShardsByIds(userId, crystal.shardIds);

  const handleDelete = async () => {
    const success = await deleteCrystal(crystal._id);
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
  if (isCompact) {
    return (
      <div className="space-y-2 py-3 border-l-2 border-blue-400/30 pl-4">
        <div className="font-medium text-foreground">{crystal.name}</div>
        <div className="text-sm text-muted-foreground leading-relaxed">
          {crystal.description}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-1 bg-muted/30 rounded">
            {crystal.dimension}
          </span>
          <span className={`px-2 py-1 rounded ${
            crystal.confidence_score === 'high' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' :
            crystal.confidence_score === 'moderate' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' :
            'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}>
            {crystal.confidence_score} confidence
          </span>
          {crystal.shardIds && crystal.shardIds.length > 0 && (
            <span className="px-2 py-1 bg-muted/30 rounded">
              {shardsLoading ? 'Loading...' : `${shards.length}/${crystal.shardIds.length} shard${crystal.shardIds.length !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border/50 rounded-2xl p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="text-lg font-medium text-foreground">{crystal.name}</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-muted/30 rounded">
              {crystal.dimension}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${
              crystal.confidence_score === 'high' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' :
              crystal.confidence_score === 'moderate' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' :
              'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}>
              {crystal.confidence_score}
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
        <p className="text-muted-foreground leading-relaxed">{crystal.description}</p>
      </div>

      {crystal.core_insight && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-foreground">Key Insight</h5>
          <p className="text-sm text-muted-foreground leading-relaxed">{crystal.core_insight}</p>
        </div>
      )}

      {crystal.behavioral_implications && crystal.behavioral_implications.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-foreground">Behavioral Implications</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            {crystal.behavioral_implications.map((implication: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-muted-foreground/60 mt-2 flex-shrink-0" />
                <span className="leading-relaxed">{implication}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {crystal.supporting_quotes && crystal.supporting_quotes.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-foreground">Direct Quotes</h5>
          <div className="space-y-2">
            {crystal.supporting_quotes.slice(0, 2).map((quote: string, index: number) => (
              <blockquote key={index} className="text-sm text-muted-foreground italic border-l-2 border-border/50 pl-3 leading-relaxed">
                "{quote}"
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {crystal.shardIds && crystal.shardIds.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-foreground">Connected Shards</h5>
            <div className="flex items-center gap-2">
              {shardsLoading && (
                <span className="text-xs text-muted-foreground">Loading...</span>
              )}
              <span className="text-xs text-muted-foreground">
                {crystal.shardIds.length} shard{crystal.shardIds.length !== 1 ? 's' : ''}
              </span>
              {shards.length > 3 && (
                <button
                  onClick={() => setShowAllShards(!showAllShards)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {showAllShards ? 'Show less' : `Show all ${shards.length}`}
                </button>
              )}
            </div>
          </div>
          
          {hasShards && (
            <div className="space-y-2">
              {(showAllShards ? shards : shards.slice(0, 3)).map((shard: any) => (
                <div key={shard._id} className="border border-border/30 rounded-lg p-3 space-y-2 bg-muted/20">
                  {shard.exact_quote && (
                    <blockquote className="text-xs text-foreground italic border-l-2 border-blue-400/40 pl-2">
                      "{shard.exact_quote}"
                    </blockquote>
                  )}
                  
                  <div className="space-y-1">
                    {shard.what_it_reveals && (
                      <div>
                        <span className="text-xs font-medium text-foreground">Reveals: </span>
                        <span className="text-xs text-muted-foreground">{shard.what_it_reveals}</span>
                      </div>
                    )}
                    
                    {shard.why_significant && (
                      <div>
                        <span className="text-xs font-medium text-foreground">Significance: </span>
                        <span className="text-xs text-muted-foreground">{shard.why_significant}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs px-1.5 py-0.5 bg-muted/50 rounded text-muted-foreground">
                      {shard.dimension}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      shard.confidence_level === 'high' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' :
                      shard.confidence_level === 'medium' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}>
                      {shard.confidence_level}
                    </span>
                    {shard.source_type && (
                      <span className="text-xs text-muted-foreground">
                        {shard.source_type}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!shardsLoading && !hasShards && crystal.shardIds.length > 0 && (
            <div className="text-xs text-muted-foreground italic">
              Shard content not available
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
        <span>
          {crystal.observation_count} observations • {crystal.time_span_days} days
        </span>
        <span>{crystal.crystal_type?.replace('_', ' ')}</span>
      </div>

      {/* Edit Modal */}
      <EditCrystalModal
        crystal={crystal}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Crystal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{crystal.name}"? This action cannot be undone.
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
    </div>
  );
};
