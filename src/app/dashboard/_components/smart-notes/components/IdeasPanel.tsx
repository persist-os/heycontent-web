import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import IdeaCard, { Idea } from './IdeaCard';
import IdeasActionButton from './IdeasActionButton';
import IdeasOverlay from './IdeasOverlay';
import { normalizeSmartNoteIdeas } from '../utils/normalizeSmartNoteIdeas';
import { useSmartNoteIdeas } from '../hooks/useSmartNoteIdeas';

interface IdeasPanelProps {
  noteId?: string;
  userId: string;
  platform?: string;
  mode?: 'note' | 'user';
  limit?: number;
  onApplyIdea?: (idea: string) => void;
  isEmbedded?: boolean;
}

import { useCallback, useMemo } from 'react';

const platformOptions = [
  { label: 'Any', value: 'any' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Twitter', value: 'twitter' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Blog', value: 'blog' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'LinkedIn', value: 'linkedin' }
];

const IdeasPanel: React.FC<IdeasPanelProps> = ({ noteId, userId, platform: initialPlatform, onApplyIdea, limit = 5, isEmbedded = false }) => {
  const [platform, setPlatform] = useState<string>(initialPlatform || 'any');
  // Memoize the platform and limit to avoid unnecessary hook re-initialization
  const memoPlatform = useMemo(() => platform, [platform]);
  const memoLimit = useMemo(() => limit, [limit]);
  const memoNoteId = useMemo(() => noteId, [noteId]);
  
  // Use the enhanced hook with noteId for local storage persistence
  const { ideas: rawIdeas, loading, error, refetch, clearIdeas } = useSmartNoteIdeas({
    platform: memoPlatform, 
    limit: memoLimit,
    noteId: memoNoteId
  });
  
  const [hasRequested, setHasRequested] = useState(false);
  const [applying, setApplying] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const ideas: Idea[] = useMemo(() => normalizeSmartNoteIdeas(rawIdeas), [rawIdeas]);

  const handleFetchIdeas = useCallback(async () => {
    setHasRequested(true);
    await refetch();
  }, [refetch]);
  
  // Clear ideas from local storage and fetch new ones
  const handleRefreshIdeas = useCallback(async () => {
    clearIdeas();
    setHasRequested(true);
    await refetch();
  }, [clearIdeas, refetch]);

  const handleApplyIdea = useCallback((idea: Idea) => {
    if (applying) return;
    setApplying(true);
    try {
      // Format the idea content to be more editor-friendly
      let formattedContent = idea.content;
      
      // Add a newline before the idea if we're not at the beginning of a line
      if (onApplyIdea) {
        // Add a newline prefix to ensure the idea starts on a new line
        formattedContent = `\n${formattedContent}`;
        
        // If there are actionable steps, add them too
        if (idea.actionable_steps && idea.actionable_steps.length > 0) {
          formattedContent += '\n\nActionable Steps:\n' + 
            idea.actionable_steps.map(step => `- ${step}`).join('\n');
        }
        
        // Apply the idea without switching tabs
        onApplyIdea(formattedContent);
      }
    } finally {
      setTimeout(() => setApplying(false), 500); // Add a slight delay for better UX
    }
  }, [applying, onApplyIdea, isEmbedded]);

  return (
    <div className={`bg-white ${!isEmbedded ? 'border border-purple-100 rounded-lg' : ''} overflow-hidden transition-all duration-300 ease-in-out`}>
      {!isEmbedded && (
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-purple-500" />
            <span className="font-semibold text-purple-700 text-base">Smart Note Ideas</span>
          </div>
          <button
            className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1 rounded focus:outline-none"
            onClick={() => setIsPanelCollapsed(v => !v)}
            aria-label={isPanelCollapsed ? 'Expand ideas panel' : 'Collapse ideas panel'}
          >
            {isPanelCollapsed ? (
              <ChevronDown size={16} className="text-purple-600" />
            ) : (
              <ChevronUp size={16} className="text-purple-600" />
            )}
            <span className="sr-only">{isPanelCollapsed ? 'Show' : 'Hide'}</span>
          </button>
        </div>
      )}
      {(!isPanelCollapsed || isEmbedded) && (
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label htmlFor="platform-select" className="text-sm text-purple-700 font-medium">Platform:</label>
              <select
                id="platform-select"
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                className="border border-purple-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                {platformOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            {/* Refresh button - only shown when ideas exist */}
            {ideas.length > 0 && (
              <button
                onClick={handleRefreshIdeas}
                className="text-purple-600 hover:text-purple-800 p-1 rounded-full hover:bg-purple-50 transition-colors"
                title="Get new ideas"
                disabled={loading}
              >
                <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh ideas</span>
              </button>
            )}
          </div>
          
          {/* Show action button only when no ideas exist or explicitly requested */}
          {(ideas.length === 0 || !hasRequested) && (
            <IdeasActionButton
              loading={loading}
              hasIdeas={hasRequested && ideas.length > 0}
              onClick={handleFetchIdeas}
              className="mb-4 mx-auto"
            />
          )}
          {hasRequested && error && (
            <div className="text-red-600 text-sm text-center my-4">{error}</div>
          )}
          {hasRequested && !loading && ideas.length === 0 && !error && (
            <div className="text-center text-gray-400 py-4">No ideas found. Try regenerating.</div>
          )}
          {hasRequested && ideas.length > 0 && !loading && (
            <div className="space-y-4">
              {ideas.map((idea, idx) => (
                <IdeaCard key={idx} idea={idea} index={idx} onApply={handleApplyIdea} />
              ))}
            </div>
          )}
          <IdeasOverlay show={applying} text="Applying idea to your note..." />
        </div>
      )}
    </div>
  );
};

export default IdeasPanel;
