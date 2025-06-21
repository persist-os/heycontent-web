"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleTypeSelect = (newType: NoteType) => {
    console.log('[TypeSelector] Type selected:', newType);
    if (newType !== currentType) {
      onTypeChange(newType);
    }
    setIsOpen(false);
  };

  const handleToggle = () => {
    console.log('[TypeSelector] Toggle clicked, current isOpen:', isOpen);
    
    if (!isOpen && buttonRef.current) {
      // Calculate position when opening
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4, // 4px gap
        right: window.innerWidth - rect.right // Right-aligned
      });
    }
    
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking on the button or inside the dropdown
      if (
        (buttonRef.current && buttonRef.current.contains(target)) ||
        (dropdownRef.current && dropdownRef.current.contains(target))
      ) {
        return;
      }
      
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const currentLabel = TYPE_LABELS[currentType]?.label || 'Unknown';

  const dropdownContent = isOpen && (
    <div 
      ref={dropdownRef}
      className="fixed w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[9999]"
      style={{
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
      }}
    >
      <div className="p-2">
        {Object.entries(TYPE_LABELS).map(([type, { label, description }]) => (
          <button
            key={type}
            onClick={() => handleTypeSelect(type as NoteType)}
            className={`w-full text-left p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
              type === currentType 
                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' 
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="font-medium text-sm">{label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background text-foreground shadow border border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 gap-1"
          title={`Type: ${currentLabel}${typeGenerated ? ' (AI-classified)' : ''}`}
        >
          <span className={typeGenerated ? 'opacity-75' : ''}>{currentLabel}</span>
          {typeGenerated && (
            <span className="text-purple-500 text-[10px] font-medium">AI</span>
          )}
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {/* Portal the dropdown to body to avoid clipping */}
      {typeof window !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
} 