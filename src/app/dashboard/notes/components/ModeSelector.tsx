"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Lightbulb, FileText, Users, BarChart3, BookOpen, CheckSquare, Edit3, Sparkles } from 'lucide-react';
import { NoteType } from '../utils/refinement-configs';

interface ModeSelectorProps {
  currentNoteType: NoteType;
  selectedNoteType: NoteType | 'all';
  availableNoteTypes: NoteType[];
  onNoteTypeSelect: (noteType: NoteType | 'all') => void;
  mode: 'generation' | 'refinement';
}

// Note type configuration with icons and labels
const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; icon: React.ReactNode }> = {
  idea_bank: { 
    label: 'Ideas', 
    icon: <Lightbulb className="w-4 h-4" /> 
  },
  content_script: { 
    label: 'Writing', 
    icon: <FileText className="w-4 h-4" /> 
  },
  analytics_insight: { 
    label: 'Insights', 
    icon: <BarChart3 className="w-4 h-4" /> 
  },
  collaboration_note: { 
    label: 'People', 
    icon: <Users className="w-4 h-4" /> 
  },
  reflection_journal: { 
    label: 'Reflection', 
    icon: <BookOpen className="w-4 h-4" /> 
  },
  task_checklist: { 
    label: 'Tasks', 
    icon: <CheckSquare className="w-4 h-4" /> 
  },
  email_draft: { 
    label: 'Messages', 
    icon: <FileText className="w-4 h-4" /> 
  }
};

export function ModeSelector({
  currentNoteType,
  selectedNoteType,
  availableNoteTypes,
  onNoteTypeSelect,
  mode
}: ModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Generate unique IDs for ARIA relationships
  const comboboxId = `mode-selector-${mode}`;
  const listboxId = `${comboboxId}-listbox`;
  const activeDescendantId = isOpen ? `${comboboxId}-option-${focusedIndex}` : undefined;

  // Get current selection info
  const getCurrentSelection = () => {
    if (selectedNoteType === 'all') {
      return {
        label: 'All Types',
        icon: <Sparkles className="w-4 h-4" />,
        description: mode === 'generation' ? 'Universal commands for any note type' : 'All available refinement options'
      };
    }
    
    const config = NOTE_TYPE_CONFIG[selectedNoteType];
    return {
      label: config.label,
      icon: config.icon,
      description: selectedNoteType === currentNoteType 
        ? `Commands for current ${config.label.toLowerCase()}` 
        : `Cross-note commands for ${config.label.toLowerCase()}`
    };
  };

  const currentSelection = getCurrentSelection();

  // Create dropdown options
  const dropdownOptions = [
    {
      value: 'all' as const,
      label: 'All Types',
      icon: <Sparkles className="w-4 h-4" />,
      description: mode === 'generation' ? 'Universal commands for any note type' : 'All available refinement options',
      isSelected: selectedNoteType === 'all'
    },
    ...availableNoteTypes.map(noteType => ({
      value: noteType,
      label: NOTE_TYPE_CONFIG[noteType].label,
      icon: NOTE_TYPE_CONFIG[noteType].icon,
      description: noteType === currentNoteType 
        ? `Commands for current ${NOTE_TYPE_CONFIG[noteType].label.toLowerCase()}` 
        : `Cross-note commands for ${NOTE_TYPE_CONFIG[noteType].label.toLowerCase()}`,
      isSelected: selectedNoteType === noteType
    }))
  ];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => (prev + 1) % dropdownOptions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => (prev - 1 + dropdownOptions.length) % dropdownOptions.length);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const selectedOption = dropdownOptions[focusedIndex];
          onNoteTypeSelect(selectedOption.value);
          setIsOpen(false);
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, dropdownOptions, onNoteTypeSelect]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Reset focused index when opening
  useEffect(() => {
    if (isOpen) {
      const selectedIndex = dropdownOptions.findIndex(option => option.isSelected);
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, dropdownOptions]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionSelect = (noteType: NoteType | 'all') => {
    onNoteTypeSelect(noteType);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Mode indicator and selector button */}
      <div className="flex items-center gap-2">
        {/* Mode indicator */}
        <div className="flex items-center gap-1" role="status" aria-label={`Current mode: ${mode}`}>
          {mode === 'refinement' ? (
            <Edit3 className="w-3 h-3 text-purple-600 dark:text-purple-400" aria-hidden="true" />
          ) : (
            <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          )}
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {mode === 'refinement' ? 'Refine' : 'Generate'}
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-4 bg-border" aria-hidden="true" />

        {/* Note type selector */}
        <button
          ref={buttonRef}
          type="button"
          id={comboboxId}
          onClick={handleToggle}
          className={`
            flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors
            hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/30
            ${isOpen ? 'bg-muted/50' : ''}
          `}
          role="combobox"
          aria-expanded={isOpen ? "true" : "false"}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={activeDescendantId}
          aria-label={`Select note type for ${mode} commands. Currently selected: ${currentSelection.label}. ${currentSelection.description}`}
        >
          <div className="flex items-center gap-1.5">
            <div className="text-muted-foreground" aria-hidden="true">
              {currentSelection.icon}
            </div>
            <span className="font-medium text-foreground">
              {currentSelection.label}
            </span>
          </div>
          <ChevronDown 
            className={`w-3 h-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          id={listboxId}
          className="absolute top-full left-0 mt-1 min-w-[240px] bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden"
          role="listbox"
          aria-label={`${mode === 'refinement' ? 'Refinement' : 'Generation'} command options by note type`}
          aria-multiselectable="false"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-border bg-muted/5" role="presentation">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {mode === 'refinement' ? 'Browse Refinement Commands' : 'Browse Generation Commands'}
            </div>
          </div>

          {/* Options */}
          <div className="py-1 max-h-64 overflow-y-auto" role="presentation">
            {dropdownOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                id={`${comboboxId}-option-${index}`}
                onClick={() => handleOptionSelect(option.value)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                  ${focusedIndex === index 
                    ? 'bg-purple-500/10 dark:bg-yellow-500/10 text-purple-600 dark:text-yellow-400' 
                    : 'hover:bg-muted/50 text-foreground'
                  }
                  ${option.isSelected ? 'font-medium' : ''}
                `}
                role="option"
                aria-selected={option.isSelected ? "true" : "false"}
                aria-describedby={`${comboboxId}-option-${index}-description`}
                tabIndex={-1}
              >
                <div 
                  className={`flex-shrink-0 ${
                    focusedIndex === index 
                      ? 'text-purple-600 dark:text-yellow-400' 
                      : 'text-muted-foreground'
                  }`}
                  aria-hidden="true"
                >
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {option.label}
                  </div>
                  <div 
                    id={`${comboboxId}-option-${index}-description`}
                    className="text-xs text-muted-foreground"
                  >
                    {option.description}
                  </div>
                </div>
                {option.isSelected && (
                  <div className="flex-shrink-0" aria-hidden="true">
                    <div className="w-2 h-2 rounded-full bg-purple-600 dark:bg-yellow-400" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-border bg-muted/5" role="presentation">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↑↓</kbd>
                <span>to navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↵</kbd>
                <span>to select</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}