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
    <div className="bg-card border border-border/50 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <Lightbulb size={16} className="text-primary mr-2 flex-shrink-0" />
          <span className="font-medium text-sm text-foreground/90">Idea {index + 1}</span>
        </div>
        {idea.confidence !== undefined && (
          <div className="px-2.5 py-0.5 bg-muted rounded-full text-xs text-foreground/80">
            {Math.round(idea.confidence * 100)}% match
          </div>
        )}
      </div>
      <p className="text-foreground/90 text-sm mb-3 leading-relaxed">{idea.content}</p>
      
      {hasSummary && (
        <div className="bg-muted/50 p-3 rounded-md mb-3 border border-border/30">
          <p className="text-xs text-muted-foreground mb-1.5 font-medium">Summary</p>
          <p className="text-sm text-foreground/90">{idea.summary}</p>
        </div>
      )}
      
      {hasActionableSteps && (
        <div className="mb-3">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center group"
          >
            {expanded ? 'Hide' : 'Show'} actionable steps
            <svg
              className={`w-3.5 h-3.5 ml-1.5 transform transition-transform ${expanded ? 'rotate-180' : 'group-hover:translate-y-0.5'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expanded && (
            <ul className="text-sm text-foreground/90 list-disc pl-5 mt-2 space-y-1.5">
              {idea.actionable_steps?.map((step, idx) => (
                <li key={idx} className="leading-relaxed">{step}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <div className="flex justify-end space-x-2 pt-2">
        <button 
          onClick={handleCopy}
          className="flex items-center text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check size={14} className="mr-1.5 text-green-500" />
          ) : (
            <Copy size={14} className="mr-1.5" />
          )}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button 
          onClick={() => onApply(idea)}
          className="flex items-center text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          title="Apply this idea"
        >
          <ArrowRight size={14} className="mr-1.5" />
          Apply
        </button>
      </div>
    </div>
  );
};

export default IdeaCard;
