import React from 'react';

interface IdeasActionButtonProps {
  loading: boolean;
  hasIdeas: boolean;
  onClick: () => void;
  className?: string;
}

const IdeasActionButton: React.FC<IdeasActionButtonProps> = ({ loading, hasIdeas, onClick, className }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`flex items-center text-sm px-4 py-2 rounded-md ${hasIdeas ? 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-100' : 'bg-purple-600 text-white hover:bg-purple-700'} ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
    aria-label={hasIdeas ? 'Regenerate ideas' : 'Request ideas'}
  >
    {loading ? (hasIdeas ? 'Regenerating...' : 'Generating...') : (hasIdeas ? 'Regenerate Ideas' : 'Request Ideas')}
  </button>
);

export default IdeasActionButton;
