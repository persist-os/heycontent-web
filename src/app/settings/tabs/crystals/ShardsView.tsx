import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown, ChevronRight, Clock, MessageSquare, FileText, Brain, Zap, Target, Edit3, Trash2, Save, X } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface ShardsViewProps {
  recentShards?: any[]; // Legacy prop for fallback
}

interface EnhancedShardCardProps {
  shard: any;
}

const EnhancedShardCard: React.FC<EnhancedShardCardProps> = ({ shard }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editedShard, setEditedShard] = useState(shard);
  
  // Convex mutation for shard operations
  const batchMutateCrystalData = useMutation(api.crystalMutations.batchMutateCrystalData);

  const handleDelete = async () => {
    try {
      const result = await batchMutateCrystalData({
        table: "crystal_shards",
        operations: [{
          type: "delete",
          id: shard._id
        }]
      });

      if (result.success) {
        toast.success('Shard deleted successfully');
        setShowDeleteConfirm(false);
      } else {
        toast.error('Failed to delete shard');
      }
    } catch (error) {
      console.error('Error deleting shard:', error);
      toast.error('Failed to delete shard');
    }
  };

  const handleSave = async () => {
    try {
      const updateData = {
        exact_quote: editedShard.exact_quote,
        what_it_reveals: editedShard.what_it_reveals,
        why_significant: editedShard.why_significant,
        confidence_level: editedShard.confidence_level,
        updatedAt: Date.now()
      };

      const result = await batchMutateCrystalData({
        table: "crystal_shards",
        operations: [{
          type: "update",
          id: shard._id,
          data: updateData
        }]
      });

      if (result.success) {
        toast.success('Shard updated successfully');
        setIsEditing(false);
      } else {
        toast.error('Failed to update shard');
      }
    } catch (error) {
      console.error('Error updating shard:', error);
      toast.error('Failed to update shard');
    }
  };

  const handleCancel = () => {
    setEditedShard(shard);
    setIsEditing(false);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      case 'low':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800';
      default:
        return 'text-muted-foreground bg-muted/30 border-border';
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'conversation':
        return <MessageSquare className="w-3 h-3" />;
      case 'note':
        return <FileText className="w-3 h-3" />;
      case 'document':
        return <FileText className="w-3 h-3" />;
      case 'behavior_observation':
        return <Brain className="w-3 h-3" />;
      default:
        return <Zap className="w-3 h-3" />;
    }
  };

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'conversation': return 'Chat';
      case 'note': return 'Note';
      case 'document': return 'Document';
      case 'behavior_observation': return 'Behavior';
      default: return sourceType || 'Unknown';
    }
  };

  const getExtractionMethodLabel = (method: string) => {
    switch (method) {
      case 'direct_quote': return 'Direct Quote';
      case 'behavioral_inference': return 'Behavior Analysis';
      case 'pattern_synthesis': return 'Pattern Recognition';
      default: return method?.replace('_', ' ') || 'Analysis';
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'strong':
        return 'text-red-600 dark:text-red-400';
      case 'moderate':
        return 'text-amber-600 dark:text-amber-400';
      case 'weak':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getEmotionalWeightColor = (weight: string) => {
    switch (weight) {
      case 'strong':
        return 'text-purple-600 dark:text-purple-400';
      case 'mild':
        return 'text-blue-600 dark:text-blue-400';
      case 'neutral':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'used_for_crystal':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30';
      case 'unprocessed':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30';
      case 'archived':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30';
      default:
        return 'text-muted-foreground bg-muted/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'used_for_crystal': return 'In Crystal';
      case 'unprocessed': return 'Pending';
      case 'archived': return 'Archived';
      default: return status?.replace('_', ' ') || 'Unknown';
    }
  };

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-background/50 backdrop-blur-sm hover:border-border/60 transition-all duration-300">
      {/* Status line at top */}
      <div className={`h-px w-full ${
        shard.confidence_level === 'high'
          ? 'bg-gradient-to-r from-transparent via-blue-400/60 to-transparent'
          : shard.confidence_level === 'medium'
          ? 'bg-gradient-to-r from-transparent via-amber-400/60 to-transparent'
          : 'bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent'
      }`} />
      
      <div className="p-4 space-y-3">
        {/* Quote */}
        {(shard.exact_quote || isEditing) && (
          <div className="space-y-1">
            <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">Quote</h5>
            {isEditing ? (
              <textarea
                value={editedShard.exact_quote || ''}
                onChange={(e) => setEditedShard({...editedShard, exact_quote: e.target.value})}
                className="w-full text-sm text-foreground italic border-l-2 border-blue-400/60 pl-3 leading-relaxed bg-muted/20 p-2 rounded border-r border-t border-b border-border/50 focus:border-border focus:outline-none resize-none"
                rows={2}
                placeholder="Enter the exact quote..."
              />
            ) : (
              <blockquote className="text-sm text-foreground italic border-l-2 border-blue-400/60 pl-3 leading-relaxed">
                "{shard.exact_quote}"
              </blockquote>
            )}
          </div>
        )}

        {/* Main insights */}
        <div className="space-y-2">
          {(shard.what_it_reveals || isEditing) && (
            <div className="space-y-1">
              <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">Shows</h5>
              {isEditing ? (
                <textarea
                  value={editedShard.what_it_reveals || ''}
                  onChange={(e) => setEditedShard({...editedShard, what_it_reveals: e.target.value})}
                  className="w-full text-sm text-muted-foreground leading-relaxed bg-muted/20 p-2 rounded border border-border/50 focus:border-border focus:outline-none resize-none"
                  rows={2}
                  placeholder="What does this reveal..."
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">{shard.what_it_reveals}</p>
              )}
            </div>
          )}

          {(shard.why_significant || isEditing) && (
            <div className="space-y-1">
              <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">Why Important</h5>
              {isEditing ? (
                <textarea
                  value={editedShard.why_significant || ''}
                  onChange={(e) => setEditedShard({...editedShard, why_significant: e.target.value})}
                  className="w-full text-sm text-muted-foreground leading-relaxed bg-muted/20 p-2 rounded border border-border/50 focus:border-border focus:outline-none resize-none"
                  rows={2}
                  placeholder="Why is this significant..."
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">{shard.why_significant}</p>
              )}
            </div>
          )}
        </div>

        {/* Metadata summary */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-muted/30 rounded-full text-muted-foreground">
              {shard.dimension}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full border ${getConfidenceColor(shard.confidence_level)}`}>
              {shard.confidence_level}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {shard.source_type && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getSourceIcon(shard.source_type)}
                <span>{getSourceLabel(shard.source_type)}</span>
              </div>
            )}
            
            {/* Edit/Delete Actions */}
            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                    title="Save changes"
                  >
                    <Save className="h-3 w-3" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                    title="Cancel editing"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                    title="Edit shard"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete shard"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
            >
              {showDetails ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Details
            </button>
          </div>
        </div>

        {/* Detailed metadata - Progressive disclosure */}
        {showDetails && (
          <div className="space-y-3 pt-3 border-t border-border/20">
            {/* Quality indicators */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {shard.linguistic_intensity && (
                <div className="space-y-1">
                  <span className="font-medium text-foreground">Language Strength</span>
                  <div className={`${getIntensityColor(shard.linguistic_intensity)}`}>
                    {shard.linguistic_intensity}
                  </div>
                </div>
              )}
              
              {shard.emotional_weight && (
                <div className="space-y-1">
                  <span className="font-medium text-foreground">Emotional Weight</span>
                  <div className={`${getEmotionalWeightColor(shard.emotional_weight)}`}>
                    {shard.emotional_weight}
                  </div>
                </div>
              )}

              {shard.specificity && (
                <div className="space-y-1">
                  <span className="font-medium text-foreground">Detail Level</span>
                  <div className="text-muted-foreground">
                    {shard.specificity.replace('_', ' ')}
                  </div>
                </div>
              )}

              {shard.recency_weight && (
                <div className="space-y-1">
                  <span className="font-medium text-foreground">Recency</span>
                  <div className="text-muted-foreground">
                    {shard.recency_weight}
                  </div>
                </div>
              )}
            </div>

            {/* Context information */}
            {(shard.situation_context || shard.temporal_context) && (
              <div className="space-y-2">
                {shard.situation_context && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-foreground">Context</span>
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-2 rounded">
                      {shard.situation_context}
                    </p>
                  </div>
                )}
                
                {shard.temporal_context && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-foreground">When</span>
                    <p className="text-xs text-muted-foreground">
                      {shard.temporal_context}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Processing metadata */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/20">
              <div className="flex items-center gap-3">
                {shard.extraction_method && (
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {getExtractionMethodLabel(shard.extraction_method)}
                  </span>
                )}
                
                {shard.extraction_timestamp && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(shard.extraction_timestamp)}
                  </span>
                )}
              </div>
              
              {shard.shard_status && (
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(shard.shard_status)}`}>
                  {getStatusLabel(shard.shard_status)}
                </span>
              )}
            </div>

            {/* Usage stats */}
            {(shard.reference_count > 0 || shard.last_referenced) && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {shard.reference_count > 0 && (
                  <span>Referenced {shard.reference_count}x</span>
                )}
                {shard.last_referenced && (
                  <span>Last used {formatTimestamp(shard.last_referenced)}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Shard"
        titleContext="shard.delete_confirm.title"
        description="Are you sure you want to delete this shard? This action cannot be undone."
        descriptionContext="shard.delete_confirm.description"
        confirmText="Delete"
        confirmContext="button.delete"
        cancelText="Cancel"
        cancelContext="button.cancel"
        variant="destructive"
      />
    </div>
  );
};

export const ShardsView: React.FC<ShardsViewProps> = ({ recentShards }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingUserId, setIsLoadingUserId] = useState(true);

  // Get user ID on mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await getCurrentUserId();
        setUserId(id);
      } catch (error) {
        console.error('Failed to get user ID:', error);
        setUserId(null);
      } finally {
        setIsLoadingUserId(false);
      }
    };
    fetchUserId();
  }, []);
  
  // Use direct query for shards - load all available (no limit for full data access)
  const shards = useQuery(
    api.crystalQueries.getPersonaData,
    userId ? {
      userId,
      operation: "shards",
      limit: 2000 // High limit to get all shards
    } : "skip"
  );
  
  // Use direct data or fallback to legacy prop
  const displayShards = shards || recentShards || [];
  const isLoading = isLoadingUserId || (!userId || shards === undefined);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-light tracking-tight text-foreground">
          Information Shards
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Raw insights and observations extracted from your interactions
          {displayShards.length > 0 && (
            <span className="ml-2 text-sm">
              • {displayShards.length} shard{displayShards.length !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-border/50 rounded-xl p-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : displayShards.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayShards.map((shard: any) => (
              <EnhancedShardCard 
                key={shard._id} 
                shard={shard} 
              />
            ))}
          </div>
          
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No shards found. Start a conversation to generate insights!</p>
        </div>
      )}
    </div>
  );
};
