import React from 'react';
import { useSmartNotePrompts } from '@/app/lib/api-helpers';
import ReactMarkdown from 'react-markdown';

interface IdeasPanelProps {
  noteId?: string;
  userId: string;
  platform?: string;
  mode?: 'note' | 'user';
  limit?: number;
}

const IdeasPanel: React.FC<IdeasPanelProps> = ({ noteId, userId, platform }) => {
  const { prompts, loading, error, refetch } = useSmartNotePrompts({ noteId, userId, platform });

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
      ) : prompts.length > 0 ? (
        <ReactMarkdown>
          {prompts.map(p => `- ${p}`).join('\n')}
        </ReactMarkdown>
      ) : (
        !error && <div style={{ color: '#888', marginTop: 16 }}>No prompts yet.</div>
      )}
    </div>
  );
};
};

export default IdeasPanel;
