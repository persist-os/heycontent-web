import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown, ChevronRight, Clock, TrendingUp, Users, Zap, Eye, EyeOff, Edit3, Trash2, Save, X } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { toast } from 'sonner';
import { T } from '@/components/translation/T';
import { useTranslation } from '@/hooks/useTranslation';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface CrystalsViewProps {
  recentCrystals?: any[]; // Legacy prop for fallback - now expects cognitive fields
}

interface EnhancedCognitiveFieldCardProps {
  field: any;
}

const EnhancedCognitiveFieldCard: React.FC<EnhancedCognitiveFieldCardProps> = ({ field }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Translations for button titles
  const { text: saveChangesTitle } = useTranslation('Save changes', {
    sourceLang: 'en',
    context: 'button.cognitive_field.save.title'
  });
  const { text: cancelEditingTitle } = useTranslation('Cancel editing', {
    sourceLang: 'en',
    context: 'button.cognitive_field.cancel.title'
  });
  const { text: editFieldTitle } = useTranslation('Edit cognitive field', {
    sourceLang: 'en',
    context: 'button.cognitive_field.edit.title'
  });
  const { text: deleteFieldTitle } = useTranslation('Delete cognitive field', {
    sourceLang: 'en',
    context: 'button.cognitive_field.delete.title'
  });
  const [showAllShards, setShowAllShards] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editedField, setEditedField] = useState({
    ...field,
    transparencyLayer: field.transparencyLayer || {}
  });
  
  // Convex mutation for cognitive field operations
  const mutateCognitiveField = useMutation(api.cognitiveMutations.mutateCognitiveField);
  
  // Use direct query for shards
  const shards = useQuery(
    api.shardQueries.getShardsByIds,
    field.sourceShardIds && field.sourceShardIds.length > 0 ? {
      userId: field.userId,
      shardIds: field.sourceShardIds
    } : "skip"
  );
  
  const shardsLoading = shards === undefined;
  const hasShards = shards && shards.length > 0;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleDelete = async () => {
    try {
      const result = await mutateCognitiveField({
        operation: "delete",
        id: field._id
      });

      if (result) {
        toast.success('Cognitive field deleted successfully');
        setShowDeleteConfirm(false);
      } else {
        toast.error('Failed to delete cognitive field');
      }
    } catch (error) {
      console.error('Error deleting cognitive field:', error);
      toast.error('Failed to delete cognitive field');
    }
  };

  const handleSave = async () => {
    try {
      const updateData = {
        transparencyLayer: editedField.transparencyLayer,
        updatedAt: Date.now()
      };

      const result = await mutateCognitiveField({
        operation: "update",
        id: field._id,
        updateData: updateData
      });

      if (result) {
        toast.success('Cognitive field updated successfully');
        setIsEditing(false);
      } else {
        toast.error('Failed to update cognitive field');
      }
    } catch (error) {
      console.error('Error updating cognitive field:', error);
      toast.error('Failed to update cognitive field');
    }
  };

  const handleCancel = () => {
    setEditedField(field);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
      case 'evolving':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      case 'active':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
      case 'archived':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800';
      default:
        return 'text-muted-foreground bg-muted/30 border-border';
    }
  };

  const getStabilityColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 0.8) return 'text-blue-600 dark:text-blue-400';
    if (score >= 0.5) return 'text-amber-600 dark:text-amber-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden bg-background/50 backdrop-blur-sm hover:border-border/60 transition-all duration-300">
      {/* Status line at top */}
      <div className={`h-px w-full ${
        field.status === 'stable'
          ? 'bg-gradient-to-r from-transparent via-blue-400/60 to-transparent'
          : field.status === 'evolving'
          ? 'bg-gradient-to-r from-transparent via-amber-400/60 to-transparent'
          : 'bg-gradient-to-r from-transparent via-green-400/60 to-transparent'
      }`} />
      
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-lg font-medium text-foreground leading-tight">
                {field.transparencyLayer?.humanLabel || field.fieldId || 'Cognitive Field'}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 bg-muted/30 rounded-full">
                  Cognitive Field
                </span>
                {field.transparencyLayer?.stabilityScore !== undefined && (
                  <>
                    <span>•</span>
                    <span className={getStabilityColor(field.transparencyLayer.stabilityScore)}>
                      Stability: {Math.round(field.transparencyLayer.stabilityScore * 100)}%
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(field.status || 'active')}`}>
                {field.status || 'active'}
              </span>
              
              {/* Edit/Delete Actions */}
              <div className="flex items-center gap-1 ml-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                      title={saveChangesTitle}
                    >
                      <Save className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      title={cancelEditingTitle}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      title={editFieldTitle}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title={deleteFieldTitle}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <p className="text-muted-foreground leading-relaxed text-sm">
            {field.transparencyLayer?.interpretiveSummary || 'No summary available'}
          </p>
        </div>

        {/* Temporal Note - Always visible if present */}
        {field.transparencyLayer?.temporalNote && (
          <div className="space-y-2 border-l-2 border-blue-400/30 pl-4">
            <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">
              Temporal Evolution
            </h5>
            {isEditing ? (
              <textarea
                value={editedField.transparencyLayer?.temporalNote || ''}
                onChange={(e) => setEditedField({
                  ...editedField, 
                  transparencyLayer: {
                    ...editedField.transparencyLayer,
                    temporalNote: e.target.value
                  }
                })}
                className="w-full text-sm text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/50 focus:border-border focus:outline-none resize-none"
                rows={3}
                placeholder="How this field changes over time..."
              />
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {field.transparencyLayer.temporalNote}
              </p>
            )}
          </div>
        )}

        {/* Metadata Summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
          <div className="flex items-center gap-4">
            {field.sourceShardIds && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {field.sourceShardIds.length} source shards
              </span>
            )}
            {field.createdAt && (
              <span>
                Created {formatTimestamp(field.createdAt)}
              </span>
            )}
            {field.usageCount !== undefined && field.usageCount > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Used {field.usageCount}x
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {field.lastEvolution && (
              <span className="text-xs text-muted-foreground">
                Evolved {formatTimestamp(field.lastEvolution)}
              </span>
            )}
          </div>
        </div>

        {/* Progressive disclosure sections */}
        <div className="space-y-2">
          {/* Trace Links - Source Attribution */}
          {field.transparencyLayer?.traceLinks && field.transparencyLayer.traceLinks.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('traceLinks')}
                className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {expandedSection === 'traceLinks' ? 
                  <ChevronDown className="w-3 h-3" /> : 
                  <ChevronRight className="w-3 h-3" />
                }
                Source Attribution ({field.transparencyLayer.traceLinks.length})
              </button>
              
              {expandedSection === 'traceLinks' && (
                <div className="space-y-2 ml-5">
                  {field.transparencyLayer.traceLinks.map((link: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground capitalize">
                            {link.sourceType || 'Unknown'}
                          </span>
                          {link.contributionWeight !== undefined && (
                            <span className="text-muted-foreground">
                              {Math.round(link.contributionWeight * 100)}% contribution
                            </span>
                          )}
                        </div>
                        {link.sourceId && (
                          <p className="text-muted-foreground leading-relaxed text-xs font-mono">
                            {link.sourceId}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ethical Disclosure */}
          {field.transparencyLayer?.ethicalDisclosure && (
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('ethical')}
                className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {expandedSection === 'ethical' ? 
                  <ChevronDown className="w-3 h-3" /> : 
                  <ChevronRight className="w-3 h-3" />
                }
                Ethical Considerations
              </button>
              
              {expandedSection === 'ethical' && (
                <div className="ml-5 text-xs text-muted-foreground leading-relaxed bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                  {field.transparencyLayer.ethicalDisclosure}
                </div>
              )}
            </div>
          )}

          {/* Connected Shards */}
          {field.sourceShardIds && field.sourceShardIds.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('shards')}
                className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {expandedSection === 'shards' ? 
                  <ChevronDown className="w-3 h-3" /> : 
                  <ChevronRight className="w-3 h-3" />
                }
                Source Insights ({field.sourceShardIds.length})
                {shardsLoading && <span className="text-muted-foreground">Loading...</span>}
              </button>
              
              {expandedSection === 'shards' && hasShards && (
                <div className="space-y-2 ml-5">
                  {(showAllShards ? shards : shards.slice(0, 3)).map((shard: any) => (
                    <div key={shard._id} className="border border-border/30 rounded-lg p-3 space-y-2 bg-muted/10">
                      {shard.exact_quote && (
                        <blockquote className="text-xs text-foreground italic border-l-2 border-blue-400/40 pl-2">
                          "{shard.exact_quote}"
                        </blockquote>
                      )}
                      
                      <div className="space-y-1">
                        {shard.what_it_reveals && (
                          <div>
                            <span className="text-xs font-medium text-foreground">Shows: </span>
                            <span className="text-xs text-muted-foreground">{shard.what_it_reveals}</span>
                          </div>
                        )}
                        
                        {shard.why_significant && (
                          <div>
                            <span className="text-xs font-medium text-foreground">Why Important: </span>
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
                            from {shard.source_type}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {shards.length > 3 && (
                    <button
                      onClick={() => setShowAllShards(!showAllShards)}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {showAllShards ? 'Show less' : `Show all ${shards.length} insights`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Cognitive Field"
        titleContext="cognitive_field.delete_confirm.title"
        description="Are you sure you want to delete this cognitive field? This action cannot be undone."
        descriptionContext="cognitive_field.delete_confirm.description"
        confirmText="Delete"
        confirmContext="button.delete"
        cancelText="Cancel"
        cancelContext="button.cancel"
        variant="destructive"
      />
    </div>
  );
};

export const CrystalsView: React.FC<CrystalsViewProps> = ({ recentCrystals }) => {
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
  
  // Use direct query for cognitive fields - load all available
  const cognitiveFields = useQuery(
    api.cognitiveQueries.getAllCognitiveFields,
    userId ? {
      userId,
      limit: 1000 // High limit to get all fields
    } : "skip"
  );
  
  // Use direct data or fallback to legacy prop (recentCrystals now contains cognitive fields)
  const displayFields = cognitiveFields || recentCrystals || [];
  const isLoading = isLoadingUserId || (!userId || cognitiveFields === undefined);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-light tracking-tight text-foreground">
          Cognitive Fields
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Living intelligence substrates that capture and evolve your patterns over time
          {displayFields.length > 0 && (
            <span className="ml-2 text-sm">
              • {displayFields.length} cognitive field{displayFields.length !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-border/50 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : displayFields.length > 0 ? (
        <>
          <div className="space-y-6">
            {displayFields.map((field: any) => (
              <EnhancedCognitiveFieldCard key={field._id} field={field} />
            ))}
          </div>
          
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No cognitive fields found. Start a conversation to generate cognitive fields!</p>
        </div>
      )}
    </div>
  );
};
