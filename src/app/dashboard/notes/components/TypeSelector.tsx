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

const TYPE_LABELS: Record<NoteType, { label: string; description: string; color: string }> = {
  idea_bank: { label: 'Ideas', description: 'Thoughts & inspiration', color: 'bg-red-500/80' },
  content_script: { label: 'Writing', description: 'Draft & create', color: 'bg-accent' },
  collaboration_note: { label: 'People', description: 'Relationships & teams', color: 'bg-green-500/80' },
  analytics_insight: { label: 'Insights', description: 'Analysis & learnings', color: 'bg-pink-500/80' },
  reflection_journal: { label: 'Reflection', description: 'Deep thinking', color: 'bg-blue-500/80' },
  task_checklist: { label: 'Tasks', description: 'Things to do', color: 'bg-primary' },
  email_draft: { label: 'Messages', description: 'Communications', color: 'bg-orange-500/80' }
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
  const updateNoteMutation = useMutation(api.noteMutations.updateNote);



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
    if (newType !== optimisticType) {
      // 1. INSTANTLY update the UI (optimistic update)
      setOptimisticType(newType);
      setHasOptimisticUpdate(true);
      setIsOpen(false);
      
      // 2. Call the optional callback immediately for UI consistency
      onTypeChange?.(newType);
      
      // 3. Call the mutation in the background
      setIsSyncing(true);
      try {
        await updateNoteMutation({
          noteId: noteId as Id<"notes">,
          userId,
          updates: {
            type: newType,
            typeGenerated: false // Clear the AI-generated flag when user manually changes type
          }
        });
        // Don't reset hasOptimisticUpdate here - let the useEffect handle it when props update
      } catch (error) {
        console.error('[TypeSelector] Mutation failed:', error);
        // Revert optimistic update on error
        setOptimisticType(currentType);
        setHasOptimisticUpdate(false);
        onTypeChange?.(currentType);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleToggle = () => {
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
  const currentColor = TYPE_LABELS[optimisticType]?.color || 'bg-gray-500/80';

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-transparent hover:bg-muted/40 rounded-md transition-all duration-300 hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-50"
          title={`${currentLabel}${typeGenerated ? ' (AI)' : ''}${isSyncing ? ' (syncing)' : ''}`}
        >
          <div className={`w-2.5 h-2.5 rounded-full ${currentColor} transition-all duration-300`} />
          <span className="tracking-wide">{currentLabel}</span>
          {typeGenerated && (
            <span className="text-[10px] font-medium text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-full">AI</span>
          )}
          {isSyncing && (
            <span className="text-[10px] font-medium text-muted-foreground/60 animate-pulse">•••</span>
          )}
          <ChevronDown className={`w-3 h-3 transition-all duration-300 ${isOpen ? 'rotate-180 text-foreground' : 'text-muted-foreground/60'}`} />
        </button>
      </div>
      
      {/* Beautiful minimalist dropdown */}
      {typeof window !== 'undefined' && isOpen && (
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed w-72 border border-border/50 rounded-xl shadow-2xl z-[9999] backdrop-blur-md bg-background/95 overflow-hidden"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
          >
            <div className="p-2 space-y-1">
              {Object.entries(TYPE_LABELS).map(([type, { label, description, color }]) => (
                <button
                  key={type}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTypeSelect(type as NoteType);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 group border border-transparent hover:scale-[1.01] hover:bg-muted/60
                    ${type === optimisticType
                      ? 'bg-muted/80 text-foreground border-border/40'
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <div className={`w-3 h-3 rounded-full ${color} transition-all duration-300 group-hover:scale-110`} />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm tracking-tight">{label}</div>
                    <div className="text-xs text-muted-foreground/70 mt-0.5 leading-tight">{description}</div>
                  </div>
                  {type === optimisticType && (
                    <div className="w-2 h-2 rounded-full bg-primary/60" />
                  )}
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

// Minimal and beautiful type display for metadata
export function MinimalTypeDisplay({ currentType }: { currentType: NoteType }) {
  const typeInfo = TYPE_LABELS[currentType] || { label: 'Unknown', color: 'bg-gray-500/80' };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${typeInfo.color} transition-all duration-300`} />
      <span className="text-xs font-medium text-muted-foreground/80 tracking-wide">{typeInfo.label}</span>
    </div>
  );
} 