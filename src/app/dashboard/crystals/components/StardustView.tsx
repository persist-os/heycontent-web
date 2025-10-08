import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, TrendingUp, Calendar, Zap, Edit3, Trash2, Save, X, CheckCircle2, ExternalLink } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { toast } from 'sonner';

interface StardustViewProps {
  recentStardust?: any[]; // Legacy prop for fallback
}

interface StardustCardProps {
  stardust: any;
  userId: string;
}

const StardustCard: React.FC<StardustCardProps> = ({ stardust, userId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStardust, setEditedStardust] = useState({
    suggestedProjectName: stardust.suggestedProjectName || '',
    suggestedProjectDescription: stardust.suggestedProjectDescription || '',
  });
  
  // Convex mutations for stardust operations (to be implemented)
  // const updateStardust = useMutation(api.stardustMutations.updateStardust);
  // const deleteStardust = useMutation(api.stardustMutations.deleteStardust);
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this stardust? This action cannot be undone.')) {
      return;
    }

    try {
      // await deleteStardust({ stardustId: stardust._id });
      toast.success('Stardust deleted successfully');
    } catch (error) {
      console.error('Error deleting stardust:', error);
      toast.error('Failed to delete stardust');
    }
  };

  const handleSave = async () => {
    try {
      // await updateStardust({
      //   stardustId: stardust._id,
      //   updates: {
      //     suggestedProjectName: editedStardust.suggestedProjectName,
      //     suggestedProjectDescription: editedStardust.suggestedProjectDescription,
      //   }
      // });
      toast.success('Stardust updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating stardust:', error);
      toast.error('Failed to update stardust');
    }
  };

  const handleCancel = () => {
    setEditedStardust({
      suggestedProjectName: stardust.suggestedProjectName || '',
      suggestedProjectDescription: stardust.suggestedProjectDescription || '',
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) {
      return 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800';
    } else if (confidence >= 0.6) {
      return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
    } else {
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800';
    }
  };

  const formatConfidence = (confidence: number) => {
    if (confidence >= 0.8) return 'Very High';
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.5) return 'Moderate';
    return 'Developing';
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

  const getLifecycleStageColor = (stage: string) => {
    switch (stage) {
      case 'embryo':
        return 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300';
      case 'juvenile':
        return 'bg-cyan-100 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300';
      case 'mature':
        return 'bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300';
      case 'elder':
        return 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300';
      case 'transcendent':
        return 'bg-pink-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const isPromoted = stardust.promoted;

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden bg-background/50 backdrop-blur-sm hover:border-border/60 transition-all duration-300">
      {/* Status line at top - violet for high confidence stardust */}
      <div className={`h-px w-full ${
        stardust.confidence >= 0.7
          ? 'bg-gradient-to-r from-transparent via-violet-400/60 to-transparent'
          : stardust.confidence >= 0.5
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
                  value={editedStardust.suggestedProjectName}
                  onChange={(e) => setEditedStardust({...editedStardust, suggestedProjectName: e.target.value})}
                  className="text-lg font-medium text-foreground leading-tight bg-muted/20 px-3 py-2 rounded-lg border border-border/50 focus:border-border focus:outline-none w-full"
                  placeholder="Project name..."
                />
              ) : (
                <h4 className="text-lg font-medium text-foreground leading-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                  {stardust.suggestedProjectName || stardust.name}
                </h4>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span className="px-2 py-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full font-medium">
                  Stardust
                </span>
                {stardust.lifecycleStage && (
                  <>
                    <span>•</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getLifecycleStageColor(stardust.lifecycleStage)}`}>
                      {stardust.lifecycleStage}
                    </span>
                  </>
                )}
                {stardust.suggestedDomain && (
                  <>
                    <span>•</span>
                    <span>{stardust.suggestedDomain}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-1 rounded-full border ${getConfidenceColor(stardust.confidence)}`}>
                {formatConfidence(stardust.confidence)}
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
                        title="Edit stardust"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={handleDelete}
                        className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete stardust"
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
              value={editedStardust.suggestedProjectDescription}
              onChange={(e) => setEditedStardust({...editedStardust, suggestedProjectDescription: e.target.value})}
              className="w-full text-muted-foreground leading-relaxed text-sm bg-muted/20 p-3 rounded-lg border border-border/50 focus:border-border focus:outline-none resize-none"
              rows={3}
              placeholder="Project description..."
            />
          ) : (
            <p className="text-muted-foreground leading-relaxed text-sm">
              {stardust.suggestedProjectDescription || stardust.description}
            </p>
          )}
        </div>

        {/* Project Metadata */}
        <div className="flex items-center flex-wrap gap-2">
          {stardust.suggestedComplexity !== undefined && (
            <span className={`text-xs px-2 py-1 rounded-full ${getComplexityColor(String(stardust.suggestedComplexity))}`}>
              Complexity: {stardust.suggestedComplexity}/10
            </span>
          )}
          {stardust.suggestedTimeHorizon && (
            <span className="text-xs px-2 py-1 rounded-full bg-muted/50 text-foreground flex items-center gap-1">
              {getTimeHorizonIcon(stardust.suggestedTimeHorizon)}
              {stardust.suggestedTimeHorizon.replace('_', ' ')}
            </span>
          )}
          {stardust.evidenceStrength && (
            <span className="text-xs px-2 py-1 rounded-full bg-muted/50 text-foreground">
              {stardust.evidenceStrength} evidence
            </span>
          )}
          {stardust.detectionMethod && (
            <span className="text-xs px-2 py-1 rounded-full bg-muted/50 text-foreground">
              {stardust.detectionMethod}
            </span>
          )}
          {stardust.dimension && (
            <span className="text-xs px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300">
              {stardust.dimension}
            </span>
          )}
        </div>

        {/* Content Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
          <div className="flex items-center gap-4">
            {stardust.keywords && stardust.keywords.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {stardust.keywords.map((keyword: string, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 bg-muted/50 rounded text-xs">
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {stardust.detectedAt && (
              <span>{formatTimestamp(stardust.detectedAt)}</span>
            )}
            {isPromoted && stardust.promotedToProjectId && (
              <a
                href={`/dashboard/projects/${stardust.promotedToProjectId}`}
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
        {isPromoted && stardust.confidenceAtPromotion && (
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">
              Auto-promoted to project
            </div>
            <div>
              Confidence at promotion: {formatConfidence(stardust.confidenceAtPromotion)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const StardustView: React.FC<StardustViewProps> = ({ recentStardust }) => {
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
  
  // Query stardust from dedicated stardust table
  const stardustData = useQuery(
    api.stardustQueries.listStardust,
    userId ? {
      userId,
      includePromoted: true,
      limit: 100
    } : "skip"
  );
  
  // Use direct data or fallback to legacy prop
  const displayStardust = stardustData || recentStardust || [];
  const isLoading = isLoadingUserId || (!userId || stardustData === undefined);
  
  // Separate promoted and active stardust
  const activeStardust = displayStardust.filter((s: any) => !s.promoted);
  const promotedStardust = displayStardust.filter((s: any) => s.promoted);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-light tracking-tight text-foreground">
          Stardust
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Project potentials that evolve into star organisms
          {displayStardust.length > 0 && (
            <span className="ml-2 text-sm">
              • {activeStardust.length} active stardust
              {promotedStardust.length > 0 && ` • ${promotedStardust.length} promoted`}
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
      ) : displayStardust.length > 0 ? (
        <div className="space-y-8">
          {/* Active Stardust */}
          {activeStardust.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Active Stardust
                </h4>
                <div className="h-px flex-1 bg-border/30" />
              </div>
              <div className="space-y-6">
                {activeStardust.map((s: any) => (
                  <StardustCard key={s._id} stardust={s} userId={userId || ''} />
                ))}
              </div>
            </div>
          )}
          
          {/* Promoted Stardust */}
          {promotedStardust.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Promoted to Projects
                </h4>
                <div className="h-px flex-1 bg-border/30" />
              </div>
              <div className="space-y-6">
                {promotedStardust.map((s: any) => (
                  <StardustCard key={s._id} stardust={s} userId={userId || ''} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 space-y-3">
          <Sparkles className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">
            No stardust detected yet. Continue adding content and the system will identify project potentials automatically!
          </p>
        </div>
      )}
    </div>
  );
};

