import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown, ChevronRight, Clock, TrendingUp, Users, Zap, Eye, EyeOff, Edit3, Trash2, Save, X } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface CrystalsViewProps {
  recentCrystals?: any[]; // Legacy prop for fallback
}

interface EnhancedCrystalCardProps {
  crystal: any;
}

const EnhancedCrystalCard: React.FC<EnhancedCrystalCardProps> = ({ crystal }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showAllEvolution, setShowAllEvolution] = useState(false);
  const [showAllShards, setShowAllShards] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editedCrystal, setEditedCrystal] = useState({
    ...crystal,
    core_insight: crystal.core_insight || crystal.stable_trait
  });
  
  // Convex mutation for crystal operations
  const batchMutateCrystalData = useMutation(api.crystalMutations.batchMutateCrystalData);
  
  // Use direct query for shards
  const shards = useQuery(
    api.shardQueries.getShardsByIds,
    crystal.shardIds && crystal.shardIds.length > 0 ? {
      userId: crystal.userId,
      shardIds: crystal.shardIds
    } : "skip"
  );
  
  const shardsLoading = shards === undefined;
  const hasShards = shards && shards.length > 0;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleDelete = async () => {
    try {
      const result = await batchMutateCrystalData({
        table: "crystals",
        operations: [{
          type: "delete",
          id: crystal._id
        }]
      });

      if (result.success) {
        toast.success('Crystal deleted successfully');
        setShowDeleteConfirm(false);
      } else {
        toast.error('Failed to delete crystal');
      }
    } catch (error) {
      console.error('Error deleting crystal:', error);
      toast.error('Failed to delete crystal');
    }
  };

  const handleSave = async () => {
    try {
      const updateData = {
        core_insight: editedCrystal.core_insight || editedCrystal.stable_trait,
        behavioral_implications: editedCrystal.behavioral_implications,
        confidence_score: editedCrystal.confidence_score,
        updatedAt: Date.now()
      };

      const result = await batchMutateCrystalData({
        table: "crystals",
        operations: [{
          type: "update",
          id: crystal._id,
          data: updateData
        }]
      });

      if (result.success) {
        toast.success('Crystal updated successfully');
        setIsEditing(false);
      } else {
        toast.error('Failed to update crystal');
      }
    } catch (error) {
      console.error('Error updating crystal:', error);
      toast.error('Failed to update crystal');
    }
  };

  const handleCancel = () => {
    setEditedCrystal(crystal);
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
      case 'very_high':
      case 'high':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
      case 'moderate':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      case 'developing':
      case 'low':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800';
      default:
        return 'text-muted-foreground bg-muted/30 border-border';
    }
  };

  const getStabilityIcon = (trend: string) => {
    switch (trend) {
      case 'strengthening':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'weakening':
        return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />;
      case 'evolving':
        return <Zap className="w-3 h-3 text-amber-500" />;
      default:
        return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'stable_trait': return 'Core Trait';
      case 'behavioral_pattern': return 'Behavior Pattern';
      case 'preference_cluster': return 'Preferences';
      case 'value_system': return 'Values';
      case 'contextual_adaptation': return 'Adaptability';
      case 'growth_trajectory': return 'Growth Path';
      case 'contradiction_resolution': return 'Complexity';
      default: return type?.replace('_', ' ') || 'Pattern';
    }
  };

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden bg-background/50 backdrop-blur-sm hover:border-border/60 transition-all duration-300">
      {/* Status line at top */}
      <div className={`h-px w-full ${
        crystal.confidence_score === 'high' || crystal.confidence_score === 'very_high'
          ? 'bg-gradient-to-r from-transparent via-blue-400/60 to-transparent'
          : crystal.confidence_score === 'moderate'
          ? 'bg-gradient-to-r from-transparent via-amber-400/60 to-transparent'
          : 'bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent'
      }`} />
      
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-lg font-medium text-foreground leading-tight">
                {crystal.name}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 bg-muted/30 rounded-full">
                  {getTypeLabel(crystal.crystal_type)}
                </span>
                <span>•</span>
                <span>{crystal.dimension}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {crystal.stability_trend && getStabilityIcon(crystal.stability_trend)}
              <span className={`text-xs px-2 py-1 rounded-full border ${getConfidenceColor(crystal.confidence_score)}`}>
                {crystal.confidence_score?.replace('_', ' ')}
              </span>
              
              {/* Edit/Delete Actions */}
              <div className="flex items-center gap-1 ml-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                      title="Save changes"
                    >
                      <Save className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      title="Cancel editing"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      title="Edit crystal"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete crystal"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <p className="text-muted-foreground leading-relaxed text-sm">
            {crystal.description}
          </p>
        </div>

        {/* Core Insight - Always visible */}
        {(crystal.core_insight || crystal.stable_trait) && (
          <div className="space-y-2 border-l-2 border-blue-400/30 pl-4">
            <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">
              Key Insight
            </h5>
            {isEditing ? (
              <textarea
                value={editedCrystal.core_insight || editedCrystal.stable_trait || ''}
                onChange={(e) => setEditedCrystal({...editedCrystal, core_insight: e.target.value})}
                className="w-full text-sm text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/50 focus:border-border focus:outline-none resize-none"
                rows={3}
                placeholder="Describe the core insight..."
              />
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {crystal.stable_trait || crystal.core_insight}
              </p>
            )}
          </div>
        )}

        {/* Metadata Summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {crystal.observation_count} observations
            </span>
            <span>{crystal.time_span_days} days</span>
            {crystal.usage_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Used {crystal.usage_count}x
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {crystal.evidence_strength && (
              <span className={`px-2 py-1 rounded-full text-xs ${
                crystal.evidence_strength === 'overwhelming' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300' :
                crystal.evidence_strength === 'strong' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' :
                crystal.evidence_strength === 'moderate' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' :
                'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}>
                {crystal.evidence_strength} evidence
              </span>
            )}
          </div>
        </div>

        {/* Progressive disclosure sections */}
        <div className="space-y-2">
          {/* Evolution History */}
          {crystal.evolution_history && crystal.evolution_history.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('evolution')}
                className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {expandedSection === 'evolution' ? 
                  <ChevronDown className="w-3 h-3" /> : 
                  <ChevronRight className="w-3 h-3" />
                }
                Evolution History ({crystal.evolution_history.length})
              </button>
              
              {expandedSection === 'evolution' && (
                <div className="space-y-2 ml-5">
                  {(showAllEvolution ? crystal.evolution_history : crystal.evolution_history.slice(0, 3))
                    .map((event: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        event.change_type === 'created' ? 'bg-green-400' :
                        event.change_type === 'strengthened' ? 'bg-blue-400' :
                        event.change_type === 'refined' ? 'bg-amber-400' :
                        event.change_type === 'contradicted' ? 'bg-red-400' :
                        'bg-muted-foreground'
                      }`} />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground capitalize">
                            {event.change_type.replace('_', ' ')}
                          </span>
                          <span className="text-muted-foreground">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {crystal.evolution_history.length > 3 && (
                    <button
                      onClick={() => setShowAllEvolution(!showAllEvolution)}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-5"
                    >
                      {showAllEvolution ? 'Show less' : `Show all ${crystal.evolution_history.length} events`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Behavioral Implications */}
          {crystal.behavioral_implications && crystal.behavioral_implications.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('implications')}
                className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {expandedSection === 'implications' ? 
                  <ChevronDown className="w-3 h-3" /> : 
                  <ChevronRight className="w-3 h-3" />
                }
                What This Means ({crystal.behavioral_implications.length})
              </button>
              
              {expandedSection === 'implications' && (
                <div className="space-y-1 ml-5">
                  {crystal.behavioral_implications.map((implication: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/60 mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground leading-relaxed">
                        {implication}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Supporting Evidence */}
          {crystal.supporting_quotes && crystal.supporting_quotes.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('quotes')}
                className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {expandedSection === 'quotes' ? 
                  <ChevronDown className="w-3 h-3" /> : 
                  <ChevronRight className="w-3 h-3" />
                }
                Direct Quotes ({crystal.supporting_quotes.length})
              </button>
              
              {expandedSection === 'quotes' && (
                <div className="space-y-2 ml-5">
                  {crystal.supporting_quotes.slice(0, 3).map((quote: string, i: number) => (
                    <blockquote key={i} className="text-xs text-muted-foreground italic border-l-2 border-border/50 pl-3 leading-relaxed">
                      "{quote}"
                    </blockquote>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Connected Shards */}
          {crystal.shardIds && crystal.shardIds.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('shards')}
                className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {expandedSection === 'shards' ? 
                  <ChevronDown className="w-3 h-3" /> : 
                  <ChevronRight className="w-3 h-3" />
                }
                Source Insights ({crystal.shardIds.length})
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

          {/* Detailed Analysis */}
          {crystal.detailed_analysis && (
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('analysis')}
                className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {expandedSection === 'analysis' ? 
                  <ChevronDown className="w-3 h-3" /> : 
                  <ChevronRight className="w-3 h-3" />
                }
                Deep Analysis
              </button>
              
              {expandedSection === 'analysis' && (
                <div className="ml-5 text-xs text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-lg">
                  {crystal.detailed_analysis}
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
        title="Delete Crystal"
        titleContext="crystal.delete_confirm.title"
        description="Are you sure you want to delete this crystal? This action cannot be undone."
        descriptionContext="crystal.delete_confirm.description"
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
  
  // Use direct query for crystals - load all available (no limit for full data access)
  const crystals = useQuery(
    api.crystalQueries.getCrystalPersonaData,
    userId ? {
      userId,
      limit: 1000 // High limit to get all crystals
    } : "skip"
  );
  
  // Use direct data or fallback to legacy prop
  const displayCrystals = crystals || recentCrystals || [];
  const isLoading = isLoadingUserId || (!userId || crystals === undefined);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-light tracking-tight text-foreground">
          Knowledge Crystals
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Consolidated patterns and behavioral insights from your interactions
          {displayCrystals.length > 0 && (
            <span className="ml-2 text-sm">
              • {displayCrystals.length} crystal{displayCrystals.length !== 1 ? 's' : ''}
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
      ) : displayCrystals.length > 0 ? (
        <>
          <div className="space-y-6">
            {displayCrystals.map((crystal: any) => (
              <EnhancedCrystalCard key={crystal._id} crystal={crystal} />
            ))}
          </div>
          
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No crystals found. Start a conversation to generate insights!</p>
        </div>
      )}
    </div>
  );
};
