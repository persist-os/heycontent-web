import React, { useState } from 'react';
import { useSmartNoteIdeas, useExecuteIdea } from './hooks';

interface IdeasPanelProps {
  noteId?: string;
  userId: string;
  platform?: string;
  mode?: 'note' | 'user';
  limit?: number;
}

const IdeasPanel: React.FC<IdeasPanelProps> = ({ noteId, userId, platform, mode = 'note', limit = 5 }) => {
  const { ideas, loading, error, refresh } = useSmartNoteIdeas({ noteId, userId, platform, mode, limit });
  const { result, loading: executing, error: execError, execute, reset } = useExecuteIdea();
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);

  const handleIdeaClick = (idea: string) => {
    setSelectedIdea(idea);
    execute({ userId, idea, note: '', context: {} }); // Pass note/context as needed
  };

  const closeModal = () => {
    setSelectedIdea(null);
    reset();
  };

  return (
    <div className="ideas-panel">
      <div className="ideas-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>AI Content Ideas</h3>
        <button onClick={refresh} disabled={loading} style={{ marginLeft: 8 }}>
          {loading ? 'Refreshing...' : 'Regenerate'}
        </button>
      </div>
      {error && <div className="ideas-error" style={{ color: 'red', margin: '8px 0' }}>{error}</div>}
      <ul className="ideas-list" style={{ listStyle: 'none', padding: 0 }}>
        {ideas.map((idea, idx) => (
          <li key={idx} style={{ margin: '8px 0' }}>
            <button
              style={{ width: '100%', textAlign: 'left', background: '#f9f9f9', border: '1px solid #ddd', padding: '8px', borderRadius: 4, cursor: 'pointer' }}
              onClick={() => handleIdeaClick(idea)}
              disabled={executing && selectedIdea === idea}
            >
              {idea}
            </button>
          </li>
        ))}
      </ul>
      {ideas.length === 0 && !loading && !error && <div style={{ color: '#888', marginTop: 16 }}>No ideas yet.</div>}

      {/* Modal for expanded idea */}
      {selectedIdea && (
        <div className="ideas-modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320, maxWidth: 480, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
            <h4>Expanded Idea</h4>
            <div style={{ minHeight: 60 }}>
              {executing ? (
                <div>Generating...</div>
              ) : execError ? (
                <div style={{ color: 'red' }}>{execError}</div>
              ) : (
                <div>{result || 'No result.'}</div>
              )}
            </div>
            <button onClick={closeModal} style={{ marginTop: 16 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeasPanel;
