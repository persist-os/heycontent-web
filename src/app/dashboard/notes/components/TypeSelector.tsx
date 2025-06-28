"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NoteType } from '../types';
import { Id } from '@/convex/_generated/dataModel';

interface TypeSelectorProps {
  noteId: string | Id<"notes">;
  userId: string;
  currentType: NoteType;
  typeGenerated?: boolean;
  // Keep the callback as optional for compatibility, but won't use it
  onTypeChange?: (newType: NoteType) => void;
}

const TYPE_LABELS: Record<NoteType, { label: string; description: string }> = {
  idea_bank: { label: 'Idea Bank', description: 'Early-stage ideas and brainstorming' },
  content_script: { label: 'Content Script', description: 'Structured posts and video scripts' },
  collaboration_note: { label: 'Collaboration', description: 'Brand deals and creator projects' },
  analytics_insight: { label: 'Analytics', description: 'Performance analysis and insights' },
  reflection_journal: { label: 'Reflection', description: 'Personal thoughts and creative process' },
  task_checklist: { label: 'Task Checklist', description: 'Action items and to-do lists' }
};

export function TypeSelector({ noteId, userId, currentType, typeGenerated, onTypeChange }: TypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [optimisticType, setOptimisticType] = useState<NoteType>(currentType);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasOptimisticUpdate, setHasOptimisticUpdate] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Convex mutation
  const updateNoteMutation = useMutation(api.notes.updateNote);

  // Debug logging
  useEffect(() => {
    console.log('[TypeSelector] Props changed:', { 
      noteId, 
      currentType, 
      optimisticType, 
      hasOptimisticUpdate,
      isSyncing 
    });
  }, [noteId, currentType, optimisticType, hasOptimisticUpdate, isSyncing]);

  // Only update optimistic type from props if we don't have a pending optimistic update
  // OR if the prop matches our optimistic value (sync completed)
  useEffect(() => {
    if (!hasOptimisticUpdate || currentType === optimisticType) {
      setOptimisticType(currentType);
      if (currentType === optimisticType) {
        setHasOptimisticUpdate(false);
      }
    }
  }, [currentType, optimisticType, hasOptimisticUpdate]);

  const handleTypeSelect = async (newType: NoteType) => {
    console.log('[TypeSelector] ===== Type selection started =====');
    console.log('[TypeSelector] Selected type:', newType);
    console.log('[TypeSelector] Current optimistic type:', optimisticType);
    console.log('[TypeSelector] Current prop type:', currentType);
    
    if (newType !== optimisticType) {
      console.log('[TypeSelector] Types are different, proceeding with selection...');
      
      // 1. INSTANTLY update the UI (optimistic update)
      console.log('[TypeSelector] Setting optimistic type to:', newType);
      setOptimisticType(newType);
      setHasOptimisticUpdate(true);
      setIsOpen(false);
      
      // 2. Call the optional callback immediately for UI consistency
      console.log('[TypeSelector] Calling onTypeChange callback...');
      onTypeChange?.(newType);
      
      // 3. Call the mutation in the background
      console.log('[TypeSelector] Starting Convex mutation...');
      setIsSyncing(true);
      try {
        const result = await updateNoteMutation({
          noteId: noteId as Id<"notes">,
          userId,
          updates: {
            type: newType,
            typeGenerated: false // Clear the AI-generated flag when user manually changes type
          }
        });
        console.log('[TypeSelector] Mutation successful, result:', result);
        console.log('[TypeSelector] Successfully synced note type to:', newType);
        // Don't reset hasOptimisticUpdate here - let the useEffect handle it when props update
      } catch (error) {
        console.error('[TypeSelector] Mutation failed:', error);
        // Revert optimistic update on error
        setOptimisticType(currentType);
        setHasOptimisticUpdate(false);
        onTypeChange?.(currentType);
      } finally {
        setIsSyncing(false);
        console.log('[TypeSelector] ===== Type selection completed =====');
      }
    } else {
      console.log('[TypeSelector] Types are the same, just closing dropdown');
      setIsOpen(false);
    }
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

  // Close dropdown when clicking outside - improved to handle portaled content
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideButton = buttonRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);
      
      console.log('[TypeSelector] Click detected:', {
        isInsideButton,
        isInsideDropdown,
        target: (target as Element)?.tagName
      });
      
      // Only close if clicking outside both button and dropdown
      if (!isInsideButton && !isInsideDropdown) {
        console.log('[TypeSelector] Clicking outside, closing dropdown');
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Small delay to prevent immediate closing
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const currentLabel = TYPE_LABELS[optimisticType]?.label || 'Unknown';

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 gap-1.5
            ${optimisticType === 'task_checklist' ? 'bg-yellow-500 text-white dark:bg-yellow-500 dark:text-white border-none' : ''}
            ${optimisticType !== 'task_checklist' ? 'bg-muted text-foreground border-none' : ''}
          `}
          style={{ boxShadow: 'none' }}
          title={`Type: ${currentLabel}${typeGenerated ? ' (AI-classified)' : ''}${isSyncing ? ' (Syncing...)' : ''}`}
        >
          <span className={typeGenerated ? 'opacity-75' : ''}>{currentLabel}</span>
          {typeGenerated && (
            <span className="text-primary-foreground text-[10px] font-medium px-1 py-0.5 rounded">AI</span>
          )}
          {isSyncing && (
            <span className="text-primary-foreground text-[10px] font-medium px-1 py-0.5 rounded animate-pulse">...</span>
          )}
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {/* Portal the dropdown to body to avoid clipping */}
      {typeof window !== 'undefined' && isOpen && (
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed w-64 border border-border rounded-lg shadow-lg z-[9999] backdrop-blur-sm bg-background"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
          >
            <div className="p-1">
              {Object.entries(TYPE_LABELS).map(([type, { label, description }]) => (
                <button
                  key={type}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTypeSelect(type as NoteType);
                  }}
                  className={`w-full text-left p-3 rounded-md transition-all duration-200 group border border-transparent
                    ${type === optimisticType ?
                      (type === 'task_checklist' ? 'text-white dark:text-white bg-yellow-500 dark:bg-yellow-500' :
                       type === 'content_script' ? 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900' :
                       'text-primary bg-primary/10')
                    :
                      'text-foreground hover:bg-primary/10 hover:text-primary'}
                  `}
                >
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs text-gray-600 dark:text-muted-foreground mt-0.5 group-hover:text-gray-800 dark:group-hover:text-muted-foreground/80">{description}</div>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )
      )}
    </>
  );
}

// Update MinimalTypeDisplay to use correct text color for yellow in dark mode and purple in light mode
export function MinimalTypeDisplay({ currentType }: { currentType: NoteType }) {
  const TYPE_COLORS: Record<NoteType, string> = {
    idea_bank: 'bg-red-500',
    content_script: 'bg-purple-500',
    collaboration_note: 'bg-green-500',
    analytics_insight: 'bg-pink-500',
    reflection_journal: 'bg-blue-500',
    task_checklist: 'bg-yellow-500'
  };

  const TYPE_LABELS: Record<NoteType, string> = {
    idea_bank: 'Idea Bank',
    content_script: 'Content Script',
    collaboration_note: 'Collaboration',
    analytics_insight: 'Analytics',
    reflection_journal: 'Reflection',
    task_checklist: 'Task Checklist'
  };

  // Set text color for yellow in dark mode and purple in light mode
  let textClass = 'text-muted-foreground font-medium';
  if (currentType === 'task_checklist') {
    textClass = 'text-yellow-700 dark:text-white font-medium';
  } else if (currentType === 'content_script') {
    textClass = 'text-purple-700 dark:text-purple-300 font-medium';
  }

  const colorClass = TYPE_COLORS[currentType] || 'bg-gray-500';
  const label = TYPE_LABELS[currentType] || 'Unknown';

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colorClass}`}></div>
      <span className={`text-xs ${textClass}`}>{label}</span>
    </div>
  );
} 