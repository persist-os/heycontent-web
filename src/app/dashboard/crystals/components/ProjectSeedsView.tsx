import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sprout, TrendingUp, Calendar, Zap, Edit3, Trash2, Save, X, CheckCircle2, ExternalLink } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { toast } from 'sonner';

interface ProjectSeedsViewProps {
  recentSeeds?: any[]; // Legacy prop for fallback
}

interface ProjectSeedCardProps {
  seed: any;
}

const ProjectSeedCard: React.FC<ProjectSeedCardProps> = ({ seed }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSeed, setEditedSeed] = useState({
    suggested_project_name: seed.suggested_project_name || '',
    suggested_project_description: seed.suggested_project_description || '',
  });
  
  // Convex mutation for seed operations
  const batchMutateCrystalData = useMutation(api.crystalMutations.batchMutateCrystalData);
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project seed? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await batchMutateCrystalData({
        table: "crystals",
        operations: [{
          type: "delete",
          id: seed._id
        }]
      });

      if (result.success) {
        toast.success('Project seed deleted successfully');
      } else {
        toast.error('Failed to delete project seed');
      }
    } catch (error) {
      console.error('Error deleting project seed:', error);
      toast.error('Failed to delete project seed');
    }
  };

  const handleSave = async () => {
    try {
      const updateData = {
        suggested_project_name: editedSeed.suggested_project_name,
        suggested_project_description: editedSeed.suggested_project_description,
        updatedAt: Date.now()
      };

      const result = await batchMutateCrystalData({
        table: "crystals",
        operations: [{
          type: "update",
          id: seed._id,
          data: updateData
        }]
      });

      if (result.success) {
        toast.success('Project seed updated successfully');
        setIsEditing(false);
      } else {
        toast.error('Failed to update project seed');
      }
    } catch (error) {
      console.error('Error updating project seed:', error);
      toast.error('Failed to update project seed');
    }
  };

  const handleCancel = () => {
    setEditedSeed({
      suggested_project_name: seed.suggested_project_name || '',
      suggested_project_description: seed.suggested_project_description || '',
    });
    setIsEditing(false);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    
    if (diffSeconds < 60) return `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`;
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'very_high':
      case 'high':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
      case 'moderate':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      case 'developing':
      case 'low':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800';
      default:
        return 'text-muted-foreground bg-muted/30 border-border';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300';
      case 'moderate':
        return 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300';
      case 'complex':
        return 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const getTimeHorizonIcon = (horizon: string) => {
    switch (horizon) {
      case 'short_term':
        return <Zap className="w-3 h-3" />;
      case 'medium_term':
        return <Calendar className="w-3 h-3" />;
      case 'long_term':
        return <TrendingUp className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const isPromoted = seed.auto_promoted || seed.promoted_to_project_id;

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden bg-background/50 backdrop-blur-sm hover:border-border/60 transition-all duration-300">
      {/* Status line at top - green for high confidence seeds */}
      <div className={`h-px w-full ${
        seed.confidence_score === 'high' || seed.confidence_score === 'very_high'
          ? 'bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent'
          : seed.confidence_score === 'moderate'
          ? 'bg-gradient-to-r from-transparent via-amber-400/60 to-transparent'
          : 'bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent'
      }`} />
      
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editedSeed.suggested_project_name}
                  onChange={(e) => setEditedSeed({...editedSeed, suggested_project_name: e.target.value})}
                  className="text-lg font-medium text-foreground leading-tight bg-muted/20 px-3 py-2 rounded-lg border border-border/50 focus:border-border focus:outline-none w-full"
                  placeholder="Project name..."
                />
              ) : (
                <h4 className="text-lg font-medium text-foreground leading-tight flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-500" />
                  {seed.suggested_project_name || seed.name}
                </h4>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-medium">
                  Project Seed
                </span>
                {seed.suggested_domain && (
                  <>
                    <span>•</span>
                    <span>{seed.suggested_domain}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-1 rounded-full border ${getConfidenceColor(seed.confidence_score)}`}>
                {seed.confidence_score?.replace('_', ' ')}
              </span>
              
              {/* Promoted Badge */}
              {isPromoted && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Promoted
                </span>
              )}
              
              {/* Edit/Delete Actions */}
              {!isPromoted && (
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
                        title="Edit seed"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={handleDelete}
                        className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete seed"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <textarea
              value={editedSeed.suggested_project_description}
              onChange={(e) => setEditedSeed({...editedSeed, suggested_project_description: e.target.value})}
              className="w-full text-muted-foreground leading-relaxed text-sm bg-muted/20 p-3 rounded-lg border border-border/50 focus:border-border focus:outline-none resize-none"
              rows={3}
              placeholder="Project description..."
            />
          ) : (
            <p className="text-muted-foreground leading-relaxed text-sm">
              {seed.suggested_project_description || seed.description}
            </p>
          )}
        </div>

        {/* Project Metadata */}
        <div className="flex items-center flex-wrap gap-2">
          {seed.suggested_complexity && (
            <span className={`text-xs px-2 py-1 rounded-full ${getComplexityColor(seed.suggested_complexity)}`}>
              {seed.suggested_complexity} complexity
            </span>
          )}
          {seed.suggested_time_horizon && (
            <span className="text-xs px-2 py-1 rounded-full bg-muted/50 text-foreground flex items-center gap-1">
              {getTimeHorizonIcon(seed.suggested_time_horizon)}
              {seed.suggested_time_horizon.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Content Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
          <div className="flex items-center gap-4">
            {seed.related_note_ids && seed.related_note_ids.length > 0 && (
              <span>{seed.related_note_ids.length} related notes</span>
            )}
            {seed.related_conversation_ids && seed.related_conversation_ids.length > 0 && (
              <span>{seed.related_conversation_ids.length} conversations</span>
            )}
            {seed.observation_count > 0 && (
              <span>{seed.observation_count} observations</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {seed._creationTime && (
              <span>{formatTimestamp(seed._creationTime)}</span>
            )}
            {isPromoted && seed.promoted_to_project_id && (
              <a
                href={`/dashboard/projects/${seed.promoted_to_project_id}`}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                title="View promoted project"
              >
                <ExternalLink className="w-3 h-3" />
                View Project
              </a>
            )}
          </div>
        </div>

        {/* Promotion Info */}
        {isPromoted && seed.confidence_at_promotion && (
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">
              Auto-promoted to project
            </div>
            <div>
              Confidence at promotion: {seed.confidence_at_promotion}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProjectSeedsView: React.FC<ProjectSeedsViewProps> = ({ recentSeeds }) => {
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
  
  // Query project seeds (crystals with type = project_seed)
  const projectSeeds = useQuery(
    api.projectSeedQueries.getProjectSeeds,
    userId ? {
      userId,
      includePromoted: true,
      limit: 100
    } : "skip"
  );
  
  // Use direct data or fallback to legacy prop
  const displaySeeds = projectSeeds || recentSeeds || [];
  const isLoading = isLoadingUserId || (!userId || projectSeeds === undefined);
  
  // Separate promoted and active seeds
  const activeSeeds = displaySeeds.filter((seed: any) => !seed.auto_promoted && !seed.promoted_to_project_id);
  const promotedSeeds = displaySeeds.filter((seed: any) => seed.auto_promoted || seed.promoted_to_project_id);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-light tracking-tight text-foreground flex items-center gap-2">
          <Sprout className="w-6 h-6 text-emerald-500" />
          Project Seeds
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Emergent project opportunities detected from your content patterns
          {displaySeeds.length > 0 && (
            <span className="ml-2 text-sm">
              • {activeSeeds.length} active seed{activeSeeds.length !== 1 ? 's' : ''}
              {promotedSeeds.length > 0 && ` • ${promotedSeeds.length} promoted`}
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
      ) : displaySeeds.length > 0 ? (
        <div className="space-y-8">
          {/* Active Seeds */}
          {activeSeeds.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Active Seeds
                </h4>
                <div className="h-px flex-1 bg-border/30" />
              </div>
              <div className="space-y-6">
                {activeSeeds.map((seed: any) => (
                  <ProjectSeedCard key={seed._id} seed={seed} />
                ))}
              </div>
            </div>
          )}
          
          {/* Promoted Seeds */}
          {promotedSeeds.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Promoted to Projects
                </h4>
                <div className="h-px flex-1 bg-border/30" />
              </div>
              <div className="space-y-6">
                {promotedSeeds.map((seed: any) => (
                  <ProjectSeedCard key={seed._id} seed={seed} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 space-y-3">
          <Sprout className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">
            No project seeds detected yet. Continue adding content and the system will identify potential projects automatically!
          </p>
        </div>
      )}
    </div>
  );
};
