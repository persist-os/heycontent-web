import React from 'react';
import { useSmartNoteIdeas } from '@/app/lib/api-helpers';
import ReactMarkdown from 'react-markdown';

interface IdeasPanelProps {
  noteId?: string;
  userId: string;
  platform?: string;
  mode?: 'note' | 'user';
  limit?: number;
}

const IdeasPanel: React.FC<IdeasPanelProps> = ({ noteId, userId, platform }) => {
  const { ideas, loading, error, refetch } = useSmartNoteIdeas({ userId, platform });

  return (
    <div className="ideas-panel">
      <div className="ideas-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>AI Prompts</h3>
        <button onClick={refetch} disabled={loading} style={{ marginLeft: 8 }}>
          {loading ? 'Refreshing...' : 'Regenerate'}
        </button>
      </div>
      {error && <div className="ideas-error" style={{ color: 'red', margin: '8px 0' }}>{error}</div>}
      {loading ? (
        <div style={{ color: '#888', marginTop: 16 }}>Loading prompts...</div>
      ) : ideas.length > 0 ? (
        <div>
          {ideas.map((p, i) => (
            <div key={i}>{typeof p === 'string' ? p : JSON.stringify(p)}</div>
          ))}
        </div>
      ) : (
        !error && <div style={{ color: '#888', marginTop: 16 }}>No prompts yet.</div>
      )}
    </div>
  );
};


export default IdeasPanel;
