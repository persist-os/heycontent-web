import React, { useState } from 'react';
import { Lightbulb, Copy, Check, ArrowRight } from 'lucide-react';

export interface Idea {
  content: string;
  summary?: string;
  actionable_steps?: string[];
  confidence?: number;
}

interface IdeaCardProps {
  idea: Idea;
  index: number;
  onApply: (idea: Idea) => void;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, index, onApply }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    let textToCopy = idea.content;
    if (idea.actionable_steps && idea.actionable_steps.length > 0) {
      textToCopy += '\n\nActionable Steps:\n' + idea.actionable_steps.map(step => `- ${step}`).join('\n');
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasActionableSteps = idea.actionable_steps && idea.actionable_steps.length > 0;
  const hasSummary = !!idea.summary;

  return (
    <div className="bg-white border border-purple-100 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <Lightbulb size={16} className="text-purple-500 mr-2" />
          <span className="font-medium text-sm text-purple-700">Idea {index + 1}</span>
        </div>
        {idea.confidence !== undefined && (
          <div className="px-2 py-1 bg-purple-50 rounded-full text-xs text-purple-700">
            {Math.round(idea.confidence * 100)}% match
          </div>
        )}
      </div>
      <p className="text-gray-700 text-sm mb-2">{idea.content}</p>
      {hasSummary && (
        <div className="bg-purple-50 p-2 rounded-md mb-2">
          <p className="text-xs text-gray-600 mb-1 font-medium">Summary:</p>
          <p className="text-xs text-gray-700">{idea.summary}</p>
        </div>
      )}
      {hasActionableSteps && (
        <div className="mb-3">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-purple-600 hover:text-purple-800 mb-1 flex items-center"
          >
            {expanded ? 'Hide' : 'Show'} actionable steps
            <svg
              className={`w-3 h-3 ml-1 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expanded && (
            <ul className="text-xs text-gray-700 list-disc pl-4 pt-1 space-y-1">
              {idea.actionable_steps?.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="flex justify-end space-x-2">
        <button 
          onClick={handleCopy}
          className="flex items-center text-xs px-2 py-1 rounded-md text-gray-600 hover:bg-gray-100"
          title="Copy to clipboard"
        >
          {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button 
          onClick={() => onApply(idea)}
          className="flex items-center text-xs px-2 py-1 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200"
          title="Apply this idea"
        >
          <ArrowRight size={14} className="mr-1" />
          Apply
        </button>
      </div>
    </div>
  );
};

export default IdeaCard;
