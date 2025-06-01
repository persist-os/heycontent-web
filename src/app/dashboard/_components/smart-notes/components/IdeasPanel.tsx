import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
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
}

const IdeasPanel: React.FC<IdeasPanelProps> = ({ noteId, userId, platform, onApplyIdea, limit = 5 }) => {
  const { ideas: rawIdeas, loading, error, refetch } = useSmartNoteIdeas({ platform, limit });
  const [hasRequested, setHasRequested] = useState(false);
  const [applying, setApplying] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const ideas: Idea[] = normalizeSmartNoteIdeas(rawIdeas);

  const handleFetchIdeas = async () => {
    setHasRequested(true);
    await refetch();
  };

  const handleApplyIdea = (idea: Idea) => {
    if (applying) return;
    setApplying(true);
    try {
      if (onApplyIdea) onApplyIdea(idea.content);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-white border border-purple-100 rounded-lg overflow-hidden transition-all duration-300 ease-in-out">
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
      {!isPanelCollapsed && (
        <div className="p-4">
          <IdeasActionButton
            loading={loading}
            hasIdeas={hasRequested && ideas.length > 0}
            onClick={handleFetchIdeas}
            className="mb-4 mx-auto"
          />
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
