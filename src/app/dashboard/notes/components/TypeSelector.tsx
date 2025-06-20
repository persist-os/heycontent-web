"use client";
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { NoteType } from '../types';

interface TypeSelectorProps {
  currentType: NoteType;
  typeGenerated?: boolean;
  onTypeChange: (newType: NoteType) => void;
}

const TYPE_LABELS: Record<NoteType, { label: string; description: string }> = {
  idea_bank: { label: 'Idea Bank', description: 'Early-stage ideas and brainstorming' },
  content_script: { label: 'Content Script', description: 'Structured posts and video scripts' },
  collaboration_note: { label: 'Collaboration', description: 'Brand deals and creator projects' },
  analytics_insight: { label: 'Analytics', description: 'Performance analysis and insights' },
  reflection_journal: { label: 'Reflection', description: 'Personal thoughts and creative process' },
  task_checklist: { label: 'Task Checklist', description: 'Action items and to-do lists' }
};

export function TypeSelector({ currentType, typeGenerated, onTypeChange }: TypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTypeSelect = (newType: NoteType) => {
    if (newType !== currentType) {
      onTypeChange(newType);
    }
    setIsOpen(false);
  };

  const currentLabel = TYPE_LABELS[currentType]?.label || 'Unknown';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background text-foreground shadow border border-gray-200 hover:bg-gray-50 gap-1"
        title={`Type: ${currentLabel}${typeGenerated ? ' (AI-classified)' : ''}`}
      >
        <span className={typeGenerated ? 'opacity-75' : ''}>{currentLabel}</span>
        {typeGenerated && (
          <span className="text-purple-500 text-[10px] font-medium">AI</span>
        )}
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              {Object.entries(TYPE_LABELS).map(([type, { label, description }]) => (
                <button
                  key={type}
                  onClick={() => handleTypeSelect(type as NoteType)}
                  className={`w-full text-left p-2 rounded-md hover:bg-gray-50 transition-colors ${
                    type === currentType ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                  }`}
                >
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{description}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 